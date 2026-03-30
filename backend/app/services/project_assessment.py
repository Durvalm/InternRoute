from __future__ import annotations

import base64
from dataclasses import dataclass
from io import BytesIO
import json
import os
import re
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen
import zipfile

DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"
GITHUB_API_BASE_URL = "https://api.github.com"
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"

HTTP_TIMEOUT_SECONDS = 25.0
OPENAI_TIMEOUT_SECONDS = 45.0

MAX_TREE_PATHS = 1200
MAX_SELECTED_FILES = 12
MAX_FILE_CHARS = 6000
MAX_TOTAL_FILE_CHARS = 48000
MAX_ARCHIVE_FILE_BYTES = 200_000
MAX_TOTAL_ARCHIVE_FILES = 2500

_ALLOWED_GITHUB_HOSTS = {"github.com", "www.github.com"}
_TEXT_EXTENSIONS = {
  ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".cpp", ".h", ".hpp", ".go", ".rs", ".rb", ".php",
  ".sql", ".json", ".yaml", ".yml", ".toml", ".ini", ".txt", ".md", ".env", ".sh",
}

FILE_SELECTOR_SYSTEM_PROMPT = """
You are selecting code files for technical assessment.

Goal:
Pick files that are most useful to determine:
1) API/backend endpoint implementation
2) Database/persistence implementation
3) Whether code quality is strong enough to skip our Coding Skills module

Rules:
- Return ONLY a JSON array of file paths.
- Pick between 1 and 12 paths.
- Prefer server/backend/core implementation files.
- If the project seems frontend-only or small, still pick representative files.
""".strip()

ASSESSMENT_SYSTEM_PROMPT = """
You are evaluating internship-level engineering evidence from code files.

Return ONLY valid JSON:
{
  "has_api_layer": true|false,
  "has_database_layer": true|false,
  "has_coding_skills": true|false,
  "coding_confidence": "low|medium|high",
  "summary": "short practical summary",
  "evidence": {
    "api": ["path1", "path2"],
    "database": ["path3"],
    "coding": ["path4", "path5"]
  }
}

Judgement criteria:
- has_api_layer: true only if there is real server-side API route/handler implementation.
- has_database_layer: true only if there is real persistent DB integration (ORM/driver/schema/query/migration).
- has_coding_skills: true only if there is clear evidence the user can likely pass our Coding Skills module now.

Use this Coding Skills benchmark (challenge-level reference):
1) word_counter:
   Count repeated words and return formatted entries like "word:count".
2) summarize_orders:
   From parallel arrays (users, amounts), aggregate per-user order count and total amount.
3) cart_total:
   Compute cart total from prices, quantities, and coupon rules.

Coding-skip decision:
- Do not require the submitted code to match these exact problem shapes.
- If the project solves a different problem with similar or greater coding depth, count that as valid evidence.
- has_coding_skills is independent from has_api_layer and has_database_layer.
- This module is above beginner syntax: it expects multi-step logic and meaningful collection/data processing.
- Code that is mostly input/output flow with very simple branching is usually not enough by itself.
- Mark has_coding_skills=true when code evidence strongly suggests the user could likely pass this Coding Skills module now.
- If uncertain, return false.

Use only provided files. Keep evidence paths from provided files only.
""".strip()

class ProjectAssessmentError(RuntimeError):
  def __init__(self, message: str, *, code: str = "project_assessment_error", status_code: int = 400):
    super().__init__(message)
    self.code = code
    self.status_code = status_code


@dataclass(frozen=True)
class TextFile:
  path: str
  content: str


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
    "User-Agent": "internroute-onboarding-evaluator",
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
      raise ProjectAssessmentError(
        "GitHub repository was not found or is not accessible.",
        code="github_repo_not_found",
        status_code=404,
      ) from err
    if err.code in {401, 403}:
      raise ProjectAssessmentError(
        "GitHub API is temporarily unavailable. Please retry shortly.",
        code="github_api_unavailable",
        status_code=503,
      ) from err
    raise ProjectAssessmentError(
      f"GitHub API request failed (HTTP {err.code}).",
      code="github_request_failed",
      status_code=502,
    ) from err
  except URLError as err:
    raise ProjectAssessmentError(
      f"GitHub API connection error: {err}",
      code="github_connection_error",
      status_code=503,
    ) from err
  except TimeoutError as err:
    raise ProjectAssessmentError(
      "GitHub API timeout.",
      code="github_timeout",
      status_code=503,
    ) from err


def _openai_request_json(payload: dict[str, Any]) -> dict[str, Any]:
  api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
  if not api_key:
    raise ProjectAssessmentError(
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
      raise ProjectAssessmentError(
        "AI evaluator is temporarily unavailable. Please retry shortly.",
        code="project_evaluator_unavailable",
        status_code=503,
      ) from err
    raise ProjectAssessmentError(
      f"AI evaluator request failed (HTTP {err.code}).",
      code="project_evaluator_request_failed",
      status_code=502,
    ) from err
  except URLError as err:
    raise ProjectAssessmentError(
      f"AI evaluator connection error: {err}",
      code="project_evaluator_connection_error",
      status_code=503,
    ) from err
  except TimeoutError as err:
    raise ProjectAssessmentError(
      "AI evaluator timeout.",
      code="project_evaluator_timeout",
      status_code=503,
    ) from err

  if not isinstance(response, dict):
    raise ProjectAssessmentError(
      "Unexpected AI evaluator response shape.",
      code="project_evaluator_invalid_response",
      status_code=502,
    )
  return response


def _parse_github_repo(value: str) -> tuple[str, str]:
  parsed = urlparse((value or "").strip())
  if parsed.scheme not in {"http", "https"}:
    raise ProjectAssessmentError("repo_url must be a valid GitHub URL.", code="invalid_repo_url")

  host = (parsed.netloc or "").lower()
  if host not in _ALLOWED_GITHUB_HOSTS:
    raise ProjectAssessmentError("repo_url must use github.com.", code="invalid_repo_host")

  segments = [segment for segment in (parsed.path or "").split("/") if segment]
  if len(segments) != 2:
    raise ProjectAssessmentError(
      "repo_url must be in format https://github.com/<owner>/<repo>",
      code="invalid_repo_url_format",
    )

  owner = segments[0].strip()
  repo = segments[1].strip()
  if repo.endswith(".git"):
    repo = repo[:-4]
  if not owner or not repo:
    raise ProjectAssessmentError("repo_url owner/repo is invalid.", code="invalid_repo_url_format")

  return owner, repo


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


def _decode_text(raw: bytes) -> str:
  for encoding in ("utf-8", "latin-1"):
    try:
      return raw.decode(encoding)
    except UnicodeDecodeError:
      continue
  return raw.decode("utf-8", errors="ignore")


def _is_text_candidate(path: str) -> bool:
  lower = path.lower()
  if "/." in lower or lower.startswith("."):
    return False
  return any(lower.endswith(ext) for ext in _TEXT_EXTENSIONS)


def _extract_text_files_from_zip(archive_bytes: bytes) -> list[TextFile]:
  try:
    archive = zipfile.ZipFile(BytesIO(archive_bytes))
  except zipfile.BadZipFile as err:
    raise ProjectAssessmentError("Uploaded zip file is invalid.", code="invalid_zip_file") from err

  files: list[TextFile] = []
  total_seen = 0
  for member in archive.infolist():
    total_seen += 1
    if total_seen > MAX_TOTAL_ARCHIVE_FILES:
      break
    if member.is_dir():
      continue

    normalized = member.filename.replace("\\", "/")
    if not _is_text_candidate(normalized):
      continue
    if member.file_size <= 0:
      continue

    limited_size = min(member.file_size, MAX_ARCHIVE_FILE_BYTES)
    with archive.open(member, "r") as file_handle:
      raw = file_handle.read(limited_size)
    if not raw:
      continue

    content = _decode_text(raw)
    slash_index = normalized.find("/")
    relative_path = normalized[slash_index + 1:] if slash_index > 0 else normalized
    files.append(TextFile(path=relative_path, content=content))

  return files


def _looks_like_zip(filename: str, mimetype: str | None) -> bool:
  name = (filename or "").lower()
  mime = (mimetype or "").lower()
  return name.endswith(".zip") or "zip" in mime


def _collect_files_from_uploaded(file_name: str, content_type: str | None, file_bytes: bytes) -> tuple[list[TextFile], bool]:
  if _looks_like_zip(file_name, content_type):
    return _extract_text_files_from_zip(file_bytes), False

  path = file_name.strip() or "uploaded_file"
  content = _decode_text(file_bytes[:MAX_ARCHIVE_FILE_BYTES])
  return [TextFile(path=path, content=content)], True


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


def _build_selector_prompt(*, source_label: str, tree_paths: list[str], total_paths: int) -> str:
  tree_text = "\n".join(f"- {path}" for path in tree_paths)
  return (
    f"Source: {source_label}\n"
    f"Total files available: {total_paths}\n"
    f"File paths provided: {len(tree_paths)}\n\n"
    "File paths:\n"
    f"{tree_text}\n"
  )


def _parse_file_selector_paths(*, raw_text: str, available_paths: set[str]) -> list[str]:
  lower_to_path: dict[str, str] = {path.lower(): path for path in available_paths}

  def normalize_candidate(value: str) -> str:
    candidate = value.strip().strip("`").strip("\"'").strip().rstrip(",")
    candidate = re.sub(r"^\s*[-*]\s+", "", candidate)
    candidate = re.sub(r"^\s*\d+\.\s+", "", candidate)
    while candidate.startswith("./"):
      candidate = candidate[2:]
    while candidate.startswith("/"):
      candidate = candidate[1:]
    return candidate.strip().strip("\"'")

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
  parsed: Any = None
  if cleaned:
    try:
      parsed = json.loads(cleaned)
    except Exception:
      parsed = None

  candidates: list[str]
  if isinstance(parsed, list):
    candidates = [item for item in parsed if isinstance(item, str)]
  elif isinstance(parsed, dict):
    raw_paths = parsed.get("paths") or parsed.get("files")
    if isinstance(raw_paths, list):
      candidates = [item for item in raw_paths if isinstance(item, str)]
    else:
      candidates = []
  else:
    candidates = [line for line in raw_text.splitlines() if line.strip()]

  selected: list[str] = []
  for path in candidates:
    normalized = normalize_candidate(path)
    if not normalized:
      continue
    matched = match_available_path(normalized)
    if matched is None or matched in selected:
      continue
    selected.append(matched)
    if len(selected) >= MAX_SELECTED_FILES:
      break

  return selected


def _run_file_selector(*, source_label: str, all_paths: list[str]) -> list[str]:
  tree_for_selection = all_paths[:MAX_TREE_PATHS]
  model_name = (os.getenv("PROJECT_EVALUATOR_LLM_MODEL") or DEFAULT_OPENAI_MODEL).strip()
  prompt = _build_selector_prompt(
    source_label=source_label,
    tree_paths=tree_for_selection,
    total_paths=len(all_paths),
  )
  payload: dict[str, Any] = {
    "model": model_name,
    "input": [
      {
        "role": "system",
        "content": [{"type": "input_text", "text": FILE_SELECTOR_SYSTEM_PROMPT}],
      },
      {
        "role": "user",
        "content": [{"type": "input_text", "text": prompt}],
      },
    ],
  }

  response = _openai_request_json(payload)
  raw_text = _extract_responses_text(response)
  selected = _parse_file_selector_paths(raw_text=raw_text, available_paths=set(all_paths))
  if selected:
    return selected
  fallback = all_paths[: min(MAX_SELECTED_FILES, len(all_paths))]
  return fallback


def _build_assessment_prompt(*, source_label: str, source_kind: str, total_paths: int, files: list[tuple[str, str]]) -> str:
  sections: list[str] = []
  for path, content in files:
    sections.append(f"### FILE: {path}\n{content}")
  payload_text = "\n\n".join(sections) if sections else "(no readable file contents)"
  return (
    f"Source: {source_label}\n"
    f"Source kind: {source_kind}\n"
    f"Total files in source: {total_paths}\n"
    f"Files provided: {len(files)}\n\n"
    "Code excerpts:\n"
    f"{payload_text}\n"
  )


def _coerce_bool(payload: dict[str, Any], key: str) -> bool:
  value = payload.get(key)
  if isinstance(value, bool):
    return value
  if isinstance(value, str):
    lowered = value.strip().lower()
    if lowered in {"true", "yes"}:
      return True
    if lowered in {"false", "no"}:
      return False
  raise ProjectAssessmentError(
    f"AI evaluator returned invalid `{key}` field.",
    code="project_evaluator_invalid_response",
    status_code=502,
  )


def _normalize_confidence(raw: Any) -> str:
  if isinstance(raw, str):
    normalized = raw.strip().lower()
    if normalized in {"low", "medium", "high"}:
      return normalized
  return "medium"


def _confidence_to_score(level: str) -> float:
  if level == "high":
    return 0.9
  if level == "medium":
    return 0.6
  return 0.35


def _normalize_evidence(raw: Any) -> dict[str, list[str]]:
  result = {
    "api": [],
    "database": [],
    "coding": [],
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


def _evaluate_with_ai(
  *,
  source_label: str,
  source_kind: str,
  total_paths: int,
  files: list[tuple[str, str]],
) -> dict[str, Any]:
  model_name = (os.getenv("PROJECT_EVALUATOR_LLM_MODEL") or DEFAULT_OPENAI_MODEL).strip()
  prompt = _build_assessment_prompt(
    source_label=source_label,
    source_kind=source_kind,
    total_paths=total_paths,
    files=files,
  )
  payload: dict[str, Any] = {
    "model": model_name,
    "temperature": 0,
    "input": [
      {
        "role": "system",
        "content": [{"type": "input_text", "text": ASSESSMENT_SYSTEM_PROMPT}],
      },
      {
        "role": "user",
        "content": [{"type": "input_text", "text": prompt}],
      },
    ],
  }

  response = _openai_request_json(payload)
  raw_text = _normalize_json_text(_extract_responses_text(response))

  if not raw_text:
    raise ProjectAssessmentError(
      "AI evaluator did not return usable output.",
      code="project_evaluator_invalid_response",
      status_code=502,
    )

  try:
    parsed = json.loads(raw_text)
  except Exception as err:
    raise ProjectAssessmentError(
      "AI evaluator did not return valid JSON.",
      code="project_evaluator_invalid_response",
      status_code=502,
    ) from err

  if not isinstance(parsed, dict):
    raise ProjectAssessmentError(
      "AI evaluator payload must be a JSON object.",
      code="project_evaluator_invalid_response",
      status_code=502,
    )

  has_api_layer = _coerce_bool(parsed, "has_api_layer")
  has_database_layer = _coerce_bool(parsed, "has_database_layer")
  has_coding_skills = _coerce_bool(parsed, "has_coding_skills")
  coding_confidence_level = _normalize_confidence(parsed.get("coding_confidence"))

  summary = str(parsed.get("summary") or "").strip()
  if not summary:
    summary = "AI evaluation completed."

  evidence = _normalize_evidence(parsed.get("evidence"))

  return {
    "has_api_layer": has_api_layer,
    "has_database_layer": has_database_layer,
    "has_coding_skills": has_coding_skills,
    "coding_confidence": _confidence_to_score(coding_confidence_level),
    "coding_confidence_level": coding_confidence_level,
    "summary": summary[:500],
    "evidence": evidence,
  }


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


def _load_repo_files(
  owner: str,
  repo: str,
  default_branch: str,
  selected_paths: list[str],
) -> list[tuple[str, str]]:
  readable_files: list[tuple[str, str]] = []
  total_chars = 0

  for path in selected_paths[:MAX_SELECTED_FILES]:
    content_url = (
      f"{GITHUB_API_BASE_URL}/repos/{quote(owner, safe='')}/{quote(repo, safe='')}"
      f"/contents/{quote(path, safe='/')}?ref={quote(default_branch, safe='')}"
    )
    content_payload = _github_get_json(content_url)
    if not isinstance(content_payload, dict):
      continue

    decoded = _decode_github_content(content_payload)
    if decoded is None:
      continue

    sampled = _sample_content(decoded)
    if not sampled:
      continue

    readable_files.append((path, sampled))
    total_chars += len(sampled)
    if total_chars >= MAX_TOTAL_FILE_CHARS:
      break

  return readable_files


def _build_analysis_notes(source_kind: str, summary: str, confidence_level: str) -> str:
  kind_label = "Single-file coding signal" if source_kind == "single_file" else "Project evidence"
  return f"{kind_label} evaluated by AI. Coding confidence: {confidence_level}. {summary}".strip()


def _compose_result(
  *,
  source_kind: str,
  canonical_repo_url: str | None,
  ai_result: dict[str, Any],
  evidence_files: list[str],
) -> dict[str, object]:
  has_coding_skills = bool(ai_result["has_coding_skills"])
  coding_confidence = float(ai_result["coding_confidence"])

  if source_kind == "single_file":
    has_api: bool | None = None
    has_database: bool | None = None
    project_pass = False
    is_coding_signal_only = True
  else:
    has_api = bool(ai_result["has_api_layer"])
    has_database = bool(ai_result["has_database_layer"])
    project_pass = bool(has_api and has_database)
    is_coding_signal_only = False

  notes = _build_analysis_notes(
    source_kind=source_kind,
    summary=str(ai_result.get("summary") or ""),
    confidence_level=str(ai_result.get("coding_confidence_level") or "medium"),
  )

  return {
    "source_kind": source_kind,
    "canonical_repo_url": canonical_repo_url,
    "has_api": has_api,
    "has_database": has_database,
    "has_coding_skills": has_coding_skills,
    "coding_confidence": round(coding_confidence, 3),
    "project_pass": project_pass,
    "is_coding_signal_only": is_coding_signal_only,
    "evidence_files": evidence_files[:MAX_SELECTED_FILES],
    "analysis_notes": notes,
  }


def analyze_repo_url(repo_url: str) -> dict[str, object]:
  owner, repo = _parse_github_repo(repo_url)
  canonical_url = f"https://github.com/{owner}/{repo}"

  repo_meta = _github_get_json(f"{GITHUB_API_BASE_URL}/repos/{quote(owner, safe='')}/{quote(repo, safe='')}")
  if not isinstance(repo_meta, dict):
    raise ProjectAssessmentError(
      "Unexpected GitHub repository metadata response.",
      code="github_request_failed",
      status_code=502,
    )
  if bool(repo_meta.get("private")):
    raise ProjectAssessmentError(
      "Repository is private. Evaluator currently supports public repositories only.",
      code="github_private_repo_not_supported",
      status_code=400,
    )

  default_branch = str(repo_meta.get("default_branch") or "").strip()
  if not default_branch:
    raise ProjectAssessmentError(
      "Could not determine repository default branch.",
      code="github_repo_invalid",
      status_code=422,
    )

  tree_url = (
    f"{GITHUB_API_BASE_URL}/repos/{quote(owner, safe='')}/{quote(repo, safe='')}"
    f"/git/trees/{quote(default_branch, safe='')}?recursive=1"
  )
  tree_payload = _github_get_json(tree_url)
  tree_entries = tree_payload.get("tree") if isinstance(tree_payload, dict) else None
  if not isinstance(tree_entries, list):
    raise ProjectAssessmentError(
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
    raise ProjectAssessmentError(
      "Repository appears to be empty.",
      code="github_repo_empty",
      status_code=422,
    )

  all_paths = sorted(all_paths)
  selected_paths = _run_file_selector(source_label=canonical_url, all_paths=all_paths)
  readable_files = _load_repo_files(owner, repo, default_branch, selected_paths)

  if not readable_files:
    raise ProjectAssessmentError(
      "Could not read selected repository files for evaluation.",
      code="github_repo_unreadable",
      status_code=422,
    )

  ai_result = _evaluate_with_ai(
    source_label=canonical_url,
    source_kind="repo",
    total_paths=len(all_paths),
    files=readable_files,
  )

  final_result = _compose_result(
    source_kind="repo",
    canonical_repo_url=canonical_url,
    ai_result=ai_result,
    evidence_files=[path for path, _ in readable_files],
  )
  return final_result


def analyze_uploaded_input(file_name: str, content_type: str | None, file_bytes: bytes) -> dict[str, object]:
  files, single_file_mode = _collect_files_from_uploaded(file_name, content_type, file_bytes)
  if not files:
    raise ProjectAssessmentError(
      "Could not read uploaded file content.",
      code="upload_no_readable_files",
      status_code=400,
    )

  source_kind = "single_file" if single_file_mode else "zip"
  all_paths = sorted(file.path for file in files if file.path.strip())
  if not all_paths:
    raise ProjectAssessmentError(
      "Could not find readable files in upload.",
      code="upload_no_readable_files",
      status_code=400,
    )

  files_by_path = {file.path: file for file in files}
  selected_paths = _run_file_selector(source_label=file_name, all_paths=all_paths)

  sampled_files: list[tuple[str, str]] = []
  total_chars = 0
  for path in selected_paths:
    file = files_by_path.get(path)
    if file is None:
      continue
    sampled = _sample_content(file.content)
    if not sampled:
      continue
    sampled_files.append((path, sampled))
    total_chars += len(sampled)
    if total_chars >= MAX_TOTAL_FILE_CHARS:
      break

  if not sampled_files:
    raise ProjectAssessmentError(
      "Could not read uploaded file content.",
      code="upload_no_readable_files",
      status_code=400,
    )

  ai_result = _evaluate_with_ai(
    source_label=file_name,
    source_kind=source_kind,
    total_paths=len(all_paths),
    files=sampled_files,
  )
  final_result = _compose_result(
    source_kind=source_kind,
    canonical_repo_url=None,
    ai_result=ai_result,
    evidence_files=[path for path, _ in sampled_files],
  )
  return final_result
