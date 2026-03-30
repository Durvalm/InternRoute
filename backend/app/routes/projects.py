from __future__ import annotations

from urllib.parse import urlparse

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..analytics import track_event
from ..extensions import db
from ..models import ProjectSubmission, User
from ..services.progression import sync_projects_submission_progress
from ..services.project_analyzer import ProjectAnalyzerError, analyze_github_project

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


def _current_user() -> User:
  user_id = int(get_jwt_identity())
  return User.query.get_or_404(user_id)


def _serialize_submission(submission: ProjectSubmission) -> dict[str, object]:
  payload: dict[str, object] = {
    "id": submission.id,
    "user_id": submission.user_id,
    "repo_url": submission.repo_url,
    "deployed_url": submission.deployed_url,
    "source_type": submission.source_type,
    "source_label": submission.source_label,
    "status": submission.status,
    "review_notes": submission.review_notes,
    "created_at": submission.created_at.isoformat() if submission.created_at else None,
    "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
  }
  return payload


def _build_evaluation_note(
  *,
  has_api_layer: bool,
  has_database_layer: bool,
  summary: str,
) -> str:
  def yes_no(value: bool) -> str:
    return "Yes" if value else "No"

  lines = [
    "AI Evaluation:",
    f"- API layer: {yes_no(has_api_layer)}",
    f"- Database layer: {yes_no(has_database_layer)}",
  ]
  if summary.strip():
    lines.append(f"Summary: {summary.strip()}")
  return "\n".join(lines)[:2000]


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

  try:
    analysis = analyze_github_project(owner=owner, repo=repo, repo_url=repo_url)
  except ProjectAnalyzerError as err:
    return jsonify({"error": str(err), "error_code": err.code}), err.status_code

  status = "pass" if analysis.passed else "fail"
  review_notes = _build_evaluation_note(
    has_api_layer=analysis.has_api_layer,
    has_database_layer=analysis.has_database_layer,
    summary=analysis.summary,
  )
  submission = ProjectSubmission(
    user_id=user.id,
    repo_url=repo_url,
    deployed_url=deployed_url,
    source_type="github",
    source_label=None,
    status="pending",
  )
  db.session.add(submission)
  db.session.flush()
  computed = sync_projects_submission_progress(
    submission.user_id,
    commit=True,
    emit_module_completion_events=True,
  )

  track_event(
    "project_evaluated",
    user_id=user.id,
    properties={
      "project_id": submission.id,
      "module_key": "projects",
      "status": status,
      "has_api_layer": analysis.has_api_layer,
      "has_database_layer": analysis.has_database_layer,
    },
  )

  return jsonify(
    {
      "submission": _serialize_submission(submission),
      "evaluation": analysis.to_dict(),
      "module_progress": computed["module_progress"],
      "category_readiness": computed["category_readiness"],
    }
  ), 201
