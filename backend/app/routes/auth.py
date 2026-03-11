import time
from threading import Lock

from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import (
  create_access_token,
  get_jwt_identity,
  jwt_required,
  set_access_cookies,
  unset_jwt_cookies,
)
from sqlalchemy.exc import IntegrityError
from ..analytics import track_event
from ..extensions import db
from ..models import User, UserProgress

bp = Blueprint("auth", __name__, url_prefix="/auth")
AUTH_RATE_LIMIT_WINDOW_SECONDS = 60
AUTH_LOGIN_LIMIT_PER_WINDOW = 10
AUTH_REGISTER_LIMIT_PER_WINDOW = 5
_RATE_LIMIT_EVENTS: dict[str, list[float]] = {}
_RATE_LIMIT_LOCK = Lock()


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


def _request_ip() -> str:
  forwarded_for = (request.headers.get("X-Forwarded-For") or "").strip()
  if forwarded_for:
    return forwarded_for.split(",")[0].strip() or "unknown"
  return request.remote_addr or "unknown"


def _check_auth_rate_limit(action: str, *, limit: int, window_seconds: int) -> int | None:
  now = time.time()
  key = f"{_request_ip()}:{action}"

  with _RATE_LIMIT_LOCK:
    history = _RATE_LIMIT_EVENTS.get(key, [])
    history = [stamp for stamp in history if now - stamp < window_seconds]
    if len(history) >= limit:
      retry_after = int(window_seconds - (now - history[0])) + 1
      _RATE_LIMIT_EVENTS[key] = history
      return max(1, retry_after)
    history.append(now)
    _RATE_LIMIT_EVENTS[key] = history

  return None


def _rate_limited_response(message: str, retry_after_seconds: int):
  response = jsonify({"error": message, "retry_after_seconds": retry_after_seconds})
  response.status_code = 429
  response.headers["Retry-After"] = str(retry_after_seconds)
  return response


def _token_claims(user: User) -> dict[str, int]:
  return {"token_version": int(user.token_version or 0)}


def _auth_success_response(user: User):
  token = create_access_token(identity=str(user.id), additional_claims=_token_claims(user))
  response = jsonify({"user": user.to_dict()})
  set_access_cookies(response, token)
  return response

@bp.post("/register")
def register():
  retry_after = _check_auth_rate_limit(
    "register",
    limit=AUTH_REGISTER_LIMIT_PER_WINDOW,
    window_seconds=AUTH_RATE_LIMIT_WINDOW_SECONDS,
  )
  if retry_after is not None:
    return _rate_limited_response("Too many register attempts. Try again soon.", retry_after)

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

  track_event(
    "signup_completed",
    user_id=user.id,
    properties={"auth_method": "email_password"},
  )
  return _auth_success_response(user)

@bp.post("/login")
def login():
  retry_after = _check_auth_rate_limit(
    "login",
    limit=AUTH_LOGIN_LIMIT_PER_WINDOW,
    window_seconds=AUTH_RATE_LIMIT_WINDOW_SECONDS,
  )
  if retry_after is not None:
    return _rate_limited_response("Too many login attempts. Try again soon.", retry_after)

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

  track_event(
    "login_succeeded",
    user_id=user.id,
    properties={"auth_method": "email_password"},
  )
  return _auth_success_response(user)


@bp.post("/logout")
@jwt_required(optional=True)
def logout():
  response = jsonify({"ok": True})
  unset_jwt_cookies(response)
  return response

@bp.get("/me")
@jwt_required()
def me():
  user_id = int(get_jwt_identity())
  user = User.query.get_or_404(user_id)
  return jsonify({"user": user.to_dict()})
