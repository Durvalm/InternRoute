from app.services.resume_scoring import (
  PreparedResumeContent,
  ResumeDeterministicSignals,
  apply_deterministic_adjustments,
  parse_provider_payload,
  score_prepared_resume,
  validate_pdf_upload,
)


class _FakeProvider:
  provider_name = "anthropic"
  model_name = "fake-model"

  def score_resume(self, *, resume_text: str, page_count: int):
    return {
      "formatting": 83,
      "content": 88,
      "ats": 84,
      "impact": 86,
      "strengths": [
        "Strong technical stack coverage.",
        "Clear internship-relevant projects.",
      ],
      "improvements": [
        "Quantify at least two more bullet points with metrics.",
        "Tighten wording to reduce verbosity.",
        "Emphasize ownership for major deliverables.",
      ],
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
    "formatting": 80,
    "content": 82,
    "strengths": ["Good bullets", "Good scope"],
    "improvements": ["A", "B", "C"],
  }
  try:
    parse_provider_payload(invalid_payload)
    assert False, "Expected missing ats/impact to fail."
  except Exception as err:
    assert "missing" in str(err).lower()


def test_deterministic_adjustments_are_bounded():
  adjusted, improvement_hints = apply_deterministic_adjustments(
    scores={"formatting": 5, "content": 10, "ats": 6, "impact": 8},
    signals=ResumeDeterministicSignals(
      page_count=3,
      has_email=False,
      has_phone=False,
      has_github=False,
      has_linkedin=False,
      has_any_url=False,
    ),
  )
  for value in adjusted.values():
    assert 0 <= value <= 100
  assert len(improvement_hints) >= 3


def test_score_prepared_resume_returns_weighted_response():
  prepared = PreparedResumeContent(
    text_for_prompt=(
      "Jane Doe\njane@example.com\nhttps://github.com/janedoe\n"
      "Built a task management platform with Flask and PostgreSQL."
    ),
    page_count=1,
    extracted_char_count=140,
  )
  result = score_prepared_resume(prepared_content=prepared, provider=_FakeProvider())
  assert 0 <= result.overall_score <= 100
  assert len(result.strengths) == 2
  assert len(result.improvements) == 3
