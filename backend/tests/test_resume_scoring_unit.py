from app.services.resume_scoring import (
  PreparedResumeContent,
  parse_provider_payload,
  score_prepared_resume,
  validate_pdf_upload,
)
from app.services.resume_providers import ResumeProviderError


class _FakeProvider:
  provider_name = "openai"
  model_name = "fake-model"

  def score_resume(self, *, resume_text: str, page_count: int, pdf_bytes: bytes, file_name: str):
    return {
      "overall_score": 84,
      "bullet_quality_impact": 29,
      "technical_demonstration": 24,
      "writing_communication": 13,
      "formatting_ats": 16,
    }


class _FlakyProvider:
  provider_name = "openai"
  model_name = "fake-model"

  def __init__(self):
    self.calls = 0

  def score_resume(self, *, resume_text: str, page_count: int, pdf_bytes: bytes, file_name: str):
    self.calls += 1
    if self.calls == 1:
      raise ResumeProviderError("LLM provider timeout.")
    return {
      "overall_score": 82,
      "bullet_quality_impact": 28,
      "technical_demonstration": 24,
      "writing_communication": 12,
      "formatting_ats": 16,
    }


def test_validate_pdf_upload_rejects_large_files():
  try:
    validate_pdf_upload(
      filename="resume.pdf",
      mimetype="application/pdf",
      file_size_bytes=(5 * 1024 * 1024) + 1,
    )
    assert False, "Expected validation error for oversized file."
  except Exception as err:
    assert "Max size is 5MB" in str(err)


def test_parse_provider_payload_requires_expected_fields():
  invalid_payload = {
    "overall_score": 80,
    "technical_demonstration": 24,
    "writing_communication": 12,
    "formatting_ats": 15,
  }
  try:
    parse_provider_payload(invalid_payload)
    assert False, "Expected missing bullet_quality_impact to fail."
  except Exception as err:
    assert "missing" in str(err).lower()


def test_score_prepared_resume_returns_weighted_response():
  prepared = PreparedResumeContent(
    text_for_prompt=(
      "Jane Doe\njane@example.com\nhttps://github.com/janedoe\n"
      "Built a task management platform with Flask and PostgreSQL."
    ),
    page_count=1,
    extracted_char_count=140,
  )
  result = score_prepared_resume(
    prepared_content=prepared,
    provider=_FakeProvider(),
    pdf_bytes=b"%PDF-1.4 fake",
    file_name="resume.pdf",
  )
  assert 0 <= result.overall_score <= 100
  assert result.overall_score == 84
  assert len(result.strengths) == 0
  assert len(result.improvements) == 0


def test_score_prepared_resume_retries_on_timeout_provider_error():
  prepared = PreparedResumeContent(
    text_for_prompt="Student resume text",
    page_count=1,
    extracted_char_count=20,
  )
  provider = _FlakyProvider()
  result = score_prepared_resume(
    prepared_content=prepared,
    provider=provider,
    pdf_bytes=b"%PDF-1.4 fake",
    file_name="resume.pdf",
  )
  assert result.overall_score == 82
  assert provider.calls == 2
