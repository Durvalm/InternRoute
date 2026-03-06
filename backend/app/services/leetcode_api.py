from __future__ import annotations

import json
import os
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


DEFAULT_LEETCODE_API_BASE_URL = "https://alfa-leetcode-api.onrender.com"
DEFAULT_TIMEOUT_SECONDS = 20.0


class LeetcodeApiError(RuntimeError):
  def __init__(self, message: str, *, status_code: int | None = None):
    super().__init__(message)
    self.status_code = status_code


def _base_url() -> str:
  value = (os.getenv("LEETCODE_API_BASE_URL") or DEFAULT_LEETCODE_API_BASE_URL).strip()
  return value.rstrip("/")


def _timeout_seconds() -> float:
  raw = (os.getenv("LEETCODE_API_TIMEOUT_SECONDS") or "").strip()
  if not raw:
    return DEFAULT_TIMEOUT_SECONDS
  try:
    value = float(raw)
  except ValueError:
    return DEFAULT_TIMEOUT_SECONDS
  if value <= 0:
    return DEFAULT_TIMEOUT_SECONDS
  return min(value, 60.0)


def _request_json(path: str, *, timeout: float | None = None) -> Any:
  normalized_path = path.lstrip("/")
  url = f"{_base_url()}/{normalized_path}"
  req = Request(
    url=url,
    method="GET",
    headers={
      "Accept": "application/json",
      "User-Agent": "InternRoute/1.0 (+leetcode-progress)",
    },
  )
  try:
    with urlopen(req, timeout=timeout or _timeout_seconds()) as res:
      raw = res.read().decode("utf-8")
      if not raw:
        return {}
      return json.loads(raw)
  except HTTPError as err:
    if err.code == 404:
      raise LeetcodeApiError("LeetCode user not found.", status_code=404) from err
    body = ""
    try:
      body = err.read().decode("utf-8")
    except Exception:
      body = ""
    message = f"LeetCode API returned HTTP {err.code}."
    if body:
      message = f"{message} {body[:220]}"
    raise LeetcodeApiError(message, status_code=err.code) from err
  except URLError as err:
    raise LeetcodeApiError(f"Unable to reach LeetCode API: {err}") from err
  except TimeoutError as err:
    raise LeetcodeApiError("LeetCode API timed out.") from err
  except json.JSONDecodeError as err:
    raise LeetcodeApiError("LeetCode API returned malformed JSON.") from err


def _coerce_int(value: Any) -> int | None:
  if isinstance(value, bool):
    return None
  if isinstance(value, int):
    return max(0, value)
  if isinstance(value, float) and value.is_integer():
    return max(0, int(value))
  if isinstance(value, str):
    normalized = value.strip()
    if normalized.isdigit():
      return int(normalized)
  return None


def _extract_int(data: dict[str, Any], keys: Iterable[str]) -> int | None:
  for key in keys:
    if key not in data:
      continue
    parsed = _coerce_int(data.get(key))
    if parsed is not None:
      return parsed
  return None


def fetch_solved_counts(leetcode_username: str) -> dict[str, int]:
  username = quote(leetcode_username.strip())
  payload = _request_json(f"{username}/solved")
  if not isinstance(payload, dict):
    raise LeetcodeApiError("LeetCode API returned an unexpected solved payload.")

  easy = _extract_int(payload, ("easySolved", "easy", "easy_solved", "easyCount")) or 0
  medium = _extract_int(payload, ("mediumSolved", "medium", "medium_solved", "mediumCount")) or 0
  hard = _extract_int(payload, ("hardSolved", "hard", "hard_solved", "hardCount")) or 0
  total = _extract_int(
    payload,
    (
      "solvedProblem",
      "totalSolved",
      "solved",
      "numSolved",
      "num_solved",
      "total_questions_solved",
      "allSolved",
    ),
  )
  if total is None:
    total = easy + medium + hard

  if total < (easy + medium + hard):
    total = easy + medium + hard

  return {
    "total_solved": total,
    "easy_solved": easy,
    "medium_solved": medium,
    "hard_solved": hard,
  }
