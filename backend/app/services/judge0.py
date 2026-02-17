from __future__ import annotations

import json
import os
import re
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class Judge0Error(RuntimeError):
  pass


class Judge0ProcessingTimeout(Judge0Error):
  pass


_LANGUAGE_CACHE: list[dict[str, Any]] | None = None
_LANGUAGE_CACHE_EXPIRES_AT = 0.0

_COMPACT_LANGUAGE_ORDER = [
  "python",
  "javascript",
  "typescript",
  "java",
  "cpp",
  "csharp",
  "go",
  "rust",
  "kotlin",
  "swift",
  "php",
  "ruby",
  "c",
]

_COMPACT_LANGUAGE_DISPLAY_NAMES = {
  "python": "Python",
  "javascript": "JavaScript",
  "typescript": "TypeScript",
  "java": "Java",
  "cpp": "C++",
  "csharp": "C#",
  "go": "Go",
  "rust": "Rust",
  "kotlin": "Kotlin",
  "swift": "Swift",
  "php": "PHP",
  "ruby": "Ruby",
  "c": "C",
}


def _language_family(name: str) -> str | None:
  value = name.lower()
  if "typescript" in value:
    return "typescript"
  if "javascript" in value or "node.js" in value:
    return "javascript"
  if "python" in value:
    return "python"
  if "c++" in value:
    return "cpp"
  if "c#" in value or "c-sharp" in value:
    return "csharp"
  if value.startswith("c ") or value.startswith("c(") or value.startswith("c ("):
    return "c"
  if " java" in value or value.startswith("java"):
    return "java"
  if "kotlin" in value:
    return "kotlin"
  if "swift" in value:
    return "swift"
  if "php" in value:
    return "php"
  if "ruby" in value:
    return "ruby"
  if "rust" in value:
    return "rust"
  if "golang" in value or value.startswith("go ") or value.startswith("go(") or value.startswith("go ("):
    return "go"
  if value == "go":
    return "go"
  return None


def _version_tuple(name: str) -> tuple[int, ...]:
  match = re.search(r"(\d+(?:\.\d+){0,3})", name)
  if not match:
    return ()
  parts = []
  for token in match.group(1).split("."):
    try:
      parts.append(int(token))
    except ValueError:
      return ()
  return tuple(parts)


def _is_pre_release(name: str) -> bool:
  value = name.lower()
  return any(token in value for token in ("beta", "rc", "alpha", "nightly", "preview", "dev"))


def _candidate_rank(family: str, language_name: str) -> tuple[int, int, tuple[int, ...], str]:
  version = _version_tuple(language_name)
  stable_score = 0 if _is_pre_release(language_name) else 1

  if family == "python":
    major = version[0] if version else 0
    modern_python = 1 if major >= 3 else 0
    return (stable_score, modern_python, version, language_name.lower())

  return (stable_score, 1, version, language_name.lower())


def _base_url() -> str:
  return (os.getenv("JUDGE0_BASE_URL") or "https://ce.judge0.com").rstrip("/")


def _headers() -> dict[str, str]:
  headers = {
    "Accept": "application/json",
    # RapidAPI/Cloudflare can block generic urllib traffic; explicit UA helps avoid 1010 blocks.
    "User-Agent": "InternRoute-Judge0-Client/1.0",
  }
  api_key = os.getenv("JUDGE0_API_KEY")
  rapidapi_host = os.getenv("JUDGE0_RAPIDAPI_HOST")
  auth_token = os.getenv("JUDGE0_AUTH_TOKEN")

  if api_key or auth_token:
    headers["Content-Type"] = "application/json"
  if api_key:
    headers["X-RapidAPI-Key"] = api_key
  if rapidapi_host:
    headers["X-RapidAPI-Host"] = rapidapi_host
  if auth_token:
    headers["Authorization"] = f"Bearer {auth_token}"
  return headers


def _request_json(method: str, path: str, payload: dict[str, Any] | None = None, *, timeout: float = 20.0) -> Any:
  url = f"{_base_url()}{path}"
  data = None
  if payload is not None:
    data = json.dumps(payload).encode("utf-8")

  req = Request(url=url, method=method, headers=_headers(), data=data)
  try:
    with urlopen(req, timeout=timeout) as res:
      raw = res.read().decode("utf-8")
      return json.loads(raw) if raw else {}
  except HTTPError as err:
    body = ""
    try:
      body = err.read().decode("utf-8")
    except Exception:
      body = ""
    message = f"Judge0 HTTP {err.code}"
    if body:
      message = f"{message}: {body[:240]}"
    raise Judge0Error(message) from err
  except URLError as err:
    raise Judge0Error(f"Judge0 connection error: {err}") from err


def _poll_submission(token: str, *, max_attempts: int = 25, interval_seconds: float = 0.35) -> dict[str, Any]:
  last_response: dict[str, Any] = {}
  for _ in range(max_attempts):
    response = _request_json("GET", f"/submissions/{token}?base64_encoded=false")
    status_id = int(response.get("status", {}).get("id") or 0)
    last_response = response
    if status_id not in {1, 2}:  # In Queue / Processing
      return response
    time.sleep(interval_seconds)
  status = last_response.get("status") if isinstance(last_response, dict) else {}
  status_id = int((status or {}).get("id") or 0)
  if status_id in {1, 2}:
    raise Judge0ProcessingTimeout("Execution is still processing on Judge0. Please retry in a moment.")
  return last_response


def get_languages(*, cache_seconds: int = 3600) -> list[dict[str, Any]]:
  global _LANGUAGE_CACHE, _LANGUAGE_CACHE_EXPIRES_AT

  now = time.time()
  if _LANGUAGE_CACHE is not None and now < _LANGUAGE_CACHE_EXPIRES_AT:
    return _LANGUAGE_CACHE

  payload = _request_json("GET", "/languages")
  if not isinstance(payload, list):
    raise Judge0Error("Unexpected Judge0 /languages response.")

  normalized = []
  for item in payload:
    if not isinstance(item, dict):
      continue
    language_id = item.get("id")
    name = item.get("name")
    if isinstance(language_id, int) and isinstance(name, str):
      normalized.append({"id": language_id, "name": name})

  normalized.sort(key=lambda lang: lang["name"].lower())
  _LANGUAGE_CACHE = normalized
  _LANGUAGE_CACHE_EXPIRES_AT = now + cache_seconds
  return normalized


def get_compact_languages(*, cache_seconds: int = 3600) -> list[dict[str, Any]]:
  raw_languages = get_languages(cache_seconds=cache_seconds)

  by_family: dict[str, list[dict[str, Any]]] = {}
  for language in raw_languages:
    name = language["name"]
    family = _language_family(name)
    if family is None or family not in _COMPACT_LANGUAGE_DISPLAY_NAMES:
      continue
    by_family.setdefault(family, []).append(language)

  compact: list[dict[str, Any]] = []
  for family in _COMPACT_LANGUAGE_ORDER:
    candidates = by_family.get(family) or []
    if not candidates:
      continue

    best = max(candidates, key=lambda item: _candidate_rank(family, item["name"]))
    compact.append(
      {
        "id": best["id"],
        "name": best["name"],
        "family": family,
        "display_name": _COMPACT_LANGUAGE_DISPLAY_NAMES[family],
      }
    )

  return compact


def get_language_family(language_id: int, *, cache_seconds: int = 3600) -> str | None:
  for language in get_languages(cache_seconds=cache_seconds):
    if language["id"] == language_id:
      return _language_family(language["name"])
  return None


def run_submission(
  *,
  source_code: str,
  language_id: int,
  stdin: str,
  expected_output: str | None = None,
  cpu_time_limit: float = 2.0,
) -> dict[str, Any]:
  payload = {
    "source_code": source_code,
    "language_id": language_id,
    "stdin": stdin,
    "cpu_time_limit": cpu_time_limit,
    "wall_time_limit": max(cpu_time_limit * 2, 3.0),
  }
  if expected_output is not None:
    payload["expected_output"] = expected_output
  response = _request_json("POST", "/submissions?base64_encoded=false&wait=true", payload=payload)

  # Some deployments ignore wait=true and return only token.
  if isinstance(response, dict) and "token" in response and "status" not in response:
    return _poll_submission(str(response["token"]))

  if isinstance(response, dict):
    status = response.get("status") or {}
    status_id = int(status.get("id") or 0)
    if status_id in {1, 2}:
      raise Judge0ProcessingTimeout("Execution is still processing on Judge0. Please retry in a moment.")

  return response if isinstance(response, dict) else {}
