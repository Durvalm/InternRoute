from __future__ import annotations

import re
import hashlib
from datetime import datetime
from typing import Any

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func

from ..analytics import track_event
from ..extensions import db
from ..monitoring import capture_monitored_exception
from ..models import LeetcodeProgress
from ..services.leetcode_api import LeetcodeApiError, fetch_solved_counts
from ..services.progression import module_completion_allowed_or_error, sync_leetcode_progress


bp = Blueprint("leetcode", __name__, url_prefix="/leetcode")

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_-]{2,50}$")
TOTAL_TARGET = 50
MEDIUM_TARGET = 30


def _normalize_username(value: object) -> str | None:
  if not isinstance(value, str):
    return None
  normalized = value.strip()
  if not normalized:
    return None
  if not USERNAME_PATTERN.fullmatch(normalized):
    return None
  return normalized


def _progress_percent(value: int, target: int) -> int:
  if target <= 0:
    return 0
  ratio = max(0.0, min(1.0, value / target))
  return int(round(ratio * 100))


def _overall_progress_percent(record: LeetcodeProgress | None) -> int:
  if record is None:
    return 0
  total_part = min(max(record.total_solved, 0) / TOTAL_TARGET, 1.0)
  medium_part = min(max(record.medium_solved, 0) / MEDIUM_TARGET, 1.0)
  return int(round(((total_part + medium_part) / 2.0) * 100))


def _meets_completion_target(record: LeetcodeProgress | None) -> bool:
  if record is None:
    return False
  return record.total_solved >= TOTAL_TARGET and record.medium_solved >= MEDIUM_TARGET


def _serialize_status(record: LeetcodeProgress | None) -> dict[str, Any]:
  target_met = _meets_completion_target(record)
  return {
    "linked": record is not None,
    "leetcode_username": record.leetcode_username if record else None,
    "total_solved": record.total_solved if record else 0,
    "easy_solved": record.easy_solved if record else 0,
    "medium_solved": record.medium_solved if record else 0,
    "hard_solved": record.hard_solved if record else 0,
    "total_target": TOTAL_TARGET,
    "medium_target": MEDIUM_TARGET,
    "completion_target_met": target_met,
    "progress_percent_total": _progress_percent(record.total_solved if record else 0, TOTAL_TARGET),
    "progress_percent_medium": _progress_percent(record.medium_solved if record else 0, MEDIUM_TARGET),
    "progress_percent_overall": _overall_progress_percent(record),
    "last_synced_at": record.last_synced_at.isoformat() if record and record.last_synced_at else None,
    "sync_hint": "Sync can take a few minutes to reflect recent LeetCode submissions.",
  }


def _module_progress_snapshot(computed: dict[str, Any]) -> dict[str, Any] | None:
  modules = computed.get("module_progress")
  if not isinstance(modules, list):
    return None
  module = next((item for item in modules if item.get("module_key") == "leetcode"), None)
  if not isinstance(module, dict):
    return None
  return {
    "module_key": module.get("module_key"),
    "score": int(module.get("score") or 0),
    "unlock_threshold": int(module.get("unlock_threshold") or 0),
  }


def _capture_leetcode_api_error(err: LeetcodeApiError, *, user_id: int, route: str) -> None:
  status = err.status_code
  if status is not None and 400 <= status <= 499:
    return
  capture_monitored_exception(
    err,
    tags={"area": "leetcode", "service": "leetcode_api", "route": route},
    context={"user_id": user_id, "status_code": status if status is not None else 502},
  )


def _api_error_response(err: LeetcodeApiError):
  status = err.status_code
  if status is not None and 400 <= status <= 499:
    return jsonify({"error": str(err)}), status
  return jsonify({"error": str(err)}), 502


def _hash_username(username: str) -> str:
  return hashlib.sha256(username.strip().lower().encode("utf-8")).hexdigest()


@bp.get("/progress")
@jwt_required()
def get_status():
  user_id = int(get_jwt_identity())
  record = LeetcodeProgress.query.filter_by(user_id=user_id).first()
  computed = sync_leetcode_progress(user_id, commit=True)
  return jsonify({
    "progress": _serialize_status(record),
    "module_progress": _module_progress_snapshot(computed),
  })


@bp.post("/progress/link")
@jwt_required()
def link_username():
  user_id = int(get_jwt_identity())
  allowed, error_payload = module_completion_allowed_or_error(user_id, "leetcode")
  if not allowed and error_payload is not None:
    return jsonify(error_payload), 409

  payload = request.get_json() or {}
  username = _normalize_username(payload.get("leetcode_username"))
  if username is None:
    return jsonify({"error": "leetcode_username must be 2-50 chars using letters, numbers, underscore, or hyphen."}), 400
  username_canonical = username.lower()

  duplicate = LeetcodeProgress.query.filter(
    LeetcodeProgress.user_id != user_id,
    func.lower(LeetcodeProgress.leetcode_username) == username_canonical,
  ).first()
  if duplicate is not None:
    return jsonify({"error": "This LeetCode username is already linked to another account."}), 409

  try:
    solved = fetch_solved_counts(username)
  except LeetcodeApiError as err:
    track_event(
      "leetcode_sync_failed",
      user_id=user_id,
      properties={
        "error_code": "leetcode_api_error",
        "status_code": int(err.status_code or 502),
        "route": "link",
      },
    )
    if err.status_code == 404:
      return jsonify({"error": "LeetCode username not found."}), 404
    _capture_leetcode_api_error(err, user_id=user_id, route="link")
    return _api_error_response(err)

  now = datetime.utcnow()
  record = LeetcodeProgress.query.filter_by(user_id=user_id).first()
  if record is None:
    record = LeetcodeProgress(
      user_id=user_id,
      leetcode_username=username,
      total_solved=0,
      easy_solved=0,
      medium_solved=0,
      hard_solved=0,
    )
    db.session.add(record)
  else:
    record.leetcode_username = username

  record.total_solved = solved["total_solved"]
  record.easy_solved = solved["easy_solved"]
  record.medium_solved = solved["medium_solved"]
  record.hard_solved = solved["hard_solved"]
  record.last_synced_at = now
  record.completion_verified_at = now if _meets_completion_target(record) else None

  try:
    computed = sync_leetcode_progress(user_id, commit=False, emit_module_completion_events=True)
    db.session.commit()
  except IntegrityError:
    db.session.rollback()
    return jsonify({"error": "This LeetCode username is already linked to another account."}), 409

  track_event(
    "leetcode_linked",
    user_id=user_id,
    properties={
      "leetcode_username": _hash_username(username),
    },
  )

  return jsonify({
    "progress": _serialize_status(record),
    "module_progress": _module_progress_snapshot(computed),
  })


@bp.post("/progress/sync")
@jwt_required()
def sync_progress():
  user_id = int(get_jwt_identity())
  allowed, error_payload = module_completion_allowed_or_error(user_id, "leetcode")
  if not allowed and error_payload is not None:
    return jsonify(error_payload), 409

  record = LeetcodeProgress.query.filter_by(user_id=user_id).first()
  if record is None:
    return jsonify({"error": "Link your LeetCode username first."}), 400

  try:
    solved = fetch_solved_counts(record.leetcode_username)
  except LeetcodeApiError as err:
    track_event(
      "leetcode_sync_failed",
      user_id=user_id,
      properties={
        "error_code": "leetcode_api_error",
        "status_code": int(err.status_code or 502),
        "route": "sync",
      },
    )
    if err.status_code == 404:
      return jsonify({"error": "LeetCode username not found."}), 404
    _capture_leetcode_api_error(err, user_id=user_id, route="sync")
    return _api_error_response(err)

  now = datetime.utcnow()
  record.total_solved = solved["total_solved"]
  record.easy_solved = solved["easy_solved"]
  record.medium_solved = solved["medium_solved"]
  record.hard_solved = solved["hard_solved"]
  record.last_synced_at = now
  record.completion_verified_at = now if _meets_completion_target(record) else None

  computed = sync_leetcode_progress(user_id, commit=False, emit_module_completion_events=True)
  db.session.commit()
  track_event(
    "leetcode_sync_succeeded",
    user_id=user_id,
    properties={
      "total_solved": record.total_solved,
      "medium_solved": record.medium_solved,
      "hard_solved": record.hard_solved,
    },
  )
  return jsonify({
    "progress": _serialize_status(record),
    "module_progress": _module_progress_snapshot(computed),
  })
