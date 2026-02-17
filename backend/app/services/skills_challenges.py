from __future__ import annotations

from typing import Any


CHALLENGE_TASK_SORT_ORDERS: dict[str, int] = {
  "string_reversal": 1,
  "fizzbuzz_logic": 2,
  "list_filtering": 3,
  "dictionary_basics": 4,
  "palindrome_check": 5,
  "sum_of_two": 6,
}


CHALLENGE_CONFIGS: dict[str, dict[str, Any]] = {
  "string_reversal": {
    "function_name": "string_reversal",
    "parameters": [
      {"name": "s", "type": "string"},
    ],
    "return_type": "string",
    "sample_cases": [
      {"args": ["hello"], "expected": "olleh"},
      {"args": ["Internship Route"], "expected": "etuoR pihsnretnI"},
    ],
    "hidden_cases": [
      {"args": ["a"], "expected": "a"},
      {"args": ["12345"], "expected": "54321"},
      {"args": ["racecar"], "expected": "racecar"},
    ],
    "cpu_time_limit": 2.0,
  },
  "fizzbuzz_logic": {
    "function_name": "fizzbuzz_logic",
    "parameters": [
      {"name": "n", "type": "int"},
    ],
    "return_type": "string",
    "sample_cases": [
      {"args": [5], "expected": "1 2 Fizz 4 Buzz"},
      {"args": [15], "expected": "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz"},
    ],
    "hidden_cases": [
      {"args": [1], "expected": "1"},
      {"args": [16], "expected": "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16"},
      {
        "args": [30],
        "expected": (
          "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz "
          "16 17 Fizz 19 Buzz Fizz 22 23 Fizz Buzz 26 Fizz 28 29 FizzBuzz"
        ),
      },
    ],
    "cpu_time_limit": 2.0,
  },
  "list_filtering": {
    "function_name": "list_filtering",
    "parameters": [
      {"name": "nums", "type": "int_list"},
    ],
    "return_type": "string",
    "sample_cases": [
      {"args": [[1, 2, 3, 4, 5, 6]], "expected": "2 4 6"},
      {"args": [[1, 3, 5, 7, 9]], "expected": "NONE"},
    ],
    "hidden_cases": [
      {"args": [[-2, -1, 0, 3]], "expected": "-2 0"},
      {"args": [[8]], "expected": "8"},
      {"args": [[11, 13, 15]], "expected": "NONE"},
    ],
    "cpu_time_limit": 2.0,
  },
  "dictionary_basics": {
    "function_name": "dictionary_basics",
    "parameters": [
      {"name": "words", "type": "string_list"},
    ],
    "return_type": "string",
    "sample_cases": [
      {"args": [["apple", "banana", "apple", "orange", "banana", "apple", "grape"]], "expected": "apple 3"},
      {"args": [["cat", "dog", "dog", "cat", "ant", "ant"]], "expected": "ant 2"},
    ],
    "hidden_cases": [
      {"args": [["go", "go", "rust", "rust", "rust"]], "expected": "rust 3"},
      {"args": [["x", "y", "z", "w"]], "expected": "w 1"},
      {"args": [["a", "a", "b", "b", "c", "c", "c", "a"]], "expected": "a 3"},
    ],
    "cpu_time_limit": 2.0,
  },
  "palindrome_check": {
    "function_name": "palindrome_check",
    "parameters": [
      {"name": "s", "type": "string"},
    ],
    "return_type": "string",
    "sample_cases": [
      {"args": ["racecar"], "expected": "YES"},
      {"args": ["hello"], "expected": "NO"},
    ],
    "hidden_cases": [
      {"args": ["abba"], "expected": "YES"},
      {"args": ["abcba"], "expected": "YES"},
      {"args": ["intern"], "expected": "NO"},
    ],
    "cpu_time_limit": 2.0,
  },
  "sum_of_two": {
    "function_name": "sum_of_two",
    "parameters": [
      {"name": "nums", "type": "int_list"},
      {"name": "target", "type": "int"},
    ],
    "return_type": "string",
    "sample_cases": [
      {"args": [[2, 7, 11, 15, 1], 9], "expected": "YES"},
      {"args": [[1, 2, 3, 4], 20], "expected": "NO"},
    ],
    "hidden_cases": [
      {"args": [[1, 9, 5, 5, 3, 7], 10], "expected": "YES"},
      {"args": [[-2, -1, 0, 4, 10], 1], "expected": "YES"},
      {"args": [[1, 2, 3], 100], "expected": "NO"},
    ],
    "cpu_time_limit": 2.0,
  },
}


def get_challenge_config(challenge_id: str) -> dict[str, Any] | None:
  return CHALLENGE_CONFIGS.get(challenge_id)
