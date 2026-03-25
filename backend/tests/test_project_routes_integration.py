from app.models import ProjectSubmission
from app.routes import projects as projects_route
from app.services.project_analyzer import ProjectAnalysisResult, ProjectAnalyzerError


def _build_result(*, has_db: bool, has_api: bool) -> ProjectAnalysisResult:
  return ProjectAnalysisResult(
    has_database_layer=has_db,
    has_api_layer=has_api,
    summary="Automated evaluation summary.",
    evidence={
      "database": ["app/models.py"],
      "api": ["app/routes/projects.py"],
    },
    confidence="high",
  )


def test_create_submission_ai_pass_sets_submission_to_pass(client, auth_headers, app, monkeypatch):
  monkeypatch.setattr(
    projects_route,
    "analyze_github_project",
    lambda **_: _build_result(has_db=True, has_api=True),
  )

  response = client.post(
    "/projects/submissions",
    headers=auth_headers,
    json={"repo_url": "https://github.com/example-org/example-repo"},
  )
  assert response.status_code == 201
  payload = response.get_json()
  assert payload["submission"]["status"] == "pass"
  assert payload["evaluation"]["passed"] is True

  with app.app_context():
    saved = ProjectSubmission.query.order_by(ProjectSubmission.id.desc()).first()
    assert saved is not None
    assert saved.status == "pass"
    assert saved.review_notes is not None
    assert "API layer: Yes" in saved.review_notes


def test_create_submission_ai_fail_sets_submission_to_fail(client, auth_headers, app, monkeypatch):
  monkeypatch.setattr(
    projects_route,
    "analyze_github_project",
    lambda **_: _build_result(has_db=True, has_api=False),
  )

  response = client.post(
    "/projects/submissions",
    headers=auth_headers,
    json={"repo_url": "https://github.com/example-org/example-repo"},
  )
  assert response.status_code == 201
  payload = response.get_json()
  assert payload["submission"]["status"] == "fail"
  assert payload["evaluation"]["passed"] is False
  assert payload["evaluation"]["has_api_layer"] is False

  with app.app_context():
    saved = ProjectSubmission.query.order_by(ProjectSubmission.id.desc()).first()
    assert saved is not None
    assert saved.status == "fail"
    assert saved.review_notes is not None
    assert "API layer: No" in saved.review_notes


def test_create_submission_ai_error_returns_controlled_error(client, auth_headers, app, monkeypatch):
  def _raise(*_args, **_kwargs):
    raise ProjectAnalyzerError(
      "AI evaluator is temporarily unavailable.",
      code="project_evaluator_unavailable",
      status_code=503,
    )

  monkeypatch.setattr(projects_route, "analyze_github_project", _raise)

  response = client.post(
    "/projects/submissions",
    headers=auth_headers,
    json={"repo_url": "https://github.com/example-org/example-repo"},
  )
  assert response.status_code == 503
  payload = response.get_json()
  assert payload["error_code"] == "project_evaluator_unavailable"

  with app.app_context():
    saved = ProjectSubmission.query.order_by(ProjectSubmission.id.desc()).first()
    assert saved is None


def test_admin_manual_review_endpoints_removed(client, auth_headers):
  list_response = client.get("/projects/admin/submissions", headers=auth_headers)
  review_response = client.post("/projects/submissions/1/review", headers=auth_headers, json={})
  assert list_response.status_code == 404
  assert review_response.status_code == 404
