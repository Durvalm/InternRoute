"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Play
} from "lucide-react";
import { apiRequest } from "@/lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ChallengeExample = {
  input: string;
  output: string;
  explanation?: string;
};

type ChallengeParamType = "string" | "int" | "int_list" | "string_list";
type ChallengeReturnType = "string" | "int" | "float" | "string_list" | "int_list" | "string_list_list";
type LanguageFamily = "python" | "javascript" | "typescript" | "java" | "cpp" | "csharp" | "go" | "rust" | "kotlin" | "swift" | "php" | "ruby" | "c";

type ChallengeParameter = {
  name: string;
  type: ChallengeParamType;
};

type ChallengeUI = {
  id: string;
  order: number;
  title: string;
  description: string;
  functionName: string;
  parameters: ChallengeParameter[];
  returnType: ChallengeReturnType;
  examples: ChallengeExample[];
  whatToReturn: string;
  supportedFamilies: LanguageFamily[];
};

type ChallengeContract = {
  id: string;
  order: number;
  function_name: string;
  parameters: ChallengeParameter[];
  return_type: ChallengeReturnType;
  supported_families: LanguageFamily[];
};

type LanguageOption = {
  id: number;
  name: string;
  family?: string;
  display_name?: string;
};

type CodingTasksResponse = {
  challenge_completion: Record<string, boolean>;
};

type LanguagesResponse = {
  languages: LanguageOption[];
};

type ChallengeContractsResponse = {
  challenges: ChallengeContract[];
};

type RunResponse = {
  status: string;
  sample_results: Array<{
    passed: boolean;
    input_preview: string;
    expected_preview: string;
    actual_preview: string;
    status: string;
  }>;
  compile_output: string;
  stderr: string;
  time_ms: number | null;
  memory_kb: number | null;
};

type SubmitResponse = {
  status: string;
  passed_all_hidden: boolean;
  hidden_pass_count: number;
  hidden_total: number;
  task_completed: boolean;
  completion_blocked_reason?: string | null;
  compile_output: string;
  stderr: string;
  time_ms: number | null;
  memory_kb: number | null;
};

const CHALLENGE_FALLBACKS: ChallengeUI[] = [
  {
    id: "clean_username",
    order: 1,
    title: "Clean Username",
    description: "Remove leading/trailing spaces, lowercase the text, then replace spaces with underscores.",
    functionName: "clean_username",
    parameters: [{ name: "s", type: "string" }],
    returnType: "string",
    examples: [{ input: "s = \"  John Doe  \"", output: "\"john_doe\"" }],
    whatToReturn: "Return the cleaned username string.",
    supportedFamilies: ["python", "javascript", "typescript", "java", "cpp", "csharp", "go", "rust", "kotlin", "swift", "php", "ruby", "c"]
  },
  {
    id: "word_counter",
    order: 2,
    title: "Word Counter",
    description: "Count how many times each word appears in the input list.",
    functionName: "word_counter",
    parameters: [{ name: "words", type: "string_list" }],
    returnType: "string_list",
    examples: [{ input: "words = [\"python\", \"python\", \"sql\", \"api\", \"sql\"]", output: "[\"python:2\", \"sql:2\", \"api:1\"]" }],
    whatToReturn: "Return a list of \"word:count\" strings, in the order each word first appears.",
    supportedFamilies: ["python", "javascript", "typescript", "java", "cpp", "csharp", "go", "rust", "kotlin", "swift", "php", "ruby"]
  },
  {
    id: "summarize_orders",
    order: 3,
    title: "Build Order Summary",
    description: "Given aligned user and amount lists, return each user's order count and total amount.",
    functionName: "summarize_orders",
    parameters: [
      { name: "users", type: "string_list" },
      { name: "amounts", type: "int_list" }
    ],
    examples: [
      {
        input: "users = [\"u1\", \"u2\", \"u1\"], amounts = [10, 5, 7]",
        output: "[\"u1:count=2,total=17\", \"u2:count=1,total=5\"]"
      }
    ],
    returnType: "string_list",
    whatToReturn: "Return one summary string per user in first-appearance order: user:count=<n>,total=<sum>.",
    supportedFamilies: ["python", "javascript", "typescript", "java", "cpp", "csharp", "go", "rust", "kotlin", "swift", "php", "ruby"]
  },
  {
    id: "cart_total",
    order: 4,
    title: "Shopping Cart Total with Coupons",
    description: "Compute subtotal from aligned prices/qty. Apply SAVE10 always; apply SAVE20 only when subtotal is at least 20.",
    functionName: "cart_total",
    parameters: [
      { name: "prices", type: "int_list" },
      { name: "qty", type: "int_list" },
      { name: "coupon", type: "string" }
    ],
    examples: [
      {
        input: "prices = [10, 2], qty = [2, 3], coupon = \"SAVE10\"",
        output: "23.4"
      }
    ],
    returnType: "float",
    whatToReturn: "Return the final numeric total after applying coupon rules. Use coupon=\"NONE\" for no discount.",
    supportedFamilies: ["python", "javascript", "typescript", "java", "cpp", "csharp", "go", "rust", "kotlin", "swift", "php", "ruby", "c"]
  },
  {
    id: "group_anagrams",
    order: 5,
    title: "Group Anagrams",
    description: "Group words that are anagrams of each other.",
    functionName: "group_anagrams",
    parameters: [{ name: "words", type: "string_list" }],
    returnType: "string_list_list",
    examples: [
      {
        input: "words = [\"eat\", \"tea\", \"tan\", \"ate\", \"nat\", \"bat\"]",
        output: "[[\"eat\", \"tea\", \"ate\"], [\"tan\", \"nat\"], [\"bat\"]]"
      }
    ],
    whatToReturn: "Return a list of groups, where each group is a list of anagram words.",
    supportedFamilies: ["python", "javascript", "typescript", "java", "cpp", "csharp", "go", "rust", "kotlin", "swift", "php", "ruby"]
  }
];

type LearningGuideStep = {
  id: string;
  label: string;
};

const LEARNING_GUIDE_STEPS: LearningGuideStep[] = [
  { id: "how-to-learn", label: "How to Learn" },
  { id: "courses", label: "Courses" },
  { id: "why-python", label: "Why Python?" }
];

function titleFromChallengeId(challengeId: string): string {
  return challengeId
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function mergeChallengesWithContracts(contracts: ChallengeContract[]): ChallengeUI[] {
  if (!contracts.length) {
    return CHALLENGE_FALLBACKS;
  }

  const fallbackById = new Map(CHALLENGE_FALLBACKS.map((challenge) => [challenge.id, challenge]));
  const merged = contracts.map((contract) => {
    const fallback = fallbackById.get(contract.id);
    if (!fallback) {
      return {
        id: contract.id,
        order: contract.order,
        title: titleFromChallengeId(contract.id),
        description: "Solve the challenge by implementing the required function.",
        functionName: contract.function_name,
        parameters: contract.parameters,
        returnType: contract.return_type,
        examples: [],
        whatToReturn: "Return the expected value.",
        supportedFamilies: (contract.supported_families || PREFERRED_LANGUAGE_ORDER) as LanguageFamily[]
      } satisfies ChallengeUI;
    }

    return {
      ...fallback,
      order: contract.order,
      functionName: contract.function_name,
      parameters: contract.parameters,
      returnType: contract.return_type,
      supportedFamilies: (contract.supported_families || fallback.supportedFamilies) as LanguageFamily[]
    } satisfies ChallengeUI;
  });

  merged.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return merged;
}

const PREFERRED_LANGUAGE_ORDER = [
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
  "c"
];

function inferFamilyFromName(name: string | undefined): string | undefined {
  const value = (name || "").toLowerCase();
  if (value.includes("typescript")) return "typescript";
  if (value.includes("javascript") || value.includes("node.js")) return "javascript";
  if (value.includes("python")) return "python";
  if (value.includes("c++")) return "cpp";
  if (value.includes("c#") || value.includes("c-sharp")) return "csharp";
  if (value.startsWith("c ") || value.startsWith("c(") || value.startsWith("c (")) return "c";
  if (
    value === "go"
    || value.startsWith("go ")
    || value.startsWith("go(")
    || value.startsWith("go (")
    || value.includes("golang")
  ) {
    return "go";
  }
  if (value.includes("rust")) return "rust";
  if (value.includes("kotlin")) return "kotlin";
  if (value.includes("swift")) return "swift";
  if (value.includes("php")) return "php";
  if (value.includes("ruby")) return "ruby";
  if (value.startsWith("java") || value.includes(" java")) return "java";
  return undefined;
}

function sortedLanguages(languages: LanguageOption[]): LanguageOption[] {
  const ranked = [...languages];
  ranked.sort((a, b) => {
    const aFamily = a.family || inferFamilyFromName(a.name);
    const bFamily = b.family || inferFamilyFromName(b.name);

    const aRank = aFamily ? PREFERRED_LANGUAGE_ORDER.findIndex((token) => token === aFamily) : -1;
    const bRank = bFamily ? PREFERRED_LANGUAGE_ORDER.findIndex((token) => token === bFamily) : -1;

    if (aRank !== -1 && bRank === -1) return -1;
    if (aRank === -1 && bRank !== -1) return 1;
    if (aRank !== -1 && bRank !== -1 && aRank !== bRank) return aRank - bRank;
    return (a.display_name || a.name).toLowerCase().localeCompare((b.display_name || b.name).toLowerCase());
  });
  return ranked;
}

function getLanguageFamily(language: LanguageOption | null): string | undefined {
  return language?.family || inferFamilyFromName(language?.name);
}

function toMonacoLanguage(family: string | undefined): string {
  if (family === "python") return "python";
  if (family === "typescript") return "typescript";
  if (family === "javascript") return "javascript";
  if (family === "java") return "java";
  if (family === "cpp") return "cpp";
  if (family === "csharp") return "csharp";
  if (family === "kotlin") return "kotlin";
  if (family === "swift") return "swift";
  if (family === "php") return "php";
  if (family === "ruby") return "ruby";
  if (family === "go") return "go";
  if (family === "rust") return "rust";
  if (family === "c") return "c";
  return "plaintext";
}

function parameterTypeForSignature(family: string | undefined, type: ChallengeParamType, name: string): string {
  if (family === "python") {
    if (type === "string") return `${name}: str`;
    if (type === "int") return `${name}: int`;
    if (type === "int_list") return `${name}: list[int]`;
    return `${name}: list[str]`;
  }
  if (family === "javascript" || family === "typescript") {
    const tsType = type === "string"
      ? "string"
      : type === "int"
        ? "number"
        : type === "int_list"
          ? "number[]"
          : "string[]";
    return family === "typescript" ? `${name}: ${tsType}` : name;
  }
  if (family === "java") {
    if (type === "string") return `String ${name}`;
    if (type === "int") return `int ${name}`;
    if (type === "int_list") return `int[] ${name}`;
    return `String[] ${name}`;
  }
  if (family === "cpp") {
    if (type === "string") return `const std::string& ${name}`;
    if (type === "int") return `int ${name}`;
    if (type === "int_list") return `const std::vector<int>& ${name}`;
    return `const std::vector<std::string>& ${name}`;
  }
  if (family === "csharp") {
    if (type === "string") return `string ${name}`;
    if (type === "int") return `int ${name}`;
    if (type === "int_list") return `List<int> ${name}`;
    return `List<string> ${name}`;
  }
  if (family === "go") {
    if (type === "string") return `${name} string`;
    if (type === "int") return `${name} int`;
    if (type === "int_list") return `${name} []int`;
    return `${name} []string`;
  }
  if (family === "rust") {
    if (type === "string") return `${name}: String`;
    if (type === "int") return `${name}: i32`;
    if (type === "int_list") return `${name}: Vec<i32>`;
    return `${name}: Vec<String>`;
  }
  if (family === "kotlin") {
    if (type === "string") return `${name}: String`;
    if (type === "int") return `${name}: Int`;
    if (type === "int_list") return `${name}: IntArray`;
    return `${name}: List<String>`;
  }
  if (family === "swift") {
    if (type === "string") return `${name}: String`;
    if (type === "int") return `${name}: Int`;
    if (type === "int_list") return `${name}: [Int]`;
    return `${name}: [String]`;
  }
  if (family === "php" || family === "ruby") {
    return `$${name}`;
  }
  if (family === "c") {
    if (type === "string") return `const char* ${name}`;
    if (type === "int") return `int ${name}`;
    if (type === "int_list") return `int ${name}[], int ${name}_len`;
    return `char* ${name}[], int ${name}_len`;
  }
  return name;
}

function returnTypeForSignature(family: string | undefined, returnType: ChallengeReturnType): string {
  if (family === "python") {
    if (returnType === "string") return "str";
    if (returnType === "int") return "int";
    if (returnType === "float") return "float";
    if (returnType === "string_list") return "list[str]";
    if (returnType === "int_list") return "list[int]";
    return "list[list[str]]";
  }
  if (family === "typescript") {
    if (returnType === "string") return "string";
    if (returnType === "int" || returnType === "float") return "number";
    if (returnType === "string_list") return "string[]";
    if (returnType === "int_list") return "number[]";
    return "string[][]";
  }
  if (family === "javascript") return "";
  if (family === "java") {
    if (returnType === "string") return "String";
    if (returnType === "int") return "int";
    if (returnType === "float") return "double";
    if (returnType === "string_list") return "java.util.List<String>";
    if (returnType === "int_list") return "java.util.List<Integer>";
    return "java.util.List<java.util.List<String>>";
  }
  if (family === "cpp") {
    if (returnType === "string") return "std::string";
    if (returnType === "int") return "int";
    if (returnType === "float") return "double";
    if (returnType === "string_list") return "std::vector<std::string>";
    if (returnType === "int_list") return "std::vector<int>";
    return "std::vector<std::vector<std::string>>";
  }
  if (family === "csharp") {
    if (returnType === "string") return "string";
    if (returnType === "int") return "int";
    if (returnType === "float") return "double";
    if (returnType === "string_list") return "List<string>";
    if (returnType === "int_list") return "List<int>";
    return "List<List<string>>";
  }
  if (family === "go") {
    if (returnType === "string") return "string";
    if (returnType === "int") return "int";
    if (returnType === "float") return "float64";
    if (returnType === "string_list") return "[]string";
    if (returnType === "int_list") return "[]int";
    return "[][]string";
  }
  if (family === "rust") {
    if (returnType === "string") return "String";
    if (returnType === "int") return "i32";
    if (returnType === "float") return "f64";
    if (returnType === "string_list") return "Vec<String>";
    if (returnType === "int_list") return "Vec<i32>";
    return "Vec<Vec<String>>";
  }
  if (family === "kotlin") {
    if (returnType === "string") return "String";
    if (returnType === "int") return "Int";
    if (returnType === "float") return "Double";
    if (returnType === "string_list") return "List<String>";
    if (returnType === "int_list") return "List<Int>";
    return "List<List<String>>";
  }
  if (family === "swift") {
    if (returnType === "string") return "String";
    if (returnType === "int") return "Int";
    if (returnType === "float") return "Double";
    if (returnType === "string_list") return "[String]";
    if (returnType === "int_list") return "[Int]";
    return "[[String]]";
  }
  if (family === "php" || family === "ruby") return "";
  if (family === "c") {
    if (returnType === "string") return "const char*";
    if (returnType === "int") return "int";
    return "double";
  }
  return "string";
}

function defaultReturnLiteral(family: string | undefined, returnType: ChallengeReturnType): string {
  if (family === "python") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int") return "0";
    if (returnType === "float") return "0.0";
    return "[]";
  }
  if (family === "javascript" || family === "typescript") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int" || returnType === "float") return "0";
    return "[]";
  }
  if (family === "java") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int") return "0";
    if (returnType === "float") return "0.0";
    if (returnType === "string_list" || returnType === "int_list" || returnType === "string_list_list") {
      return "new java.util.ArrayList<>()";
    }
  }
  if (family === "cpp") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int") return "0";
    if (returnType === "float") return "0.0";
    return "{}";
  }
  if (family === "csharp") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int") return "0";
    if (returnType === "float") return "0.0";
    if (returnType === "string_list") return "new List<string>()";
    if (returnType === "int_list") return "new List<int>()";
    if (returnType === "string_list_list") return "new List<List<string>>()";
  }
  if (family === "go") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int") return "0";
    if (returnType === "float") return "0";
    if (returnType === "string_list") return "[]string{}";
    if (returnType === "int_list") return "[]int{}";
    if (returnType === "string_list_list") return "[][]string{}";
  }
  if (family === "rust") {
    if (returnType === "string") return "String::new()";
    if (returnType === "int") return "0";
    if (returnType === "float") return "0.0";
    return "Vec::new()";
  }
  if (family === "kotlin") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int") return "0";
    if (returnType === "float") return "0.0";
    return "emptyList()";
  }
  if (family === "swift") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int") return "0";
    if (returnType === "float") return "0.0";
    return "[]";
  }
  if (family === "php") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int" || returnType === "float") return "0";
    return "[]";
  }
  if (family === "ruby") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int") return "0";
    if (returnType === "float") return "0.0";
    return "[]";
  }
  if (family === "c") {
    if (returnType === "string") return "\"\"";
    if (returnType === "int") return "0";
    return "0.0";
  }
  return "\"\"";
}

function challengeSignatureText(challenge: ChallengeUI, family: string | undefined): string {
  const params = challenge.parameters.map((param) => parameterTypeForSignature(family, param.type, param.name)).join(", ");
  const returnType = returnTypeForSignature(family, challenge.returnType);
  const name = challenge.functionName;

  if (family === "python") return `def ${name}(${params}) -> ${returnType}`;
  if (family === "javascript") return `function ${name}(${params})`;
  if (family === "typescript") return `function ${name}(${params}): ${returnType}`;
  if (family === "java") return `public static ${returnType} ${name}(${params})`;
  if (family === "cpp") return `${returnType} ${name}(${params})`;
  if (family === "csharp") return `public static ${returnType} ${name}(${params})`;
  if (family === "go") return `func ${name}(${params}) ${returnType}`;
  if (family === "rust") return `fn ${name}(${params}) -> ${returnType}`;
  if (family === "kotlin") return `fun ${name}(${params}): ${returnType}`;
  if (family === "swift") return `func ${name}(${params}) -> ${returnType}`;
  if (family === "php") return `function ${name}(${params})`;
  if (family === "ruby") return `def ${name}(${challenge.parameters.map((p) => p.name).join(", ")})`;
  if (family === "c") return `${returnType} ${name}(${params})`;
  return `${name}(${params})`;
}

function starterCodeForChallenge(challenge: ChallengeUI, family: string | undefined): string {
  const signature = challengeSignatureText(challenge, family);
  const literal = defaultReturnLiteral(family, challenge.returnType);

  if (family === "python") {
    return [signature + ":", "    # Return the final result value", `    return ${literal}`, ""].join("\n");
  }
  if (family === "javascript") {
    return [signature + " {", "  // Return the final result value", `  return ${literal};`, "}", ""].join("\n");
  }
  if (family === "typescript") {
    return [signature + " {", "  // Return the final result value", `  return ${literal};`, "}", ""].join("\n");
  }
  if (family === "java") {
    return [
      "class Solution {",
      `  ${signature} {`,
      "    // Return the final result value",
      `    return ${literal};`,
      "  }",
      "}",
      ""
    ].join("\n");
  }
  if (family === "cpp") {
    return [signature + " {", "  // Return the final result value", `  return ${literal};`, "}", ""].join("\n");
  }
  if (family === "csharp") {
    return [
      "using System.Collections.Generic;",
      "",
      "public static class Solution {",
      `  ${signature} {`,
      "    // Return the final result value",
      `    return ${literal};`,
      "  }",
      "}",
      ""
    ].join("\n");
  }
  if (family === "go") {
    return [signature + " {", "\t// Return the final result value", `\treturn ${literal}`, "}", ""].join("\n");
  }
  if (family === "rust") {
    return [signature + " {", "    // Return the final result value", `    ${literal}`, "}", ""].join("\n");
  }
  if (family === "kotlin") {
    return [
      "object Solution {",
      `    @JvmStatic ${signature} {`,
      "        // Return the final result value",
      `        return ${literal}`,
      "    }",
      "}",
      ""
    ].join("\n");
  }
  if (family === "swift") {
    return [signature + " {", "    // Return the final result value", `    return ${literal}`, "}", ""].join("\n");
  }
  if (family === "php") {
    return [signature + " {", "  // Return the final result value", `  return ${literal};`, "}", ""].join("\n");
  }
  if (family === "ruby") {
    return [signature, "  # Return the final result value", `  ${literal}`, "end", ""].join("\n");
  }
  if (family === "c") {
    return [
      "#include <stddef.h>",
      "",
      signature + " {",
      "  // Return the final result value.",
      `  return ${literal};`,
      "}",
      ""
    ].join("\n");
  }

  return ["// Implement the required function and return the required value.", ""].join("\n");
}

export default function SkillsPage() {
  const [challenges, setChallenges] = useState<ChallengeUI[]>(CHALLENGE_FALLBACKS);
  const [activeChallengeId, setActiveChallengeId] = useState(CHALLENGE_FALLBACKS[0].id);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({});
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [learningGuideOpen, setLearningGuideOpen] = useState(true);
  const [activeLearningStepIndex, setActiveLearningStepIndex] = useState(0);

  const activeChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === activeChallengeId) || challenges[0] || CHALLENGE_FALLBACKS[0],
    [activeChallengeId, challenges]
  );

  const availableLanguages = useMemo(
    () => languages.filter((language) => {
      const family = language.family || inferFamilyFromName(language.name);
      return Boolean(family && activeChallenge.supportedFamilies.includes(family as LanguageFamily));
    }),
    [activeChallenge.supportedFamilies, languages]
  );

  const selectedLanguage = useMemo(
    () => availableLanguages.find((language) => language.id === selectedLanguageId) || null,
    [availableLanguages, selectedLanguageId]
  );
  const selectedFamily = getLanguageFamily(selectedLanguage);
  const activeSignature = challengeSignatureText(activeChallenge, selectedFamily);

  const draftKey = `${activeChallenge.id}:${selectedLanguageId ?? "none"}`;
  const currentCode = drafts[draftKey] ?? "";
  const totalChallenges = challenges.length;
  const completedCount = challenges.reduce(
    (count, challenge) => count + (completionMap[challenge.id] ? 1 : 0),
    0
  );
  const activeLearningStep = LEARNING_GUIDE_STEPS[activeLearningStepIndex] ?? LEARNING_GUIDE_STEPS[0];
  const learningStepNumber = activeLearningStepIndex + 1;

  const refreshCodingProgress = useCallback(async () => {
    setLoadingProgress(true);
    try {
      const data = await apiRequest<CodingTasksResponse>("/skills/progress");
      const nextMap = challenges.reduce<Record<string, boolean>>((acc, challenge) => {
        acc[challenge.id] = Boolean(data.challenge_completion[challenge.id]);
        return acc;
      }, {});
      setCompletionMap(nextMap);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to load coding progress.");
    } finally {
      setLoadingProgress(false);
    }
  }, [challenges]);

  useEffect(() => {
    let mounted = true;

    const loadLanguages = async () => {
      setLoadingLanguages(true);
      try {
        const data = await apiRequest<LanguagesResponse>("/skills/languages?view=compact");
        if (!mounted) return;
        const next = sortedLanguages(data.languages);
        setLanguages(next);
        const python = next.find((language) => (language.family || inferFamilyFromName(language.name)) === "python");
        setSelectedLanguageId((prev) => prev ?? python?.id ?? next[0]?.id ?? null);
      } catch (err) {
        if (!mounted) return;
        setApiError(err instanceof Error ? err.message : "Failed to load execution languages.");
      } finally {
        if (mounted) setLoadingLanguages(false);
      }
    };

    const loadChallenges = async () => {
      try {
        const data = await apiRequest<ChallengeContractsResponse>("/skills/challenges");
        if (!mounted) return;
        const nextChallenges = mergeChallengesWithContracts(data.challenges ?? []);
        setChallenges(nextChallenges);
      } catch {
        // Fallback content remains available when challenge-contract endpoint is unavailable.
      }
    };

    void Promise.all([loadLanguages(), loadChallenges()]);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    void refreshCodingProgress();
  }, [refreshCodingProgress]);

  useEffect(() => {
    if (!challenges.length) return;
    const hasActiveChallenge = challenges.some((challenge) => challenge.id === activeChallengeId);
    if (!hasActiveChallenge) {
      setActiveChallengeId(challenges[0].id);
    }
  }, [activeChallengeId, challenges]);

  useEffect(() => {
    if (!availableLanguages.length) {
      setSelectedLanguageId(null);
      return;
    }
    const languageStillAvailable = availableLanguages.some((language) => language.id === selectedLanguageId);
    if (!languageStillAvailable) {
      const python = availableLanguages.find((language) => (language.family || inferFamilyFromName(language.name)) === "python");
      setSelectedLanguageId(python?.id ?? availableLanguages[0].id);
    }
  }, [availableLanguages, selectedLanguageId]);

  useEffect(() => {
    if (!selectedLanguage) return;
    setDrafts((prev) => {
      if (prev[draftKey] !== undefined) return prev;
      return {
        ...prev,
        [draftKey]: starterCodeForChallenge(activeChallenge, selectedFamily)
      };
    });
  }, [activeChallenge, draftKey, selectedFamily, selectedLanguage]);

  useEffect(() => {
    setRunResult(null);
    setSubmitResult(null);
    setApiError(null);
  }, [activeChallenge.id, selectedLanguageId]);

  const handleCodeChange = (value: string | undefined) => {
    setDrafts((prev) => ({
      ...prev,
      [draftKey]: value || ""
    }));
  };

  const handleRun = async () => {
    if (!selectedLanguageId) return;
    if (!currentCode.trim()) {
      setApiError("Write some code first.");
      return;
    }

    setRunning(true);
    setApiError(null);
    setSubmitResult(null);
    try {
      const data = await apiRequest<RunResponse>(`/skills/challenges/${activeChallenge.id}/run`, {
        method: "POST",
        body: JSON.stringify({
          source_code: currentCode,
          language_id: selectedLanguageId
        })
      });
      setRunResult(data);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to run code.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLanguageId) return;
    if (!currentCode.trim()) {
      setApiError("Write some code first.");
      return;
    }

    setSubmitting(true);
    setApiError(null);
    try {
      const data = await apiRequest<SubmitResponse>(`/skills/challenges/${activeChallenge.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          source_code: currentCode,
          language_id: selectedLanguageId
        })
      });
      setSubmitResult(data);
      if (data.passed_all_hidden && data.task_completed) {
        await refreshCodingProgress();
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to submit challenge.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      <section id="readiness-check" className="space-y-4">
        <div className="rounded-[13px] border border-slate-200 bg-white p-5 md:p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700">
              Module 02
            </span>
            <span className="text-[13px] font-semibold text-slate-500">The Foundation</span>
          </div>

          <div className="mt-4">
            <h1 className="text-[22px] font-bold leading-tight text-slate-950">Coding Skills</h1>
            <p className="mt-1.5 max-w-4xl text-[13px] leading-[1.6] text-slate-600">
              Your main tool for coding interviews, scripts, and logic. Pass the 5 challenges to complete this module.
            </p>
            <p className="mt-1 text-[12px] text-slate-400 max-w-4xl">
              Part of the 2 core skills track: coding now, backend depth next in Projects.
            </p>
          </div>

          <div className="mt-5 relative pl-8 space-y-6">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-indigo-200" />

            <article className="relative">
              <span className="absolute -left-[29px] top-1.5 h-5 w-5 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
              <h2 className="text-[19px] font-bold text-indigo-900">1. Programming Language (Python Recommended)</h2>
              <div className="mt-1 inline-flex items-center gap-2 text-[13px] font-semibold text-indigo-700">
                <Clock3 size={15} />
                ~2 Months
              </div>
              <p className="mt-2 text-[13px] leading-[1.65] text-slate-600">
                Your main tool for coding interviews, scripts, and logic. We recommend Python to start faster, but
                you can choose any language and follow the exact same learning process.
              </p>
              <p className="mt-1 text-[13px] font-semibold text-indigo-700">
                This module uses Python examples, but the strategy works for any language.
              </p>
            </article>

            <article className="relative opacity-65">
              <span className="absolute -left-[29px] top-1.5 h-5 w-5 rounded-full bg-slate-300" />
              <h2 className="text-[19px] font-bold text-slate-600">2. Backend Development</h2>
              <div className="mt-1 inline-flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                <Clock3 size={15} />
                ~4 Months
              </div>
              <p className="mt-2 text-[13px] leading-[1.65] text-slate-500">APIs, Databases, Frameworks. This is how you build real software.</p>
              <p className="mt-1 text-[13px] italic text-slate-400">Covered in the &quot;Projects&quot; module.</p>
            </article>
          </div>
        </div>

        <details className="group rounded-[9px] border border-amber-200 bg-amber-50/80 px-4 py-3">
          <summary className="list-none cursor-pointer text-[12px] leading-[1.65] text-amber-900">
            <span className="font-semibold">Before you start:</span>{" "}
            Don&apos;t use AI for these. Coding ability is the bare minimum - you need to genuinely own it.
            Solve inside the function, run tests, debug, submit when stable.
            <span className="ml-1 font-medium text-amber-800 underline group-open:hidden">See full rules</span>
            <span className="ml-1 hidden font-medium text-amber-800 underline group-open:inline">Hide rules</span>
          </summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[12px] leading-[1.6] text-amber-900/90">
            <li>Implement your code inside the pre-defined function signature and return the required value.</li>
            <li>Use your IDE actively: write code, click Run Code, read errors/output, and iterate.</li>
            <li>If your code is not working, check the error message, debug, and keep trying.</li>
            <li>Submit only when local runs are stable and your output matches expected behavior.</li>
            <li>Challenge #5 is intentionally harder. Try it first - if you can&apos;t, it&apos;s okay to look up the concept.</li>
          </ul>
        </details>

        <div className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] min-h-[680px]">
            <aside className="border-r border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Problem list
              </div>
              <div>
                {challenges.map((challenge) => {
                  const active = challenge.id === activeChallenge.id;
                  const completed = completionMap[challenge.id];
                  return (
                    <button
                      key={challenge.id}
                      type="button"
                      onClick={() => setActiveChallengeId(challenge.id)}
                      className={`w-full border-b border-slate-200 px-4 py-3 text-left transition-colors ${
                        active ? "bg-white border-l-4 border-l-indigo-600" : "hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400">#{challenge.order}</p>
                          <p className={`text-[13px] font-semibold leading-[1.35] ${active ? "text-indigo-700" : "text-slate-800"}`}>{challenge.title}</p>
                        </div>
                        {completed ? <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="flex flex-col min-w-0">
              <div className="space-y-4 border-b border-slate-200 bg-white p-4 md:p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                        Checkpoint
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">Problem {activeChallenge.order}</span>
                    </div>
                    <h2 className="mt-2 text-[22px] font-bold leading-tight text-slate-950">{activeChallenge.title}</h2>
                    <p className="mt-1 max-w-3xl text-[13px] leading-[1.6] text-slate-600">{activeChallenge.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Language</label>
                    <select
                      className="rounded-[7px] border border-slate-300 bg-white px-3 py-2 text-[12px] font-medium text-slate-700"
                      disabled={loadingLanguages || !availableLanguages.length}
                      value={selectedLanguageId ?? ""}
                      onChange={(event) => setSelectedLanguageId(Number(event.target.value))}
                    >
                      {!availableLanguages.length ? <option value="">No compatible language</option> : null}
                      {availableLanguages.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.display_name || language.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-[9px] border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Function signature</p>
                  <pre className="mt-1 text-xs font-mono whitespace-pre-wrap break-words text-indigo-700">{activeSignature}</pre>
                </div>

                <div className="rounded-[9px] border border-indigo-200 bg-indigo-50/60 p-3 text-[12px] text-indigo-900">
                  <p className="font-semibold">What to return</p>
                  <p className="mt-1 leading-[1.6]">{activeChallenge.whatToReturn}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeChallenge.examples.slice(0, 2).map((example, index) => (
                    <div key={`${activeChallenge.id}-example-${index}`} className="rounded-[9px] border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{index === 0 ? "Input" : "Expected output"}</p>
                      <pre className="mt-1 text-xs font-mono whitespace-pre-wrap break-words text-slate-700">
                        {index === 0 ? example.input : example.output}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-950 text-indigo-100 p-0 font-mono relative h-[320px] md:h-[380px] lg:h-[430px]">
                {selectedLanguage ? (
                  <MonacoEditor
                    height="100%"
                    theme="vs-dark"
                    language={toMonacoLanguage(selectedFamily)}
                    value={currentCode}
                    onChange={handleCodeChange}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                      wordWrap: "on",
                      automaticLayout: true,
                      lineNumbersMinChars: 2
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-indigo-100/80">
                    {loadingLanguages ? "Loading languages..." : "No compatible language"}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-slate-200 bg-white px-5 py-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-mono text-[12px] text-slate-400">// Ready to run</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRun}
                      disabled={running || submitting || loadingLanguages || !selectedLanguageId}
                      className="inline-flex items-center gap-2 rounded-[7px] border border-indigo-300 bg-indigo-50 px-4 py-2 text-[12px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-60"
                    >
                      {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                      Run Code
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={running || submitting || loadingLanguages || !selectedLanguageId}
                      className="inline-flex items-center gap-2 rounded-[7px] bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Submit
                    </button>
                  </div>
                </div>

                {apiError ? (
                  <p className="rounded-[7px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{apiError}</p>
                ) : null}

                {runResult ? (
                  <div className="space-y-3 rounded-[9px] border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-[13px] font-semibold text-slate-700">
                        Run status: <span className="uppercase">{runResult.status}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {runResult.time_ms ? `${runResult.time_ms} ms` : "--"} | {runResult.memory_kb ? `${runResult.memory_kb} kb` : "--"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {runResult.sample_results.map((result, index) => (
                        <div
                          key={`${index}-${result.input_preview}`}
                          className={`rounded-[7px] border px-3 py-2 text-[12px] ${
                            result.passed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                          }`}
                        >
                          <p className="font-semibold">
                            Sample {index + 1}: {result.passed ? "Pass" : "Fail"} ({result.status})
                          </p>
                          <p className="text-xs mt-1 text-slate-600">Input: {result.input_preview || "(none)"}</p>
                          {!result.passed ? (
                            <p className="text-xs text-slate-600 mt-1">
                              Expected: {result.expected_preview || "(empty)"} | Actual: {result.actual_preview || "(empty)"}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {runResult.compile_output ? <p className="text-xs text-amber-800">Compile output: {runResult.compile_output}</p> : null}
                    {runResult.stderr ? <p className="text-xs text-red-700">Stderr: {runResult.stderr}</p> : null}
                  </div>
                ) : null}

                {submitResult ? (
                  <div
                    className={`rounded-[7px] border px-3 py-2 text-[12px] ${
                      submitResult.passed_all_hidden ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <p className="font-semibold">
                      {submitResult.passed_all_hidden ? "Hidden tests passed." : "Hidden tests not passed yet."}
                    </p>
                    <p className="text-xs mt-1 text-slate-600">
                      {submitResult.hidden_pass_count}/{submitResult.hidden_total} hidden tests passed.
                      {submitResult.task_completed ? " Task marked complete." : ""}
                    </p>
                    {submitResult.completion_blocked_reason ? <p className="text-xs mt-1 text-amber-900">{submitResult.completion_blocked_reason}</p> : null}
                    {submitResult.compile_output ? <p className="text-xs mt-1 text-amber-800">Compile output: {submitResult.compile_output}</p> : null}
                    {submitResult.stderr ? <p className="text-xs mt-1 text-red-700">Stderr: {submitResult.stderr}</p> : null}
                  </div>
                ) : null}
              </div>

            </div>
          </div>
          <div className="overflow-x-auto border-t border-slate-200 bg-slate-50 px-5 py-3">
            <p className="whitespace-nowrap text-[12px] text-slate-600">
              <strong>You&apos;re practicing the real interview format.</strong> Problem list on the left, specs above, code in a function below, exactly how OAs and live coding screens work.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setLearningGuideOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between gap-4 bg-white px-5 py-[15px] text-left transition-colors hover:bg-slate-50 ${learningGuideOpen ? "border-b border-slate-200" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600">
              <BookOpen size={15} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-950">Learning Guide</p>
              <p className="mt-0.5 text-[12px] text-slate-400">How to learn, courses, and why Python - 3 reads</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-[12px] font-semibold text-slate-400">
            <div className="flex gap-[5px]">
              {LEARNING_GUIDE_STEPS.map((step, index) => {
                const completed = index < activeLearningStepIndex;
                const active = index === activeLearningStepIndex;
                return (
                  <span
                    key={`guide-progress-${step.id}`}
                    className={`h-[5px] w-[22px] rounded-full ${completed ? "bg-emerald-500" : active ? "bg-indigo-600" : "bg-slate-200"}`}
                  />
                );
              })}
            </div>
            <span>{learningGuideOpen ? "Close" : "Open"}</span>
            {learningGuideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </button>

        {learningGuideOpen ? (
          <>
            <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
              {LEARNING_GUIDE_STEPS.map((step, index) => {
                const completed = index < activeLearningStepIndex;
                const active = index === activeLearningStepIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveLearningStepIndex(index)}
                    className={`flex shrink-0 items-center gap-[7px] border-b-2 px-5 py-[11px] text-[13px] font-medium transition-colors ${
                      active
                        ? "border-b-indigo-600 bg-white text-indigo-600"
                        : completed
                          ? "border-b-transparent text-emerald-600 hover:bg-white"
                          : "border-b-transparent text-slate-400 hover:bg-white hover:text-slate-700"
                    }`}
                  >
                    <span
                      className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold ${
                        active
                          ? "bg-indigo-600 text-white"
                          : completed
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {completed ? "✓" : index + 1}
                    </span>
                    {step.label}
                  </button>
                );
              })}
            </div>

            <div>
              {activeLearningStep.id === "how-to-learn" ? (
                <div className="border-b border-slate-200 px-9 py-8">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Learning Playbook</div>
                  <h2 className="mt-1.5 text-[19px] font-bold leading-[1.3] text-slate-950">How to Actually Learn Coding</h2>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-slate-500">
                    Start with a course. Every time you learn something new, implement it as a small challenge. That&apos;s how it sticks.
                  </p>

                  <p className="mt-6 text-[13px] leading-[1.75] text-slate-600">
                    Every time you learn something new, think of a small challenge or mini program using that concept and implement it.{" "}
                    <strong className="font-semibold text-slate-800">That&apos;s how concepts turn into real skill, not by watching, by doing.</strong>
                  </p>

                  <div className="mt-6">
                    <p className="mb-3 text-[12px] font-semibold text-slate-800">The practical loop</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                      {["Learn in course", "Think challenge", "Implement it", "Go harder"].map((item, index) => (
                        <div key={item} className="rounded-[9px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                          <p className="text-[11px] font-semibold text-slate-400">{index + 1}</p>
                          <p className="mt-1 text-[12px] font-semibold text-slate-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-r-[9px] rounded-l-none border border-slate-200 border-l-[3px] border-l-indigo-600 bg-slate-50 px-4 py-[14px]">
                    <div className="mb-[9px] flex items-center gap-[6px] text-[10px] font-bold uppercase tracking-[0.09em] text-indigo-600">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">D</span>
                      Founder&apos;s Note
                    </div>
                    <p className="text-[12px] leading-[1.7] text-slate-600">
                      When I was learning to code, I took a course that required me to solve around 40 challenges. If I could not solve
                      one, the instructor walked through it step by step. We started from basic calculator problems and progressed to
                      bigger implementations.
                    </p>
                    <p className="mt-[7px] text-[12px] leading-[1.7] text-slate-600">
                      <strong className="font-semibold text-slate-700">
                        The habit of implementing every concept is what separates people who actually learn from people who just watch a lot of videos.
                      </strong>
                    </p>
                  </div>
                </div>
              ) : null}

              {activeLearningStep.id === "courses" ? (
                <div className="border-b border-slate-200 px-9 py-8">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Course Recommendations</div>
                  <h2 className="mt-1.5 text-[19px] font-bold leading-[1.3] text-slate-950">Pick one and go deep</h2>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-slate-500">
                    Both options work. The approach is identical: learn concept, implement it, go harder.
                  </p>

                  <div className="mt-4 rounded-[9px] border border-indigo-200 bg-indigo-50 px-[14px] py-[11px] text-[12px] leading-[1.6] text-indigo-800">
                    This module uses Python examples, <strong className="font-semibold">but the strategy works for any language.</strong> Apply the same playbook with your language&apos;s tools.
                  </div>

                  <div className="my-6 h-px bg-slate-200" />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <article className="rounded-[9px] border border-slate-200 bg-slate-50 px-[18px] py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">Paid Option</p>
                      <h3 className="mt-1.5 text-[14px] font-bold text-slate-800">The Art of Doing (Python)</h3>
                      <p className="mt-[7px] text-[13px] leading-[1.65] text-slate-500">
                        Challenge-driven, instructor walks through solutions when you get stuck. Actively forces implementation, not just watching.
                      </p>
                      <a
                        href="https://www.udemy.com/course/the-art-of-doing/"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 hover:underline"
                      >
                        Open on Udemy
                        <ChevronRight size={14} />
                      </a>
                    </article>

                    <article className="rounded-[9px] border border-slate-200 bg-slate-50 px-[18px] py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">Free Option</p>
                      <h3 className="mt-1.5 text-[14px] font-bold text-slate-800">freeCodeCamp Python</h3>
                      <p className="mt-[7px] text-[13px] leading-[1.65] text-slate-500">
                        Excellent free course on YouTube. Fewer built-in challenges, so supplement with extra coding problems as you go.
                      </p>
                      <a
                        href="https://www.youtube.com/watch?v=rfscVS0vtbw"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 hover:underline"
                      >
                        Watch on YouTube
                        <ChevronRight size={14} />
                      </a>
                    </article>
                  </div>

                  <div className="mt-5 rounded-r-[9px] rounded-l-none border border-slate-200 border-l-[3px] border-l-indigo-600 bg-slate-50 px-4 py-[14px]">
                    <div className="mb-[9px] flex items-center gap-[6px] text-[10px] font-bold uppercase tracking-[0.09em] text-indigo-600">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">D</span>
                      Founder&apos;s Note
                    </div>
                    <p className="text-[12px] leading-[1.7] text-slate-600">
                      The paid option is what I&apos;d use if I were starting today. Regardless of which one you pick: learn concept,
                      implement it, solve progressively harder challenges.
                    </p>
                    <p className="mt-[7px] text-[12px] leading-[1.7] text-slate-600">
                      <strong className="font-semibold text-slate-700">Don&apos;t move on until it clicks in code.</strong>
                    </p>
                  </div>
                </div>
              ) : null}

              {activeLearningStep.id === "why-python" ? (
                <div className="border-b border-slate-200 px-9 py-8">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Language Choice</div>
                  <h2 className="mt-1.5 text-[19px] font-bold leading-[1.3] text-slate-950">Why we recommend Python</h2>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-slate-500">
                    A recommendation, not a requirement. The same strategy works with any language.
                  </p>

                  <div className="mt-6 rounded-[9px] bg-[#1e1b4b] px-[18px] py-4 text-indigo-100">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-200">Our recommendation</p>
                    <div className="mt-[6px] flex items-center gap-2">
                      <h3 className="text-[20px] font-bold text-white">Python</h3>
                      <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-950">
                        Recommended
                      </span>
                    </div>
                    <div className="mt-4 space-y-2.5 text-[13px] leading-[1.65] text-indigo-100/90">
                      <p><strong className="font-semibold text-white">Easiest syntax</strong> - lets you focus on logic, not semicolons and type declarations.</p>
                      <p><strong className="font-semibold text-white">Opens Data/AI roles</strong> - including data engineering, machine learning, and analytics-heavy internships.</p>
                      <p><strong className="font-semibold text-white">Best language for coding interviews</strong> - readable, fast to write, and ideal for solving problems under time pressure.</p>
                    </div>
                    <div className="mt-4 rounded-[7px] border border-white/10 bg-white/10 px-3 py-2 text-[12px] leading-[1.6] text-indigo-100">
                      <strong className="font-semibold text-white">Recommendation, not restriction.</strong> JavaScript, Java, C++, and others are all valid. Same strategy, different language.
                    </div>
                  </div>

                  <div className="mt-5 rounded-r-[9px] rounded-l-none border border-slate-200 border-l-[3px] border-l-indigo-600 bg-slate-50 px-4 py-[14px]">
                    <div className="mb-[9px] flex items-center gap-[6px] text-[10px] font-bold uppercase tracking-[0.09em] text-indigo-600">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">D</span>
                      Founder&apos;s Note
                    </div>
                    <p className="text-[12px] leading-[1.7] text-slate-600">
                      My first job wasn&apos;t even in software engineering. My first two jobs were in data engineering. Python helped
                      me break in faster because I could ship working solutions quickly and communicate clearly in interviews.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-[13px]">
              <p className="text-[12px] text-slate-400">Step {learningStepNumber} of {LEARNING_GUIDE_STEPS.length}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLearningStepIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={activeLearningStepIndex === 0}
                  className="rounded-[7px] border border-slate-200 bg-white px-4 py-[7px] text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  ← Previous
                </button>
                {activeLearningStepIndex < LEARNING_GUIDE_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveLearningStepIndex((prev) => Math.min(prev + 1, LEARNING_GUIDE_STEPS.length - 1))}
                    className="rounded-[7px] border border-indigo-600 bg-indigo-600 px-4 py-[7px] text-[12px] font-semibold text-white hover:bg-indigo-700"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-[7px] border border-emerald-300 bg-emerald-50 px-4 py-[7px] text-[12px] font-semibold text-emerald-600"
                  >
                    Done ✓
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-xl border border-indigo-600 bg-indigo-600 px-5 py-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-white">Ready for the next step?</p>
          <p className="text-sm text-indigo-100">Pass 4 of 5 challenges and you unlock the Projects module.</p>
        </div>
        <a
          href="/projects"
          className="inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
        >
          Continue to Projects <ChevronRight size={16} />
        </a>
      </section>
    </div>
  );
}
