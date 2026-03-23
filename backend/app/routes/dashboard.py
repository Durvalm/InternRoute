from collections import defaultdict
from datetime import date, datetime
from math import floor
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload

from ..models import Module, Task, User, UserTaskCompletion
from ..utils import days_until
from ..services.progression import (
  get_module_states_for_user,
  get_tasks_for_user_module,
  module_completion_allowed_or_error,
  recompute_and_persist_user_progress,
  set_task_completion_internal,
)
from ..services.recruiting import build_recruiting_view

bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


def _serialize_timestamp(value: datetime | None) -> str | None:
  return value.isoformat() if value else None


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

  today = date.today()

  computed = recompute_and_persist_user_progress(user.id, commit=True)
  recruiting = build_recruiting_view(
    today=today,
    readiness_score=computed["progress"],
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

  payload = {
    "user_name": user.name,
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
  }

  return jsonify(payload)


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
