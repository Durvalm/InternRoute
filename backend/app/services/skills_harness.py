from __future__ import annotations

import json
from typing import Any


def format_case_preview(parameters: list[dict[str, str]], args: list[Any]) -> str:
  parts: list[str] = []
  for param, value in zip(parameters, args):
    name = str(param.get("name") or "arg")
    parts.append(f"{name} = {json.dumps(value, ensure_ascii=False)}")
  return ", ".join(parts)


def build_harness_source(
  *,
  family: str,
  function_name: str,
  parameters: list[dict[str, str]],
  args: list[Any],
  user_source: str,
) -> str:
  prelude, call_args = _call_args_and_prelude(family=family, parameters=parameters, args=args)
  call_expr = _call_expression(family=family, function_name=function_name, call_args=call_args)

  if family == "python":
    prelude_block = _indented_block(prelude, indent="    ")
    return (
      f"{user_source}\n\n"
      "def __internroute_main():\n"
      f"{prelude_block}"
      f"    __result = {call_expr}\n"
      "    if __result is None:\n"
      "        __result = \"\"\n"
      "    print(str(__result), end=\"\")\n\n"
      "if __name__ == \"__main__\":\n"
      "    __internroute_main()\n"
    )

  if family in {"javascript", "typescript"}:
    prelude_block = _indented_block(prelude, indent="  ")
    return (
      f"{user_source}\n\n"
      "(function () {\n"
      f"{prelude_block}"
      f"  const __result = {call_expr};\n"
      "  process.stdout.write(String(__result ?? \"\"));\n"
      "})();\n"
    )

  if family == "java":
    prelude_block = _indented_block(prelude, indent="    ")
    return (
      f"{user_source}\n\n"
      "public class Main {\n"
      "  public static void main(String[] args) {\n"
      f"{prelude_block}"
      f"    Object __result = {call_expr};\n"
      "    System.out.print(__result == null ? \"\" : __result.toString());\n"
      "  }\n"
      "}\n"
    )

  if family == "cpp":
    prelude_block = _indented_block(prelude, indent="  ")
    return (
      "#include <bits/stdc++.h>\n"
      "using namespace std;\n\n"
      f"{user_source}\n\n"
      "int main() {\n"
      "  ios::sync_with_stdio(false);\n"
      "  cin.tie(nullptr);\n"
      f"{prelude_block}"
      f"  auto __result = {call_expr};\n"
      "  cout << __result;\n"
      "  return 0;\n"
      "}\n"
    )

  if family == "csharp":
    prelude_block = _indented_block(prelude, indent="    ")
    return (
      "using System;\n"
      "using System.Collections.Generic;\n\n"
      f"{user_source}\n\n"
      "public class Program {\n"
      "  public static void Main() {\n"
      f"{prelude_block}"
      f"    object __result = {call_expr};\n"
      "    Console.Write(__result == null ? \"\" : __result.ToString());\n"
      "  }\n"
      "}\n"
    )

  if family == "go":
    prelude_block = _indented_block(prelude, indent="\t")
    return (
      "package main\n\n"
      "import (\n"
      "\t\"fmt\"\n"
      ")\n\n"
      f"{user_source}\n\n"
      "func main() {\n"
      f"{prelude_block}"
      f"\t__result := {call_expr}\n"
      "\tfmt.Print(__result)\n"
      "}\n"
    )

  if family == "rust":
    prelude_block = _indented_block(prelude, indent="    ")
    return (
      f"{user_source}\n\n"
      "fn main() {\n"
      f"{prelude_block}"
      f"    let __result = {call_expr};\n"
      "    print!(\"{}\", __result);\n"
      "}\n"
    )

  if family == "kotlin":
    prelude_block = _indented_block(prelude, indent="    ")
    return (
      f"{user_source}\n\n"
      "fun main() {\n"
      f"{prelude_block}"
      f"    val __result = {call_expr}\n"
      "    print(__result.toString())\n"
      "}\n"
    )

  if family == "swift":
    prelude_block = _indented_block(prelude, indent="")
    return (
      "import Foundation\n\n"
      f"{user_source}\n\n"
      f"{prelude_block}"
      f"let __result = {call_expr}\n"
      "print(__result, terminator: \"\")\n"
    )

  if family == "php":
    prelude_block = _indented_block(prelude, indent="")
    return (
      "<?php\n"
      f"{user_source}\n\n"
      f"{prelude_block}"
      f"$__result = {call_expr};\n"
      "echo strval($__result);\n"
    )

  if family == "ruby":
    prelude_block = _indented_block(prelude, indent="")
    return (
      f"{user_source}\n\n"
      f"{prelude_block}"
      f"__result = {call_expr}\n"
      "print(__result.to_s)\n"
    )

  if family == "c":
    prelude_block = _indented_block(prelude, indent="  ")
    return (
      "#include <stdio.h>\n"
      "#include <string.h>\n"
      "#include <stdlib.h>\n\n"
      f"{user_source}\n\n"
      "int main(void) {\n"
      f"{prelude_block}"
      f"  const char *__result = {call_expr};\n"
      "  if (__result != NULL) {\n"
      "    printf(\"%s\", __result);\n"
      "  }\n"
      "  return 0;\n"
      "}\n"
    )

  raise ValueError(f"Unsupported language family: {family}")


def _call_expression(*, family: str, function_name: str, call_args: list[str]) -> str:
  joined_args = ", ".join(call_args)
  if family in {"java", "csharp", "kotlin"}:
    return f"Solution.{function_name}({joined_args})"
  return f"{function_name}({joined_args})"


def _call_args_and_prelude(
  *,
  family: str,
  parameters: list[dict[str, str]],
  args: list[Any],
) -> tuple[list[str], list[str]]:
  prelude: list[str] = []
  call_args: list[str] = []

  for index, (param, value) in enumerate(zip(parameters, args)):
    param_type = str(param.get("type") or "")

    if family == "c":
      arg_name = f"__arg_{index}"
      if param_type == "int_list":
        if not isinstance(value, list):
          raise ValueError("Expected int_list argument.")
        elements = ", ".join(str(int(v)) for v in value)
        prelude.append(f"int {arg_name}[] = {{{elements}}};")
        call_args.extend([arg_name, str(len(value))])
        continue
      if param_type == "string_list":
        if not isinstance(value, list):
          raise ValueError("Expected string_list argument.")
        elements = ", ".join(_c_string_literal(str(v)) for v in value)
        prelude.append(f"char *{arg_name}[] = {{{elements}}};")
        call_args.extend([arg_name, str(len(value))])
        continue

    call_args.append(_literal_for_family(family=family, param_type=param_type, value=value))

  return prelude, call_args


def _literal_for_family(*, family: str, param_type: str, value: Any) -> str:
  if family == "python":
    return _python_literal(param_type, value)
  if family in {"javascript", "typescript"}:
    return _js_literal(param_type, value)
  if family == "java":
    return _java_literal(param_type, value)
  if family == "cpp":
    return _cpp_literal(param_type, value)
  if family == "csharp":
    return _csharp_literal(param_type, value)
  if family == "go":
    return _go_literal(param_type, value)
  if family == "rust":
    return _rust_literal(param_type, value)
  if family == "kotlin":
    return _kotlin_literal(param_type, value)
  if family == "swift":
    return _swift_literal(param_type, value)
  if family == "php":
    return _php_literal(param_type, value)
  if family == "ruby":
    return _ruby_literal(param_type, value)
  if family == "c":
    if param_type == "string":
      return _c_string_literal(str(value))
    if param_type == "int":
      return str(int(value))
    raise ValueError(f"Unsupported C parameter type for direct literal: {param_type}")
  raise ValueError(f"Unsupported language family: {family}")


def _python_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  return json.dumps(value, ensure_ascii=False)


def _js_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  return json.dumps(value, ensure_ascii=False)


def _java_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  if param_type == "string":
    return _java_string_literal(str(value))
  if param_type == "int":
    return str(int(value))
  if param_type == "int_list":
    assert isinstance(value, list)
    return "new int[]{" + ", ".join(str(int(v)) for v in value) + "}"
  if param_type == "string_list":
    assert isinstance(value, list)
    return "new String[]{" + ", ".join(_java_string_literal(str(v)) for v in value) + "}"
  raise ValueError(f"Unsupported parameter type: {param_type}")


def _cpp_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  if param_type == "string":
    return _cpp_string_literal(str(value))
  if param_type == "int":
    return str(int(value))
  if param_type == "int_list":
    assert isinstance(value, list)
    return "std::vector<int>{" + ", ".join(str(int(v)) for v in value) + "}"
  if param_type == "string_list":
    assert isinstance(value, list)
    return "std::vector<std::string>{" + ", ".join(_cpp_string_literal(str(v)) for v in value) + "}"
  raise ValueError(f"Unsupported parameter type: {param_type}")


def _csharp_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  if param_type == "string":
    return _csharp_string_literal(str(value))
  if param_type == "int":
    return str(int(value))
  if param_type == "int_list":
    assert isinstance(value, list)
    return "new List<int>{" + ", ".join(str(int(v)) for v in value) + "}"
  if param_type == "string_list":
    assert isinstance(value, list)
    return "new List<string>{" + ", ".join(_csharp_string_literal(str(v)) for v in value) + "}"
  raise ValueError(f"Unsupported parameter type: {param_type}")


def _go_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  if param_type == "string":
    return _go_string_literal(str(value))
  if param_type == "int":
    return str(int(value))
  if param_type == "int_list":
    assert isinstance(value, list)
    return "[]int{" + ", ".join(str(int(v)) for v in value) + "}"
  if param_type == "string_list":
    assert isinstance(value, list)
    return "[]string{" + ", ".join(_go_string_literal(str(v)) for v in value) + "}"
  raise ValueError(f"Unsupported parameter type: {param_type}")


def _rust_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  if param_type == "string":
    return f"String::from({_rust_string_literal(str(value))})"
  if param_type == "int":
    return str(int(value))
  if param_type == "int_list":
    assert isinstance(value, list)
    return "vec![" + ", ".join(str(int(v)) for v in value) + "]"
  if param_type == "string_list":
    assert isinstance(value, list)
    return "vec![" + ", ".join(f"String::from({_rust_string_literal(str(v))})" for v in value) + "]"
  raise ValueError(f"Unsupported parameter type: {param_type}")


def _kotlin_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  if param_type == "string":
    return _kotlin_string_literal(str(value))
  if param_type == "int":
    return str(int(value))
  if param_type == "int_list":
    assert isinstance(value, list)
    return "intArrayOf(" + ", ".join(str(int(v)) for v in value) + ")"
  if param_type == "string_list":
    assert isinstance(value, list)
    return "listOf(" + ", ".join(_kotlin_string_literal(str(v)) for v in value) + ")"
  raise ValueError(f"Unsupported parameter type: {param_type}")


def _swift_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  if param_type == "string":
    return _swift_string_literal(str(value))
  if param_type == "int":
    return str(int(value))
  if param_type == "int_list":
    assert isinstance(value, list)
    return "[" + ", ".join(str(int(v)) for v in value) + "]"
  if param_type == "string_list":
    assert isinstance(value, list)
    return "[" + ", ".join(_swift_string_literal(str(v)) for v in value) + "]"
  raise ValueError(f"Unsupported parameter type: {param_type}")


def _php_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  if param_type == "string":
    return _php_string_literal(str(value))
  if param_type == "int":
    return str(int(value))
  if param_type == "int_list":
    assert isinstance(value, list)
    return "[" + ", ".join(str(int(v)) for v in value) + "]"
  if param_type == "string_list":
    assert isinstance(value, list)
    return "[" + ", ".join(_php_string_literal(str(v)) for v in value) + "]"
  raise ValueError(f"Unsupported parameter type: {param_type}")


def _ruby_literal(param_type: str, value: Any) -> str:
  _validate_param_value(param_type, value)
  if param_type == "string":
    return _ruby_string_literal(str(value))
  if param_type == "int":
    return str(int(value))
  if param_type == "int_list":
    assert isinstance(value, list)
    return "[" + ", ".join(str(int(v)) for v in value) + "]"
  if param_type == "string_list":
    assert isinstance(value, list)
    return "[" + ", ".join(_ruby_string_literal(str(v)) for v in value) + "]"
  raise ValueError(f"Unsupported parameter type: {param_type}")


def _validate_param_value(param_type: str, value: Any) -> None:
  if param_type == "string" and isinstance(value, str):
    return
  if param_type == "int" and isinstance(value, int):
    return
  if param_type == "int_list" and isinstance(value, list) and all(isinstance(v, int) for v in value):
    return
  if param_type == "string_list" and isinstance(value, list) and all(isinstance(v, str) for v in value):
    return
  raise ValueError(f"Unexpected value for parameter type '{param_type}'.")


def _indented_block(lines: list[str], *, indent: str) -> str:
  if not lines:
    return ""
  return "".join(f"{indent}{line}\n" for line in lines)


def _java_string_literal(value: str) -> str:
  return json.dumps(value, ensure_ascii=False)


def _cpp_string_literal(value: str) -> str:
  return json.dumps(value, ensure_ascii=False)


def _csharp_string_literal(value: str) -> str:
  escaped = value.replace("\\", "\\\\").replace("\"", "\\\"")
  escaped = escaped.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
  return f"\"{escaped}\""


def _go_string_literal(value: str) -> str:
  return json.dumps(value, ensure_ascii=False)


def _rust_string_literal(value: str) -> str:
  return json.dumps(value, ensure_ascii=False)


def _kotlin_string_literal(value: str) -> str:
  escaped = value.replace("\\", "\\\\").replace("\"", "\\\"")
  escaped = escaped.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
  return f"\"{escaped}\""


def _swift_string_literal(value: str) -> str:
  escaped = value.replace("\\", "\\\\").replace("\"", "\\\"")
  escaped = escaped.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
  return f"\"{escaped}\""


def _php_string_literal(value: str) -> str:
  escaped = value.replace("\\", "\\\\").replace("'", "\\'")
  escaped = escaped.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
  return f"'{escaped}'"


def _ruby_string_literal(value: str) -> str:
  escaped = value.replace("\\", "\\\\").replace("\"", "\\\"")
  escaped = escaped.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
  return f"\"{escaped}\""


def _c_string_literal(value: str) -> str:
  escaped = value.replace("\\", "\\\\").replace("\"", "\\\"")
  escaped = escaped.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
  return f"\"{escaped}\""
