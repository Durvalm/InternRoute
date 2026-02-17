from __future__ import annotations

import time
from threading import Lock
from typing import Any

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import Module, Task
from ..services.judge0 import Judge0Error, get_languages, run_submission
from ..services.progression import set_task_completion_internal
from ..services.skills_challenges import CHALLENGE_TASK_SORT_ORDERS, get_challenge_config

bp = Blueprint("skills", __name__, url_prefix="/skills")

MAX_SOURCE_CODE_CHARS = 20000
RUN_LIMIT_PER_MINUTE = 40
SUBMIT_LIMIT_PER_MINUTE = 15

_RATE_LIMIT_EVENTS: dict[str, list[float]] = {}
_RATE_LIMIT_LOCK = Lock()


def _normalize_output(value: str | None) -> str:
  if value is None:
    return ""
  value = value.replace("\r\n", "\n").replace("\r", "\n")
  lines = [line.rstrip() for line in value.split("\n")]
  return "\n".join(lines).strip()


def _preview(value: str | None, *, max_len: int = 200) -> str:
  if value is None:
    return ""
  value = value.replace("\r\n", "\n").replace("\r", "\n").strip()
  if len(value) <= max_len:
    return value
  return f"{value[:max_len]}..."


def _to_ms(time_value: Any) -> int | None:
  try:
    return int(float(time_value) * 1000)
  except Exception:
    return None


def _status_kind(status_id: int, status_description: str) -> str:
  text = (status_description or "").lower()
  if status_id == 3:
    return "ok"
  if "compile" in text:
    return "compile_error"
  if "runtime" in text:
    return "runtime_error"
  if "time limit" in text:
    return "timeout"
  if "memory limit" in text:
    return "memory_limit"
  if status_id in {1, 2}:
    return "processing"
  return "wrong_answer"


def _check_rate_limit(user_id: int, action: str, limit: int, *, window_seconds: float = 60.0) -> int | None:
  key = f"{user_id}:{action}"
  now = time.time()

  with _RATE_LIMIT_LOCK:
    history = _RATE_LIMIT_EVENTS.get(key, [])
    history = [stamp for stamp in history if now - stamp < window_seconds]
    if len(history) >= limit:
      retry_after = int(window_seconds - (now - history[0])) + 1
      _RATE_LIMIT_EVENTS[key] = history
      return max(1, retry_after)
    history.append(now)
    _RATE_LIMIT_EVENTS[key] = history
  return None


def _evaluate_case(source_code: str, language_id: int, test_case: dict[str, str], cpu_time_limit: float) -> dict[str, Any]:
  result = run_submission(
    source_code=source_code,
    language_id=language_id,
    stdin=test_case["input"],
    cpu_time_limit=cpu_time_limit,
  )

  status = result.get("status") or {}
  status_id = int(status.get("id") or 0)
  status_description = str(status.get("description") or "Unknown")

  stdout = result.get("stdout") or ""
  compile_output = result.get("compile_output") or ""
  stderr = result.get("stderr") or ""

  normalized_actual = _normalize_output(stdout)
  normalized_expected = _normalize_output(test_case["expected_output"])
  passed = status_id == 3 and normalized_actual == normalized_expected
  if status_id == 3:
    status_kind = "ok" if passed else "wrong_answer"
  else:
    status_kind = _status_kind(status_id, status_description)

  return {
    "passed": passed,
    "status_id": status_id,
    "status_description": status_description,
    "status_kind": status_kind,
    "actual_output": normalized_actual,
    "expected_output": normalized_expected,
    "stdin": test_case["input"],
    "compile_output": compile_output,
    "stderr": stderr,
    "time_ms": _to_ms(result.get("time")),
    "memory_kb": result.get("memory"),
  }


def _evaluate_test_group(
  source_code: str,
  language_id: int,
  tests: list[dict[str, str]],
  cpu_time_limit: float,
  *,
  stop_on_first_failure: bool,
) -> dict[str, Any]:
  case_results: list[dict[str, Any]] = []
  error_kind = "ok"
  compile_output = ""
  stderr = ""
  peak_time_ms = 0
  peak_memory_kb = 0

  for test_case in tests:
    case = _evaluate_case(source_code, language_id, test_case, cpu_time_limit)
    case_results.append(case)

    if case["compile_output"] and not compile_output:
      compile_output = str(case["compile_output"])
    if case["stderr"] and not stderr:
      stderr = str(case["stderr"])
    if isinstance(case["time_ms"], int):
      peak_time_ms = max(peak_time_ms, case["time_ms"])
    if isinstance(case["memory_kb"], int):
      peak_memory_kb = max(peak_memory_kb, case["memory_kb"])

    if case["status_kind"] not in {"ok", "wrong_answer"} and error_kind == "ok":
      error_kind = case["status_kind"]

    if stop_on_first_failure and not case["passed"]:
      break

  passed_count = sum(1 for case in case_results if case["passed"])
  total = len(tests)

  if error_kind != "ok":
    final_status = error_kind
  elif passed_count == total:
    final_status = "ok"
  else:
    final_status = "wrong_answer"

  return {
    "status": final_status,
    "passed_count": passed_count,
    "total": total,
    "case_results": case_results,
    "compile_output": _preview(compile_output, max_len=500),
    "stderr": _preview(stderr, max_len=500),
    "time_ms": peak_time_ms or None,
    "memory_kb": peak_memory_kb or None,
}


def _resolve_challenge_task(*, challenge_id: str, coding_module_id: int) -> Task | None:
  sort_order = CHALLENGE_TASK_SORT_ORDERS.get(challenge_id)
  if sort_order is None:
    return None
  return Task.query.filter_by(
    module_id=coding_module_id,
    sort_order=sort_order,
    is_active=True,
  ).first()


@bp.get("/progress")
@jwt_required()
def progress():
  user_id = int(get_jwt_identity())
  coding_module = Module.query.filter_by(key="coding").first()
  if coding_module is None:
    return jsonify({"error": "Coding module not found"}), 404

  challenge_completion: dict[str, bool] = {}
  completed_count = 0

  for challenge_id in CHALLENGE_TASK_SORT_ORDERS:
    task = _resolve_challenge_task(challenge_id=challenge_id, coding_module_id=coding_module.id)
    if task is None:
      challenge_completion[challenge_id] = False
      continue

    is_completed = bool(
      task.completions
      and any(completion.user_id == user_id for completion in task.completions)
    )
    challenge_completion[challenge_id] = is_completed
    if is_completed:
      completed_count += 1

  total = len(CHALLENGE_TASK_SORT_ORDERS)
  return jsonify(
    {
      "challenge_completion": challenge_completion,
      "completed_count": completed_count,
      "total": total,
    }
  )


@bp.get("/languages")
@jwt_required()
def languages():
  try:
    languages_payload = get_languages()
  except Judge0Error as err:
    return jsonify({"error": str(err)}), 502
  return jsonify({"languages": languages_payload})


@bp.post("/challenges/<challenge_id>/run")
@jwt_required()
def run_challenge(challenge_id: str):
  user_id = int(get_jwt_identity())
  retry_after = _check_rate_limit(user_id, "run", RUN_LIMIT_PER_MINUTE)
  if retry_after is not None:
    return jsonify({"error": "Rate limit exceeded. Try again soon.", "retry_after_seconds": retry_after}), 429

  challenge = get_challenge_config(challenge_id)
  if challenge is None:
    return jsonify({"error": "Unknown challenge"}), 404

  payload = request.get_json() or {}
  source_code = payload.get("source_code")
  language_id = payload.get("language_id")

  if not isinstance(source_code, str) or not source_code.strip():
    return jsonify({"error": "source_code is required"}), 400
  if len(source_code) > MAX_SOURCE_CODE_CHARS:
    return jsonify({"error": f"source_code exceeds {MAX_SOURCE_CODE_CHARS} characters"}), 400
  if not isinstance(language_id, int):
    return jsonify({"error": "language_id must be an integer"}), 400

  sample_tests = challenge["sample_tests"]
  cpu_time_limit = float(challenge.get("cpu_time_limit") or 2.0)

  try:
    evaluation = _evaluate_test_group(
      source_code=source_code,
      language_id=language_id,
      tests=sample_tests,
      cpu_time_limit=cpu_time_limit,
      stop_on_first_failure=False,
    )
  except Judge0Error as err:
    return jsonify({"error": str(err)}), 502

  sample_results = [
    {
      "passed": result["passed"],
      "input_preview": _preview(result["stdin"]),
      "expected_preview": _preview(result["expected_output"]),
      "actual_preview": _preview(result["actual_output"]),
      "status": result["status_kind"],
    }
    for result in evaluation["case_results"]
  ]

  return jsonify(
    {
      "status": evaluation["status"],
      "sample_results": sample_results,
      "compile_output": evaluation["compile_output"],
      "stderr": evaluation["stderr"],
      "time_ms": evaluation["time_ms"],
      "memory_kb": evaluation["memory_kb"],
    }
  )


@bp.post("/challenges/<challenge_id>/submit")
@jwt_required()
def submit_challenge(challenge_id: str):
  user_id = int(get_jwt_identity())
  retry_after = _check_rate_limit(user_id, "submit", SUBMIT_LIMIT_PER_MINUTE)
  if retry_after is not None:
    return jsonify({"error": "Rate limit exceeded. Try again soon.", "retry_after_seconds": retry_after}), 429

  challenge = get_challenge_config(challenge_id)
  if challenge is None:
    return jsonify({"error": "Unknown challenge"}), 404

  payload = request.get_json() or {}
  source_code = payload.get("source_code")
  language_id = payload.get("language_id")

  if not isinstance(source_code, str) or not source_code.strip():
    return jsonify({"error": "source_code is required"}), 400
  if len(source_code) > MAX_SOURCE_CODE_CHARS:
    return jsonify({"error": f"source_code exceeds {MAX_SOURCE_CODE_CHARS} characters"}), 400
  if not isinstance(language_id, int):
    return jsonify({"error": "language_id must be an integer"}), 400

  hidden_tests = challenge["hidden_tests"]
  cpu_time_limit = float(challenge.get("cpu_time_limit") or 2.0)

  try:
    evaluation = _evaluate_test_group(
      source_code=source_code,
      language_id=language_id,
      tests=hidden_tests,
      cpu_time_limit=cpu_time_limit,
      stop_on_first_failure=True,
    )
  except Judge0Error as err:
    return jsonify({"error": str(err)}), 502

  passed_all_hidden = evaluation["passed_count"] == evaluation["total"]
  task_completed = False

  if passed_all_hidden:
    coding_module = Module.query.filter_by(key="coding").first()
    if coding_module:
      task = _resolve_challenge_task(challenge_id=challenge_id, coding_module_id=coding_module.id)
      if task:
        set_task_completion_internal(user_id, task.id, True)
        task_completed = True

  return jsonify(
    {
      "status": evaluation["status"],
      "passed_all_hidden": passed_all_hidden,
      "hidden_pass_count": evaluation["passed_count"],
      "hidden_total": evaluation["total"],
      "task_completed": task_completed,
      "compile_output": evaluation["compile_output"],
      "stderr": evaluation["stderr"],
      "time_ms": evaluation["time_ms"],
      "memory_kb": evaluation["memory_kb"],
    }
  )
