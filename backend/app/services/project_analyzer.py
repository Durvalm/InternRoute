from __future__ import annotations

import base64
import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"
GITHUB_API_BASE_URL = "https://api.github.com"
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"

HTTP_TIMEOUT_SECONDS = 25.0
OPENAI_TIMEOUT_SECONDS = 45.0

MAX_TREE_PATHS = 1200
MAX_SELECTED_FILES = 12
MAX_FILE_CHARS = 6000
MAX_TOTAL_FILE_CHARS = 48000
MAX_LOG_PREVIEW_CHARS = 600
MAX_LOG_PATHS = 8

logger = logging.getLogger(__name__)

FILE_SELECTOR_SYSTEM_PROMPT = """
You are selecting files for architecture review from a GitHub repository file tree.

Goal:
Pick the files that are most useful to determine whether the project has:
1) Database layer
2) API layer

Use broad engineering judgment across languages/frameworks.
Return a JSON array of file paths from the provided tree.
- Return at least 1 and at most 12 paths.
- Never return an empty array.
- If the repo looks frontend-only, still return the most representative files.

Example:
["path/to/file1.py", "src/app/routes.ts"]
""".strip()

ARCHITECTURE_SYSTEM_PROMPT = """
You are evaluating backend code architecture from selected GitHub repository files.

Determine whether the repository clearly includes both layers:
1) Database layer
2) API layer

Rules:
- Use only provided file contents and repository context.
- Mark true only when there is reasonable evidence.
- Keep summary concise and practical.
- Evidence paths must come from provided files.
- `has_api_layer` is true only when the repo implements server-side API endpoints/handlers.
- Client-side API consumption (fetch/axios calls to external APIs) does NOT count as API layer.
- `has_database_layer` is true only when there is a real persistent SQL/NoSQL integration (ORM/driver/migrations/schema/queries).
- In-memory structures (lists/dicts/maps), local JSON files, or frontend localStorage-only patterns do NOT count as database layer.
- If uncertain, prefer false.

Return ONLY valid JSON:
{
  "has_database_layer": true|false,
  "has_api_layer": true|false,
  "summary": "short summary",
  "evidence": {
    "database": ["path1", "path2"],
    "api": ["path3"]
  },
  "confidence": "low|medium|high"
}
""".strip()


@dataclass(frozen=True)
class ProjectAnalysisResult:
  has_database_layer: bool
  has_api_layer: bool
  summary: str
  evidence: dict[str, list[str]]
  confidence: str

  @property
  def passed(self) -> bool:
    return self.has_database_layer and self.has_api_layer

  def to_dict(self) -> dict[str, Any]:
    return {
      "has_database_layer": self.has_database_layer,
      "has_api_layer": self.has_api_layer,
      "summary": self.summary,
      "evidence": self.evidence,
      "confidence": self.confidence,
      "passed": self.passed,
    }


class ProjectAnalyzerError(RuntimeError):
  def __init__(self, message: str, *, code: str, status_code: int):
    super().__init__(message)
    self.code = code
    self.status_code = status_code


def _preview_text(value: str, *, limit: int = MAX_LOG_PREVIEW_CHARS) -> str:
  normalized = value.replace("\r\n", "\n").replace("\r", "\n").strip()
  if len(normalized) <= limit:
    return normalized
  return f"{normalized[:limit]}...[truncated]"


def _normalize_json_text(raw_text: str) -> str:
  cleaned = raw_text.strip()
  if cleaned.startswith("```"):
    lines = cleaned.splitlines()
    if len(lines) >= 3 and lines[-1].strip() == "```":
      cleaned = "\n".join(lines[1:-1]).strip()
  if cleaned and (not cleaned.startswith("{") and not cleaned.startswith("[")):
    first_obj = cleaned.find("{")
    first_arr = cleaned.find("[")
    first = min(x for x in [first_obj, first_arr] if x != -1) if (first_obj != -1 or first_arr != -1) else -1
    if first != -1:
      cleaned = cleaned[first:].strip()
  return cleaned


def _extract_responses_text(response: dict[str, Any]) -> str:
  output_text = response.get("output_text")
  if isinstance(output_text, str) and output_text.strip():
    return output_text

  chunks: list[str] = []
  output = response.get("output")
  if isinstance(output, list):
    for item in output:
      if not isinstance(item, dict):
        continue
      content = item.get("content")
      if not isinstance(content, list):
        continue
      for part in content:
        if not isinstance(part, dict):
          continue
        part_type = str(part.get("type") or "")
        text = part.get("text")
        if part_type in {"output_text", "text"} and isinstance(text, str):
          chunks.append(text)
  return "\n".join(chunks)


def _request_json(
  *,
  method: str,
  url: str,
  headers: dict[str, str],
  timeout_seconds: float,
  payload: dict[str, Any] | None = None,
) -> Any:
  body: bytes | None = None
  if payload is not None:
    body = json.dumps(payload).encode("utf-8")
  request = Request(url=url, method=method, headers=headers, data=body)
  with urlopen(request, timeout=timeout_seconds) as response:
    raw = response.read().decode("utf-8")
    return json.loads(raw) if raw else {}


def _github_get_json(url: str) -> Any:
  headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "internroute-project-evaluator",
  }
  github_token = (os.getenv("GITHUB_API_TOKEN") or "").strip()
  if github_token:
    headers["Authorization"] = f"Bearer {github_token}"
  try:
    return _request_json(
      method="GET",
      url=url,
      headers=headers,
      timeout_seconds=HTTP_TIMEOUT_SECONDS,
    )
  except HTTPError as err:
    if err.code == 404:
      raise ProjectAnalyzerError(
        "GitHub repository was not found or is not accessible.",
        code="github_repo_not_found",
        status_code=404,
      ) from err
    if err.code in {401, 403}:
      raise ProjectAnalyzerError(
        "GitHub API is temporarily unavailable. Please retry shortly.",
        code="github_api_unavailable",
        status_code=503,
      ) from err
    raise ProjectAnalyzerError(
      f"GitHub API request failed (HTTP {err.code}).",
      code="github_request_failed",
      status_code=502,
    ) from err
  except URLError as err:
    raise ProjectAnalyzerError(
      f"GitHub API connection error: {err}",
      code="github_connection_error",
      status_code=503,
    ) from err
  except TimeoutError as err:
    raise ProjectAnalyzerError(
      "GitHub API timeout.",
      code="github_timeout",
      status_code=503,
    ) from err


def _openai_request_json(payload: dict[str, Any]) -> dict[str, Any]:
  api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
  if not api_key:
    raise ProjectAnalyzerError(
      "OPENAI_API_KEY is required for project evaluation.",
      code="project_evaluator_not_configured",
      status_code=503,
    )
  try:
    response = _request_json(
      method="POST",
      url=OPENAI_RESPONSES_URL,
      headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
      },
      timeout_seconds=OPENAI_TIMEOUT_SECONDS,
      payload=payload,
    )
  except HTTPError as err:
    if err.code in {429, 500, 502, 503, 504}:
      raise ProjectAnalyzerError(
        "AI evaluator is temporarily unavailable. Please retry shortly.",
        code="project_evaluator_unavailable",
        status_code=503,
      ) from err
    raise ProjectAnalyzerError(
      f"AI evaluator request failed (HTTP {err.code}).",
      code="project_evaluator_request_failed",
      status_code=502,
    ) from err
  except URLError as err:
    raise ProjectAnalyzerError(
      f"AI evaluator connection error: {err}",
      code="project_evaluator_connection_error",
      status_code=503,
    ) from err
  except TimeoutError as err:
    raise ProjectAnalyzerError(
      "AI evaluator timeout.",
      code="project_evaluator_timeout",
      status_code=503,
    ) from err

  if not isinstance(response, dict):
    raise ProjectAnalyzerError(
      "Unexpected AI evaluator response shape.",
      code="project_evaluator_invalid_response",
      status_code=502,
    )
  return response


def _build_file_selector_prompt(*, repo_url: str, tree_paths: list[str], total_paths: int) -> str:
  tree_text = "\n".join(f"- {path}" for path in tree_paths)
  return (
    f"Repository: {repo_url}\n"
    f"Total files in repository tree: {total_paths}\n"
    f"File tree sample count provided: {len(tree_paths)}\n\n"
    "File tree paths:\n"
    f"{tree_text}\n"
  )


def _parse_file_selector_paths(*, raw_text: str, available_paths: set[str]) -> list[str]:
  lower_to_path: dict[str, str] = {}
  for path in available_paths:
    lowered = path.lower()
    if lowered not in lower_to_path:
      lower_to_path[lowered] = path

  def normalize_candidate(value: str) -> str:
    candidate = value.strip()
    candidate = candidate.strip("`")
    candidate = candidate.strip("\"'")
    candidate = candidate.strip().rstrip(",")
    candidate = re.sub(r"^\s*[-*]\s+", "", candidate)
    candidate = re.sub(r"^\s*\d+\.\s+", "", candidate)
    candidate = candidate.strip().strip("\"'")
    while candidate.startswith("./"):
      candidate = candidate[2:]
    while candidate.startswith("/"):
      candidate = candidate[1:]
    return candidate.strip()

  def match_available_path(candidate: str) -> str | None:
    if candidate in available_paths:
      return candidate
    lowered = candidate.lower()
    if lowered in lower_to_path:
      return lower_to_path[lowered]

    if "/" in candidate:
      parts = [part for part in candidate.split("/") if part]
      for index in range(1, len(parts)):
        suffix = "/".join(parts[index:])
        if suffix in available_paths:
          return suffix
        suffix_lower = suffix.lower()
        if suffix_lower in lower_to_path:
          return lower_to_path[suffix_lower]
    return None

  cleaned = _normalize_json_text(raw_text)
  candidates: list[str] = []
  parsed: Any = None
  if cleaned:
    try:
      parsed = json.loads(cleaned)
    except Exception:
      parsed = None

  if isinstance(parsed, list):
    candidates = [item for item in parsed if isinstance(item, str)]
  elif isinstance(parsed, dict):
    raw_paths = parsed.get("paths") or parsed.get("files")
    if isinstance(raw_paths, list):
      candidates = [item for item in raw_paths if isinstance(item, str)]
  else:
    candidates = [line for line in raw_text.splitlines() if line.strip()]

  selected: list[str] = []
  for path in candidates:
    normalized = normalize_candidate(path)
    if not normalized:
      continue
    matched = match_available_path(normalized)
    if matched is None:
      continue
    if matched in selected:
      continue
    selected.append(matched)
    if len(selected) >= MAX_SELECTED_FILES:
      break
  return selected


def _decode_github_content(payload: dict[str, Any]) -> str | None:
  encoding = str(payload.get("encoding") or "")
  content = payload.get("content")
  if encoding != "base64" or not isinstance(content, str):
    return None
  try:
    decoded = base64.b64decode(content)
    return decoded.decode("utf-8", errors="ignore")
  except Exception:
    return None


def _sample_content(text: str) -> str:
  normalized = text.strip()
  if len(normalized) <= MAX_FILE_CHARS:
    return normalized

  segment = max(1000, MAX_FILE_CHARS // 3)
  start = normalized[:segment]
  mid_index = len(normalized) // 2
  mid_start = max(0, mid_index - (segment // 2))
  middle = normalized[mid_start:mid_start + segment]
  end = normalized[-segment:]
  return (
    f"{start}\n\n"
    "... [middle excerpt] ...\n\n"
    f"{middle}\n\n"
    "... [end excerpt] ...\n\n"
    f"{end}"
  )


def _build_analysis_prompt(*, repo_url: str, files: list[tuple[str, str]], total_paths: int) -> str:
  sections: list[str] = []
  for path, content in files:
    sections.append(f"### FILE: {path}\n{content}")
  payload_text = "\n\n".join(sections) if sections else "(no readable file contents)"
  return (
    f"Repository: {repo_url}\n"
    f"Total files in repository tree: {total_paths}\n"
    f"Selected files provided: {len(files)}\n\n"
    "Selected file contents:\n"
    f"{payload_text}\n"
  )


def _coerce_bool(payload: dict[str, Any], key: str) -> bool:
  value = payload.get(key)
  if isinstance(value, bool):
    return value
  if isinstance(value, str):
    normalized = value.strip().lower()
    if normalized in {"true", "yes"}:
      return True
    if normalized in {"false", "no"}:
      return False
  raise ProjectAnalyzerError(
    f"AI evaluator returned invalid `{key}` field.",
    code="project_evaluator_invalid_response",
    status_code=502,
  )


def _normalize_evidence(raw: Any) -> dict[str, list[str]]:
  result = {
    "database": [],
    "api": [],
  }
  if not isinstance(raw, dict):
    return result

  for key in result:
    value = raw.get(key)
    if not isinstance(value, list):
      continue
    cleaned: list[str] = []
    for item in value:
      if not isinstance(item, str):
        continue
      normalized = item.strip()
      if not normalized:
        continue
      cleaned.append(normalized[:180])
      if len(cleaned) >= 6:
        break
    result[key] = cleaned
  return result


def _normalize_confidence(raw: Any) -> str:
  if isinstance(raw, str):
    normalized = raw.strip().lower()
    if normalized in {"low", "medium", "high"}:
      return normalized
  return "medium"


def analyze_github_project(*, owner: str, repo: str, repo_url: str) -> ProjectAnalysisResult:
  logger.info("project_eval_start repo=%s", repo_url)

  repo_meta = _github_get_json(f"{GITHUB_API_BASE_URL}/repos/{quote(owner, safe='')}/{quote(repo, safe='')}")
  if not isinstance(repo_meta, dict):
    raise ProjectAnalyzerError(
      "Unexpected GitHub repository metadata response.",
      code="github_request_failed",
      status_code=502,
    )
  if bool(repo_meta.get("private")):
    raise ProjectAnalyzerError(
      "Repository is private. MVP evaluator currently supports public repositories only.",
      code="github_private_repo_not_supported",
      status_code=400,
    )
  default_branch = str(repo_meta.get("default_branch") or "").strip()
  if not default_branch:
    raise ProjectAnalyzerError(
      "Could not determine repository default branch.",
      code="github_repo_invalid",
      status_code=422,
    )
  logger.info(
    "project_eval_repo_meta repo=%s default_branch=%s private=%s",
    repo_url,
    default_branch,
    bool(repo_meta.get("private")),
  )

  tree_url = (
    f"{GITHUB_API_BASE_URL}/repos/{quote(owner, safe='')}/{quote(repo, safe='')}"
    f"/git/trees/{quote(default_branch, safe='')}?recursive=1"
  )
  tree_payload = _github_get_json(tree_url)
  tree_entries = tree_payload.get("tree") if isinstance(tree_payload, dict) else None
  if not isinstance(tree_entries, list):
    raise ProjectAnalyzerError(
      "Could not load repository tree.",
      code="github_tree_unavailable",
      status_code=502,
    )

  all_paths: list[str] = []
  for entry in tree_entries:
    if not isinstance(entry, dict):
      continue
    if str(entry.get("type") or "") != "blob":
      continue
    path = str(entry.get("path") or "").strip()
    if not path:
      continue
    all_paths.append(path)

  if not all_paths:
    raise ProjectAnalyzerError(
      "Repository appears to be empty.",
      code="github_repo_empty",
      status_code=422,
    )

  all_paths = sorted(all_paths)
  available_paths = set(all_paths)
  tree_for_selection = all_paths[:MAX_TREE_PATHS]
  logger.info(
    "project_eval_tree_loaded repo=%s total_paths=%s paths_sent_to_selector=%s",
    repo_url,
    len(all_paths),
    len(tree_for_selection),
  )
  model_name = (os.getenv("PROJECT_EVALUATOR_LLM_MODEL") or DEFAULT_OPENAI_MODEL).strip()

  pass_1_prompt = _build_file_selector_prompt(
    repo_url=repo_url,
    tree_paths=tree_for_selection,
    total_paths=len(all_paths),
  )
  pass_1_payload: dict[str, Any] = {
    "model": model_name,
    "input": [
      {
        "role": "system",
        "content": [{"type": "input_text", "text": FILE_SELECTOR_SYSTEM_PROMPT}],
      },
      {
        "role": "user",
        "content": [{"type": "input_text", "text": pass_1_prompt}],
      },
    ],
  }
  pass_1_response = _openai_request_json(pass_1_payload)
  pass_1_text = _extract_responses_text(pass_1_response)
  logger.info(
    "project_eval_pass1_output repo=%s model=%s preview=%s",
    repo_url,
    model_name,
    _preview_text(pass_1_text),
  )
  selected_paths = _parse_file_selector_paths(
    raw_text=pass_1_text,
    available_paths=available_paths,
  )
  logger.info(
    "project_eval_pass1_selected repo=%s selected_count=%s selected_paths=%s",
    repo_url,
    len(selected_paths),
    selected_paths[:MAX_LOG_PATHS],
  )
  if not selected_paths:
    logger.warning(
      "project_eval_pass1_no_valid_paths repo=%s pass1_preview=%s",
      repo_url,
      _preview_text(pass_1_text),
    )
    forced = all_paths[0]
    selected_paths = [forced]
    logger.info(
      "project_eval_pass1_forced_selection repo=%s forced_path=%s",
      repo_url,
      forced,
    )

  readable_files: list[tuple[str, str]] = []
  total_chars = 0
  unreadable_count = 0
  github_fetch_skips = 0
  for path in selected_paths[:MAX_SELECTED_FILES]:
    content_url = (
      f"{GITHUB_API_BASE_URL}/repos/{quote(owner, safe='')}/{quote(repo, safe='')}"
      f"/contents/{quote(path, safe='/')}?ref={quote(default_branch, safe='')}"
    )
    try:
      content_payload = _github_get_json(content_url)
    except ProjectAnalyzerError as err:
      if err.code in {"github_repo_not_found", "github_api_unavailable"}:
        raise
      github_fetch_skips += 1
      continue

    if not isinstance(content_payload, dict):
      unreadable_count += 1
      continue
    decoded = _decode_github_content(content_payload)
    if decoded is None:
      unreadable_count += 1
      continue
    sampled = _sample_content(decoded)
    if not sampled:
      unreadable_count += 1
      continue
    readable_files.append((path, sampled))
    total_chars += len(sampled)
    if total_chars >= MAX_TOTAL_FILE_CHARS:
      break

  logger.info(
    "project_eval_files_loaded repo=%s selected_considered=%s readable_files=%s total_chars=%s unreadable=%s github_skips=%s",
    repo_url,
    min(len(selected_paths), MAX_SELECTED_FILES),
    len(readable_files),
    total_chars,
    unreadable_count,
    github_fetch_skips,
  )

  if not readable_files:
    logger.warning("project_eval_no_readable_files repo=%s", repo_url)
    raise ProjectAnalyzerError(
      "Could not read selected repository files for evaluation.",
      code="github_repo_unreadable",
      status_code=422,
    )

  pass_2_prompt = _build_analysis_prompt(
    repo_url=repo_url,
    files=readable_files,
    total_paths=len(all_paths),
  )
  pass_2_payload: dict[str, Any] = {
    "model": model_name,
    "input": [
      {
        "role": "system",
        "content": [{"type": "input_text", "text": ARCHITECTURE_SYSTEM_PROMPT}],
      },
      {
        "role": "user",
        "content": [{"type": "input_text", "text": pass_2_prompt}],
      },
    ],
  }
  pass_2_response = _openai_request_json(pass_2_payload)
  raw_text = _normalize_json_text(_extract_responses_text(pass_2_response))
  logger.info(
    "project_eval_pass2_output repo=%s model=%s preview=%s",
    repo_url,
    model_name,
    _preview_text(raw_text),
  )
  if not raw_text:
    logger.warning("project_eval_pass2_empty_output repo=%s", repo_url)
    raise ProjectAnalyzerError(
      "AI evaluator did not return usable output.",
      code="project_evaluator_invalid_response",
      status_code=502,
    )
  try:
    parsed = json.loads(raw_text)
  except Exception as err:
    logger.warning(
      "project_eval_pass2_json_parse_error repo=%s preview=%s",
      repo_url,
      _preview_text(raw_text),
    )
    raise ProjectAnalyzerError(
      "AI evaluator did not return valid JSON.",
      code="project_evaluator_invalid_response",
      status_code=502,
    ) from err

  if not isinstance(parsed, dict):
    raise ProjectAnalyzerError(
      "AI evaluator payload must be a JSON object.",
      code="project_evaluator_invalid_response",
      status_code=502,
    )

  has_database_layer = _coerce_bool(parsed, "has_database_layer")
  has_api_layer = _coerce_bool(parsed, "has_api_layer")
  summary = str(parsed.get("summary") or "").strip()
  if not summary:
    summary = "Evaluation completed using selected repository files."
  summary = summary[:500]
  evidence = _normalize_evidence(parsed.get("evidence"))
  confidence = _normalize_confidence(parsed.get("confidence"))
  logger.info(
    "project_eval_result repo=%s has_api=%s has_db=%s confidence=%s evidence_api=%s evidence_db=%s",
    repo_url,
    has_api_layer,
    has_database_layer,
    confidence,
    len(evidence.get("api") or []),
    len(evidence.get("database") or []),
  )

  return ProjectAnalysisResult(
    has_database_layer=has_database_layer,
    has_api_layer=has_api_layer,
    summary=summary,
    evidence=evidence,
    confidence=confidence,
  )
