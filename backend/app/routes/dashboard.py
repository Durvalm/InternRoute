from collections import defaultdict
from datetime import date, datetime, timedelta
from math import floor
from typing import Any
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import Module, OnboardingAssessment, Task, User, UserTaskCompletion
from ..utils import days_until
from ..services.progression import (
  get_or_create_user_progress,
  get_module_states_for_user,
  get_tasks_for_user_module,
  module_completion_allowed_or_error,
  recompute_and_persist_user_progress,
  set_task_completion_internal,
  sync_projects_submission_progress,
)
from ..services.recruiting import READY_THRESHOLD, build_recruiting_view
from ..services.onboarding_timeline import TRACK_DURATION_WEEKS, build_onboarding_timeline_plan

bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")

ROADMAP_TRACK_KEY_DEFAULT = "foundation_start"
ROADMAP_SEQUENCE = ("timeline", "coding", "projects", "resume", "applications")
ROADMAP_CUMULATIVE_WEEKS_BY_TRACK: dict[str, dict[str, int]] = {
  "foundation_start": {
    "timeline": 1,
    "coding": 9,
    "projects": 26,
    "resume": 30,
    "applications": 31,
  },
  "coding_base_build_depth": {
    "timeline": 1,
    "coding": 1,
    "projects": 18,
    "resume": 22,
    "applications": 23,
  },
  "emerging_builder": {
    "timeline": 1,
    "coding": 1,
    "projects": 5,
    "resume": 9,
    "applications": 10,
  },
  "strong_builder_needs_positioning": {
    "timeline": 1,
    "coding": 1,
    "projects": 1,
    "resume": 5,
    "applications": 6,
  },
  "acceleration_track": {
    "timeline": 1,
    "coding": 1,
    "projects": 1,
    "resume": 1,
    "applications": 2,
  },
}


def _serialize_timestamp(value: datetime | None) -> str | None:
  return value.isoformat() if value else None


def _coerce_module_progress(computed: dict[str, Any]) -> list[dict[str, Any]]:
  raw = computed.get("module_progress")
  if not isinstance(raw, list):
    return []
  return [item for item in raw if isinstance(item, dict)]


def _module_progress_by_key(computed: dict[str, Any]) -> dict[str, dict[str, Any]]:
  return {
    str(item.get("module_key")): item
    for item in _coerce_module_progress(computed)
    if item.get("module_key")
  }


def _timeline_module_key(module_progress_by_key: dict[str, dict[str, Any]]) -> str:
  if "timeline" in module_progress_by_key:
    return "timeline"
  if "intro" in module_progress_by_key:
    return "intro"
  return "timeline"


def _select_track_key(user_id: int) -> str:
  assessment = (
    OnboardingAssessment.query
    .filter_by(user_id=user_id, status="completed")
    .order_by(OnboardingAssessment.completed_at.desc(), OnboardingAssessment.id.desc())
    .first()
  )
  if assessment is None:
    return ROADMAP_TRACK_KEY_DEFAULT
  return str(assessment.track_key or ROADMAP_TRACK_KEY_DEFAULT)


def _select_original_anchor_date(user: User) -> date:
  assessment = (
    OnboardingAssessment.query
    .filter_by(user_id=user.id, status="completed")
    .order_by(OnboardingAssessment.completed_at.desc(), OnboardingAssessment.id.desc())
    .first()
  )
  if assessment is not None and assessment.completed_at is not None:
    return assessment.completed_at.date()
  if user.created_at is not None:
    return user.created_at.date()
  return date.today()


def _module_completion_timestamps(
  *,
  user_id: int,
  modules_by_key: dict[str, Module],
) -> dict[str, datetime]:
  if not modules_by_key:
    return {}

  module_ids = [module.id for module in modules_by_key.values()]
  tasks = (
    Task.query
    .filter(Task.module_id.in_(module_ids), Task.is_active.is_(True))
    .order_by(Task.module_id.asc(), Task.sort_order.asc(), Task.id.asc())
    .all()
  )
  if not tasks:
    return {}

  task_ids = [task.id for task in tasks]
  completions = (
    UserTaskCompletion.query
    .join(Task, UserTaskCompletion.task_id == Task.id)
    .filter(
      UserTaskCompletion.user_id == user_id,
      UserTaskCompletion.task_id.in_(task_ids),
      Task.is_active.is_(True),
    )
    .order_by(
      Task.module_id.asc(),
      UserTaskCompletion.completed_at.asc(),
      UserTaskCompletion.id.asc(),
    )
    .all()
  )

  tasks_by_module_id: dict[int, list[Task]] = defaultdict(list)
  task_by_id = {task.id: task for task in tasks}
  for task in tasks:
    tasks_by_module_id[task.module_id].append(task)

  completions_by_module_id: dict[int, list[UserTaskCompletion]] = defaultdict(list)
  for completion in completions:
    task = task_by_id.get(completion.task_id)
    if task is None:
      continue
    completions_by_module_id[task.module_id].append(completion)

  completed_at_by_key: dict[str, datetime] = {}
  for module_key, module in modules_by_key.items():
    completed_at = _module_completed_at(
      module,
      tasks_by_module_id.get(module.id, []),
      completions_by_module_id.get(module.id, []),
    )
    if completed_at is not None:
      completed_at_by_key[module_key] = completed_at
  return completed_at_by_key


def _build_journey_payload(
  *,
  user: User,
  computed: dict[str, Any],
  today: date,
) -> dict[str, Any]:
  module_progress_by_key = _module_progress_by_key(computed)
  timeline_key = _timeline_module_key(module_progress_by_key)
  canonical_key_to_actual: dict[str, str] = {
    "timeline": timeline_key,
    "coding": "coding",
    "projects": "projects",
    "resume": "resume",
    "applications": "applications",
  }

  track_key = _select_track_key(user.id)
  if track_key not in ROADMAP_CUMULATIVE_WEEKS_BY_TRACK:
    track_key = ROADMAP_TRACK_KEY_DEFAULT

  original_anchor_date = _select_original_anchor_date(user)
  progress = get_or_create_user_progress(user.id)
  active_anchor_date = progress.journey_anchor_date or original_anchor_date

  cumulative_weeks = ROADMAP_CUMULATIVE_WEEKS_BY_TRACK.get(
    track_key,
    ROADMAP_CUMULATIVE_WEEKS_BY_TRACK[ROADMAP_TRACK_KEY_DEFAULT],
  )
  readiness_duration_weeks = int(TRACK_DURATION_WEEKS.get(track_key, TRACK_DURATION_WEEKS[ROADMAP_TRACK_KEY_DEFAULT]))
  readiness_target_date = active_anchor_date + timedelta(weeks=readiness_duration_weeks)

  roadmap_keys = [actual_key for actual_key in canonical_key_to_actual.values() if actual_key in module_progress_by_key]
  modules = (
    Module.query
    .filter(Module.key.in_(roadmap_keys))
    .all()
    if roadmap_keys
    else []
  )
  modules_by_key = {module.key: module for module in modules}
  completed_at_by_key = _module_completion_timestamps(user_id=user.id, modules_by_key=modules_by_key)

  journey_modules: list[dict[str, Any]] = []
  current_assigned = False
  final_target_date: date | None = None
  for canonical_key in ROADMAP_SEQUENCE:
    actual_key = canonical_key_to_actual.get(canonical_key)
    if actual_key is None:
      continue
    module_state = module_progress_by_key.get(actual_key)
    if module_state is None:
      continue

    score = int(module_state.get("score") or 0)
    unlock_threshold = int(module_state.get("unlock_threshold") or 0)
    has_tasks = bool(module_state.get("has_tasks"))
    module_completed = score >= unlock_threshold if has_tasks else False

    if module_completed:
      status = "completed"
    elif not current_assigned:
      status = "current"
      current_assigned = True
    else:
      status = "upcoming"

    module_target_date = active_anchor_date + timedelta(weeks=int(cumulative_weeks.get(canonical_key, 0)))
    if final_target_date is None or module_target_date > final_target_date:
      final_target_date = module_target_date

    completed_at = completed_at_by_key.get(actual_key)
    completed_delta_days = None
    if completed_at is not None:
      completed_delta_days = (completed_at.date() - module_target_date).days

    journey_modules.append(
      {
        "module_key": actual_key,
        "roadmap_key": canonical_key,
        "module_name": str(module_state.get("module_name") or actual_key.title()),
        "score": score,
        "unlock_threshold": unlock_threshold,
        "status": status,
        "target_date": module_target_date.isoformat(),
        "days_to_target": (module_target_date - today).days,
        "completed_at": _serialize_timestamp(completed_at),
        "completed_delta_days": completed_delta_days,
      }
    )

  progress_score = int(computed.get("progress") or 0)
  is_stale = bool(
    final_target_date is not None
    and today > final_target_date
    and progress_score < READY_THRESHOLD
  )
  stale_reason = "timeline_expired_before_readiness" if is_stale else None

  return {
    "track_key": track_key,
    "original_anchor_date": original_anchor_date.isoformat(),
    "active_anchor_date": active_anchor_date.isoformat(),
    "readiness_threshold": READY_THRESHOLD,
    "readiness_target_date": readiness_target_date.isoformat(),
    "days_to_readiness_target": (readiness_target_date - today).days,
    "is_stale": is_stale,
    "stale_reason": stale_reason,
    "modules": journey_modules,
  }


def _build_summary_payload(user: User) -> dict[str, Any]:
  today = date.today()

  has_completed_onboarding_assessment = (
    OnboardingAssessment.query
    .filter_by(user_id=user.id, status="completed")
    .first()
    is not None
  )
  if has_completed_onboarding_assessment:
    computed = sync_projects_submission_progress(
      user.id,
      bypass_prerequisites=True,
      commit=True,
    )
  else:
    computed = recompute_and_persist_user_progress(user.id, commit=True)

  module_progress_by_key = _module_progress_by_key(computed)
  coding_module_score = int(
    module_progress_by_key.get("coding", {}).get("score")
    or computed.get("category_readiness", {}).get("coding")
    or 0
  )
  needs_skill_placement_assessment = bool(
    user.onboarding_completed
    and not has_completed_onboarding_assessment
    and coding_module_score == 0
  )

  recruiting = build_recruiting_view(
    today=today,
    readiness_score=int(computed["progress"]),
    graduation_date=user.graduation_date,
  )
  next_window_start = date.fromisoformat(recruiting["next_peak_date"])
  current_window_end = (
    date.fromisoformat(recruiting["recruiting_window_end"])
    if recruiting["recruiting_window_end"]
    else None
  )
  window_is_open = recruiting["season"] in {"peak", "lower"}
  days_until_next_window = days_until(next_window_start)
  days_until_window_close = days_until(current_window_end) if current_window_end else None
  journey = _build_journey_payload(user=user, computed=computed, today=today)
  timeline_plan = build_onboarding_timeline_plan(
    today=today,
    graduation_date=user.graduation_date,
    track_key=journey["track_key"],
  )

  return {
    "user_name": user.name,
    "needs_skill_placement_assessment": needs_skill_placement_assessment,
    "progress": computed["progress"],
    "category_readiness": computed["category_readiness"],
    "module_progress": computed["module_progress"],
    "next_action": computed["next_action"],
    "season_status": "window" if window_is_open else "prep",
    "days_until_recruiting": days_until_next_window,
    "recruiting_date": next_window_start.isoformat(),
    "days_until_window_close": days_until_window_close,
    "recruiting_window_end": current_window_end.isoformat() if current_window_end else None,
    "graduation_date": user.graduation_date.isoformat() if user.graduation_date else None,
    "recruiting": recruiting,
    "journey": journey,
    "timeline_plan": timeline_plan,
  }


def _module_completed_at(
  module: Module,
  tasks: list[Task],
  completions: list[UserTaskCompletion],
) -> datetime | None:
  if not tasks:
    return None

  total_weight = sum(max(0, task.weight) for task in tasks)
  if total_weight <= 0:
    return None

  weight_by_task_id = {task.id: max(0, task.weight) for task in tasks}
  completed_weight = 0
  seen_task_ids: set[int] = set()

  for completion in completions:
    if completion.task_id in seen_task_ids:
      continue
    seen_task_ids.add(completion.task_id)
    completed_weight += weight_by_task_id.get(completion.task_id, 0)
    score = floor((completed_weight * 100) / total_weight)
    if score >= int(module.unlock_threshold or 0):
      return completion.completed_at

  return None

@bp.get("/summary")
@jwt_required()
def summary():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  return jsonify(_build_summary_payload(user))


@bp.post("/journey/rebaseline")
@jwt_required()
def rebaseline_journey():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  progress = get_or_create_user_progress(user.id)
  progress.journey_anchor_date = date.today()
  db.session.commit()

  summary_payload = _build_summary_payload(user)
  return jsonify({
    "ok": True,
    "journey": summary_payload["journey"],
    "progress": summary_payload["progress"],
    "category_readiness": summary_payload["category_readiness"],
    "module_progress": summary_payload["module_progress"],
    "next_action": summary_payload["next_action"],
  })


@bp.get("/admin/engagement")
@jwt_required()
def admin_engagement():
  viewer_id = int(get_jwt_identity())
  viewer = User.query.get_or_404(viewer_id)
  if not viewer.is_superuser:
    return jsonify({"error": "Superuser access required."}), 403

  users = (
    User.query
    .options(joinedload(User.progress))
    .order_by(User.created_at.desc(), User.id.desc())
    .all()
  )
  modules = Module.query.order_by(Module.sort_order.asc(), Module.id.asc()).all()
  module_ids = [module.id for module in modules]
  tasks = (
    Task.query
    .filter(Task.module_id.in_(module_ids), Task.is_active.is_(True))
    .order_by(Task.module_id.asc(), Task.sort_order.asc(), Task.id.asc())
    .all()
    if module_ids
    else []
  )

  tasks_by_module_id: dict[int, list[Task]] = defaultdict(list)
  for task in tasks:
    tasks_by_module_id[task.module_id].append(task)

  user_ids = [user.id for user in users]
  completions = (
    UserTaskCompletion.query
    .join(Task, UserTaskCompletion.task_id == Task.id)
    .options(joinedload(UserTaskCompletion.task))
    .filter(
      UserTaskCompletion.user_id.in_(user_ids),
      Task.is_active.is_(True),
    )
    .order_by(
      UserTaskCompletion.user_id.asc(),
      Task.module_id.asc(),
      UserTaskCompletion.completed_at.asc(),
      UserTaskCompletion.id.asc(),
    )
    .all()
    if user_ids
    else []
  )

  completions_by_user_module: dict[tuple[int, int], list[UserTaskCompletion]] = defaultdict(list)
  for completion in completions:
    if completion.task is None:
      continue
    completions_by_user_module[(completion.user_id, completion.task.module_id)].append(completion)

  tracked_modules_count = sum(1 for module in modules if tasks_by_module_id.get(module.id))
  total_readiness_score = 0
  total_completed_modules = 0
  users_with_completed_modules = 0
  serialized_users: list[dict[str, object]] = []

  for user in users:
    readiness_score = int(user.progress.readiness_score) if user.progress and user.progress.readiness_score is not None else 0
    total_readiness_score += readiness_score

    module_states = get_module_states_for_user(user)
    current_module = next(
      (
        {
          "module_key": state.module_key,
          "module_name": state.module_name,
          "score": state.score,
          "unlock_threshold": state.unlock_threshold,
          "is_unlocked": state.is_unlocked,
        }
        for state in module_states
        if state.has_tasks and state.score < state.unlock_threshold
      ),
      None,
    )

    completed_modules: list[dict[str, object]] = []
    last_module_completed_at: datetime | None = None
    for module in modules:
      completed_at = _module_completed_at(
        module,
        tasks_by_module_id.get(module.id, []),
        completions_by_user_module.get((user.id, module.id), []),
      )
      if completed_at is None:
        continue
      completed_modules.append(
        {
          "module_key": module.key,
          "module_name": module.name,
          "completed_at": _serialize_timestamp(completed_at),
        }
      )
      if last_module_completed_at is None or completed_at > last_module_completed_at:
        last_module_completed_at = completed_at

    completed_modules_count = len(completed_modules)
    total_completed_modules += completed_modules_count
    if completed_modules_count > 0:
      users_with_completed_modules += 1

    serialized_users.append(
      {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": _serialize_timestamp(user.created_at),
        "onboarding_completed": user.onboarding_completed,
        "readiness_score": readiness_score,
        "completed_modules_count": completed_modules_count,
        "total_modules_count": tracked_modules_count,
        "last_module_completed_at": _serialize_timestamp(last_module_completed_at),
        "current_module": current_module,
        "completed_modules": completed_modules,
      }
    )

  total_users = len(users)
  avg_readiness_score = round(total_readiness_score / total_users) if total_users else 0
  avg_completed_modules = round(total_completed_modules / total_users, 1) if total_users else 0

  return jsonify(
    {
      "summary": {
        "total_users": total_users,
        "onboarded_users": sum(1 for user in users if user.onboarding_completed),
        "users_with_completed_modules": users_with_completed_modules,
        "avg_readiness_score": avg_readiness_score,
        "avg_completed_modules": avg_completed_modules,
        "tracked_modules_count": tracked_modules_count,
      },
      "users": serialized_users,
    }
  )


@bp.get("/tasks")
@jwt_required()
def tasks():
  user_id = int(get_jwt_identity())
  module_key = (request.args.get("module_key") or "").strip()
  if not module_key:
    return jsonify({"error": "module_key is required"}), 400

  payload = get_tasks_for_user_module(user_id, module_key)
  if payload is None:
    return jsonify({"error": "Module not found"}), 404
  return jsonify(payload)


@bp.patch("/tasks/<int:task_id>")
@jwt_required()
def update_task_completion(task_id: int):
  user_id = int(get_jwt_identity())
  payload = request.get_json() or {}
  completed = payload.get("completed")
  if not isinstance(completed, bool):
    return jsonify({"error": "completed must be a boolean"}), 400

  task = Task.query.filter_by(id=task_id, is_active=True).first()
  if task is None:
    return jsonify({"error": "Task not found"}), 404

  if completed and task.module is not None:
    allowed, error_payload = module_completion_allowed_or_error(user_id, task.module.key)
    if not allowed and error_payload is not None:
      return jsonify(error_payload), 409

  computed = set_task_completion_internal(user_id, task_id, completed)
  return jsonify(
    {
      "task_id": task_id,
      "completed": completed,
      "module_progress": computed["module_progress"],
    }
  )
