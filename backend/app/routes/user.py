from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User
from ..utils import parse_date

bp = Blueprint("user", __name__, url_prefix="/user")

@bp.get("/profile")
@jwt_required()
def profile():
  user_id = get_jwt_identity()
  user = User.query.get_or_404(user_id)
  return jsonify({"user": user.to_dict()})

@bp.patch("/profile")
@jwt_required()
def update_profile():
  user_id = get_jwt_identity()
  user = User.query.get_or_404(user_id)
  data = request.get_json() or {}

  try:
    graduation_date = parse_date(data.get("graduation_date"))
  except ValueError:
    return jsonify({"error": "Invalid graduation_date format"}), 400

  user.experience_level = data.get("experience_level", user.experience_level)
  user.graduation_date = graduation_date or user.graduation_date

  db.session.commit()
  return jsonify({"user": user.to_dict()})

@bp.post("/onboarding")
@jwt_required()
def complete_onboarding():
  user_id = get_jwt_identity()
  user = User.query.get_or_404(user_id)
  data = request.get_json() or {}

  try:
    graduation_date = parse_date(data.get("graduation_date"))
  except ValueError:
    return jsonify({"error": "Invalid graduation_date format"}), 400

  user.experience_level = data.get("experience_level")
  user.graduation_date = graduation_date
  user.onboarding_completed = True

  db.session.commit()
  return jsonify({"user": user.to_dict()})
