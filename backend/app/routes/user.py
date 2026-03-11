from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User
from ..utils import parse_date
from ..services.progression import recompute_and_persist_user_progress

bp = Blueprint("user", __name__, url_prefix="/user")

PROFILE_FIELDS = {"name", "graduation_date"}


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
      return {}, "Name and graduation_date are required"

  if "name" in data:
    name = normalize_name(data.get("name"))
    if name is None:
      return {}, "Name is required"
    updates["name"] = name
  elif require_all_fields:
    return {}, "Name is required"

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
    return jsonify({"error": "At least one of name or graduation_date is required"}), 400

  updates, error = _validate_profile_payload(data, require_all_fields=False)
  if error:
    return jsonify({"error": error}), 400

  if "name" in updates:
    user.name = updates["name"]
  if "graduation_date" in updates:
    user.graduation_date = updates["graduation_date"]

  if user.name and user.graduation_date:
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

  user.token_version = int(user.token_version or 0) + 1
  db.session.commit()
  return jsonify({"message": "Password updated successfully"})
