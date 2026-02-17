from datetime import date
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Task, User
from ..utils import days_until
from ..services.progression import (
  get_tasks_for_user_module,
  recompute_and_persist_user_progress,
  set_task_completion_internal,
)
from ..services.recruiting import build_recruiting_view

bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")

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

  computed = set_task_completion_internal(user_id, task_id, completed)
  return jsonify(
    {
      "task_id": task_id,
      "completed": completed,
      "module_progress": computed["module_progress"],
    }
  )
