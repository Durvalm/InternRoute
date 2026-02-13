from datetime import date
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, UserProgress
from ..extensions import db
from ..utils import days_until

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

  progress = UserProgress.query.filter_by(user_id=user.id).first()
  if not progress:
    progress = UserProgress(user_id=user.id)
    db.session.add(progress)
    db.session.commit()

  payload = {
    "user_name": user.name,
    "progress": progress.readiness_score,
    "category_readiness": {
      "coding": progress.category_coding,
      "projects": progress.category_projects,
      "resume": progress.category_resume
    },
    "season_status": "window" if window_is_open else "prep",
    "days_until_recruiting": days_until_next_window,
    "recruiting_date": next_window_start.isoformat(),
    "days_until_window_close": days_until_window_close,
    "recruiting_window_end": current_window_end.isoformat() if window_is_open else None,
    "graduation_date": user.graduation_date.isoformat() if user.graduation_date else None
  }

  return jsonify(payload)
