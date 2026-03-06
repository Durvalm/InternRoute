"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  DollarSign,
  ExternalLink,
  Filter,
  Layers,
  Play,
  Star,
  Wrench,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type LeetcodeTask = {
  id: number;
  title: string;
  description: string | null;
  weight: number;
  is_bonus: boolean;
  is_completed: boolean;
};

type LeetcodeTasksResponse = {
  module_key: string;
  tasks: LeetcodeTask[];
};

type TaskCompletionModuleProgress = {
  module_key: string;
  score: number;
};

type TaskCompletionResponse = {
  task_id: number;
  completed: boolean;
  module_progress: TaskCompletionModuleProgress[];
};

const leetcodeCompletionItems = [
  "I understand Leetcode helps pass interviews after I already have strong projects and resume fundamentals.",
  "I can explain the two-step path: practical DSA foundation first, then deliberate Leetcode practice volume.",
  "I know how to run category-based grinding in NeetCode 150 without jumping randomly across topics.",
  "I can explain solution patterns and time/space complexity for the problems I practice.",
  "I have a focused 3-month base plan and a short interview refresh strategy."
];

const stepTwoList = [
  {
    title: "Go to NeetCode 150 list.",
    body: "Problems are separated by categories (arrays, two pointers, sliding window, stacks, etc.)."
  },
  {
    title: "Start with basic categories.",
    body: "Begin with arrays/hashmaps and two pointers. Do easy and medium in one category before moving on."
  },
  {
    title: "Try first, then watch video solutions.",
    body: "Understand the approach fully before moving to the next problem."
  },
  {
    title: "Learn category patterns.",
    body: "Array problems often use hashmap/sorting. Tree problems often use BFS/DFS. Pattern recognition is the core skill."
  },
  {
    title: "Understand time complexity.",
    body: "Know Big O time and space for each final approach. Interviewers will ask."
  }
];

const basicsFirst = [
  "Arrays & Strings",
  "Hash Maps",
  "Stacks & Queues",
  "Two Pointers / Sliding Window",
  "Binary Search",
  "Linked Lists",
  "Trees (BFS/DFS)"
];

const addLater = [
  "Backtracking",
  "Graphs (advanced)",
  "Dynamic Programming",
  "Heaps / Priority Queues",
  "Tries"
];

const keyTakeaways = [
  "Start Leetcode after you have strong projects and resume fundamentals.",
  "Take a practical DSA course and avoid purely theoretical detours.",
  "Use NeetCode 150 as your structured roadmap.",
  "A focused 3-month grind builds your long-term interview foundation.",
  "After the foundation, one short review week is usually enough before interviews.",
  "Prioritize basics first (80-20), then add advanced topics later."
];

function NumberPill({ value, tone }: { value: number; tone: "blue" | "green" }) {
  return (
    <div
      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${tone === "blue" ? "bg-blue-600" : "bg-green-600"}`}
    >
      {value}
    </div>
  );
}

export default function LeetcodePage() {
  const [isComplexityExpanded, setIsComplexityExpanded] = useState(false);
  const [leetcodeTasks, setLeetcodeTasks] = useState<LeetcodeTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [completionChecks, setCompletionChecks] = useState<boolean[]>(() => leetcodeCompletionItems.map(() => false));
  const [checklistHydrated, setChecklistHydrated] = useState(false);
  const [serverChecklistSynced, setServerChecklistSynced] = useState(false);
  const [syncingTaskId, setSyncingTaskId] = useState<number | null>(null);
  const [moduleScore, setModuleScore] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setChecklistHydrated(true);
      return;
    }

    const saved = window.localStorage.getItem("leetcode_completion_checks_v2");
    if (!saved) {
      setChecklistHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === leetcodeCompletionItems.length) {
        setCompletionChecks(parsed.map(Boolean));
      }
    } catch {
      // Ignore corrupted local storage.
    }

    setChecklistHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!checklistHydrated) return;
    window.localStorage.setItem("leetcode_completion_checks_v2", JSON.stringify(completionChecks));
  }, [checklistHydrated, completionChecks]);

  useEffect(() => {
    let active = true;
    setTasksLoading(true);
    setTasksError(null);

    apiRequest<LeetcodeTasksResponse>("/dashboard/tasks?module_key=leetcode")
      .then((data) => {
        if (!active) return;
        const tasks = data.tasks ?? [];
        setLeetcodeTasks(tasks);
        const firstTask = tasks[0];
        setModuleScore(firstTask ? (firstTask.is_completed ? 100 : 0) : null);
      })
      .catch(() => {
        if (!active) return;
        setLeetcodeTasks([]);
        setTasksError("Unable to load the Leetcode checklist.");
      })
      .finally(() => {
        if (active) setTasksLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const leetcodeTask = leetcodeTasks[0] ?? null;
  const allChecksComplete = completionChecks.every(Boolean);

  const updateLeetcodeTaskCompletion = useCallback(
    async (nextCompleted: boolean) => {
      if (!leetcodeTask) {
        setTasksError("Leetcode completion task is not configured.");
        return;
      }
      if (syncingTaskId === leetcodeTask.id) return;

      const previousCompleted = leetcodeTask.is_completed;
      setTasksError(null);
      setSyncingTaskId(leetcodeTask.id);
      setLeetcodeTasks((prev) =>
        prev.map((item) => (item.id === leetcodeTask.id ? { ...item, is_completed: nextCompleted } : item))
      );

      try {
        const data = await apiRequest<TaskCompletionResponse>(`/dashboard/tasks/${leetcodeTask.id}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: nextCompleted })
        });
        const nextModuleState = data.module_progress.find((item) => item.module_key === "leetcode");
        setModuleScore(nextModuleState?.score ?? (nextCompleted ? 100 : 0));
      } catch {
        setLeetcodeTasks((prev) =>
          prev.map((item) => (item.id === leetcodeTask.id ? { ...item, is_completed: previousCompleted } : item))
        );
        setTasksError("Unable to save your checklist progress. Please try again.");
      } finally {
        setSyncingTaskId(null);
      }
    },
    [leetcodeTask, syncingTaskId]
  );

  useEffect(() => {
    if (tasksLoading || !checklistHydrated || !leetcodeTask || serverChecklistSynced) return;

    if (leetcodeTask.is_completed && !allChecksComplete) {
      setCompletionChecks(leetcodeCompletionItems.map(() => true));
    }
    if (!leetcodeTask.is_completed && allChecksComplete) {
      setCompletionChecks(leetcodeCompletionItems.map(() => false));
    }

    setServerChecklistSynced(true);
  }, [allChecksComplete, checklistHydrated, leetcodeTask, serverChecklistSynced, tasksLoading]);

  const toggleCompletionCheck = (index: number) => {
    if (syncingTaskId !== null) return;

    const nextChecks = completionChecks.map((value, itemIndex) => (itemIndex === index ? !value : value));
    setCompletionChecks(nextChecks);

    if (!leetcodeTask) return;

    const nextAllChecksComplete = nextChecks.every(Boolean);
    if (nextAllChecksComplete !== leetcodeTask.is_completed) {
      void updateLeetcodeTaskCompletion(nextAllChecksComplete);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Leetcode Preparation</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          Master technical coding interviews with strategic practice.
        </p>
      </section>

      <section className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Star className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">About NeetCode</h2>
            <p className="mt-2 text-slate-700">
              <strong>NeetCode is one of the most reliable resources in the industry</strong> for Leetcode interviews,
              and even experienced engineers use it. It is a proven roadmap for pattern recognition: learn patterns,
              then solve similar problem families.
            </p>
            <a
              href="https://www.youtube.com/c/neetcode"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <Play className="h-4 w-4" />
              NeetCode YouTube (1M+)
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">When Should You Start Leetcode?</h2>
            <p className="mt-3 text-slate-800">
              <strong>Leetcode does not get you noticed first.</strong> It mostly helps you pass OAs and technical
              interviews after your profile is already strong enough to get callbacks.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <article className="rounded-lg border border-emerald-300 bg-white p-4">
                <p className="text-sm font-semibold text-emerald-900">Start LC if:</p>
                <p className="mt-1 text-sm text-slate-700">
                  You have good projects, solid software skills, and you are getting OAs/interviews.
                </p>
              </article>
              <article className="rounded-lg border border-rose-300 bg-white p-4">
                <p className="text-sm font-semibold text-rose-900">Do not start yet if:</p>
                <p className="mt-1 text-sm text-slate-700">
                  You still struggle to build APIs, backend flows, or end-to-end project execution.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">The Roadmap</h2>
        <p className="mt-2 text-slate-600">You need 2 things to succeed at Leetcode interviews:</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="relative rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
              STEP 1
            </span>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Learn DSA</h3>
                <p className="text-xs font-semibold text-blue-600">Data Structures & Algorithms</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              Learn how data structures work, common patterns, and complexity tradeoffs.
            </p>
          </article>

          <article className="relative rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
            <span className="absolute right-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
              STEP 2
            </span>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600 text-white">
                <Code2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Grind Leetcode</h3>
                <p className="text-xs font-semibold text-green-600">Practice, practice, practice</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              Apply DSA by solving many problems. Pattern recognition comes from repetition.
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-xl border-2 border-blue-300 bg-white p-6">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <span className="font-bold">1</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">STEP 1: Learn DSA</h2>
              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">START HERE</span>
            </div>
            <p className="mt-2 text-slate-700">
              A good DSA course should be <strong>practical</strong>: implementation, common patterns, and operation
              complexity by data structure.
            </p>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsComplexityExpanded((prev) => !prev)}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition-colors hover:text-blue-800"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isComplexityExpanded ? "rotate-180" : ""}`} />
                {isComplexityExpanded ? "Hide" : "Show"} time complexity example
              </button>
              {isComplexityExpanded ? (
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-slate-700">
                    <strong>Example:</strong> Removing from the start of an array is O(n), while removing from the end
                    is usually O(1). Those operation costs drive data structure choice in interviews.
                  </p>
                </div>
              ) : null}
            </div>

            <p className="mt-3 text-sm italic text-slate-600">
              I also spent time on long theory-heavy lectures before and ended up retaining less than expected for
              interviews. Practical resources usually transfer better to Leetcode performance.
            </p>
          </div>
        </div>

        <h3 className="font-bold text-slate-900">Course Options</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-emerald-600" />
                <h4 className="font-bold text-slate-900">NeetCode Pro</h4>
              </div>
              <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">BEST</span>
            </div>
            <p className="mt-3 text-sm text-slate-700">Practical and interview-focused.</p>
            <div className="mt-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-700" />
              <p className="text-sm font-semibold text-slate-800">$119/year</p>
            </div>
            <a
              href="https://neetcode.io/pro"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              View NeetCode Pro
              <ExternalLink className="h-3 w-3" />
            </a>
          </article>

          <article className="rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-6 w-6 text-purple-600" />
                <h4 className="font-bold text-slate-900">freeCodeCamp</h4>
              </div>
              <span className="rounded-full bg-purple-600 px-2 py-1 text-xs font-semibold text-white">FREE</span>
            </div>
            <p className="mt-3 text-sm text-slate-700">Solid budget option.</p>
            <div className="mt-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-700" />
              <p className="text-sm font-semibold text-slate-800">$0</p>
            </div>
            <a
              href="https://youtu.be/8hly31xKli0?si=QCOp_tNea5mJJpYV"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              Watch on YouTube
              <ExternalLink className="h-3 w-3" />
            </a>
          </article>

          <article className="rounded-lg border-2 border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h4 className="font-bold text-slate-900">Udemy</h4>
            </div>
            <p className="mt-3 text-sm text-slate-700">Cheaper paid alternative.</p>
            <div className="mt-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-700" />
              <p className="text-sm font-semibold text-slate-800">$10-20 on sale</p>
            </div>
            <a
              href="https://www.udemy.com/course/data-structures-algorithms-python/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              View on Udemy
              <ExternalLink className="h-3 w-3" />
            </a>
          </article>
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-slate-700">
            <strong>Note:</strong> Free and cheaper options can work, but if you can afford NeetCode Pro, it is
            usually the most practical path.
          </p>
        </div>

        <div className="mt-4 rounded-lg border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">Important Topics to Learn</h3>
              <p className="mt-2 text-sm text-slate-700">
                Use the NeetCode DSA for Beginners outline as a topic checklist even if you do not buy the course.
              </p>
              <a
                href="https://neetcode.io/courses/dsa-for-beginners"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                <BookOpen className="h-4 w-4" />
                View Topics List
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Additional Practice: Build Structures From Scratch</h3>
          </div>
          <p className="mt-2 text-sm text-slate-700">
            Build linked lists, stacks, queues, and helper operations manually. This deepens understanding of tradeoffs
            and operations.
          </p>
          <a
            href="https://neetcode.io/practice/practice/coreSkills"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Code2 className="h-4 w-4" />
            NeetCode Core Skills Problems
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </section>

      <section className="rounded-xl border-2 border-green-300 bg-white p-6">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
            <span className="font-bold">2</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">STEP 2: The Leetcode Grind Strategy</h2>
            <p className="mt-2 text-slate-700">
              This is how to improve systematically. Most of this happens on NeetCode.
            </p>
            <a
              href="https://neetcode.io/practice"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <Star className="h-4 w-4" />
              Go to NeetCode 150
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="space-y-3">
          {stepTwoList.map((item, index) => (
            <div key={item.title} className="flex items-start gap-3">
              <NumberPill value={index + 1} tone="green" />
              <div className="pt-0.5">
                <p className="text-sm text-slate-800">
                  <strong>{item.title}</strong> {item.body}
                </p>
                {index === 2 ? (
                  <div className="mt-2 rounded border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-700">
                    It is completely fine to watch many videos at first. Pattern recognition improves with repetition.
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-slate-700">
            <strong>Result:</strong> You will recognize patterns, pick appropriate data structures, and explain
            complexity clearly in interviews.
          </p>
        </div>
      </section>

      <section className="rounded-xl border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Timeline: My Experience</h2>
            <p className="mt-2 text-slate-700">Here is the exact style of progression that worked in practice.</p>
          </div>
        </div>

        <div className="space-y-4">
          <article className="rounded-xl border-2 border-cyan-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-6 w-6 text-cyan-600" />
            <h3 className="font-bold text-slate-900">The Initial 3-Month Grind</h3>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              I spent around 3 focused months building pattern intuition and completed roughly 70-80 easy/medium
              NeetCode 150 problems with deep understanding.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              I moved category by category through arrays, hashmaps, two pointers, sliding window, stacks, linked
              lists, and trees, then stopped around graph-level material to avoid overload.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              The key was depth: understand why each approach works, recognize patterns, and explain time/space
              complexity tradeoffs.
            </p>
          </article>

          <article className="rounded-xl border-2 border-green-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-green-600" />
              <h3 className="font-bold text-slate-900">Before the Amazon Interview</h3>
            </div>
            <p className="mt-3 text-sm text-slate-700">
              I had about 1 week to prepare. Because the foundation already existed, prep was mostly review. In about
              3-4 days before the interview, I reviewed 60+ previously solved problems to reactivate patterns and speed.
            </p>
            <p className="mt-3 text-sm text-slate-700">I did not need to relearn from scratch, and that preparation was enough.</p>
          </article>

          <article className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white">
            <div className="flex items-start gap-3">
              <Award className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="text-lg font-bold">Key Insight</p>
                <p className="mt-2 text-white/95">
                  The initial 3-month grind is the hard part, but it creates a foundation that makes future interview
                  prep dramatically faster.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Filter className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">What to Prioritize (80-20 Rule)</h2>
            <p className="mt-2 text-slate-700">
              Do not try to master everything in one pass. Focus on high-frequency fundamentals first.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border-2 border-green-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h3 className="font-bold text-slate-900">Focus on Basics First</h3>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              {basicsFirst.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border-2 border-amber-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-6 w-6 text-amber-600" />
              <h3 className="font-bold text-slate-900">Add Later</h3>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              {addLater.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-600">Add these gradually once basics feel automatic.</p>
          </article>
        </div>

        <div className="mt-4 rounded-lg border-2 border-orange-200 bg-white p-4">
          <p className="text-sm text-slate-700">
            <strong>Practical approach:</strong> Build confidence in fundamentals first, then add advanced topics one
            at a time.
          </p>
        </div>
      </section>

      <section className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <h2 className="text-center text-xl font-bold text-slate-900">Key Takeaways</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {keyTakeaways.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
              <p className="text-sm text-slate-800">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-indigo-200 pt-4">
          <p className="text-center text-lg font-semibold text-slate-800">
            A focused 3-month grind builds a strong base. You do not need everything at once.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Complete This Module</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Check these off once the strategy is clear so your Leetcode module progress can sync.
            </p>
          </div>
          <Link
            href="/applications"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            Back to Applications
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
          <div className="space-y-2.5">
            {leetcodeCompletionItems.map((item, index) => (
              <label key={item} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={completionChecks[index]}
                  onChange={() => toggleCompletionCheck(index)}
                  disabled={syncingTaskId !== null}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
                />
                <span className="text-sm leading-relaxed text-slate-700">{item}</span>
              </label>
            ))}
          </div>

          {tasksLoading ? <p className="mt-3 text-sm text-slate-500">Loading checklist...</p> : null}
          {tasksError ? <p className="mt-3 text-xs text-rose-600">{tasksError}</p> : null}

          <p className="mt-3 text-xs text-slate-500">
            {tasksLoading
              ? "Checking your task progress..."
              : moduleScore !== null
                ? `Leetcode module progress: ${moduleScore}%.`
                : leetcodeTask
                  ? leetcodeTask.is_completed
                    ? "Leetcode checklist complete."
                    : "Complete all checklist items to mark this module done."
                  : "Checklist task will sync here once it is available."}
          </p>
        </div>
      </section>
    </div>
  );
}
