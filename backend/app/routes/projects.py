from __future__ import annotations

from urllib.parse import urlparse

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import ProjectSubmission, User
from ..services.progression import sync_projects_submission_progress

bp = Blueprint("projects", __name__, url_prefix="/projects")

_ALLOWED_GITHUB_HOSTS = {"github.com", "www.github.com"}
_REVIEW_DECISIONS = {"pass", "fail"}


def _normalize_optional_url(value: object) -> str | None:
  if value is None:
    return None
  if not isinstance(value, str):
    return None
  normalized = value.strip()
  return normalized or None


def _parse_github_repo(value: str) -> tuple[str, str] | None:
  try:
    parsed = urlparse(value)
  except Exception:
    return None

  scheme = (parsed.scheme or "").lower()
  host = (parsed.netloc or "").lower()
  if scheme not in {"http", "https"}:
    return None
  if host not in _ALLOWED_GITHUB_HOSTS:
    return None

  segments = [segment for segment in (parsed.path or "").split("/") if segment]
  if len(segments) != 2:
    return None

  owner = segments[0].strip()
  repo = segments[1].strip()
  if repo.endswith(".git"):
    repo = repo[:-4]

  if not owner or not repo:
    return None
  return owner, repo


def _canonical_github_repo_url(owner: str, repo: str) -> str:
  return f"https://github.com/{owner}/{repo}"


def _is_valid_http_url(value: str) -> bool:
  try:
    parsed = urlparse(value)
  except Exception:
    return False
  scheme = (parsed.scheme or "").lower()
  return scheme in {"http", "https"} and bool(parsed.netloc)


def _normalize_optional_note(value: object) -> str | None:
  if value is None:
    return None
  if not isinstance(value, str):
    return None
  normalized = value.strip()
  return normalized or None


def _current_user() -> User:
  user_id = int(get_jwt_identity())
  return User.query.get_or_404(user_id)


def _serialize_submission(submission: ProjectSubmission, *, include_user: bool = False) -> dict[str, object]:
  payload: dict[str, object] = {
    "id": submission.id,
    "user_id": submission.user_id,
    "repo_url": submission.repo_url,
    "deployed_url": submission.deployed_url,
    "status": submission.status,
    "review_notes": submission.review_notes,
    "created_at": submission.created_at.isoformat() if submission.created_at else None,
    "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
  }
  if include_user:
    payload["user"] = {
      "id": submission.user.id if submission.user else submission.user_id,
      "email": submission.user.email if submission.user else None,
      "name": submission.user.name if submission.user else None,
    }
  return payload


@bp.get("/submissions")
@jwt_required()
def list_submissions():
  user = _current_user()
  submissions = (
    ProjectSubmission.query
    .filter_by(user_id=user.id)
    .order_by(ProjectSubmission.created_at.desc(), ProjectSubmission.id.desc())
    .all()
  )
  return jsonify({"submissions": [_serialize_submission(item) for item in submissions]})


@bp.post("/submissions")
@jwt_required()
def create_submission():
  user = _current_user()
  payload = request.get_json() or {}

  repo_url_raw = _normalize_optional_url(payload.get("repo_url"))
  if repo_url_raw is None:
    return jsonify({"error": "repo_url is required"}), 400

  parsed_repo = _parse_github_repo(repo_url_raw)
  if parsed_repo is None:
    return jsonify({"error": "repo_url must be a valid GitHub repository URL (https://github.com/<owner>/<repo>)"}), 400
  owner, repo = parsed_repo
  repo_url = _canonical_github_repo_url(owner, repo)

  deployed_url = _normalize_optional_url(payload.get("deployed_url"))
  if deployed_url is not None and not _is_valid_http_url(deployed_url):
    return jsonify({"error": "deployed_url must be a valid http(s) URL"}), 400

  submission = ProjectSubmission(
    user_id=user.id,
    repo_url=repo_url,
    deployed_url=deployed_url,
    status="pending",
  )
  db.session.add(submission)
  db.session.commit()

  return jsonify({"submission": _serialize_submission(submission)}), 201


@bp.get("/admin/submissions")
@jwt_required()
def list_admin_submissions():
  user = _current_user()
  if not user.is_superuser:
    return jsonify({"error": "Superuser access required."}), 403

  submissions = (
    ProjectSubmission.query
    .options(joinedload(ProjectSubmission.user))
    .order_by(ProjectSubmission.created_at.desc(), ProjectSubmission.id.desc())
    .all()
  )
  return jsonify({"submissions": [_serialize_submission(item, include_user=True) for item in submissions]})


@bp.post("/submissions/<int:submission_id>/review")
@jwt_required()
def review_submission(submission_id: int):
  user = _current_user()
  if not user.is_superuser:
    return jsonify({"error": "Superuser access required."}), 403

  payload = request.get_json() or {}
  decision_raw = payload.get("decision")
  has_api = payload.get("has_api")
  has_database = payload.get("has_database")
  note = _normalize_optional_note(payload.get("note"))

  if not isinstance(decision_raw, str):
    return jsonify({"error": "decision must be provided"}), 400
  decision = decision_raw.strip().lower()
  if decision not in _REVIEW_DECISIONS:
    return jsonify({"error": "decision must be either 'pass' or 'fail'"}), 400
  if not isinstance(has_api, bool):
    return jsonify({"error": "has_api must be a boolean"}), 400
  if not isinstance(has_database, bool):
    return jsonify({"error": "has_database must be a boolean"}), 400

  if decision == "pass" and not (has_api and has_database):
    return jsonify({"error": "To mark pass, both has_api and has_database must be true."}), 400

  submission = ProjectSubmission.query.get_or_404(submission_id)
  submission.status = decision
  submission.review_notes = note
  computed = sync_projects_submission_progress(submission.user_id, commit=True)

  return jsonify(
    {
      "submission": _serialize_submission(submission),
      "review_checklist": {
        "has_api": has_api,
        "has_database": has_database,
      },
      "reviewer_user_id": user.id,
      "module_progress": computed["module_progress"],
      "category_readiness": computed["category_readiness"],
    }
  )
