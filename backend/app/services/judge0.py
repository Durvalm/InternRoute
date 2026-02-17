from __future__ import annotations

import json
import os
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class Judge0Error(RuntimeError):
  pass


_LANGUAGE_CACHE: list[dict[str, Any]] | None = None
_LANGUAGE_CACHE_EXPIRES_AT = 0.0


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


def run_submission(
  *,
  source_code: str,
  language_id: int,
  stdin: str,
  expected_output: str,
  cpu_time_limit: float = 2.0,
) -> dict[str, Any]:
  payload = {
    "source_code": source_code,
    "language_id": language_id,
    "stdin": stdin,
    "expected_output": expected_output,
    "cpu_time_limit": cpu_time_limit,
    "wall_time_limit": max(cpu_time_limit * 2, 3.0),
  }
  response = _request_json("POST", "/submissions?base64_encoded=false&wait=true", payload=payload)

  # Some deployments ignore wait=true and return only token.
  if isinstance(response, dict) and "token" in response and "status" not in response:
    return _poll_submission(str(response["token"]))

  return response if isinstance(response, dict) else {}
