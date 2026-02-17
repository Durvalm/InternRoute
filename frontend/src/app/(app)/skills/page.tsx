"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
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
};

type ChallengeUI = {
  id: string;
  order: number;
  title: string;
  prompt: string;
  hint: string;
  examples: ChallengeExample[];
  taskTitle: string;
};

type LanguageOption = {
  id: number;
  name: string;
};

type CodingTasksResponse = {
  module_key: string;
  tasks: Array<{
    id: number;
    title: string;
    is_completed: boolean;
  }>;
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
    prompt: "Read a single line string from stdin and print the reversed string to stdout.",
    hint: "In Python, slicing with [::-1] reverses a string.",
    examples: [{ input: "hello", output: "olleh" }],
    taskTitle: "Coding Challenge #1: String Reversal"
  },
  {
    id: "fizzbuzz_logic",
    order: 2,
    title: "FizzBuzz Logic",
    prompt: "Read n from stdin. Print numbers 1..n, replacing multiples of 3 with Fizz, 5 with Buzz, and both with FizzBuzz.",
    hint: "Build each token, then join with spaces for final output.",
    examples: [{ input: "5", output: "1 2 Fizz 4 Buzz" }],
    taskTitle: "Coding Challenge #2: FizzBuzz Logic"
  },
  {
    id: "list_filtering",
    order: 3,
    title: "List Filtering",
    prompt: "Read n and then n integers. Print only even numbers in original order, space-separated. Print NONE if no evens.",
    hint: "Filter first, then handle the empty case explicitly.",
    examples: [{ input: "6\\n1 2 3 4 5 6", output: "2 4 6" }],
    taskTitle: "Coding Challenge #3: List Filtering"
  },
  {
    id: "dictionary_basics",
    order: 4,
    title: "Dictionary Basics",
    prompt: "Read n and then n lowercase words. Print the most frequent word and its count. Tie-break by lexicographically smallest word.",
    hint: "Use a frequency map, then choose best by (count desc, word asc).",
    examples: [{ input: "6\\ncat dog dog cat ant ant", output: "ant 2" }],
    taskTitle: "Coding Challenge #4: Dictionary Basics"
  },
  {
    id: "palindrome_check",
    order: 5,
    title: "The Palindrome",
    prompt: "Read a lowercase string and print YES if it reads the same backward, otherwise NO.",
    hint: "Compare the string with its reverse.",
    examples: [{ input: "racecar", output: "YES" }],
    taskTitle: "Coding Challenge #5: Palindrome Check"
  },
  {
    id: "sum_of_two",
    order: 6,
    title: "Sum of Two",
    prompt: "Read n and target on line one, then n integers on line two. Print YES if any pair sums to target, otherwise NO.",
    hint: "Track seen values in a set for O(n) lookup.",
    examples: [{ input: "5 9\\n2 7 11 15 1", output: "YES" }],
    taskTitle: "Coding Challenge #6: Sum of Two"
  }
];

const PREFERRED_LANGUAGE_ORDER = [
  "python",
  "javascript",
  "typescript",
  "java",
  "c++",
  "c#",
  "go",
  "rust",
  "kotlin",
  "swift",
  "php",
  "ruby",
  "c"
];

function sortedLanguages(languages: LanguageOption[]): LanguageOption[] {
  const ranked = [...languages];
  ranked.sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();

    const aRank = PREFERRED_LANGUAGE_ORDER.findIndex((token) => aLower.includes(token));
    const bRank = PREFERRED_LANGUAGE_ORDER.findIndex((token) => bLower.includes(token));

    if (aRank !== -1 && bRank === -1) return -1;
    if (aRank === -1 && bRank !== -1) return 1;
    if (aRank !== -1 && bRank !== -1 && aRank !== bRank) return aRank - bRank;
    return aLower.localeCompare(bLower);
  });
  return ranked;
}

function toMonacoLanguage(name: string | undefined): string {
  const value = (name || "").toLowerCase();
  if (value.includes("python")) return "python";
  if (value.includes("typescript")) return "typescript";
  if (value.includes("javascript")) return "javascript";
  if (value.includes("java")) return "java";
  if (value.includes("c++")) return "cpp";
  if (value.includes("c#")) return "csharp";
  if (value.includes("kotlin")) return "kotlin";
  if (value.includes("swift")) return "swift";
  if (value.includes("php")) return "php";
  if (value.includes("ruby")) return "ruby";
  if (value.includes("go")) return "go";
  if (value.includes("rust")) return "rust";
  if (value.includes("c (") || value.includes(" c ")) return "c";
  return "plaintext";
}

function starterCodeForLanguage(name: string | undefined): string {
  const value = (name || "").toLowerCase();

  if (value.includes("python")) {
    return [
      "import sys",
      "",
      "data = sys.stdin.read().strip()",
      "# TODO: parse input and print output",
      "print(data)",
      ""
    ].join("\n");
  }

  if (value.includes("javascript")) {
    return [
      "const fs = require('fs');",
      "",
      "const input = fs.readFileSync(0, 'utf8').trim();",
      "// TODO: parse input and print output",
      "console.log(input);",
      ""
    ].join("\n");
  }

  if (value.includes("java")) {
    return [
      "import java.io.*;",
      "import java.util.*;",
      "",
      "public class Main {",
      "  public static void main(String[] args) throws Exception {",
      "    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));",
      "    String input = br.readLine();",
      "    // TODO: parse input and print output",
      "    if (input != null) System.out.println(input);",
      "  }",
      "}",
      ""
    ].join("\n");
  }

  return [
    "// Read from stdin and print to stdout.",
    "// Build your solution here.",
    ""
  ].join("\n");
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
      const data = await apiRequest<CodingTasksResponse>("/dashboard/tasks?module_key=coding");
      const nextMap = CHALLENGES.reduce<Record<string, boolean>>((acc, challenge) => {
        const task = data.tasks.find((item) => item.title === challenge.taskTitle);
        acc[challenge.id] = Boolean(task?.is_completed);
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
        const data = await apiRequest<LanguagesResponse>("/skills/languages");
        if (!mounted) return;
        const next = sortedLanguages(data.languages);
        setLanguages(next);
        const python = next.find((language) => language.name.toLowerCase().includes("python"));
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
        [draftKey]: starterCodeForLanguage(selectedLanguage.name)
      };
    });
  }, [draftKey, selectedLanguage]);

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
              <span className="text-base font-medium text-slate-500">The Foundation</span>
            </div>

            <h1 className="mt-4 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              The 2 Skills You Need
            </h1>
            <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-slate-600">
              To get your next internship, you need to master two specific areas.
              We split them into separate modules so you can focus.
            </p>

            <div className="mt-9 relative pl-10 space-y-9">
              <div className="absolute left-4 top-1 bottom-1 w-px bg-indigo-200" />

              <article className="relative">
                <span className="absolute -left-[30px] top-1 h-5 w-5 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
                <h2 className="text-lg md:text-xl font-bold text-indigo-900">1. Programming Language (Python)</h2>
                <div className="mt-2 inline-flex items-center gap-2 text-indigo-600 text-sm md:text-base font-semibold">
                  <Clock3 size={22} />
                  ~2 Months
                </div>
                <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-600">
                  Your main tool. Used for coding interviews, scripts, and logic.
                </p>
                <p className="text-sm md:text-base font-semibold text-indigo-700">This Module Focuses on This.</p>
              </article>

              <article className="relative opacity-60">
                <span className="absolute -left-[30px] top-1 h-5 w-5 rounded-full bg-slate-300" />
                <h2 className="text-lg md:text-xl font-bold text-slate-700">2. Backend Development</h2>
                <div className="mt-2 inline-flex items-center gap-2 text-slate-500 text-sm md:text-base font-semibold">
                  <Clock3 size={22} />
                  ~4 Months
                </div>
                <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-600">
                  APIs, Databases, Frameworks, Git. This is how you build real software.
                </p>
                <p className="text-sm md:text-base italic text-slate-500">Covered in the "Projects" module.</p>
              </article>
            </div>
          </div>

          <aside className="rounded-3xl bg-[#201b56] text-white p-6 md:p-8 border border-indigo-950/30 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 text-indigo-300/15">
              <TerminalSquare size={180} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl md:text-2xl font-bold">Why Python?</h3>
                <span className="rounded-full bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1 uppercase tracking-wide">
                  Recommended
                </span>
              </div>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-indigo-100">
                It has the <strong>easiest syntax</strong>, letting you focus on logic, not semicolons.
              </p>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-indigo-100">
                <strong>Insider Tip:</strong> This also opens Data/AI internship tracks where competition can differ from general SWE.
              </p>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-indigo-100">
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
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">How to Learn</h2>
          </div>
          <a
            href="#readiness-check"
            className="rounded-full bg-indigo-50 text-indigo-700 px-4 py-2 text-sm font-semibold"
          >
            Already know the basics? Skip to Challenges
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-600">Top Recommendation (Paid)</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">The Art of Doing (Python)</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              You&apos;ll build 40 small projects. It&apos;s the best way to learn by doing.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              <strong>Optimization Tip:</strong> Skip the OOP section and the last 5 projects.
              This saves you 8 hours (~20h total).
            </p>
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-500">Udemy Course</p>
              <button type="button" className="inline-flex items-center gap-1 text-indigo-600 text-base font-bold">
                View Course <ChevronRight size={20} />
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">Free Option</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">FreeCodeCamp Python</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              An excellent, comprehensive video course available for free on YouTube.
              Great if you are on a budget but still want high-quality instruction.
            </p>
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-500">YouTube</p>
              <button type="button" className="inline-flex items-center gap-1 text-indigo-600 text-base font-bold">
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
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Readiness Check</h2>
            </div>
            <p className="mt-1 text-sm md:text-base text-slate-500">
              Solve the six fixed challenges to unlock measurable coding progress.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 min-w-[210px] shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Progress</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-2xl font-bold text-indigo-600">
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
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] min-h-[720px]">
            <div className="border-r border-slate-200 bg-slate-50">
              <div className="px-5 py-4 border-b border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-500">
                Challenge List
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
                      className={`w-full text-left px-5 py-4 border-b border-slate-200 transition-colors ${
                        active ? "bg-white border-l-4 border-l-indigo-500" : "hover:bg-white/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-400">#{challenge.order}</p>
                          <p className={`text-base font-bold ${active ? "text-indigo-900" : "text-slate-700"}`}>
                            {challenge.title}
                          </p>
                        </div>
                        {completed ? <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="p-5 md:p-6 border-b border-slate-200">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{activeChallenge.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{activeChallenge.prompt}</p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700 text-sm font-semibold">
                      <CircleAlert size={16} />
                      Hint: {activeChallenge.hint}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Language
                    </label>
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                      disabled={loadingLanguages || !languages.length}
                      value={selectedLanguageId ?? ""}
                      onChange={(event) => setSelectedLanguageId(Number(event.target.value))}
                    >
                      {!languages.length ? <option value="">Loading...</option> : null}
                      {languages.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Example I/O</p>
                  <p className="mt-1 text-xs text-slate-700">
                    <span className="font-semibold">Input:</span> {activeChallenge.examples[0].input}
                    {" | "}
                    <span className="font-semibold">Output:</span> {activeChallenge.examples[0].output}
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-[#231f5a] text-indigo-100 p-0 font-mono relative min-h-[320px]">
                {selectedLanguage ? (
                  <MonacoEditor
                    height="100%"
                    theme="vs-dark"
                    language={toMonacoLanguage(selectedLanguage.name)}
                    value={currentCode}
                    onChange={handleCodeChange}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      wordWrap: "on",
                      automaticLayout: true
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
                      Run
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
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            result.passed ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                          }`}
                        >
                          <p className="font-semibold">
                            Sample {index + 1}: {result.passed ? "Pass" : "Fail"} ({result.status})
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
                    className={`rounded-lg border px-3 py-2 text-sm ${
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
