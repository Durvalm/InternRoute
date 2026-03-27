from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..analytics import track_event
from ..extensions import db
from ..models import (
  OnboardingAssessment,
  OnboardingProjectAssessment,
  ProjectSubmission,
  ResumeSubmission,
  User,
)
from ..services.progression import (
  apply_onboarding_coding_skip,
  recompute_and_persist_user_progress,
  sync_projects_submission_progress,
  sync_resume_submission_progress,
)
from ..services.project_assessment import (
  ProjectAssessmentError,
  analyze_repo_url,
  analyze_uploaded_input,
)

bp = Blueprint("onboarding_assessment", __name__, url_prefix="/onboarding")

CODING_SKIP_CONFIDENCE_THRESHOLD = 0.65

TRACK_METADATA: dict[str, dict[str, Any]] = {
  "foundation_start": {
    "title": "Foundation Start",
    "summary": "No problem. We'll start with coding fundamentals and build proof progressively.",
    "sequence": ["Coding", "Projects", "Resume"],
  },
  "coding_base_build_depth": {
    "title": "Coding Base, Needs Build Depth",
    "summary": "You show coding signal, but portfolio depth needs to improve before applications.",
    "sequence": ["Projects", "Resume", "Applications"],
  },
  "emerging_builder": {
    "title": "Emerging Builder",
    "summary": "You have real signal. Build one more strong project, then improve resume for launch.",
    "sequence": ["Projects", "Resume", "Applications"],
  },
  "strong_builder_needs_positioning": {
    "title": "Strong Builder, Needs Positioning",
    "summary": "Technical base is strong. Main leverage now is resume quality and positioning.",
    "sequence": ["Resume", "Applications", "Interview Prep"],
  },
  "acceleration_track": {
    "title": "Acceleration Track",
    "summary": "You can fast-track to applications and interview prep with focused iteration.",
    "sequence": ["Projects", "Resume", "Applications"],
  },
}


def _current_user() -> User:
  user_id = int(get_jwt_identity())
  return User.query.get_or_404(user_id)


def _get_or_create_draft_assessment(user_id: int) -> OnboardingAssessment:
  assessment = (
    OnboardingAssessment.query
    .filter_by(user_id=user_id, status="draft")
    .order_by(OnboardingAssessment.created_at.desc(), OnboardingAssessment.id.desc())
    .first()
  )
  if assessment is not None:
    return assessment

  assessment = OnboardingAssessment(user_id=user_id, status="draft")
  db.session.add(assessment)
  db.session.flush()
  return assessment


def _get_or_create_slot(assessment_id: int, slot_index: int) -> OnboardingProjectAssessment:
  slot = OnboardingProjectAssessment.query.filter_by(assessment_id=assessment_id, slot_index=slot_index).first()
  if slot is not None:
    return slot

  slot = OnboardingProjectAssessment(
    assessment_id=assessment_id,
    slot_index=slot_index,
    input_mode="repo",
  )
  db.session.add(slot)
  db.session.flush()
  return slot


def _slot_has_input(slot: OnboardingProjectAssessment) -> bool:
  return bool((slot.repo_url or "").strip()) or bool((slot.uploaded_file_name or "").strip())


def _serialize_slot(slot: OnboardingProjectAssessment) -> dict[str, Any]:
  return {
    "slot_index": slot.slot_index,
    "input_mode": slot.input_mode,
    "repo_url": slot.repo_url,
    "uploaded_file_name": slot.uploaded_file_name,
    "has_api": slot.has_api,
    "has_database": slot.has_database,
    "has_coding_skills": slot.has_coding_skills,
    "coding_confidence": slot.coding_confidence,
    "project_pass": slot.project_pass,
    "is_coding_signal_only": slot.is_coding_signal_only,
    "evidence_files": slot.evidence_files,
    "analysis_notes": slot.analysis_notes,
  }


def _track_key_for(
  *,
  project_pass_count: int,
  has_any_project_signal: bool,
  resume_score: int | None,
  coding_signal: bool,
) -> str:
  if not has_any_project_signal and resume_score is None:
    return "foundation_start"
  if project_pass_count == 0 and coding_signal:
    return "coding_base_build_depth"
  if project_pass_count == 0:
    return "foundation_start"
  if project_pass_count == 1:
    return "emerging_builder"
  if resume_score is None or resume_score < 80:
    return "strong_builder_needs_positioning"
  return "acceleration_track"


def _resolve_resume_submission(user_id: int, submission_id: int | None) -> ResumeSubmission | None:
  if submission_id is None:
    return None
  return ResumeSubmission.query.filter_by(id=submission_id, user_id=user_id).first()


@bp.post("/projects/analyze")
@jwt_required()
def analyze_project():
  user = _current_user()

  input_mode = (request.form.get("input_mode") or "").strip().lower()
  if input_mode not in {"repo", "upload"}:
    return jsonify({"error": "input_mode must be either 'repo' or 'upload'"}), 400

  slot_index_raw = (request.form.get("slot_index") or "").strip()
  if not slot_index_raw.isdigit():
    return jsonify({"error": "slot_index must be 0 or 1"}), 400
  slot_index = int(slot_index_raw)
  if slot_index not in {0, 1}:
    return jsonify({"error": "slot_index must be 0 or 1"}), 400

  try:
    if input_mode == "repo":
      repo_url = (request.form.get("repo_url") or "").strip()
      if not repo_url:
        return jsonify({"error": "repo_url is required when input_mode=repo"}), 400
      result = analyze_repo_url(repo_url)
      normalized_repo_url = str(result.get("canonical_repo_url") or repo_url)
      uploaded_file_name = None
    else:
      uploaded = request.files.get("file")
      if uploaded is None:
        return jsonify({"error": "file is required when input_mode=upload"}), 400
      file_name = (uploaded.filename or "uploaded_file").strip() or "uploaded_file"
      file_bytes = uploaded.read() or b""
      if not file_bytes:
        return jsonify({"error": "Uploaded file is empty."}), 400
      result = analyze_uploaded_input(file_name=file_name, content_type=uploaded.mimetype, file_bytes=file_bytes)
      normalized_repo_url = None
      uploaded_file_name = file_name
  except ProjectAssessmentError as err:
    return jsonify({"error": str(err), "error_code": err.code}), err.status_code

  assessment = _get_or_create_draft_assessment(user.id)
  slot = _get_or_create_slot(assessment.id, slot_index)

  slot.input_mode = input_mode
  slot.repo_url = normalized_repo_url
  slot.uploaded_file_name = uploaded_file_name
  slot.has_api = result.get("has_api")
  slot.has_database = result.get("has_database")
  slot.has_coding_skills = bool(result.get("has_coding_skills"))
  slot.coding_confidence = float(result.get("coding_confidence") or 0.0)
  slot.project_pass = bool(result.get("project_pass"))
  slot.is_coding_signal_only = bool(result.get("is_coding_signal_only"))
  slot.analysis_notes = str(result.get("analysis_notes") or "")
  slot.evidence_files_json = json.dumps(result.get("evidence_files") or [], ensure_ascii=True)
  db.session.commit()

  track_event(
    "onboarding_project_analyzed",
    user_id=user.id,
    properties={
      "assessment_id": assessment.id,
      "slot_index": slot_index,
      "input_mode": input_mode,
      "project_pass": slot.project_pass,
      "has_coding_skills": slot.has_coding_skills,
      "coding_confidence": slot.coding_confidence,
    },
  )

  return jsonify({
    "assessment_id": assessment.id,
    "slot": _serialize_slot(slot),
  })


@bp.post("/resume/link")
@jwt_required()
def link_resume_submission():
  user = _current_user()
  payload = request.get_json() or {}

  submission_id = payload.get("submission_id")
  if not isinstance(submission_id, int):
    return jsonify({"error": "submission_id must be an integer"}), 400

  submission = ResumeSubmission.query.filter_by(id=submission_id, user_id=user.id).first()
  if submission is None:
    return jsonify({"error": "Resume submission not found"}), 404

  assessment = _get_or_create_draft_assessment(user.id)
  assessment.resume_submission_id = submission.id
  db.session.commit()

  return jsonify({"assessment_id": assessment.id, "resume_submission_id": submission.id})


@bp.post("/finalize")
@jwt_required()
def finalize_assessment():
  user = _current_user()
  payload = request.get_json() or {}

  assessment = _get_or_create_draft_assessment(user.id)

  resume_submission_id_raw = payload.get("resume_submission_id")
  if resume_submission_id_raw is not None:
    if not isinstance(resume_submission_id_raw, int):
      return jsonify({"error": "resume_submission_id must be an integer when provided"}), 400
    resume_submission = _resolve_resume_submission(user.id, resume_submission_id_raw)
    if resume_submission is None:
      return jsonify({"error": "Resume submission not found"}), 404
    assessment.resume_submission_id = resume_submission.id

  if assessment.status == "completed":
    track_data = TRACK_METADATA.get(assessment.track_key or "foundation_start", TRACK_METADATA["foundation_start"])
    completed_slots = (
      OnboardingProjectAssessment.query
      .filter_by(assessment_id=assessment.id)
      .all()
    )
    completed_project_pass_count = sum(
      1
      for slot in completed_slots
      if bool(slot.project_pass) and not bool(slot.is_coding_signal_only)
    )
    completed_resume_submission = _resolve_resume_submission(user.id, assessment.resume_submission_id)
    completed_resume_score = None
    if (
      completed_resume_submission is not None
      and completed_resume_submission.status == "succeeded"
      and completed_resume_submission.overall_score is not None
    ):
      completed_resume_score = int(completed_resume_submission.overall_score)

    return jsonify({
      "assessment_id": assessment.id,
      "track_key": assessment.track_key,
      "track": track_data,
      "can_skip_coding_skills": bool(assessment.can_skip_coding_skills),
      "coding_skip_confidence": assessment.coding_skip_confidence,
      "project_pass_count": completed_project_pass_count,
      "resume_score": completed_resume_score,
      "already_finalized": True,
    })

  slots = (
    OnboardingProjectAssessment.query
    .filter_by(assessment_id=assessment.id)
    .order_by(OnboardingProjectAssessment.slot_index.asc())
    .all()
  )

  has_any_project_signal = any(_slot_has_input(slot) for slot in slots)
  project_pass_count = sum(1 for slot in slots if bool(slot.project_pass) and not bool(slot.is_coding_signal_only))

  coding_confidences = [
    float(slot.coding_confidence or 0.0)
    for slot in slots
    if bool(slot.has_coding_skills)
  ]
  max_coding_confidence = max(coding_confidences) if coding_confidences else 0.0
  coding_signal = max_coding_confidence >= CODING_SKIP_CONFIDENCE_THRESHOLD

  resume_submission = _resolve_resume_submission(user.id, assessment.resume_submission_id)
  resume_score = None
  if resume_submission is not None and resume_submission.status == "succeeded" and resume_submission.overall_score is not None:
    resume_score = int(resume_submission.overall_score)

  track_key = _track_key_for(
    project_pass_count=project_pass_count,
    has_any_project_signal=has_any_project_signal,
    resume_score=resume_score,
    coding_signal=coding_signal,
  )
  can_skip_coding_skills = bool(coding_signal)

  assessment.track_key = track_key
  assessment.can_skip_coding_skills = can_skip_coding_skills
  assessment.coding_skip_confidence = max_coding_confidence if coding_confidences else None

  created_project_submissions = 0
  for slot in slots:
    if not _slot_has_input(slot):
      continue
    if bool(slot.is_coding_signal_only):
      continue

    source_type = "github" if slot.input_mode == "repo" else "upload"
    repo_url = slot.repo_url or f"https://internroute.local/onboarding-upload/{assessment.id}/slot-{slot.slot_index + 1}"
    review_note_parts = [
      f"Onboarding assessment auto-review (assessment #{assessment.id}, slot {slot.slot_index + 1}).",
      f"has_api={slot.has_api}",
      f"has_database={slot.has_database}",
      f"has_coding_skills={slot.has_coding_skills}",
      f"coding_confidence={slot.coding_confidence}",
    ]

    submission = ProjectSubmission(
      user_id=user.id,
      repo_url=repo_url,
      deployed_url=None,
      source_type=source_type,
      source_label=slot.uploaded_file_name if source_type == "upload" else None,
      status="pass" if bool(slot.project_pass) else "fail",
      review_notes=" ".join(review_note_parts),
    )
    db.session.add(submission)
    created_project_submissions += 1

  module_sync_data: dict[str, Any] | None = None
  if created_project_submissions > 0:
    module_sync_data = sync_projects_submission_progress(
      user.id,
      commit=False,
      emit_module_completion_events=True,
    )

  if resume_submission is not None and resume_submission.status == "succeeded":
    module_sync_data = sync_resume_submission_progress(
      user.id,
      commit=False,
      emit_module_completion_events=True,
    )

  if can_skip_coding_skills:
    module_sync_data = apply_onboarding_coding_skip(
      user.id,
      confidence=max_coding_confidence,
      commit=False,
      emit_module_completion_events=True,
    )

  if module_sync_data is None:
    module_sync_data = recompute_and_persist_user_progress(
      user.id,
      commit=False,
      emit_module_completion_events=True,
    )

  assessment.status = "completed"
  assessment.completed_at = datetime.utcnow()
  db.session.commit()

  track_event(
    "onboarding_assessment_finalized",
    user_id=user.id,
    properties={
      "assessment_id": assessment.id,
      "track_key": track_key,
      "project_pass_count": project_pass_count,
      "resume_score": resume_score,
      "can_skip_coding_skills": can_skip_coding_skills,
      "coding_skip_confidence": max_coding_confidence,
    },
  )

  return jsonify({
    "assessment_id": assessment.id,
    "track_key": track_key,
    "track": TRACK_METADATA.get(track_key, TRACK_METADATA["foundation_start"]),
    "can_skip_coding_skills": can_skip_coding_skills,
    "coding_skip_confidence": max_coding_confidence,
    "project_pass_count": project_pass_count,
    "resume_score": resume_score,
    "module_progress": module_sync_data.get("module_progress") if module_sync_data else [],
    "category_readiness": module_sync_data.get("category_readiness") if module_sync_data else {},
  })
