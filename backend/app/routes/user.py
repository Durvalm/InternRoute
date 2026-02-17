from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User
from ..utils import parse_date
from ..services.progression import (
  clear_coding_override,
  recompute_and_persist_user_progress,
  set_coding_override_for_advanced,
)

bp = Blueprint("user", __name__, url_prefix="/user")

ALLOWED_CODING_SKILL_LEVELS = {"Beginner", "Intermediate", "Advanced"}


def normalize_name(value: str | None) -> str | None:
  if value is None:
    return None
  name = value.strip()
  return name or None

@bp.post("/onboarding")
@jwt_required()
def complete_onboarding():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  data = request.get_json() or {}
  name = normalize_name(data.get("name"))
  coding_skill_level = data.get("coding_skill_level")

  if name is None:
    return jsonify({"error": "Name is required"}), 400

  if coding_skill_level not in ALLOWED_CODING_SKILL_LEVELS:
    return jsonify({"error": "coding_skill_level must be Beginner, Intermediate, or Advanced"}), 400

  try:
    graduation_date = parse_date(data.get("graduation_date"))
  except ValueError:
    return jsonify({"error": "Invalid graduation_date format"}), 400
  if graduation_date is None:
    return jsonify({"error": "Graduation date is required"}), 400

  user.name = name
  user.coding_skill_level = coding_skill_level
  user.graduation_date = graduation_date
  user.onboarding_completed = True

  db.session.commit()
  if coding_skill_level == "Advanced":
    set_coding_override_for_advanced(user.id, score=80)
  else:
    clear_coding_override(user.id)
  recompute_and_persist_user_progress(user.id, commit=True)
  return jsonify({"user": user.to_dict()})
