from __future__ import annotations

from typing import Any

ALL_FAMILIES = [
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

NON_C_FAMILIES = [family for family in ALL_FAMILIES if family != "c"]

CHALLENGE_IDS: list[str] = [
  "clean_username",
  "word_counter",
  "summarize_orders",
  "cart_total",
  "group_anagrams",
]

CHALLENGE_CONFIGS: dict[str, dict[str, Any]] = {
  "clean_username": {
    "function_name": "clean_username",
    "parameters": [
      {"name": "s", "type": "string"},
    ],
    "return_type": "string",
    "sample_cases": [
      {"args": ["  John Doe  "], "expected": "john_doe"},
      {"args": ["Alice Smith"], "expected": "alice_smith"},
    ],
    "hidden_cases": [
      {"args": ["  Intern Route  "], "expected": "intern_route"},
      {"args": ["MIXED Case"], "expected": "mixed_case"},
      {"args": ["  many   spaces  "], "expected": "many___spaces"},
    ],
    "supported_families": list(ALL_FAMILIES),
    "cpu_time_limit": 2.0,
  },
  "word_counter": {
    "function_name": "word_counter",
    "parameters": [
      {"name": "words", "type": "string_list"},
    ],
    "return_type": "string_list",
    "sample_cases": [
      {"args": [["intern", "route", "intern"]], "expected": ["intern:2", "route:1"]},
      {"args": [["python", "python", "sql", "api", "sql"]], "expected": ["python:2", "sql:2", "api:1"]},
    ],
    "hidden_cases": [
      {"args": [["a"]], "expected": ["a:1"]},
      {"args": [["cat", "dog", "cat", "dog", "dog"]], "expected": ["cat:2", "dog:3"]},
      {"args": [["x", "x", "x", "y", "z", "z"]], "expected": ["x:3", "y:1", "z:2"]},
    ],
    "supported_families": list(NON_C_FAMILIES),
    "cpu_time_limit": 2.0,
  },
  "summarize_orders": {
    "function_name": "summarize_orders",
    "parameters": [
      {"name": "users", "type": "string_list"},
      {"name": "amounts", "type": "int_list"},
    ],
    "return_type": "string_list",
    "sample_cases": [
      {"args": [["u1", "u2", "u1"], [10, 5, 7]], "expected": ["u1:count=2,total=17", "u2:count=1,total=5"]},
      {"args": [["ana", "ana"], [3, 9]], "expected": ["ana:count=2,total=12"]},
    ],
    "hidden_cases": [
      {"args": [["sam", "lee", "sam", "lee"], [1, 2, 3, 4]], "expected": ["sam:count=2,total=4", "lee:count=2,total=6"]},
      {"args": [["x"], [0]], "expected": ["x:count=1,total=0"]},
      {
        "args": [["a", "b", "a", "c"], [5, 5, -2, 1]],
        "expected": ["a:count=2,total=3", "b:count=1,total=5", "c:count=1,total=1"],
      },
    ],
    "supported_families": list(NON_C_FAMILIES),
    "cpu_time_limit": 2.0,
  },
  "cart_total": {
    "function_name": "cart_total",
    "parameters": [
      {"name": "prices", "type": "int_list"},
      {"name": "qty", "type": "int_list"},
      {"name": "coupon", "type": "string"},
    ],
    "return_type": "float",
    "sample_cases": [
      {"args": [[10, 2], [2, 3], "SAVE10"], "expected": 23.4},
      {"args": [[4, 1], [4, 4], "SAVE20"], "expected": 16.0},
    ],
    "hidden_cases": [
      {"args": [[10, 2], [2, 3], "SAVE20"], "expected": 20.8},
      {"args": [[4, 1], [3, 2], "SAVE20"], "expected": 14.0},
      {"args": [[5], [4], "NONE"], "expected": 20.0},
      {"args": [[7, 3], [1, 2], "INVALID"], "expected": 13.0},
    ],
    "supported_families": list(ALL_FAMILIES),
    "cpu_time_limit": 2.0,
  },
  "group_anagrams": {
    "function_name": "group_anagrams",
    "parameters": [
      {"name": "words", "type": "string_list"},
    ],
    "return_type": "string_list_list",
    "sample_cases": [
      {"args": [["eat", "tea", "tan", "ate", "nat", "bat"]], "expected": [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]},
      {"args": [["abc", "bca", "cab", "foo"]], "expected": [["abc", "bca", "cab"], ["foo"]]},
    ],
    "hidden_cases": [
      {"args": [["listen", "silent", "enlist", "google"]], "expected": [["listen", "silent", "enlist"], ["google"]]},
      {"args": [["rat", "tar", "art", "star", "tars"]], "expected": [["rat", "tar", "art"], ["star", "tars"]]},
      {"args": [["a"]], "expected": [["a"]]},
    ],
    "comparator": "group_anagrams",
    "supported_families": list(NON_C_FAMILIES),
    "cpu_time_limit": 2.0,
  },
}


def get_challenge_config(challenge_id: str) -> dict[str, Any] | None:
  return CHALLENGE_CONFIGS.get(challenge_id)


def challenge_supports_family(challenge: dict[str, Any], language_family: str) -> bool:
  families = challenge.get("supported_families")
  if not isinstance(families, list) or not families:
    return True
  return language_family in families


def list_challenge_ids() -> list[str]:
  return list(CHALLENGE_IDS)


def list_challenge_contracts() -> list[dict[str, Any]]:
  contracts: list[dict[str, Any]] = []
  for index, challenge_id in enumerate(CHALLENGE_IDS, start=1):
    challenge = CHALLENGE_CONFIGS.get(challenge_id)
    if challenge is None:
      continue
    contracts.append(
      {
        "id": challenge_id,
        "order": index,
        "function_name": challenge["function_name"],
        "parameters": challenge["parameters"],
        "return_type": challenge["return_type"],
        "supported_families": challenge.get("supported_families") or list(ALL_FAMILIES),
      }
    )
  return contracts
