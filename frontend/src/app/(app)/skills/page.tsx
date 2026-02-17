"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Loader2,
  Play,
  TerminalSquare
} from "lucide-react";
import { apiRequest } from "@/lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ChallengeExample = {
  input: string;
  output: string;
  explanation?: string;
};

type ChallengeParamType = "string" | "int" | "int_list" | "string_list";

type ChallengeParameter = {
  name: string;
  type: ChallengeParamType;
};

type ChallengeUI = {
  id: string;
  order: number;
  title: string;
  description: string;
  hint: string;
  functionName: string;
  parameters: ChallengeParameter[];
  returnType: "string";
  constraints: string[];
  examples: ChallengeExample[];
  whatToReturn: string;
};

type LanguageOption = {
  id: number;
  name: string;
  family?: string;
  display_name?: string;
};

type CodingTasksResponse = {
  challenge_completion: Record<string, boolean>;
  completed_count: number;
  total: number;
};

type LanguagesResponse = {
  languages: LanguageOption[];
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
  compile_output: string;
  stderr: string;
  time_ms: number | null;
  memory_kb: number | null;
};

const CHALLENGES: ChallengeUI[] = [
  {
    id: "string_reversal",
    order: 1,
    title: "The String Reversal",
    description: "Implement a function that returns the reversed version of the input string.",
    hint: "In Python, slicing with [::-1] reverses a string.",
    functionName: "string_reversal",
    parameters: [{ name: "s", type: "string" }],
    returnType: "string",
    constraints: ["1 <= s.length <= 10^4", "s may contain letters, spaces, and digits"],
    examples: [{ input: "s = \"hello\"", output: "\"olleh\"" }],
    whatToReturn: "Return the reversed string."
  },
  {
    id: "fizzbuzz_logic",
    order: 2,
    title: "FizzBuzz Logic",
    description: "Return the FizzBuzz sequence from 1 to n as a single space-separated string.",
    hint: "Build each token, then join with spaces for final output.",
    functionName: "fizzbuzz_logic",
    parameters: [{ name: "n", type: "int" }],
    returnType: "string",
    constraints: ["1 <= n <= 10^4"],
    examples: [{ input: "n = 5", output: "\"1 2 Fizz 4 Buzz\"" }],
    whatToReturn: "Return one string containing the sequence separated by spaces."
  },
  {
    id: "list_filtering",
    order: 3,
    title: "List Filtering",
    description: "Return all even numbers in original order as a space-separated string, or NONE.",
    hint: "Filter first, then handle the empty case explicitly.",
    functionName: "list_filtering",
    parameters: [{ name: "nums", type: "int_list" }],
    returnType: "string",
    constraints: ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
    examples: [{ input: "nums = [1, 2, 3, 4, 5, 6]", output: "\"2 4 6\"" }],
    whatToReturn: "Return \"NONE\" when there are no even values."
  },
  {
    id: "dictionary_basics",
    order: 4,
    title: "Dictionary Basics",
    description: "Return \"word count\" for the most frequent word. Break ties with lexicographically smallest word.",
    hint: "Use a frequency map, then choose best by (count desc, word asc).",
    functionName: "dictionary_basics",
    parameters: [{ name: "words", type: "string_list" }],
    returnType: "string",
    constraints: ["1 <= words.length <= 10^4", "All words are lowercase ASCII"],
    examples: [{ input: "words = [\"cat\", \"dog\", \"dog\", \"cat\", \"ant\", \"ant\"]", output: "\"ant 2\"" }],
    whatToReturn: "Return exactly one string in the format \"word count\"."
  },
  {
    id: "palindrome_check",
    order: 5,
    title: "The Palindrome",
    description: "Check whether the string is a palindrome and return YES or NO.",
    hint: "Compare the string with its reverse.",
    functionName: "palindrome_check",
    parameters: [{ name: "s", type: "string" }],
    returnType: "string",
    constraints: ["1 <= s.length <= 10^5", "s contains lowercase letters only"],
    examples: [{ input: "s = \"racecar\"", output: "\"YES\"" }],
    whatToReturn: "Return \"YES\" if palindrome, otherwise \"NO\"."
  },
  {
    id: "sum_of_two",
    order: 6,
    title: "Sum of Two",
    description: "Determine if any two distinct numbers sum to target.",
    hint: "Track seen values in a set for O(n) lookup.",
    functionName: "sum_of_two",
    parameters: [
      { name: "nums", type: "int_list" },
      { name: "target", type: "int" }
    ],
    returnType: "string",
    constraints: ["2 <= nums.length <= 10^5", "-10^9 <= nums[i], target <= 10^9"],
    examples: [{ input: "nums = [2, 7, 11, 15, 1], target = 9", output: "\"YES\"" }],
    whatToReturn: "Return \"YES\" if a valid pair exists, otherwise \"NO\"."
  }
];

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

function returnTypeForSignature(family: string | undefined): string {
  if (family === "python") return "str";
  if (family === "typescript") return "string";
  if (family === "javascript") return "";
  if (family === "java") return "String";
  if (family === "cpp") return "std::string";
  if (family === "csharp") return "string";
  if (family === "go") return "string";
  if (family === "rust") return "String";
  if (family === "kotlin") return "String";
  if (family === "swift") return "String";
  if (family === "php" || family === "ruby") return "";
  if (family === "c") return "const char*";
  return "string";
}

function challengeSignatureText(challenge: ChallengeUI, family: string | undefined): string {
  const params = challenge.parameters.map((param) => parameterTypeForSignature(family, param.type, param.name)).join(", ");
  const returnType = returnTypeForSignature(family);
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

  if (family === "python") {
    return [signature + ":", "    # Return the final string result", "    return \"\"", ""].join("\n");
  }
  if (family === "javascript") {
    return [signature + " {", "  // Return the final string result", "  return \"\";", "}", ""].join("\n");
  }
  if (family === "typescript") {
    return [signature + " {", "  // Return the final string result", "  return \"\";", "}", ""].join("\n");
  }
  if (family === "java") {
    return [
      "class Solution {",
      `  ${signature} {`,
      "    // Return the final string result",
      "    return \"\";",
      "  }",
      "}",
      ""
    ].join("\n");
  }
  if (family === "cpp") {
    return [signature + " {", "  // Return the final string result", "  return \"\";", "}", ""].join("\n");
  }
  if (family === "csharp") {
    return [
      "using System.Collections.Generic;",
      "",
      "public static class Solution {",
      `  ${signature} {`,
      "    // Return the final string result",
      "    return \"\";",
      "  }",
      "}",
      ""
    ].join("\n");
  }
  if (family === "go") {
    return [signature + " {", "\t// Return the final string result", "\treturn \"\"", "}", ""].join("\n");
  }
  if (family === "rust") {
    return [signature + " {", "    // Return the final string result", "    String::new()", "}", ""].join("\n");
  }
  if (family === "kotlin") {
    return [
      "object Solution {",
      `    @JvmStatic ${signature} {`,
      "        // Return the final string result",
      "        return \"\"",
      "    }",
      "}",
      ""
    ].join("\n");
  }
  if (family === "swift") {
    return [signature + " {", "    // Return the final string result", "    return \"\"", "}", ""].join("\n");
  }
  if (family === "php") {
    return [signature + " {", "  // Return the final string result", "  return \"\";", "}", ""].join("\n");
  }
  if (family === "ruby") {
    return [signature, "  # Return the final string result", "  \"\"", "end", ""].join("\n");
  }
  if (family === "c") {
    return [
      "#include <stddef.h>",
      "",
      signature + " {",
      "  // Return a pointer to a string result (e.g., static buffer or string literal).",
      "  return \"\";",
      "}",
      ""
    ].join("\n");
  }

  return ["// Implement the required function and return a string.", ""].join("\n");
}

export default function SkillsPage() {
  const [activeChallengeId, setActiveChallengeId] = useState(CHALLENGES[0].id);
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

  const activeChallenge = useMemo(
    () => CHALLENGES.find((challenge) => challenge.id === activeChallengeId) || CHALLENGES[0],
    [activeChallengeId]
  );

  const selectedLanguage = useMemo(
    () => languages.find((language) => language.id === selectedLanguageId) || null,
    [languages, selectedLanguageId]
  );
  const selectedFamily = getLanguageFamily(selectedLanguage);
  const activeSignature = challengeSignatureText(activeChallenge, selectedFamily);

  const draftKey = `${activeChallenge.id}:${selectedLanguageId ?? "none"}`;
  const currentCode = drafts[draftKey] ?? "";
  const totalChallenges = CHALLENGES.length;
  const completedCount = CHALLENGES.reduce(
    (count, challenge) => count + (completionMap[challenge.id] ? 1 : 0),
    0
  );

  const refreshCodingProgress = useCallback(async () => {
    setLoadingProgress(true);
    try {
      const data = await apiRequest<CodingTasksResponse>("/skills/progress");
      const nextMap = CHALLENGES.reduce<Record<string, boolean>>((acc, challenge) => {
        acc[challenge.id] = Boolean(data.challenge_completion[challenge.id]);
        return acc;
      }, {});
      setCompletionMap(nextMap);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to load coding progress.");
    } finally {
      setLoadingProgress(false);
    }
  }, []);

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

    void Promise.all([loadLanguages(), refreshCodingProgress()]);

    return () => {
      mounted = false;
    };
  }, [refreshCodingProgress]);

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
    <div className="max-w-7xl mx-auto pb-16 space-y-7">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-6">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-bold tracking-wider uppercase">
                Module 02
              </span>
              <span className="text-sm font-medium text-slate-500">The Foundation</span>
            </div>

            <h1 className="mt-4 text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              The 2 Skills You Need
            </h1>
            <p className="mt-3 max-w-3xl text-xs md:text-sm leading-relaxed text-slate-600">
              To get your next internship, you need to master two specific areas.
              We split them into separate modules so you can focus.
            </p>

            <div className="mt-9 relative pl-10 space-y-9">
              <div className="absolute left-4 top-1 bottom-1 w-px bg-indigo-200" />

              <article className="relative">
                <span className="absolute -left-[30px] top-1 h-5 w-5 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
                <h2 className="text-base md:text-lg font-bold text-indigo-900">1. Programming Language (Python)</h2>
                <div className="mt-2 inline-flex items-center gap-2 text-indigo-600 text-xs md:text-sm font-semibold">
                  <Clock3 size={22} />
                  ~2 Months
                </div>
                <p className="mt-2 text-xs md:text-sm leading-relaxed text-slate-600">
                  Your main tool. Used for coding interviews, scripts, and logic.
                </p>
                <p className="text-xs md:text-sm font-semibold text-indigo-700">This Module Focuses on This.</p>
              </article>

              <article className="relative opacity-60">
                <span className="absolute -left-[30px] top-1 h-5 w-5 rounded-full bg-slate-300" />
                <h2 className="text-base md:text-lg font-bold text-slate-700">2. Backend Development</h2>
                <div className="mt-2 inline-flex items-center gap-2 text-slate-500 text-xs md:text-sm font-semibold">
                  <Clock3 size={22} />
                  ~4 Months
                </div>
                <p className="mt-2 text-xs md:text-sm leading-relaxed text-slate-600">
                  APIs, Databases, Frameworks, Git. This is how you build real software.
                </p>
                <p className="text-xs md:text-sm italic text-slate-500">Covered in the "Projects" module.</p>
              </article>
            </div>
          </div>

          <aside className="rounded-3xl bg-[#201b56] text-white p-6 md:p-8 border border-indigo-950/30 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 text-indigo-300/15">
              <TerminalSquare size={180} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg md:text-xl font-bold">Why Python?</h3>
                <span className="rounded-full bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1 uppercase tracking-wide">
                  Recommended
                </span>
              </div>
              <p className="mt-3 text-xs md:text-sm leading-relaxed text-indigo-100">
                It has the <strong>easiest syntax</strong>, letting you focus on logic, not semicolons.
              </p>
              <p className="mt-3 text-xs md:text-sm leading-relaxed text-indigo-100">
                <strong>Insider Tip:</strong> This also opens Data/AI internship tracks where competition can differ from general SWE.
              </p>
              <p className="mt-3 text-xs md:text-sm leading-relaxed text-indigo-100">
                Plus, Python is a common language for coding interviews.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-indigo-600" />
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">How to Learn</h2>
          </div>
          <a
            href="#readiness-check"
            className="rounded-full bg-indigo-50 text-indigo-700 px-4 py-2 text-xs font-semibold"
          >
            Already know the basics? Skip to Challenges
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Top Recommendation (Paid)</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">The Art of Doing (Python)</h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              You&apos;ll build 40 small projects. It&apos;s the best way to learn by doing.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-700">
              <strong>Optimization Tip:</strong> Skip the OOP section and the last 5 projects.
              This saves you 8 hours (~20h total).
            </p>
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold text-slate-500">Udemy Course</p>
              <button type="button" className="inline-flex items-center gap-1 text-indigo-600 text-sm font-bold">
                View Course <ChevronRight size={20} />
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Free Option</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">FreeCodeCamp Python</h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              An excellent, comprehensive video course available for free on YouTube.
              Great if you are on a budget but still want high-quality instruction.
            </p>
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold text-slate-500">YouTube</p>
              <button type="button" className="inline-flex items-center gap-1 text-indigo-600 text-sm font-bold">
                Watch Video <ChevronRight size={20} />
              </button>
            </div>
          </article>
        </div>
      </section>

      <section id="readiness-check" className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Code2 size={24} className="text-slate-700" />
              <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Readiness Check</h2>
            </div>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              Solve the six fixed challenges to unlock measurable coding progress.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 min-w-[210px] shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Progress</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-xl font-bold text-indigo-600">
                {loadingProgress ? "..." : `${completedCount}/${totalChallenges}`}
              </p>
              <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${(completedCount / totalChallenges) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_330px_minmax(0,1fr)] min-h-[640px]">
            <aside className="border-r border-slate-200 bg-slate-50">
              <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                Problem List
              </div>
              <div>
                {CHALLENGES.map((challenge) => {
                  const active = challenge.id === activeChallenge.id;
                  const completed = completionMap[challenge.id];
                  return (
                    <button
                      key={challenge.id}
                      type="button"
                      onClick={() => setActiveChallengeId(challenge.id)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-200 transition-colors ${active ? "bg-white border-l-4 border-l-indigo-500" : "hover:bg-white/70"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-400">#{challenge.order}</p>
                          <p className={`text-sm font-bold ${active ? "text-indigo-900" : "text-slate-700"}`}>
                            {challenge.title}
                          </p>
                        </div>
                        {completed ? <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <aside className="border-r border-slate-200 bg-white p-4 md:p-5 space-y-4 overflow-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Easy
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Problem {activeChallenge.order}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{activeChallenge.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-600">{activeChallenge.description}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Function Signature</p>
                  <pre className="mt-1 text-xs font-mono whitespace-pre-wrap break-words text-indigo-800">
                    {activeSignature}
                  </pre>
                </div>

                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
                  <p className="font-semibold">What to return</p>
                  <p className="mt-1">{activeChallenge.whatToReturn}</p>
                  <p className="mt-2 text-xs text-indigo-700">
                    Do not print inside your final solution unless the signature says so. Return the value.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Examples</p>
                  {activeChallenge.examples.map((example, index) => (
                    <div key={`${activeChallenge.id}-example-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-500">Example {index + 1}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">Input</p>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-700">{example.input}</pre>
                      <p className="mt-2 text-xs font-semibold text-slate-700">Output</p>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-700">{example.output}</pre>
                      {example.explanation ? <p className="mt-2 text-xs text-slate-600">{example.explanation}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex flex-col min-w-0">
              <div className="p-4 md:p-5 border-b border-slate-200">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-slate-600">
                    Implement <span className="font-mono font-semibold text-slate-800">{activeChallenge.functionName}(...)</span> and return a string.
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Language
                    </label>
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                      disabled={loadingLanguages || !languages.length}
                      value={selectedLanguageId ?? ""}
                      onChange={(event) => setSelectedLanguageId(Number(event.target.value))}
                    >
                      {!languages.length ? <option value="">Loading...</option> : null}
                      {languages.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.display_name || language.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-[#231f5a] text-indigo-100 p-0 font-mono relative h-[330px] md:h-[380px] lg:h-[420px]">
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
                    {loadingLanguages ? "Loading languages..." : "No language available"}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-slate-500 font-mono">// Ready to run...</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRun}
                      disabled={running || submitting || loadingLanguages || !selectedLanguageId}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-700 text-sm font-bold hover:bg-indigo-100 transition-colors disabled:opacity-60"
                    >
                      {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                      Run Samples
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={running || submitting || loadingLanguages || !selectedLanguageId}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Submit
                    </button>
                  </div>
                </div>

                {apiError ? (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
                ) : null}

                {runResult ? (
                  <div className="rounded-lg border border-slate-200 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm font-semibold text-slate-700">
                        Run Status: <span className="uppercase">{runResult.status}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {runResult.time_ms ? `${runResult.time_ms} ms` : "--"} | {runResult.memory_kb ? `${runResult.memory_kb} kb` : "--"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {runResult.sample_results.map((result, index) => (
                        <div
                          key={`${index}-${result.input_preview}`}
                          className={`rounded-lg border px-3 py-2 text-sm ${result.passed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                            }`}
                        >
                          <p className="font-semibold">
                            Sample {index + 1}: {result.passed ? "Pass" : "Fail"} ({result.status})
                          </p>
                          <p className="text-xs mt-1 text-slate-600">
                            Input: {result.input_preview || "(none)"}
                          </p>
                          {!result.passed ? (
                            <p className="text-xs text-slate-600 mt-1">
                              Expected: {result.expected_preview || "(empty)"} | Actual: {result.actual_preview || "(empty)"}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {runResult.compile_output ? (
                      <p className="text-xs text-amber-700">Compile output: {runResult.compile_output}</p>
                    ) : null}
                    {runResult.stderr ? (
                      <p className="text-xs text-red-700">Stderr: {runResult.stderr}</p>
                    ) : null}
                  </div>
                ) : null}

                {submitResult ? (
                  <div
                    className={`rounded-lg border px-3 py-2 text-sm ${submitResult.passed_all_hidden ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                      }`}
                  >
                    <p className="font-semibold">
                      {submitResult.passed_all_hidden ? "Hidden tests passed." : "Hidden tests not passed yet."}
                    </p>
                    <p className="text-xs mt-1 text-slate-600">
                      {submitResult.hidden_pass_count}/{submitResult.hidden_total} hidden tests passed.
                      {submitResult.task_completed ? " Task marked complete." : ""}
                    </p>
                    {submitResult.compile_output ? (
                      <p className="text-xs mt-1 text-amber-700">Compile output: {submitResult.compile_output}</p>
                    ) : null}
                    {submitResult.stderr ? (
                      <p className="text-xs mt-1 text-red-700">Stderr: {submitResult.stderr}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
