from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from math import floor
from typing import Any

from ..analytics import analytics_insert_id, track_event
from ..extensions import db
from ..models import (
  LeetcodeProgress,
  Module,
  ProjectSubmission,
  ResumeSubmission,
  Task,
  User,
  UserProgress,
  UserTaskCompletion,
)

LEETCODE_TOTAL_TARGET = 50
LEETCODE_MEDIUM_TARGET = 30


@dataclass
class ModuleState:
  module_id: int
  module_key: str
  module_name: str
  overall_weight: int
  score: int
  is_unlocked: bool
  unlock_threshold: int
  has_tasks: bool
  has_bonus_tasks: bool

  def to_dict(self) -> dict[str, Any]:
    return {
      "module_key": self.module_key,
      "module_name": self.module_name,
      "overall_weight": self.overall_weight,
      "score": self.score,
      "is_unlocked": self.is_unlocked,
      "unlock_threshold": self.unlock_threshold,
      "has_tasks": self.has_tasks,
      "has_bonus_tasks": self.has_bonus_tasks,
    }


def get_or_create_user_progress(user_id: int) -> UserProgress:
  progress = UserProgress.query.filter_by(user_id=user_id).first()
  if progress:
    return progress

  progress = UserProgress(user_id=user_id)
  db.session.add(progress)
  db.session.flush()
  return progress


def _score_from_weights(total_weight: int, completed_weight: int) -> int:
  if total_weight <= 0:
    return 0
  raw = floor((completed_weight * 100) / total_weight)
  return max(0, min(100, raw))


def _is_module_state_complete(state: ModuleState) -> bool:
  if not state.has_tasks:
    return True
  return state.score >= state.unlock_threshold


def _emit_module_completion_events(user_id: int, module_states: list[ModuleState]) -> None:
  for state in module_states:
    if not state.has_tasks:
      continue
    if state.score < state.unlock_threshold:
      continue
    track_event(
      "module_completed",
      user_id=user_id,
      properties={
        "module_key": state.module_key,
        "score": state.score,
        "unlock_threshold": state.unlock_threshold,
      },
      insert_id=analytics_insert_id("module_completed", user_id, state.module_key),
    )


def _compute_category_score(module_states: list[ModuleState], modules: list[Module], category: str) -> int:
  weighted_sum = 0
  total_weight = 0
  module_by_id = {module.id: module for module in modules}

  for state in module_states:
    module = module_by_id.get(state.module_id)
    if not module or module.category != category:
      continue
    weighted_sum += state.score * module.overall_weight
    total_weight += module.overall_weight

  if total_weight == 0:
    return 0
  return round(weighted_sum / total_weight)


def _compute_overall_score(module_states: list[ModuleState], modules: list[Module]) -> int:
  module_by_id = {module.id: module for module in modules}
  weighted_total = 0
  for state in module_states:
    module = module_by_id.get(state.module_id)
    if not module:
      continue
    weighted_total += state.score * module.overall_weight
  return round(weighted_total / 100)


def _next_action(module_states: list[ModuleState]) -> str | None:
  for state in module_states:
    if state.has_tasks and state.score < state.unlock_threshold:
      return f"Continue {state.module_name}"
  if any(state.has_tasks for state in module_states):
    return "All available tasks are complete."
  return "No tasks available yet"


def _best_successful_resume_score(user_id: int) -> int:
  best_score = (
    db.session.query(db.func.max(ResumeSubmission.overall_score))
    .filter(ResumeSubmission.user_id == user_id, ResumeSubmission.status == "succeeded")
    .scalar()
  )
  return max(0, min(100, int(best_score or 0)))


def _leetcode_module_score(user_id: int) -> int:
  progress = LeetcodeProgress.query.filter_by(user_id=user_id).first()
  if progress is None:
    return 0
  total_progress = min(max(progress.total_solved, 0) / LEETCODE_TOTAL_TARGET, 1.0)
  medium_progress = min(max(progress.medium_solved, 0) / LEETCODE_MEDIUM_TARGET, 1.0)
  return max(0, min(100, round(((total_progress + medium_progress) / 2.0) * 100)))


def _build_module_states(user: User) -> list[ModuleState]:
  modules = Module.query.order_by(Module.sort_order.asc()).all()
  if not modules:
    return []
  user_progress = UserProgress.query.filter_by(user_id=user.id).first()
  coding_override_score: int | None = None
  if user_progress is not None and user_progress.coding_override_score is not None:
    coding_override_score = max(0, min(100, int(user_progress.coding_override_score)))

  module_ids = [module.id for module in modules]
  tasks = Task.query.filter(
    Task.module_id.in_(module_ids),
    Task.is_active.is_(True),
  ).order_by(Task.sort_order.asc(), Task.id.asc()).all()

  task_ids = [task.id for task in tasks]
  completed_ids: set[int] = set()
  if task_ids:
    completed_ids = {
      row.task_id
      for row in UserTaskCompletion.query.filter(
        UserTaskCompletion.user_id == user.id,
        UserTaskCompletion.task_id.in_(task_ids),
      ).all()
    }

  tasks_by_module: dict[int, list[Task]] = {module_id: [] for module_id in module_ids}
  for task in tasks:
    tasks_by_module.setdefault(task.module_id, []).append(task)

  scores_by_module_id: dict[int, int] = {}
  has_tasks_by_module_id: dict[int, bool] = {}
  has_bonus_by_module_id: dict[int, bool] = {}

  for module in modules:
    module_tasks = tasks_by_module.get(module.id, [])
    has_tasks = len(module_tasks) > 0
    has_bonus = any(task.is_bonus for task in module_tasks)
    has_tasks_by_module_id[module.id] = has_tasks
    has_bonus_by_module_id[module.id] = has_bonus

    if module.key == "coding" and coding_override_score is not None:
      score = coding_override_score
    elif module.key == "resume":
      # Resume readiness should reflect the user's best score achieved so far.
      score = _best_successful_resume_score(user.id)
    elif module.key == "leetcode":
      score = _leetcode_module_score(user.id)
    elif has_tasks:
      total_weight = sum(max(0, task.weight) for task in module_tasks)
      completed_weight = sum(max(0, task.weight) for task in module_tasks if task.id in completed_ids)
      score = _score_from_weights(total_weight, completed_weight)
    else:
      score = 0

    scores_by_module_id[module.id] = score

  states: list[ModuleState] = []
  previous_modules_complete = True
  for module in modules:
    state = ModuleState(
      module_id=module.id,
      module_key=module.key,
      module_name=module.name,
      overall_weight=module.overall_weight,
      score=scores_by_module_id.get(module.id, 0),
      is_unlocked=previous_modules_complete,
      unlock_threshold=module.unlock_threshold,
      has_tasks=has_tasks_by_module_id.get(module.id, False),
      has_bonus_tasks=has_bonus_by_module_id.get(module.id, False),
    )
    states.append(state)
    if not _is_module_state_complete(state):
      previous_modules_complete = False

  return states


def get_module_states_for_user(user: User) -> list[ModuleState]:
  return _build_module_states(user)


def _unmet_prerequisite_states_for_module_key(
  module_states: list[ModuleState],
  module_key: str,
) -> list[ModuleState]:
  target_index = next((index for index, state in enumerate(module_states) if state.module_key == module_key), None)
  if target_index is None:
    return []

  return [
    state
    for state in module_states[:target_index]
    if state.has_tasks and state.score < state.unlock_threshold
  ]


def get_unmet_module_prerequisites(user_id: int, module_key: str) -> list[dict[str, str]]:
  user = User.query.get_or_404(user_id)
  module_states = _build_module_states(user)
  unmet_states = _unmet_prerequisite_states_for_module_key(module_states, module_key)
  return [
    {
      "module_key": state.module_key,
      "module_name": state.module_name,
    }
    for state in unmet_states
  ]


def format_unmet_prerequisites_error(module_name: str, unmet_modules: list[dict[str, str]]) -> str:
  if not unmet_modules:
    return f"Previous module requirements must be completed before {module_name}."
  names = ", ".join(item["module_name"] for item in unmet_modules)
  return f"Complete previous modules before completing {module_name}: {names}."


def module_completion_allowed_or_error(user_id: int, module_key: str) -> tuple[bool, dict[str, Any] | None]:
  module = Module.query.filter_by(key=module_key).first()
  if module is None:
    return True, None

  unmet_modules = get_unmet_module_prerequisites(user_id, module_key)
  if not unmet_modules:
    return True, None

  return False, {
    "error": format_unmet_prerequisites_error(module.name, unmet_modules),
    "unmet_prerequisites": unmet_modules,
  }


def recompute_and_persist_user_progress(
  user_id: int,
  *,
  commit: bool = True,
  emit_module_completion_events: bool = False,
) -> dict[str, Any]:
  user = User.query.get_or_404(user_id)
  progress = get_or_create_user_progress(user.id)
  modules = Module.query.order_by(Module.sort_order.asc()).all()
  module_states = _build_module_states(user)

  overall = _compute_overall_score(module_states, modules) if modules else 0
  category_coding = _compute_category_score(module_states, modules, "coding") if modules else 0
  category_projects = _compute_category_score(module_states, modules, "projects") if modules else 0
  category_resume = _compute_category_score(module_states, modules, "resume") if modules else 0

  progress.readiness_score = overall
  progress.category_coding = category_coding
  progress.category_projects = category_projects
  progress.category_resume = category_resume

  if commit:
    db.session.commit()
  else:
    db.session.flush()

  if emit_module_completion_events:
    _emit_module_completion_events(user.id, module_states)

  return {
    "progress": overall,
    "category_readiness": {
      "coding": category_coding,
      "projects": category_projects,
      "resume": category_resume,
    },
    "module_progress": [state.to_dict() for state in module_states],
    "next_action": _next_action(module_states),
  }

def get_tasks_for_user_module(user_id: int, module_key: str) -> dict[str, Any] | None:
  module = Module.query.filter_by(key=module_key).first()
  if module is None:
    return None

  tasks = Task.query.filter_by(module_id=module.id, is_active=True).order_by(Task.sort_order.asc(), Task.id.asc()).all()
  task_ids = [task.id for task in tasks]
  completed_ids: set[int] = set()
  if task_ids:
    completed_ids = {
      row.task_id
      for row in UserTaskCompletion.query.filter(
        UserTaskCompletion.user_id == user_id,
        UserTaskCompletion.task_id.in_(task_ids),
      ).all()
    }

  return {
    "module_key": module.key,
    "tasks": [
      {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "weight": task.weight,
        "is_bonus": task.is_bonus,
        "is_completed": task.id in completed_ids,
      }
      for task in tasks
    ],
  }


def set_task_completion_internal(user_id: int, task_id: int, completed: bool) -> dict[str, Any]:
  completion = UserTaskCompletion.query.filter_by(user_id=user_id, task_id=task_id).first()
  if completed and completion is None:
    db.session.add(UserTaskCompletion(user_id=user_id, task_id=task_id))
  if not completed and completion is not None:
    db.session.delete(completion)

  return recompute_and_persist_user_progress(
    user_id,
    commit=True,
    emit_module_completion_events=True,
  )


def sync_projects_submission_progress(
  user_id: int,
  *,
  commit: bool = True,
  emit_module_completion_events: bool = False,
) -> dict[str, Any]:
  module = Module.query.filter_by(key="projects").first()
  if module is None:
    return recompute_and_persist_user_progress(
      user_id,
      commit=commit,
      emit_module_completion_events=emit_module_completion_events,
    )

  keyed_tasks = {
    task.challenge_id: task
    for task in Task.query.filter_by(module_id=module.id, is_active=True).all()
    if task.challenge_id in {"projects_core_1", "projects_core_2", "projects_bonus_real_user"}
  }

  passed_count = (
    ProjectSubmission.query
    .filter_by(user_id=user_id, status="pass")
    .count()
  )
  has_bonus_real_user = (
    ProjectSubmission.query
    .filter_by(user_id=user_id, status="pass")
    .filter(ProjectSubmission.deployed_url.isnot(None))
    .first()
    is not None
  )
  can_complete, _ = module_completion_allowed_or_error(user_id, "projects")

  desired_completion_by_task_key = {
    "projects_core_1": can_complete and passed_count >= 1,
    "projects_core_2": can_complete and passed_count >= 2,
    "projects_bonus_real_user": can_complete and has_bonus_real_user,
  }

  for task_key, is_completed in desired_completion_by_task_key.items():
    task = keyed_tasks.get(task_key)
    if task is None:
      continue

    completion = UserTaskCompletion.query.filter_by(user_id=user_id, task_id=task.id).first()
    if is_completed and completion is None:
      db.session.add(UserTaskCompletion(user_id=user_id, task_id=task.id))
    if not is_completed and completion is not None:
      db.session.delete(completion)

  return recompute_and_persist_user_progress(
    user_id,
    commit=commit,
    emit_module_completion_events=emit_module_completion_events,
  )


def sync_resume_submission_progress(
  user_id: int,
  *,
  commit: bool = True,
  emit_module_completion_events: bool = False,
) -> dict[str, Any]:
  module = Module.query.filter_by(key="resume").first()
  if module is None:
    return recompute_and_persist_user_progress(
      user_id,
      commit=commit,
      emit_module_completion_events=emit_module_completion_events,
    )

  task = (
    Task.query
    .filter_by(module_id=module.id, is_active=True, challenge_id="resume_pass_threshold")
    .first()
  )
  if task is None:
    return recompute_and_persist_user_progress(
      user_id,
      commit=commit,
      emit_module_completion_events=emit_module_completion_events,
    )

  best_successful_score = _best_successful_resume_score(user_id)
  can_complete, _ = module_completion_allowed_or_error(user_id, "resume")
  is_completed = can_complete and best_successful_score >= 80

  completion = UserTaskCompletion.query.filter_by(user_id=user_id, task_id=task.id).first()
  if is_completed and completion is None:
    db.session.add(UserTaskCompletion(user_id=user_id, task_id=task.id))
  if not is_completed and completion is not None:
    db.session.delete(completion)

  return recompute_and_persist_user_progress(
    user_id,
    commit=commit,
    emit_module_completion_events=emit_module_completion_events,
  )


def sync_leetcode_progress(
  user_id: int,
  *,
  commit: bool = True,
  emit_module_completion_events: bool = False,
) -> dict[str, Any]:
  module = Module.query.filter_by(key="leetcode").first()
  if module is None:
    return recompute_and_persist_user_progress(
      user_id,
      commit=commit,
      emit_module_completion_events=emit_module_completion_events,
    )

  task = (
    Task.query
    .filter(
      Task.module_id == module.id,
      Task.is_active.is_(True),
      Task.challenge_id.in_(["leetcode_verify_50_total_30_medium", "leetcode_50_total_30_medium"]),
    )
    .first()
  )
  if task is None:
    return recompute_and_persist_user_progress(
      user_id,
      commit=commit,
      emit_module_completion_events=emit_module_completion_events,
    )

  progress = LeetcodeProgress.query.filter_by(user_id=user_id).first()
  meets_threshold = bool(
    progress is not None
    and progress.total_solved >= LEETCODE_TOTAL_TARGET
    and progress.medium_solved >= LEETCODE_MEDIUM_TARGET
  )
  can_complete, _ = module_completion_allowed_or_error(user_id, "leetcode")
  is_completed = can_complete and meets_threshold

  if progress is not None and meets_threshold and progress.completion_verified_at is None:
    progress.completion_verified_at = datetime.utcnow()
  if progress is not None and not meets_threshold:
    progress.completion_verified_at = None

  completion = UserTaskCompletion.query.filter_by(user_id=user_id, task_id=task.id).first()
  if is_completed and completion is None:
    db.session.add(UserTaskCompletion(user_id=user_id, task_id=task.id))
  if not is_completed and completion is not None:
    db.session.delete(completion)

  return recompute_and_persist_user_progress(
    user_id,
    commit=commit,
    emit_module_completion_events=emit_module_completion_events,
  )


def apply_onboarding_coding_skip(
  user_id: int,
  *,
  confidence: float | None = None,
  commit: bool = True,
  emit_module_completion_events: bool = False,
) -> dict[str, Any]:
  progress = get_or_create_user_progress(user_id)
  progress.coding_override_score = 100
  progress.coding_override_source = "onboarding_assessment"

  coding_module = Module.query.filter_by(key="coding").first()
  if coding_module is not None:
    coding_tasks = Task.query.filter_by(module_id=coding_module.id, is_active=True).all()
    for task in coding_tasks:
      completion = UserTaskCompletion.query.filter_by(user_id=user_id, task_id=task.id).first()
      if completion is None:
        db.session.add(UserTaskCompletion(user_id=user_id, task_id=task.id))

  if confidence is not None:
    track_event(
      "coding_skip_applied",
      user_id=user_id,
      properties={
        "source": "onboarding_assessment",
        "confidence": float(confidence),
      },
    )

  return recompute_and_persist_user_progress(
    user_id,
    commit=commit,
    emit_module_completion_events=emit_module_completion_events,
  )
