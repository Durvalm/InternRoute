from __future__ import annotations

from typing import Any


CHALLENGE_TASK_TITLES: dict[str, str] = {
  "string_reversal": "Coding Challenge #1: String Reversal",
  "fizzbuzz_logic": "Coding Challenge #2: FizzBuzz Logic",
  "list_filtering": "Coding Challenge #3: List Filtering",
  "dictionary_basics": "Coding Challenge #4: Dictionary Basics",
  "palindrome_check": "Coding Challenge #5: Palindrome Check",
  "sum_of_two": "Coding Challenge #6: Sum of Two",
}


CHALLENGE_CONFIGS: dict[str, dict[str, Any]] = {
  "string_reversal": {
    "sample_tests": [
      {"input": "hello\n", "expected_output": "olleh"},
      {"input": "Internship Route\n", "expected_output": "etuoR pihsnretnI"},
    ],
    "hidden_tests": [
      {"input": "a\n", "expected_output": "a"},
      {"input": "12345\n", "expected_output": "54321"},
      {"input": "racecar\n", "expected_output": "racecar"},
    ],
    "cpu_time_limit": 2.0,
  },
  "fizzbuzz_logic": {
    "sample_tests": [
      {"input": "5\n", "expected_output": "1 2 Fizz 4 Buzz"},
      {"input": "15\n", "expected_output": "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz"},
    ],
    "hidden_tests": [
      {"input": "1\n", "expected_output": "1"},
      {"input": "16\n", "expected_output": "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz 16"},
      {
        "input": "30\n",
        "expected_output": (
          "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz "
          "16 17 Fizz 19 Buzz Fizz 22 23 Fizz Buzz 26 Fizz 28 29 FizzBuzz"
        ),
      },
    ],
    "cpu_time_limit": 2.0,
  },
  "list_filtering": {
    "sample_tests": [
      {"input": "6\n1 2 3 4 5 6\n", "expected_output": "2 4 6"},
      {"input": "5\n1 3 5 7 9\n", "expected_output": "NONE"},
    ],
    "hidden_tests": [
      {"input": "4\n-2 -1 0 3\n", "expected_output": "-2 0"},
      {"input": "1\n8\n", "expected_output": "8"},
      {"input": "3\n11 13 15\n", "expected_output": "NONE"},
    ],
    "cpu_time_limit": 2.0,
  },
  "dictionary_basics": {
    "sample_tests": [
      {"input": "7\napple banana apple orange banana apple grape\n", "expected_output": "apple 3"},
      {"input": "6\ncat dog dog cat ant ant\n", "expected_output": "ant 2"},
    ],
    "hidden_tests": [
      {"input": "5\ngo go rust rust rust\n", "expected_output": "rust 3"},
      {"input": "4\nx y z w\n", "expected_output": "w 1"},
      {"input": "8\na a b b c c c a\n", "expected_output": "a 3"},
    ],
    "cpu_time_limit": 2.0,
  },
  "palindrome_check": {
    "sample_tests": [
      {"input": "racecar\n", "expected_output": "YES"},
      {"input": "hello\n", "expected_output": "NO"},
    ],
    "hidden_tests": [
      {"input": "abba\n", "expected_output": "YES"},
      {"input": "abcba\n", "expected_output": "YES"},
      {"input": "intern\n", "expected_output": "NO"},
    ],
    "cpu_time_limit": 2.0,
  },
  "sum_of_two": {
    "sample_tests": [
      {"input": "5 9\n2 7 11 15 1\n", "expected_output": "YES"},
      {"input": "4 20\n1 2 3 4\n", "expected_output": "NO"},
    ],
    "hidden_tests": [
      {"input": "6 10\n1 9 5 5 3 7\n", "expected_output": "YES"},
      {"input": "5 1\n-2 -1 0 4 10\n", "expected_output": "YES"},
      {"input": "3 100\n1 2 3\n", "expected_output": "NO"},
    ],
    "cpu_time_limit": 2.0,
  },
}


def get_challenge_config(challenge_id: str) -> dict[str, Any] | None:
  return CHALLENGE_CONFIGS.get(challenge_id)

