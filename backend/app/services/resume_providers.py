from __future__ import annotations

import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"
DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"


SYSTEM_PROMPT = """
You are a strict resume evaluator for computer science internship candidates.
Use the rubric exactly:
- Content quality: 35%
- Impact and outcomes: 25%
- Formatting and professionalism: 20%
- ATS readiness: 20%

Scoring anchors:
- 90-100: exceptionally strong internship resume with specific technical depth and quantified impact.
- 70-89: solid internship resume with meaningful experience but clear areas to improve.
- 40-69: partially competitive resume with weak specificity or weak impact framing.
- 0-39: not internship-ready due to major missing sections, unclear experience, or poor structure.

Output JSON only, with exactly these keys:
- formatting (integer 0-100)
- content (integer 0-100)
- ats (integer 0-100)
- impact (integer 0-100)
- strengths (array of exactly 2 specific strings)
- improvements (array of exactly 3 specific actionable strings)
No markdown. No extra keys.
""".strip()


class ResumeProviderError(RuntimeError):
  pass


class ResumeScoringProvider:
  provider_name = ""
  model_name = ""

  def score_resume(self, *, resume_text: str, page_count: int) -> dict[str, Any]:
    raise NotImplementedError


def _request_json(
  *,
  method: str,
  url: str,
  headers: dict[str, str],
  payload: dict[str, Any],
  timeout_seconds: float,
) -> Any:
  data = json.dumps(payload).encode("utf-8")
  request = Request(url=url, method=method, headers=headers, data=data)
  try:
    with urlopen(request, timeout=timeout_seconds) as response:
      raw = response.read().decode("utf-8")
      return json.loads(raw) if raw else {}
  except HTTPError as err:
    body = ""
    try:
      body = err.read().decode("utf-8")
    except Exception:
      body = ""
    message = f"LLM provider HTTP {err.code}"
    if body:
      message = f"{message}: {body[:280]}"
    raise ResumeProviderError(message) from err
  except URLError as err:
    raise ResumeProviderError(f"LLM provider connection error: {err}") from err
  except TimeoutError as err:
    raise ResumeProviderError("LLM provider timeout.") from err


def _extract_json_text(raw_text: str) -> str:
  cleaned = raw_text.strip()
  if cleaned.startswith("```"):
    lines = cleaned.splitlines()
    if len(lines) >= 3 and lines[-1].strip() == "```":
      cleaned = "\n".join(lines[1:-1]).strip()
  return cleaned


def _build_user_prompt(*, resume_text: str, page_count: int) -> str:
  return (
    "Evaluate this internship resume. Treat extraction artifacts as noise and score semantic quality.\n\n"
    f"Detected page count: {page_count}\n\n"
    "Resume text begins:\n"
    f"{resume_text}\n"
    "Resume text ends."
  )


class AnthropicResumeProvider(ResumeScoringProvider):
  provider_name = "anthropic"

  def __init__(self, *, api_key: str, model_name: str, timeout_seconds: float = 45.0):
    self.api_key = api_key
    self.model_name = model_name
    self.timeout_seconds = timeout_seconds

  def score_resume(self, *, resume_text: str, page_count: int) -> dict[str, Any]:
    payload = {
      "model": self.model_name,
      "temperature": 0,
      "max_tokens": 700,
      "system": SYSTEM_PROMPT,
      "messages": [
        {
          "role": "user",
          "content": _build_user_prompt(resume_text=resume_text, page_count=page_count),
        }
      ],
    }
    response = _request_json(
      method="POST",
      url="https://api.anthropic.com/v1/messages",
      headers={
        "Content-Type": "application/json",
        "x-api-key": self.api_key,
        "anthropic-version": "2023-06-01",
      },
      payload=payload,
      timeout_seconds=self.timeout_seconds,
    )
    if not isinstance(response, dict):
      raise ResumeProviderError("Unexpected Anthropic response shape.")
    blocks = response.get("content")
    if not isinstance(blocks, list):
      raise ResumeProviderError("Anthropic response missing content array.")
    text_parts = []
    for block in blocks:
      if isinstance(block, dict) and block.get("type") == "text" and isinstance(block.get("text"), str):
        text_parts.append(block["text"])
    raw_text = _extract_json_text("\n".join(text_parts))
    if not raw_text:
      raise ResumeProviderError("Anthropic response did not include JSON text.")
    try:
      parsed = json.loads(raw_text)
    except Exception as err:
      raise ResumeProviderError("Anthropic response was not valid JSON.") from err
    if not isinstance(parsed, dict):
      raise ResumeProviderError("Anthropic JSON payload must be an object.")
    return parsed


class OpenAIResumeProvider(ResumeScoringProvider):
  provider_name = "openai"

  def __init__(self, *, api_key: str, model_name: str, timeout_seconds: float = 45.0):
    self.api_key = api_key
    self.model_name = model_name
    self.timeout_seconds = timeout_seconds

  @staticmethod
  def _is_temperature_unsupported_error(message: str) -> bool:
    text = (message or "").lower()
    return "temperature" in text and "unsupported" in text

  def score_resume(self, *, resume_text: str, page_count: int) -> dict[str, Any]:
    payload: dict[str, Any] = {
      "model": self.model_name,
      "temperature": 0,
      "response_format": {"type": "json_object"},
      "messages": [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_prompt(resume_text=resume_text, page_count=page_count)},
      ],
    }
    try:
      response = _request_json(
        method="POST",
        url="https://api.openai.com/v1/chat/completions",
        headers={
          "Content-Type": "application/json",
          "Authorization": f"Bearer {self.api_key}",
        },
        payload=payload,
        timeout_seconds=self.timeout_seconds,
      )
    except ResumeProviderError as err:
      # Some OpenAI models only allow default temperature and reject explicit values.
      if self._is_temperature_unsupported_error(str(err)):
        payload_without_temperature = dict(payload)
        payload_without_temperature.pop("temperature", None)
        response = _request_json(
          method="POST",
          url="https://api.openai.com/v1/chat/completions",
          headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
          },
          payload=payload_without_temperature,
          timeout_seconds=self.timeout_seconds,
        )
      else:
        raise
    if not isinstance(response, dict):
      raise ResumeProviderError("Unexpected OpenAI response shape.")
    choices = response.get("choices")
    if not isinstance(choices, list) or not choices:
      raise ResumeProviderError("OpenAI response missing choices.")
    first = choices[0]
    if not isinstance(first, dict):
      raise ResumeProviderError("OpenAI response choice has unexpected shape.")
    message = first.get("message")
    if not isinstance(message, dict) or not isinstance(message.get("content"), str):
      raise ResumeProviderError("OpenAI response missing message content.")
    raw_text = _extract_json_text(message["content"])
    try:
      parsed = json.loads(raw_text)
    except Exception as err:
      raise ResumeProviderError("OpenAI response was not valid JSON.") from err
    if not isinstance(parsed, dict):
      raise ResumeProviderError("OpenAI JSON payload must be an object.")
    return parsed


def build_resume_scoring_provider() -> ResumeScoringProvider:
  provider = (os.getenv("RESUME_LLM_PROVIDER") or "anthropic").strip().lower()

  if provider == "anthropic":
    api_key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if not api_key:
      raise ResumeProviderError("ANTHROPIC_API_KEY is required when RESUME_LLM_PROVIDER=anthropic.")
    model_name = (os.getenv("RESUME_LLM_MODEL") or DEFAULT_ANTHROPIC_MODEL).strip()
    return AnthropicResumeProvider(api_key=api_key, model_name=model_name)

  if provider == "openai":
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
      raise ResumeProviderError("OPENAI_API_KEY is required when RESUME_LLM_PROVIDER=openai.")
    model_name = (os.getenv("RESUME_LLM_MODEL") or DEFAULT_OPENAI_MODEL).strip()
    return OpenAIResumeProvider(api_key=api_key, model_name=model_name)

  raise ResumeProviderError("RESUME_LLM_PROVIDER must be either 'anthropic' or 'openai'.")
