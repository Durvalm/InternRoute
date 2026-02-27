from io import BytesIO

from app.models import ResumeSubmission, UserTaskCompletion
from app.routes import resume as resume_route
from app.services.resume_scoring import PreparedResumeContent


class _PassingProvider:
  provider_name = "openai"
  model_name = "fake-mid-tier"

  def score_resume(self, *, resume_text: str, page_count: int, pdf_bytes: bytes, file_name: str):
    return {
      "overall_score": 84,
      "bullet_quality_impact": 30,
      "technical_demonstration": 25,
      "writing_communication": 12,
      "formatting_ats": 16,
    }


class _MalformedProvider:
  provider_name = "openai"
  model_name = "fake-mid-tier"

  def score_resume(self, *, resume_text: str, page_count: int, pdf_bytes: bytes, file_name: str):
    return {"unexpected": "payload"}


class _SequentialProvider:
  provider_name = "openai"
  model_name = "fake-mid-tier"

  def __init__(self):
    self.calls = 0

  def score_resume(self, *, resume_text: str, page_count: int, pdf_bytes: bytes, file_name: str):
    self.calls += 1
    if self.calls == 1:
      return {
        "overall_score": 84,
        "bullet_quality_impact": 30,
        "technical_demonstration": 25,
        "writing_communication": 12,
        "formatting_ats": 16,
      }
    return {
      "overall_score": 72,
      "bullet_quality_impact": 24,
      "technical_demonstration": 21,
      "writing_communication": 11,
      "formatting_ats": 14,
    }


def test_score_resume_success_persists_submission_and_updates_progress(client, auth_headers, app, monkeypatch):
  monkeypatch.setattr(resume_route, "build_resume_scoring_provider", lambda: _PassingProvider())
  monkeypatch.setattr(
    resume_route,
    "prepare_resume_content",
    lambda _: PreparedResumeContent(
      text_for_prompt="student@example.com https://github.com/student",
      page_count=1,
      extracted_char_count=48,
    ),
  )

  response = client.post(
    "/resume/score",
    headers=auth_headers,
    data={"file": (BytesIO(b"%PDF-1.4 fake"), "resume.pdf")},
    content_type="multipart/form-data",
  )
  assert response.status_code == 200
  payload = response.get_json()
  assert payload["overall_score"] >= 80
  assert payload["rubric_scores"]["bullet_quality_impact"] == 30
  assert payload["progression"]["resume_task_completed"] is True
  assert payload["progression"]["category_resume"] == payload["overall_score"]

  with app.app_context():
    saved = ResumeSubmission.query.order_by(ResumeSubmission.id.desc()).first()
    assert saved is not None
    assert saved.status == "succeeded"
    assert saved.overall_score is not None

    completion = UserTaskCompletion.query.filter_by(
      user_id=app.config["TEST_USER_ID"],
      task_id=app.config["TEST_RESUME_TASK_ID"],
    ).first()
    assert completion is not None


def test_score_resume_with_malformed_provider_payload_returns_controlled_error(client, auth_headers, app, monkeypatch):
  monkeypatch.setattr(resume_route, "build_resume_scoring_provider", lambda: _MalformedProvider())
  monkeypatch.setattr(
    resume_route,
    "prepare_resume_content",
    lambda _: PreparedResumeContent(
      text_for_prompt="student@example.com https://github.com/student",
      page_count=1,
      extracted_char_count=48,
    ),
  )

  response = client.post(
    "/resume/score",
    headers=auth_headers,
    data={"file": (BytesIO(b"%PDF-1.4 fake"), "resume.pdf")},
    content_type="multipart/form-data",
  )
  assert response.status_code == 502
  payload = response.get_json()
  assert payload["error_code"] == "provider_response_invalid"

  with app.app_context():
    saved = ResumeSubmission.query.order_by(ResumeSubmission.id.desc()).first()
    assert saved is not None
    assert saved.status == "failed"
    assert saved.error_code == "provider_response_invalid"


def test_score_resume_requires_authentication(client):
  response = client.post(
    "/resume/score",
    data={"file": (BytesIO(b"%PDF-1.4 fake"), "resume.pdf")},
    content_type="multipart/form-data",
  )
  assert response.status_code == 401


def test_score_resume_rejects_invalid_file_type(client, auth_headers):
  response = client.post(
    "/resume/score",
    headers=auth_headers,
    data={"file": (BytesIO(b"not-a-pdf"), "resume.txt")},
    content_type="multipart/form-data",
  )
  assert response.status_code == 400
  payload = response.get_json()
  assert payload["error_code"] == "invalid_file_type"


def test_resume_readiness_keeps_best_score_and_does_not_drop(client, auth_headers, monkeypatch):
  provider = _SequentialProvider()
  monkeypatch.setattr(resume_route, "build_resume_scoring_provider", lambda: provider)
  monkeypatch.setattr(
    resume_route,
    "prepare_resume_content",
    lambda _: PreparedResumeContent(
      text_for_prompt="student@example.com https://github.com/student",
      page_count=1,
      extracted_char_count=48,
    ),
  )

  first = client.post(
    "/resume/score",
    headers=auth_headers,
    data={"file": (BytesIO(b"%PDF-1.4 fake"), "resume.pdf")},
    content_type="multipart/form-data",
  )
  assert first.status_code == 200
  first_payload = first.get_json()
  assert first_payload["overall_score"] == 84
  assert first_payload["progression"]["resume_task_completed"] is True

  second = client.post(
    "/resume/score",
    headers=auth_headers,
    data={"file": (BytesIO(b"%PDF-1.4 fake"), "resume.pdf")},
    content_type="multipart/form-data",
  )
  assert second.status_code == 200
  second_payload = second.get_json()
  assert second_payload["overall_score"] == 72
  assert second_payload["progression"]["category_resume"] == 84
  assert second_payload["progression"]["resume_task_completed"] is True

  dashboard = client.get("/dashboard/summary", headers=auth_headers)
  assert dashboard.status_code == 200
  dashboard_payload = dashboard.get_json()
  assert dashboard_payload["category_readiness"]["resume"] == 84
  resume_module = next(
    module for module in dashboard_payload["module_progress"]
    if module["module_key"] == "resume"
  )
  assert resume_module["score"] == 84
