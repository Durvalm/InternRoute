from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Any

from pypdf import PdfReader

from .resume_providers import ResumeProviderError, ResumeScoringProvider


MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024
MAX_EXTRACTED_TEXT_CHARS = 18000
PROMPT_VERSION = "resume_v1"
PASS_THRESHOLD_SCORE = 80
MAX_PROVIDER_ATTEMPTS = 2

DIMENSION_WEIGHTS = {
  "content": 0.35,
  "impact": 0.25,
  "formatting": 0.20,
  "ats": 0.20,
}


class ResumeScoringError(RuntimeError):
  def __init__(self, message: str, *, code: str, status_code: int):
    super().__init__(message)
    self.code = code
    self.status_code = status_code


class ResumeValidationError(ResumeScoringError):
  def __init__(self, message: str, *, code: str = "invalid_resume_file"):
    super().__init__(message, code=code, status_code=400)


class ResumeExtractionError(ResumeScoringError):
  def __init__(self, message: str, *, code: str = "pdf_extraction_failed"):
    super().__init__(message, code=code, status_code=422)


class ResumeResponseValidationError(ResumeScoringError):
  def __init__(self, message: str, *, code: str = "provider_response_invalid"):
    super().__init__(message, code=code, status_code=502)


class ResumeProviderRequestError(ResumeScoringError):
  def __init__(self, message: str, *, code: str = "provider_request_failed"):
    super().__init__(message, code=code, status_code=502)


@dataclass
class PreparedResumeContent:
  text_for_prompt: str
  page_count: int
  extracted_char_count: int


@dataclass
class ResumeScoringResult:
  overall_score: int
  formatting_score: int
  content_score: int
  ats_score: int
  impact_score: int
  bullet_quality_impact_score: int
  technical_demonstration_score: int
  writing_communication_score: int
  formatting_ats_score: int
  strengths: list[str]
  improvements: list[str]

  @property
  def dimension_scores(self) -> dict[str, int]:
    return {
      "formatting": self.formatting_score,
      "content": self.content_score,
      "ats": self.ats_score,
      "impact": self.impact_score,
    }

  @property
  def rubric_scores(self) -> dict[str, int]:
    return {
      "bullet_quality_impact": self.bullet_quality_impact_score,
      "technical_demonstration": self.technical_demonstration_score,
      "writing_communication": self.writing_communication_score,
      "formatting_ats": self.formatting_ats_score,
    }


def clamp_score(value: int) -> int:
  return max(0, min(100, int(value)))


def _is_pdf_filename(filename: str | None) -> bool:
  if not filename:
    return False
  return filename.lower().endswith(".pdf")


def validate_pdf_upload(*, filename: str | None, mimetype: str | None, file_size_bytes: int) -> None:
  if file_size_bytes <= 0:
    raise ResumeValidationError("Uploaded file is empty.", code="file_empty")
  if file_size_bytes > MAX_RESUME_FILE_SIZE_BYTES:
    raise ResumeValidationError("File is too large. Max size is 5MB.", code="file_too_large")

  mime = (mimetype or "").lower().strip()
  valid_mime = mime in {"application/pdf", "application/x-pdf", "application/acrobat"}
  valid_name = _is_pdf_filename(filename)
  if not valid_mime and not valid_name:
    raise ResumeValidationError("Please upload a PDF file.", code="invalid_file_type")


def prepare_resume_content(pdf_bytes: bytes) -> PreparedResumeContent:
  try:
    reader = PdfReader(io.BytesIO(pdf_bytes))
  except Exception as err:
    raise ResumeExtractionError("Could not parse PDF file.") from err

  page_count = len(reader.pages)
  if page_count <= 0:
    raise ResumeExtractionError("PDF does not contain readable pages.", code="pdf_has_no_pages")

  pages_text: list[str] = []
  for page in reader.pages:
    try:
      extracted = page.extract_text() or ""
    except Exception:
      extracted = ""
    cleaned = extracted.strip()
    if cleaned:
      pages_text.append(cleaned)

  merged_text = "\n\n".join(pages_text).strip()
  if not merged_text:
    raise ResumeExtractionError(
      "Could not extract text from PDF. Use an exported text-based PDF and retry.",
      code="pdf_text_extraction_empty",
    )

  extracted_char_count = len(merged_text)
  if extracted_char_count > MAX_EXTRACTED_TEXT_CHARS:
    merged_text = merged_text[:MAX_EXTRACTED_TEXT_CHARS]

  return PreparedResumeContent(
    text_for_prompt=merged_text,
    page_count=page_count,
    extracted_char_count=extracted_char_count,
  )


def _coerce_int_score(raw: Any, *, field_name: str, max_value: int = 100) -> int:
  if isinstance(raw, bool):
    raise ResumeResponseValidationError(f"{field_name} must be an integer between 0 and {max_value}.")
  if isinstance(raw, (int, float)):
    as_float = float(raw)
    if 0 <= as_float <= max_value:
      return int(round(as_float))
    raise ResumeResponseValidationError(f"{field_name} must be between 0 and {max_value}.")
  raise ResumeResponseValidationError(f"{field_name} must be an integer between 0 and {max_value}.")


def _extract_score(
  payload: dict[str, Any],
  *,
  names: list[str],
  field_name: str,
  max_value: int = 100,
) -> int:
  for name in names:
    if name in payload:
      return _coerce_int_score(payload.get(name), field_name=field_name, max_value=max_value)
  raise ResumeResponseValidationError(f"Provider payload missing {field_name}.")


def _extract_feedback_list(payload: dict[str, Any], *, key: str, max_len: int) -> list[str]:
  raw = payload.get(key)
  if raw is None:
    return []
  if not isinstance(raw, list):
    raise ResumeResponseValidationError(f"Provider payload {key} must be a list when provided.")
  normalized = [item.strip() for item in raw if isinstance(item, str) and item.strip()]
  return normalized[:max_len]


def _normalize_score(raw_score: int, max_points: int) -> int:
  if max_points <= 0:
    return 0
  return clamp_score(round((raw_score / max_points) * 100))


def _extract_v2_points(value: Any, *, field_name: str, max_points: int, input_is_percent: bool) -> int:
  raw = _coerce_int_score(value, field_name=field_name, max_value=100)
  if input_is_percent:
    return int(round((raw / 100) * max_points))
  if raw > max_points:
    raise ResumeResponseValidationError(f"{field_name} must be between 0 and {max_points}.")
  return raw


def parse_provider_payload(
  payload: dict[str, Any]
) -> tuple[dict[str, int], list[str], list[str], int | None, dict[str, int] | None]:
  if not isinstance(payload, dict):
    raise ResumeResponseValidationError("Provider payload must be an object.")

  strengths = _extract_feedback_list(payload, key="strengths", max_len=2)
  improvements = _extract_feedback_list(payload, key="improvements", max_len=3)

  has_v2_shape = all(
    key in payload
    for key in [
      "overall_score",
      "bullet_quality_impact",
      "technical_demonstration",
      "writing_communication",
      "formatting_ats",
    ]
  )
  if has_v2_shape:
    overall_score = _coerce_int_score(payload.get("overall_score"), field_name="overall_score")
    raw_bullet_quality_impact = _coerce_int_score(
      payload.get("bullet_quality_impact"),
      field_name="bullet_quality_impact",
      max_value=100,
    )
    raw_technical_demonstration = _coerce_int_score(
      payload.get("technical_demonstration"),
      field_name="technical_demonstration",
      max_value=100,
    )
    raw_writing_communication = _coerce_int_score(
      payload.get("writing_communication"),
      field_name="writing_communication",
      max_value=100,
    )
    raw_formatting_ats = _coerce_int_score(
      payload.get("formatting_ats"),
      field_name="formatting_ats",
      max_value=100,
    )

    input_is_percent = (
      raw_bullet_quality_impact > 35
      or raw_technical_demonstration > 30
      or raw_writing_communication > 15
      or raw_formatting_ats > 20
    )

    bullet_quality_impact = _extract_v2_points(
      raw_bullet_quality_impact,
      field_name="bullet_quality_impact",
      max_points=35,
      input_is_percent=input_is_percent,
    )
    technical_demonstration = _extract_v2_points(
      raw_technical_demonstration,
      field_name="technical_demonstration",
      max_points=30,
      input_is_percent=input_is_percent,
    )
    writing_communication = _extract_v2_points(
      raw_writing_communication,
      field_name="writing_communication",
      max_points=15,
      input_is_percent=input_is_percent,
    )
    formatting_ats = _extract_v2_points(
      raw_formatting_ats,
      field_name="formatting_ats",
      max_points=20,
      input_is_percent=input_is_percent,
    )

    formatting_score = _normalize_score(formatting_ats, 20)
    content_score = _normalize_score(technical_demonstration + writing_communication, 45)
    impact_score = _normalize_score(bullet_quality_impact, 35)
    scores = {
      "formatting": formatting_score,
      "content": content_score,
      "ats": formatting_score,
      "impact": impact_score,
    }
    return scores, strengths, improvements, overall_score, {
      "bullet_quality_impact": bullet_quality_impact,
      "technical_demonstration": technical_demonstration,
      "writing_communication": writing_communication,
      "formatting_ats": formatting_ats,
    }

  dimension_payload: dict[str, Any]
  nested = payload.get("dimension_scores")
  if isinstance(nested, dict):
    dimension_payload = {**payload, **nested}
  else:
    dimension_payload = payload

  scores = {
    "formatting": _extract_score(
      dimension_payload,
      names=["formatting", "formatting_score", "format_score"],
      field_name="formatting",
    ),
    "content": _extract_score(
      dimension_payload,
      names=["content", "content_score"],
      field_name="content",
    ),
    "ats": _extract_score(
      dimension_payload,
      names=["ats", "ats_score", "technical_score"],
      field_name="ats",
    ),
    "impact": _extract_score(
      dimension_payload,
      names=["impact", "impact_score"],
      field_name="impact",
    ),
  }
  overall_score = None
  if "overall_score" in dimension_payload:
    overall_score = _coerce_int_score(dimension_payload.get("overall_score"), field_name="overall_score")

  return scores, strengths, improvements, overall_score, None


def _dedupe_preserve_order(items: list[str]) -> list[str]:
  seen: set[str] = set()
  ordered: list[str] = []
  for item in items:
    normalized = item.strip()
    if not normalized:
      continue
    key = normalized.lower()
    if key in seen:
      continue
    seen.add(key)
    ordered.append(normalized)
  return ordered


def _weighted_overall(scores: dict[str, int]) -> int:
  weighted = (
    scores["content"] * DIMENSION_WEIGHTS["content"]
    + scores["impact"] * DIMENSION_WEIGHTS["impact"]
    + scores["formatting"] * DIMENSION_WEIGHTS["formatting"]
    + scores["ats"] * DIMENSION_WEIGHTS["ats"]
  )
  return clamp_score(round(weighted))


def _is_retryable_provider_failure(error: ResumeScoringError) -> bool:
  if error.code == "provider_request_failed":
    text = str(error).lower()
    return (
      "timeout" in text
      or "connection error" in text
      or "not valid json" in text
      or "missing output text" in text
      or "http 429" in text
      or "http 500" in text
      or "http 502" in text
      or "http 503" in text
      or "http 504" in text
    )
  if error.code == "provider_response_invalid":
    return True
  return False


def score_prepared_resume(
  *,
  prepared_content: PreparedResumeContent,
  provider: ResumeScoringProvider,
  pdf_bytes: bytes,
  file_name: str,
) -> ResumeScoringResult:
  llm_scores: dict[str, int] | None = None
  strengths: list[str] = []
  improvements: list[str] = []
  overall_from_provider: int | None = None
  rubric_scores: dict[str, int] | None = None
  last_error: ResumeScoringError | None = None

  for attempt in range(MAX_PROVIDER_ATTEMPTS):
    try:
      provider_payload = provider.score_resume(
        resume_text=prepared_content.text_for_prompt,
        page_count=prepared_content.page_count,
        pdf_bytes=pdf_bytes,
        file_name=file_name,
      )
      llm_scores, strengths, improvements, overall_from_provider, rubric_scores = parse_provider_payload(provider_payload)
      last_error = None
      break
    except ResumeProviderError as err:
      last_error = ResumeProviderRequestError(str(err))
    except ResumeResponseValidationError as err:
      last_error = err

    if last_error is None:
      break
    if attempt >= (MAX_PROVIDER_ATTEMPTS - 1):
      break
    if not _is_retryable_provider_failure(last_error):
      break

  if last_error is not None:
    raise last_error
  if llm_scores is None:
    raise ResumeProviderRequestError("Failed to score resume after retries.")

  merged_improvements = _dedupe_preserve_order(improvements)[:3]
  merged_strengths = _dedupe_preserve_order(strengths)[:2]

  normalized_rubric = rubric_scores or {
    "bullet_quality_impact": int(round((llm_scores["impact"] / 100) * 35)),
    "technical_demonstration": int(round((llm_scores["content"] / 100) * 30)),
    "writing_communication": int(round((llm_scores["content"] / 100) * 15)),
    "formatting_ats": int(round(((llm_scores["formatting"] + llm_scores["ats"]) / 2 / 100) * 20)),
  }

  overall_score = overall_from_provider if overall_from_provider is not None else _weighted_overall(llm_scores)
  return ResumeScoringResult(
    overall_score=overall_score,
    formatting_score=llm_scores["formatting"],
    content_score=llm_scores["content"],
    ats_score=llm_scores["ats"],
    impact_score=llm_scores["impact"],
    bullet_quality_impact_score=normalized_rubric["bullet_quality_impact"],
    technical_demonstration_score=normalized_rubric["technical_demonstration"],
    writing_communication_score=normalized_rubric["writing_communication"],
    formatting_ats_score=normalized_rubric["formatting_ats"],
    strengths=merged_strengths,
    improvements=merged_improvements,
  )
