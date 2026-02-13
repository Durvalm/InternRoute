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
  target = date(today.year, 8, 1)
  if target < today:
    target = date(today.year + 1, 8, 1)
  days = days_until(target)

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
    "days_until_recruiting": days,
    "recruiting_date": target.isoformat(),
    "graduation_date": user.graduation_date.isoformat() if user.graduation_date else None
  }

  return jsonify(payload)
