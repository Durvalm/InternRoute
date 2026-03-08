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
PROFILE_FIELDS = {"name", "coding_skill_level", "graduation_date"}


def normalize_name(value: str | None) -> str | None:
  if value is None:
    return None
  name = value.strip()
  return name or None


def _validate_profile_payload(data: dict, *, require_all_fields: bool) -> tuple[dict, str | None]:
  updates: dict = {}

  if require_all_fields:
    missing = [field for field in PROFILE_FIELDS if field not in data]
    if missing:
      return {}, "Name, coding_skill_level, and graduation_date are required"

  if "name" in data:
    name = normalize_name(data.get("name"))
    if name is None:
      return {}, "Name is required"
    updates["name"] = name
  elif require_all_fields:
    return {}, "Name is required"

  if "coding_skill_level" in data:
    coding_skill_level = data.get("coding_skill_level")
    if coding_skill_level not in ALLOWED_CODING_SKILL_LEVELS:
      return {}, "coding_skill_level must be Beginner, Intermediate, or Advanced"
    updates["coding_skill_level"] = coding_skill_level
  elif require_all_fields:
    return {}, "coding_skill_level must be Beginner, Intermediate, or Advanced"

  if "graduation_date" in data:
    try:
      graduation_date = parse_date(data.get("graduation_date"))
    except ValueError:
      return {}, "Invalid graduation_date format"
    if graduation_date is None:
      return {}, "Graduation date is required"
    updates["graduation_date"] = graduation_date
  elif require_all_fields:
    return {}, "Graduation date is required"

  return updates, None


def _persist_profile_changes(user: User) -> None:
  if user.coding_skill_level == "Advanced":
    set_coding_override_for_advanced(user.id, score=80)
  else:
    clear_coding_override(user.id)
  recompute_and_persist_user_progress(user.id, commit=True)


@bp.post("/onboarding")
@jwt_required()
def complete_onboarding():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  data = request.get_json() or {}
  updates, error = _validate_profile_payload(data, require_all_fields=True)
  if error:
    return jsonify({"error": error}), 400

  user.name = updates["name"]
  user.coding_skill_level = updates["coding_skill_level"]
  user.graduation_date = updates["graduation_date"]
  user.onboarding_completed = True

  db.session.commit()
  _persist_profile_changes(user)
  return jsonify({"user": user.to_dict()})


@bp.patch("/profile")
@jwt_required()
def update_profile():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  data = request.get_json() or {}
  if not isinstance(data, dict):
    return jsonify({"error": "Invalid JSON payload"}), 400

  if not any(field in data for field in PROFILE_FIELDS):
    return jsonify({"error": "At least one of name, coding_skill_level, or graduation_date is required"}), 400

  updates, error = _validate_profile_payload(data, require_all_fields=False)
  if error:
    return jsonify({"error": error}), 400

  if "name" in updates:
    user.name = updates["name"]
  if "coding_skill_level" in updates:
    user.coding_skill_level = updates["coding_skill_level"]
  if "graduation_date" in updates:
    user.graduation_date = updates["graduation_date"]

  if user.name and user.coding_skill_level and user.graduation_date:
    user.onboarding_completed = True

  db.session.commit()
  _persist_profile_changes(user)
  return jsonify({"user": user.to_dict()})


@bp.post("/password")
@jwt_required()
def change_password():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  data = request.get_json() or {}

  current_password = data.get("current_password")
  new_password = data.get("new_password")

  if not isinstance(current_password, str) or not current_password:
    return jsonify({"error": "current_password is required"}), 400
  if not isinstance(new_password, str) or not new_password:
    return jsonify({"error": "new_password is required"}), 400
  if current_password == new_password:
    return jsonify({"error": "New password must be different from current password"}), 400
  if not user.check_password(current_password):
    return jsonify({"error": "Current password is incorrect"}), 401

  try:
    user.set_password(new_password)
  except ValueError:
    return jsonify({"error": "Password too long (max 72 bytes)."}), 400

  db.session.commit()
  return jsonify({"message": "Password updated successfully"})
