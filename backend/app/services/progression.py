from __future__ import annotations

from dataclasses import dataclass
from math import floor
from typing import Any

from ..extensions import db
from ..models import Module, ProjectSubmission, ResumeSubmission, Task, User, UserProgress, UserTaskCompletion


@dataclass
class ModuleState:
  module_id: int
  module_key: str
  module_name: str
  score: int
  is_unlocked: bool
  unlock_threshold: int
  has_tasks: bool
  has_bonus_tasks: bool

  def to_dict(self) -> dict[str, Any]:
    return {
      "module_key": self.module_key,
      "module_name": self.module_name,
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


def set_coding_override_for_advanced(user_id: int, score: int = 80) -> None:
  progress = get_or_create_user_progress(user_id)
  progress.coding_override_score = max(0, min(100, score))
  progress.coding_override_source = "advanced_onboarding"
  db.session.flush()


def clear_coding_override(user_id: int) -> None:
  progress = get_or_create_user_progress(user_id)
  progress.coding_override_score = None
  progress.coding_override_source = None
  db.session.flush()


def _score_from_weights(total_weight: int, completed_weight: int) -> int:
  if total_weight <= 0:
    return 0
  raw = floor((completed_weight * 100) / total_weight)
  return max(0, min(100, raw))


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


def _build_module_states(user: User, progress: UserProgress) -> list[ModuleState]:
  modules = Module.query.order_by(Module.sort_order.asc()).all()
  if not modules:
    return []

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

    if module.key == "resume":
      # Resume readiness should reflect the user's best score achieved so far.
      score = _best_successful_resume_score(user.id)
    elif has_tasks:
      total_weight = sum(max(0, task.weight) for task in module_tasks)
      completed_weight = sum(max(0, task.weight) for task in module_tasks if task.id in completed_ids)
      score = _score_from_weights(total_weight, completed_weight)
    elif (
      module.key == "coding"
      and progress.coding_override_score is not None
      and progress.coding_override_source == "advanced_onboarding"
    ):
      score = max(0, min(100, progress.coding_override_score))
    else:
      score = 0

    scores_by_module_id[module.id] = score

  states: list[ModuleState] = []
  for module in modules:
    states.append(
      ModuleState(
        module_id=module.id,
        module_key=module.key,
        module_name=module.name,
        score=scores_by_module_id.get(module.id, 0),
        is_unlocked=True,
        unlock_threshold=module.unlock_threshold,
        has_tasks=has_tasks_by_module_id.get(module.id, False),
        has_bonus_tasks=has_bonus_by_module_id.get(module.id, False),
      )
    )

  return states


def recompute_and_persist_user_progress(user_id: int, *, commit: bool = True) -> dict[str, Any]:
  user = User.query.get_or_404(user_id)
  progress = get_or_create_user_progress(user.id)
  modules = Module.query.order_by(Module.sort_order.asc()).all()
  module_states = _build_module_states(user, progress)

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

  return recompute_and_persist_user_progress(user_id, commit=True)


def sync_projects_submission_progress(user_id: int, *, commit: bool = True) -> dict[str, Any]:
  module = Module.query.filter_by(key="projects").first()
  if module is None:
    return recompute_and_persist_user_progress(user_id, commit=commit)

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

  desired_completion_by_task_key = {
    "projects_core_1": passed_count >= 1,
    "projects_core_2": passed_count >= 2,
    "projects_bonus_real_user": has_bonus_real_user,
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

  return recompute_and_persist_user_progress(user_id, commit=commit)


def sync_resume_submission_progress(user_id: int, *, commit: bool = True) -> dict[str, Any]:
  module = Module.query.filter_by(key="resume").first()
  if module is None:
    return recompute_and_persist_user_progress(user_id, commit=commit)

  task = (
    Task.query
    .filter_by(module_id=module.id, is_active=True, challenge_id="resume_pass_threshold")
    .first()
  )
  if task is None:
    return recompute_and_persist_user_progress(user_id, commit=commit)

  best_successful_score = _best_successful_resume_score(user_id)
  is_completed = best_successful_score >= 80

  completion = UserTaskCompletion.query.filter_by(user_id=user_id, task_id=task.id).first()
  if is_completed and completion is None:
    db.session.add(UserTaskCompletion(user_id=user_id, task_id=task.id))
  if not is_completed and completion is not None:
    db.session.delete(completion)

  return recompute_and_persist_user_progress(user_id, commit=commit)
