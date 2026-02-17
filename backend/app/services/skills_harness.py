from __future__ import annotations

import json
from typing import Any

RESULT_MARKER = "__IR_RESULT__:"


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
  return_type: str,
  args: list[Any],
  user_source: str,
) -> str:
  prelude, call_args = _call_args_and_prelude(family=family, parameters=parameters, args=args)
  call_expr = _call_expression(family=family, function_name=function_name, call_args=call_args)
  serializer_helpers = _serializer_helpers_for_family(family=family, return_type=return_type)

  if family == "python":
    prelude_block = _indented_block(prelude, indent="  ")
    helper_block = _indented_block(serializer_helpers, indent="")
    return (
      f"{user_source}\n\n"
      "import json\n\n"
      f"{helper_block}"
      "def __internroute_main():\n"
      f"{prelude_block}"
      f"  __result = {call_expr}\n"
      "  __payload = __internroute_to_json(__result)\n"
      f"  print(\"{RESULT_MARKER}\" + __payload, end=\"\")\n\n"
      "if __name__ == \"__main__\":\n"
      "  __internroute_main()\n"
    )

  if family in {"javascript", "typescript"}:
    prelude_block = _indented_block(prelude, indent="    ")
    helper_block = _indented_block(serializer_helpers, indent="")
    return (
      f"{user_source}\n\n"
      f"{helper_block}"
      "(function () {\n"
      f"{prelude_block}"
      f"    const __result = {call_expr};\n"
      "    const __payload = __internroute_to_json(__result);\n"
      f"    process.stdout.write(\"{RESULT_MARKER}\" + __payload);\n"
      "})();\n"
    )

  if family == "java":
    prelude_block = _indented_block(prelude, indent="    ")
    helper_block = _indented_block(serializer_helpers, indent="  ")
    return (
      f"{user_source}\n\n"
      "public class Main {\n"
      f"{helper_block}"
      "  public static void main(String[] args) {\n"
      f"{prelude_block}"
      f"    Object __result = {call_expr};\n"
      "    String __payload = __internroute_to_json(__result);\n"
      f"    System.out.print(\"{RESULT_MARKER}\" + __payload);\n"
      "  }\n"
      "}\n"
    )

  if family == "cpp":
    prelude_block = _indented_block(prelude, indent="  ")
    helper_block = _indented_block(serializer_helpers, indent="")
    return (
      "#include <bits/stdc++.h>\n"
      "using namespace std;\n\n"
      f"{user_source}\n\n"
      f"{helper_block}"
      "int main() {\n"
      "  ios::sync_with_stdio(false);\n"
      "  cin.tie(nullptr);\n"
      f"{prelude_block}"
      f"  auto __result = {call_expr};\n"
      "  string __payload = __internroute_to_json(__result);\n"
      f"  cout << \"{RESULT_MARKER}\" << __payload;\n"
      "  return 0;\n"
      "}\n"
    )

  if family == "csharp":
    prelude_block = _indented_block(prelude, indent="    ")
    helper_block = _indented_block(serializer_helpers, indent="  ")
    return (
      "using System;\n"
      "using System.Collections;\n"
      "using System.Collections.Generic;\n"
      "using System.Globalization;\n"
      "using System.Text;\n\n"
      f"{user_source}\n\n"
      "public class Program {\n"
      f"{helper_block}"
      "  public static void Main() {\n"
      f"{prelude_block}"
      f"    object __result = {call_expr};\n"
      "    string __payload = __internroute_to_json(__result);\n"
      f"    Console.Write(\"{RESULT_MARKER}\" + __payload);\n"
      "  }\n"
      "}\n"
    )

  if family == "go":
    prelude_block = _indented_block(prelude, indent="\t")
    helper_block = _indented_block(serializer_helpers, indent="")
    return (
      "package main\n\n"
      "import (\n"
      "\t\"encoding/json\"\n"
      "\t\"fmt\"\n"
      ")\n\n"
      f"{user_source}\n\n"
      f"{helper_block}"
      "func main() {\n"
      f"{prelude_block}"
      f"\t__result := {call_expr}\n"
      "\t__payload := __internroute_to_json(__result)\n"
      f"\tfmt.Print(\"{RESULT_MARKER}\" + __payload)\n"
      "}\n"
    )

  if family == "rust":
    prelude_block = _indented_block(prelude, indent="    ")
    helper_block = _indented_block(serializer_helpers, indent="")
    return (
      f"{user_source}\n\n"
      f"{helper_block}"
      "fn main() {\n"
      f"{prelude_block}"
      f"    let __result = {call_expr};\n"
      "    let __payload = __internroute_to_json(__result);\n"
      f"    print!(\"{RESULT_MARKER}{{}}\", __payload);\n"
      "}\n"
    )

  if family == "kotlin":
    prelude_block = _indented_block(prelude, indent="")
    helper_block = _indented_block(serializer_helpers, indent="")
    return (
      f"{user_source}\n\n"
      f"{helper_block}"
      "fun main() {\n"
      f"{prelude_block}"
      f"val __result = {call_expr}\n"
      "val __payload = __internroute_to_json(__result)\n"
      f"print(\"{RESULT_MARKER}\" + __payload)\n"
      "}\n"
    )

  if family == "swift":
    prelude_block = _indented_block(prelude, indent="")
    helper_block = _indented_block(serializer_helpers, indent="")
    return (
      "import Foundation\n\n"
      f"{user_source}\n\n"
      f"{helper_block}"
      f"{prelude_block}"
      f"let __result = {call_expr}\n"
      "let __payload = __internroute_to_json(__result)\n"
      f"print(\"{RESULT_MARKER}\" + __payload, terminator: \"\")\n"
    )

  if family == "php":
    prelude_block = _indented_block(prelude, indent="")
    helper_block = _indented_block(serializer_helpers, indent="")
    return (
      "<?php\n"
      f"{user_source}\n\n"
      f"{helper_block}"
      f"{prelude_block}"
      f"$__result = {call_expr};\n"
      "$__payload = __internroute_to_json($__result);\n"
      f"echo '{RESULT_MARKER}' . $__payload;\n"
    )

  if family == "ruby":
    prelude_block = _indented_block(prelude, indent="")
    helper_block = _indented_block(serializer_helpers, indent="")
    return (
      f"{user_source}\n\n"
      f"{helper_block}"
      f"{prelude_block}"
      f"__result = {call_expr}\n"
      "__payload = __internroute_to_json(__result)\n"
      f"print(\"{RESULT_MARKER}\" + __payload)\n"
    )

  if family == "c":
    prelude_block = _indented_block(prelude, indent="  ")
    c_return_type = _c_return_type_for_challenge(return_type)
    helper_block = _indented_block(serializer_helpers, indent="")
    if return_type == "string":
      c_emit = "__internroute_emit_result_string(__result);"
    elif return_type == "int":
      c_emit = "__internroute_emit_result_int(__result);"
    elif return_type == "float":
      c_emit = "__internroute_emit_result_float(__result);"
    else:
      raise ValueError(f"Unsupported return type for C challenge: {return_type}")
    return (
      "#include <stdio.h>\n"
      "#include <string.h>\n"
      "#include <stdlib.h>\n\n"
      f"{user_source}\n\n"
      f"{helper_block}"
      "int main(void) {\n"
      f"{prelude_block}"
      f"  {c_return_type} __result = {call_expr};\n"
      f"  {c_emit}\n"
      "  return 0;\n"
      "}\n"
    )

  raise ValueError(f"Unsupported language family: {family}")


def _serializer_helpers_for_family(*, family: str, return_type: str) -> list[str]:
  if family == "python":
    return [
      "def __internroute_to_json(value):",
      "  return json.dumps(value, ensure_ascii=False, separators=(\",\", \":\"))",
      "",
    ]

  if family in {"javascript", "typescript"}:
    return [
      "function __internroute_to_json(value) {",
      "  const seen = new WeakSet();",
      "  const normalize = (node) => {",
      "    if (node === null || node === undefined) return null;",
      "    if (typeof node === \"number\" && !Number.isFinite(node)) return null;",
      "    if (Array.isArray(node)) return node.map((item) => normalize(item));",
      "    if (typeof node === \"object\") {",
      "      if (seen.has(node)) return null;",
      "      seen.add(node);",
      "      const out = {};",
      "      for (const key of Object.keys(node)) out[key] = normalize(node[key]);",
      "      return out;",
      "    }",
      "    return node;",
      "  };",
      "  const encoded = JSON.stringify(normalize(value));",
      "  return encoded === undefined ? \"null\" : encoded;",
      "}",
      "",
    ]

  if family == "java":
    return [
      'private static String __internroute_escape(String value) {',
      '  return value.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\n", "\\\\n").replace("\\r", "\\\\r").replace("\\t", "\\\\t");',
      '}',
      '',
      'private static String __internroute_to_json(Object value) {',
      '  if (value == null) return "null";',
      '  if (value instanceof String) return "\\"" + __internroute_escape((String) value) + "\\"";',
      '  if (value instanceof Number || value instanceof Boolean) return String.valueOf(value);',
      '  if (value instanceof Iterable) {',
      '    StringBuilder builder = new StringBuilder();',
      '    builder.append("[");',
      '    boolean first = true;',
      '    for (Object item : (Iterable<?>) value) {',
      '      if (!first) builder.append(",");',
      '      first = false;',
      '      builder.append(__internroute_to_json(item));',
      '    }',
      '    builder.append("]");',
      '    return builder.toString();',
      '  }',
      '  if (value.getClass().isArray()) {',
      '    StringBuilder builder = new StringBuilder();',
      '    builder.append("[");',
      '    int length = java.lang.reflect.Array.getLength(value);',
      '    for (int i = 0; i < length; i++) {',
      '      if (i > 0) builder.append(",");',
      '      builder.append(__internroute_to_json(java.lang.reflect.Array.get(value, i)));',
      '    }',
      '    builder.append("]");',
      '    return builder.toString();',
      '  }',
      '  return "\\"" + __internroute_escape(String.valueOf(value)) + "\\"";',
      '}',
      '',
    ]

  if family == "cpp":
    return [
      "static string __internroute_escape(const string &value) {",
      "  string out;",
      "  out.reserve(value.size());",
      "  for (char c : value) {",
      "    if (c == '\\\\') out += \"\\\\\\\\\";",
      "    else if (c == '\\\"') out += \"\\\\\\\\\\\\\\\"\";",
      "    else if (c == '\\n') out += \"\\\\n\";",
      "    else if (c == '\\r') out += \"\\\\r\";",
      "    else if (c == '\\t') out += \"\\\\t\";",
      "    else out.push_back(c);",
      "  }",
      "  return out;",
      "}",
      "",
      "static string __internroute_to_json(const string &value) { return \"\\\"\" + __internroute_escape(value) + \"\\\"\"; }",
      "static string __internroute_to_json(const char *value) { return value == nullptr ? string(\"null\") : __internroute_to_json(string(value)); }",
      "static string __internroute_to_json(bool value) { return value ? \"true\" : \"false\"; }",
      "",
      "template <typename T, typename enable_if<is_integral<T>::value && !is_same<T, bool>::value, int>::type = 0>",
      "static string __internroute_to_json(T value) { return to_string(value); }",
      "",
      "template <typename T, typename enable_if<is_floating_point<T>::value, int>::type = 0>",
      "static string __internroute_to_json(T value) {",
      "  if (!isfinite(value)) return \"null\";",
      "  ostringstream stream;",
      "  stream << setprecision(15) << value;",
      "  return stream.str();",
      "}",
      "",
      "template <typename T>",
      "static string __internroute_to_json(const vector<T> &items) {",
      "  string out = \"[\";",
      "  for (size_t i = 0; i < items.size(); i++) {",
      "    if (i > 0) out += \",\";",
      "    out += __internroute_to_json(items[i]);",
      "  }",
      "  out += \"]\";",
      "  return out;",
      "}",
      "",
    ]

  if family == "csharp":
    return [
      "  private static string __internroute_escape(string value) {",
      "    return value.Replace(\"\\\\\", \"\\\\\\\\\").Replace(\"\\\"\", \"\\\\\\\"\").Replace(\"\\n\", \"\\\\n\").Replace(\"\\r\", \"\\\\r\").Replace(\"\\t\", \"\\\\t\");",
      "  }",
      "",
      "  private static string __internroute_to_json(object value) {",
      "    if (value == null) return \"null\";",
      "    if (value is string str) return \"\\\"\" + __internroute_escape(str) + \"\\\"\";",
      "    if (value is bool flag) return flag ? \"true\" : \"false\";",
      "    if (value is float || value is double || value is decimal) return Convert.ToString(value, CultureInfo.InvariantCulture) ?? \"null\";",
      "    if (value is IFormattable formattable) return formattable.ToString(null, CultureInfo.InvariantCulture);",
      "    if (value is IEnumerable enumerable) {",
      "      var builder = new StringBuilder();",
      "      builder.Append(\"[\");",
      "      var first = true;",
      "      foreach (var item in enumerable) {",
      "        if (!first) builder.Append(\",\");",
      "        first = false;",
      "        builder.Append(__internroute_to_json(item));",
      "      }",
      "      builder.Append(\"]\");",
      "      return builder.ToString();",
      "    }",
      "    return \"\\\"\" + __internroute_escape(value.ToString() ?? \"\") + \"\\\"\";",
      "  }",
      "",
    ]

  if family == "go":
    return [
      "func __internroute_to_json(value interface{}) string {",
      "\tpayload, err := json.Marshal(value)",
      "\tif err != nil {",
      "\t\treturn \"null\"",
      "\t}",
      "\treturn string(payload)",
      "}",
      "",
    ]

  if family == "rust":
    return _rust_serializer_block(return_type)

  if family == "kotlin":
    return [
      'fun __internroute_escape(value: String): String {',
      '    return value.replace("\\\\", "\\\\\\\\")',
      '        .replace("\\"", "\\\\\\"")',
      '        .replace("\\n", "\\\\n")',
      '        .replace("\\r", "\\\\r")',
      '        .replace("\\t", "\\\\t")',
      '}',
      '',
      'fun __internroute_to_json(value: Any?): String {',
      '    return when (value) {',
      '        null -> "null"',
      '        is String -> "\\"${__internroute_escape(value)}\\""',
      '        is Boolean -> value.toString()',
      '        is Byte, is Short, is Int, is Long -> value.toString()',
      '        is Float -> if (value.isFinite()) value.toString() else "null"',
      '        is Double -> if (value.isFinite()) value.toString() else "null"',
      '        is Iterable<*> -> value.joinToString(prefix = "[", postfix = "]") { item -> __internroute_to_json(item) }',
      '        is Array<*> -> value.joinToString(prefix = "[", postfix = "]") { item -> __internroute_to_json(item) }',
      '        else -> "\\"${__internroute_escape(value.toString())}\\""',
      '    }',
      '}',
      '',
    ]

  if family == "swift":
    return [
      'func __internroute_escape(_ value: String) -> String {',
      '    return value',
      '        .replacingOccurrences(of: "\\\\", with: "\\\\\\\\")',
      '        .replacingOccurrences(of: "\\"", with: "\\\\\\"")',
      '        .replacingOccurrences(of: "\\n", with: "\\\\n")',
      '        .replacingOccurrences(of: "\\r", with: "\\\\r")',
      '        .replacingOccurrences(of: "\\t", with: "\\\\t")',
      '}',
      '',
      'func __internroute_to_json(_ value: Any?) -> String {',
      '    guard let value = value else { return "null" }',
      '    if let text = value as? String { return "\\"" + __internroute_escape(text) + "\\"" }',
      '    if let boolValue = value as? Bool { return boolValue ? "true" : "false" }',
      '    if let intValue = value as? Int { return String(intValue) }',
      '    if let doubleValue = value as? Double { return doubleValue.isFinite ? String(doubleValue) : "null" }',
      '    if let floatValue = value as? Float { return floatValue.isFinite ? String(floatValue) : "null" }',
      '    if let listValue = value as? [Any] {',
      '        return "[" + listValue.map { __internroute_to_json($0) }.joined(separator: ",") + "]"',
      '    }',
      '    if let strings = value as? [String] {',
      '        return "[" + strings.map { __internroute_to_json($0) }.joined(separator: ",") + "]"',
      '    }',
      '    if let ints = value as? [Int] {',
      '        return "[" + ints.map { __internroute_to_json($0) }.joined(separator: ",") + "]"',
      '    }',
      '    if let groups = value as? [[String]] {',
      '        return "[" + groups.map { __internroute_to_json($0) }.joined(separator: ",") + "]"',
      '    }',
      '    return "\\"" + __internroute_escape(String(describing: value)) + "\\""',
      '}',
      '',
    ]

  if family == "php":
    return [
      "function __internroute_to_json($value): string {",
      "  $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);",
      "  return $encoded === false ? \"null\" : $encoded;",
      "}",
      "",
    ]

  if family == "ruby":
    return [
      "require \"json\"",
      "",
      "def __internroute_to_json(value)",
      "  JSON.generate(value)",
      "end",
      "",
    ]

  if family == "c":
    return _c_serializer_block(return_type)

  raise ValueError(f"Unsupported language family: {family}")


def _rust_serializer_block(return_type: str) -> list[str]:
  base = [
    "fn __internroute_escape(value: &str) -> String {",
    "    value.replace(\"\\\\\", \"\\\\\\\\\").replace(\"\\\"\", \"\\\\\\\"\").replace(\"\\n\", \"\\\\n\").replace(\"\\r\", \"\\\\r\").replace(\"\\t\", \"\\\\t\")",
    "}",
    "",
  ]

  if return_type == "string":
    return base + [
      "fn __internroute_to_json(value: String) -> String {",
      "    format!(\"\\\"{}\\\"\", __internroute_escape(&value))",
      "}",
      "",
    ]

  if return_type == "int":
    return base + [
      "fn __internroute_to_json(value: i32) -> String {",
      "    format!(\"{}\", value)",
      "}",
      "",
    ]

  if return_type == "float":
    return base + [
      "fn __internroute_to_json(value: f64) -> String {",
      "    if value.is_finite() { format!(\"{}\", value) } else { String::from(\"null\") }",
      "}",
      "",
    ]

  if return_type == "string_list":
    return base + [
      "fn __internroute_to_json(value: Vec<String>) -> String {",
      "    let items: Vec<String> = value.into_iter().map(|item| format!(\"\\\"{}\\\"\", __internroute_escape(&item))).collect();",
      "    format!(\"[{}]\", items.join(\",\"))",
      "}",
      "",
    ]

  if return_type == "int_list":
    return base + [
      "fn __internroute_to_json(value: Vec<i32>) -> String {",
      "    let items: Vec<String> = value.into_iter().map(|item| format!(\"{}\", item)).collect();",
      "    format!(\"[{}]\", items.join(\",\"))",
      "}",
      "",
    ]

  if return_type == "string_list_list":
    return base + [
      "fn __internroute_to_json(value: Vec<Vec<String>>) -> String {",
      "    let groups: Vec<String> = value.into_iter().map(|group| {",
      "        let items: Vec<String> = group.into_iter().map(|item| format!(\"\\\"{}\\\"\", __internroute_escape(&item))).collect();",
      "        format!(\"[{}]\", items.join(\",\"))",
      "    }).collect();",
      "    format!(\"[{}]\", groups.join(\",\"))",
      "}",
      "",
    ]

  raise ValueError(f"Unsupported return type for rust serializer: {return_type}")


def _c_serializer_block(return_type: str) -> list[str]:
  if return_type == "string":
    return [
      f"static const char *__internroute_marker = \"{RESULT_MARKER}\";",
      "",
      "static void __internroute_emit_result_string(const char *value) {",
      "  const char *next = value == NULL ? \"\" : value;",
      "  printf(\"%s\\\"\", __internroute_marker);",
      "  while (*next) {",
      "    if (*next == '\\\\') printf(\"\\\\\\\\\");",
      "    else if (*next == '\\\"') printf(\"\\\\\\\\\\\\\\\"\");",
      "    else if (*next == '\\n') printf(\"\\\\n\");",
      "    else if (*next == '\\r') printf(\"\\\\r\");",
      "    else if (*next == '\\t') printf(\"\\\\t\");",
      "    else putchar(*next);",
      "    next++;",
      "  }",
      "  printf(\"\\\"\");",
      "}",
      "",
    ]

  if return_type == "int":
    return [
      f"static const char *__internroute_marker = \"{RESULT_MARKER}\";",
      "",
      "static void __internroute_emit_result_int(int value) {",
      "  printf(\"%s%d\", __internroute_marker, value);",
      "}",
      "",
    ]

  if return_type == "float":
    return [
      f"static const char *__internroute_marker = \"{RESULT_MARKER}\";",
      "",
      "static void __internroute_emit_result_float(double value) {",
      "  printf(\"%s%.15g\", __internroute_marker, value);",
      "}",
      "",
    ]

  raise ValueError(f"Unsupported return type for C serializer: {return_type}")


def _c_return_type_for_challenge(return_type: str) -> str:
  if return_type == "string":
    return "const char *"
  if return_type == "int":
    return "int"
  if return_type == "float":
    return "double"
  raise ValueError(f"Unsupported return type for C challenge: {return_type}")


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
