from datetime import date
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User
from ..utils import days_until
from ..services.progression import (
  get_tasks_for_user_module,
  recompute_and_persist_user_progress,
)

bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")

@bp.get("/summary")
@jwt_required()
def summary():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)

  today = date.today()
  next_window_start = date(today.year, 8, 1)
  if next_window_start < today:
    next_window_start = date(today.year + 1, 8, 1)

  current_window_start = date(today.year, 8, 1) if today >= date(today.year, 8, 1) else date(today.year - 1, 8, 1)
  current_window_end = date(current_window_start.year + 1, 3, 31)
  window_is_open = current_window_start <= today <= current_window_end

  days_until_next_window = days_until(next_window_start)
  days_until_window_close = days_until(current_window_end) if window_is_open else None

  computed = recompute_and_persist_user_progress(user.id, commit=True)

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
    "recruiting_window_end": current_window_end.isoformat() if window_is_open else None,
    "graduation_date": user.graduation_date.isoformat() if user.graduation_date else None
  }

  return jsonify(payload)


@bp.get("/modules")
@jwt_required()
def modules():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  computed = recompute_and_persist_user_progress(user.id, commit=True)
  return jsonify({"modules": computed["module_progress"]})


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
