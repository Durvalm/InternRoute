from __future__ import annotations

import io
import re
from dataclasses import dataclass
from typing import Any

from pypdf import PdfReader

from .resume_providers import ResumeProviderError, ResumeScoringProvider


MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024
MAX_EXTRACTED_TEXT_CHARS = 18000
PROMPT_VERSION = "resume_v1"
PASS_THRESHOLD_SCORE = 80

DIMENSION_WEIGHTS = {
  "content": 0.35,
  "impact": 0.25,
  "formatting": 0.20,
  "ats": 0.20,
}

_EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
_PHONE_RE = re.compile(r"(?:\+?\d[\d\s().-]{7,}\d)")
_GITHUB_RE = re.compile(r"\b(?:https?://)?(?:www\.)?github\.com/[A-Z0-9_.-]+", re.IGNORECASE)
_LINKEDIN_RE = re.compile(r"\b(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[A-Z0-9_.-]+", re.IGNORECASE)
_URL_RE = re.compile(r"\bhttps?://[^\s)]+", re.IGNORECASE)


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
class ResumeDeterministicSignals:
  page_count: int
  has_email: bool
  has_phone: bool
  has_github: bool
  has_linkedin: bool
  has_any_url: bool


@dataclass
class ResumeScoringResult:
  overall_score: int
  formatting_score: int
  content_score: int
  ats_score: int
  impact_score: int
  strengths: list[str]
  improvements: list[str]
  signals: ResumeDeterministicSignals

  @property
  def dimension_scores(self) -> dict[str, int]:
    return {
      "formatting": self.formatting_score,
      "content": self.content_score,
      "ats": self.ats_score,
      "impact": self.impact_score,
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


def detect_signals(*, resume_text: str, page_count: int) -> ResumeDeterministicSignals:
  return ResumeDeterministicSignals(
    page_count=page_count,
    has_email=bool(_EMAIL_RE.search(resume_text)),
    has_phone=bool(_PHONE_RE.search(resume_text)),
    has_github=bool(_GITHUB_RE.search(resume_text)),
    has_linkedin=bool(_LINKEDIN_RE.search(resume_text)),
    has_any_url=bool(_URL_RE.search(resume_text)),
  )


def _coerce_int_score(raw: Any, *, field_name: str) -> int:
  if isinstance(raw, bool):
    raise ResumeResponseValidationError(f"{field_name} must be an integer between 0 and 100.")
  if isinstance(raw, int):
    if 0 <= raw <= 100:
      return raw
    raise ResumeResponseValidationError(f"{field_name} must be between 0 and 100.")
  if isinstance(raw, float) and raw.is_integer():
    as_int = int(raw)
    if 0 <= as_int <= 100:
      return as_int
    raise ResumeResponseValidationError(f"{field_name} must be between 0 and 100.")
  raise ResumeResponseValidationError(f"{field_name} must be an integer between 0 and 100.")


def _extract_score(payload: dict[str, Any], *, names: list[str], field_name: str) -> int:
  for name in names:
    if name in payload:
      return _coerce_int_score(payload.get(name), field_name=field_name)
  raise ResumeResponseValidationError(f"Provider payload missing {field_name}.")


def _extract_feedback_list(payload: dict[str, Any], *, key: str, expected_len: int) -> list[str]:
  raw = payload.get(key)
  if not isinstance(raw, list):
    raise ResumeResponseValidationError(f"Provider payload {key} must be a list.")
  normalized = [item.strip() for item in raw if isinstance(item, str) and item.strip()]
  if len(normalized) < expected_len:
    raise ResumeResponseValidationError(f"Provider payload {key} must contain {expected_len} items.")
  return normalized[:expected_len]


def parse_provider_payload(payload: dict[str, Any]) -> tuple[dict[str, int], list[str], list[str]]:
  if not isinstance(payload, dict):
    raise ResumeResponseValidationError("Provider payload must be an object.")

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

  strengths = _extract_feedback_list(payload, key="strengths", expected_len=2)
  improvements = _extract_feedback_list(payload, key="improvements", expected_len=3)
  return scores, strengths, improvements


def _bounded_adjustment(value: int) -> int:
  return max(-12, min(6, value))


def apply_deterministic_adjustments(
  *,
  scores: dict[str, int],
  signals: ResumeDeterministicSignals,
) -> tuple[dict[str, int], list[str]]:
  adjustments = {
    "formatting": 0,
    "content": 0,
    "ats": 0,
    "impact": 0,
  }
  deterministic_improvements: list[str] = []

  if signals.page_count > 1:
    if signals.page_count == 2:
      adjustments["formatting"] -= 4
      adjustments["ats"] -= 3
    else:
      adjustments["formatting"] -= 8
      adjustments["ats"] -= 6
    deterministic_improvements.append(
      "Keep your resume to one page for internship recruiting unless you have unusually extensive experience."
    )

  if not signals.has_email:
    adjustments["formatting"] -= 4
    adjustments["ats"] -= 5
    deterministic_improvements.append(
      "Add a professional email in your header so recruiters can contact you immediately."
    )

  if not signals.has_phone:
    adjustments["formatting"] -= 2
    deterministic_improvements.append(
      "Add a phone number in the header to make recruiter outreach easier."
    )

  if not signals.has_github and not signals.has_linkedin and not signals.has_any_url:
    adjustments["impact"] -= 4
    adjustments["ats"] -= 3
    deterministic_improvements.append(
      "Include at least one professional link (GitHub and/or LinkedIn) in the header."
    )
  elif not signals.has_github:
    adjustments["impact"] -= 2
    deterministic_improvements.append(
      "Add a GitHub link so reviewers can verify your technical work quickly."
    )

  adjusted = {}
  for key in {"formatting", "content", "ats", "impact"}:
    delta = _bounded_adjustment(adjustments.get(key, 0))
    adjusted[key] = clamp_score(scores[key] + delta)

  return adjusted, deterministic_improvements


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


def score_prepared_resume(
  *,
  prepared_content: PreparedResumeContent,
  provider: ResumeScoringProvider,
) -> ResumeScoringResult:
  signals = detect_signals(
    resume_text=prepared_content.text_for_prompt,
    page_count=prepared_content.page_count,
  )
  try:
    provider_payload = provider.score_resume(
      resume_text=prepared_content.text_for_prompt,
      page_count=prepared_content.page_count,
    )
  except ResumeProviderError as err:
    raise ResumeProviderRequestError(str(err)) from err

  llm_scores, strengths, improvements = parse_provider_payload(provider_payload)
  adjusted_scores, deterministic_improvements = apply_deterministic_adjustments(
    scores=llm_scores,
    signals=signals,
  )

  merged_improvements = _dedupe_preserve_order(deterministic_improvements + improvements)
  if len(merged_improvements) < 3:
    raise ResumeResponseValidationError("Could not build 3 actionable improvements from scoring result.")
  merged_improvements = merged_improvements[:3]

  merged_strengths = _dedupe_preserve_order(strengths)
  if len(merged_strengths) < 2:
    merged_strengths = strengths
  if len(merged_strengths) < 2:
    raise ResumeResponseValidationError("Provider strengths list must contain 2 non-empty items.")
  merged_strengths = merged_strengths[:2]

  overall_score = _weighted_overall(adjusted_scores)
  return ResumeScoringResult(
    overall_score=overall_score,
    formatting_score=adjusted_scores["formatting"],
    content_score=adjusted_scores["content"],
    ats_score=adjusted_scores["ats"],
    impact_score=adjusted_scores["impact"],
    strengths=merged_strengths,
    improvements=merged_improvements,
    signals=signals,
  )
