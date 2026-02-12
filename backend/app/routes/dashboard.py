from datetime import date
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User
from ..utils import days_until

bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")

@bp.get("/summary")
@jwt_required()
def summary():
  user_id = get_jwt_identity()
  user = User.query.get_or_404(user_id)

  today = date.today()
  target = date(today.year, 8, 1)
  if target < today:
    target = date(today.year + 1, 8, 1)
  days = days_until(target)

  return jsonify({
    "progress": 42,
    "days_until_recruiting": days,
    "recruiting_date": target.isoformat(),
    "graduation_date": user.graduation_date.isoformat() if user.graduation_date else None,
    "est_ready_by": "Aug 2026",
    "streak_days": 7
  })

