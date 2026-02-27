from __future__ import annotations

import json
import logging
import time
from threading import Lock
from typing import Any

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import ResumeSubmission
from ..services.progression import sync_resume_submission_progress
from ..services.resume_providers import ResumeProviderError, build_resume_scoring_provider
from ..services.resume_scoring import (
  PASS_THRESHOLD_SCORE,
  PROMPT_VERSION,
  ResumeScoringError,
  prepare_resume_content,
  score_prepared_resume,
  validate_pdf_upload,
)


bp = Blueprint("resume", __name__, url_prefix="/resume")
logger = logging.getLogger(__name__)

RESUME_SCORE_LIMIT_PER_MINUTE = 6
_RATE_LIMIT_EVENTS: dict[str, list[float]] = {}
_RATE_LIMIT_LOCK = Lock()


def _is_resume_scorer_enabled() -> bool:
  value = current_app.config.get("RESUME_SCORER_ENABLED")
  if isinstance(value, bool):
    return value
  if value is None:
    return False
  text = str(value).strip().lower()
  return text in {"1", "true", "yes", "on"}


def _check_rate_limit(user_id: int, *, limit: int, window_seconds: float = 60.0) -> int | None:
  key = f"{user_id}:resume_score"
  now = time.time()
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


def _json_list(value: list[str]) -> str:
  return json.dumps(value, ensure_ascii=True)


def _submission_error_payload(message: str, *, error_code: str | None = None) -> dict[str, str]:
  payload: dict[str, str] = {"error": message}
  if error_code:
    payload["error_code"] = error_code
  return payload


def _public_error_message(err: ResumeScoringError) -> str:
  if err.code in {"provider_request_failed", "provider_response_invalid"}:
    return "Resume scoring is temporarily unstable. Please retry in a moment."
  return str(err)


def _serialize_submission(submission: ResumeSubmission) -> dict[str, Any]:
  payload: dict[str, Any] = {
    "id": submission.id,
    "status": submission.status,
    "file_name": submission.file_name,
    "file_size_bytes": submission.file_size_bytes,
    "page_count": submission.page_count,
    "extracted_char_count": submission.extracted_char_count,
    "overall_score": submission.overall_score,
    "metadata": {
      "provider": submission.provider,
      "model": submission.model,
      "prompt_version": submission.prompt_version,
    },
    "strengths": submission.strengths,
    "improvements": submission.improvements,
    "error_code": submission.error_code,
    "error_message": submission.error_message,
    "created_at": submission.created_at.isoformat() if submission.created_at else None,
    "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
  }
  if submission.formatting_score is not None and submission.content_score is not None and submission.ats_score is not None and submission.impact_score is not None:
    payload["dimension_scores"] = {
      "formatting": submission.formatting_score,
      "content": submission.content_score,
      "ats": submission.ats_score,
      "impact": submission.impact_score,
    }
  else:
    payload["dimension_scores"] = None
  return payload


@bp.get("/submissions")
@jwt_required()
def list_submissions():
  user_id = int(get_jwt_identity())
  submissions = (
    ResumeSubmission.query
    .filter_by(user_id=user_id)
    .order_by(ResumeSubmission.created_at.desc(), ResumeSubmission.id.desc())
    .all()
  )
  return jsonify({"submissions": [_serialize_submission(submission) for submission in submissions]})


@bp.post("/score")
@jwt_required()
def score_resume():
  if not _is_resume_scorer_enabled():
    return jsonify({"error": "Resume scoring is currently disabled."}), 503

  user_id = int(get_jwt_identity())
  retry_after = _check_rate_limit(user_id, limit=RESUME_SCORE_LIMIT_PER_MINUTE)
  if retry_after is not None:
    response = jsonify({
      "error": "Too many resume scoring requests.",
      "retry_after_seconds": retry_after,
    })
    response.status_code = 429
    response.headers["Retry-After"] = str(retry_after)
    return response

  uploaded = request.files.get("file")
  if uploaded is None:
    return jsonify({"error": "file is required"}), 400

  file_name = (uploaded.filename or "resume.pdf").strip() or "resume.pdf"
  file_bytes = uploaded.read() or b""
  file_size_bytes = len(file_bytes)
  submission = ResumeSubmission(
    user_id=user_id,
    file_name=file_name,
    file_size_bytes=file_size_bytes,
    status="failed",
  )
  db.session.add(submission)

  start = time.perf_counter()
  try:
    validate_pdf_upload(
      filename=file_name,
      mimetype=uploaded.mimetype,
      file_size_bytes=file_size_bytes,
    )

    prepared_content = prepare_resume_content(file_bytes)
    submission.page_count = prepared_content.page_count
    submission.extracted_char_count = prepared_content.extracted_char_count
    submission.prompt_version = PROMPT_VERSION

    provider = build_resume_scoring_provider()
    submission.provider = provider.provider_name
    submission.model = provider.model_name

    scored = score_prepared_resume(
      prepared_content=prepared_content,
      provider=provider,
      pdf_bytes=file_bytes,
      file_name=file_name,
    )

    submission.status = "succeeded"
    submission.overall_score = scored.overall_score
    submission.formatting_score = scored.formatting_score
    submission.content_score = scored.content_score
    submission.ats_score = scored.ats_score
    submission.impact_score = scored.impact_score
    submission.strengths_json = _json_list(scored.strengths)
    submission.improvements_json = _json_list(scored.improvements)
    submission.error_code = None
    submission.error_message = None

    sync_resume_submission_progress(user_id, commit=False)
    db.session.commit()

    best_successful_score = (
      db.session.query(db.func.max(ResumeSubmission.overall_score))
      .filter(ResumeSubmission.user_id == user_id, ResumeSubmission.status == "succeeded")
      .scalar()
    )
    resume_category = int(best_successful_score or 0)
    resume_task_completed = resume_category >= PASS_THRESHOLD_SCORE
    elapsed_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
      "resume_score_succeeded user_id=%s submission_id=%s provider=%s model=%s overall=%s page_count=%s size=%s elapsed_ms=%s",
      user_id,
      submission.id,
      submission.provider,
      submission.model,
      scored.overall_score,
      submission.page_count,
      submission.file_size_bytes,
      elapsed_ms,
    )

    return jsonify(
      {
        "submission_id": submission.id,
        "overall_score": scored.overall_score,
        "rubric_scores": scored.rubric_scores,
        "dimension_scores": scored.dimension_scores,
        "strengths": scored.strengths,
        "improvements": scored.improvements,
        "metadata": {
          "page_count": submission.page_count,
          "provider": submission.provider,
          "model": submission.model,
          "prompt_version": submission.prompt_version,
        },
        "progression": {
          "resume_task_completed": resume_task_completed,
          "category_resume": resume_category,
          "pass_threshold": PASS_THRESHOLD_SCORE,
        },
      }
    )
  except ResumeScoringError as err:
    public_message = _public_error_message(err)
    submission.status = "failed"
    submission.error_code = err.code
    submission.error_message = public_message[:500]
    db.session.commit()
    logger.warning(
      "resume_score_failed user_id=%s submission_id=%s code=%s message=%s",
      user_id,
      submission.id,
      err.code,
      str(err),
    )
    return jsonify(_submission_error_payload(public_message, error_code=err.code)), err.status_code
  except ResumeProviderError as err:
    submission.status = "failed"
    submission.error_code = "provider_config_error"
    submission.error_message = str(err)[:500]
    db.session.commit()
    logger.exception("resume_score_provider_config_error user_id=%s submission_id=%s", user_id, submission.id)
    return jsonify(_submission_error_payload("Resume scorer is not configured.", error_code="provider_config_error")), 503
  except Exception:
    submission.status = "failed"
    submission.error_code = "resume_scoring_internal_error"
    submission.error_message = "Internal scoring error."
    db.session.commit()
    logger.exception("resume_score_internal_error user_id=%s submission_id=%s", user_id, submission.id)
    return jsonify(_submission_error_payload("Internal scoring error.", error_code="resume_scoring_internal_error")), 500
