from app.services.resume_scoring import (
  PreparedResumeContent,
  parse_provider_payload,
  score_prepared_resume,
  validate_pdf_upload,
)


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
