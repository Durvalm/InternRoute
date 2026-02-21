from __future__ import annotations

from urllib.parse import urlparse

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..extensions import db
from ..models import ProjectSubmission

bp = Blueprint("projects", __name__, url_prefix="/projects")

_ALLOWED_GITHUB_HOSTS = {"github.com", "www.github.com"}


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


def _serialize_submission(submission: ProjectSubmission) -> dict[str, object]:
  return {
    "id": submission.id,
    "repo_url": submission.repo_url,
    "deployed_url": submission.deployed_url,
    "status": submission.status,
    "review_notes": submission.review_notes,
    "created_at": submission.created_at.isoformat() if submission.created_at else None,
    "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
  }


@bp.get("/submissions")
@jwt_required()
def list_submissions():
  user_id = int(get_jwt_identity())
  submissions = (
    ProjectSubmission.query
    .filter_by(user_id=user_id)
    .order_by(ProjectSubmission.created_at.desc(), ProjectSubmission.id.desc())
    .all()
  )
  return jsonify({"submissions": [_serialize_submission(item) for item in submissions]})


@bp.post("/submissions")
@jwt_required()
def create_submission():
  user_id = int(get_jwt_identity())
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
    user_id=user_id,
    repo_url=repo_url,
    deployed_url=deployed_url,
    status="pending",
  )
  db.session.add(submission)
  db.session.commit()

  return jsonify({"submission": _serialize_submission(submission)}), 201
