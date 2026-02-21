from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import User, UserProgress

bp = Blueprint("auth", __name__, url_prefix="/auth")


def _configured_superuser_emails() -> set[str]:
  raw = (current_app.config.get("SUPERUSER_EMAILS") or "").strip()
  if not raw:
    return set()
  return {
    email.strip().lower()
    for email in raw.split(",")
    if email.strip()
  }


def _sync_superuser_flag(user: User) -> bool:
  should_be_superuser = user.email in _configured_superuser_emails()
  if user.is_superuser == should_be_superuser:
    return False
  user.is_superuser = should_be_superuser
  return True

@bp.post("/register")
def register():
  data = request.get_json() or {}
  email = (data.get("email") or "").strip().lower()
  password = data.get("password")

  if not email or not password:
    return jsonify({"error": "Email and password are required"}), 400

  if User.query.filter_by(email=email).first():
    return jsonify({"error": "Email already registered"}), 409

  user = User(email=email)
  try:
    user.set_password(password)
  except ValueError:
    return jsonify({"error": "Password too long (max 72 bytes)."}), 400
  _sync_superuser_flag(user)

  progress = UserProgress(user=user)
  db.session.add_all([user, progress])
  try:
    db.session.commit()
  except IntegrityError:
    db.session.rollback()
    return jsonify({"error": "Email already registered"}), 409

  token = create_access_token(identity=str(user.id))
  return jsonify({"access_token": token, "user": user.to_dict()})

@bp.post("/login")
def login():
  data = request.get_json() or {}
  email = (data.get("email") or "").strip().lower()
  password = data.get("password")

  if not email or not password:
    return jsonify({"error": "Email and password are required"}), 400

  user = User.query.filter_by(email=email).first()
  if not user or not user.check_password(password):
    return jsonify({"error": "Invalid credentials"}), 401

  if _sync_superuser_flag(user):
    db.session.commit()

  token = create_access_token(identity=str(user.id))
  return jsonify({"access_token": token, "user": user.to_dict()})

@bp.get("/me")
@jwt_required()
def me():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  return jsonify({"user": user.to_dict()})
