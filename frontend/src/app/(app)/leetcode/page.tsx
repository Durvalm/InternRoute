"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";

// ── LeetCode API types ────────────────────────────────────────────────────────

type LeetcodeProgressStatus = {
  linked: boolean;
  leetcode_username: string | null;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  total_target: number;
  medium_target: number;
  completion_target_met: boolean;
  progress_percent_total: number;
  progress_percent_medium: number;
  progress_percent_overall: number;
  last_synced_at: string | null;
  sync_hint: string;
};

type LeetcodeProgressResponse = {
  progress: LeetcodeProgressStatus;
  module_progress: { module_key: string; score: number; unlock_threshold: number } | null;
};

// ── Static data ───────────────────────────────────────────────────────────────

const grindSteps = [
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
  "Trees (BFS / DFS)"
];

const addLater = [
  "Backtracking",
  "Graphs (advanced)",
  "Dynamic Programming",
  "Heaps / Priority Queues",
  "Tries"
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value: string | null): string {
  if (!value) return "Not synced yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleString();
}

function stepLabel(index: number): string {
  if (index === 0) return "When to Start";
  if (index === 1) return "Learn DSA First";
  return "The Grind Strategy";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LeetcodePage() {
  // Guide state
  const [openGuide, setOpenGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set());
  // LeetCode progress API state
  const [progress, setProgress] = useState<LeetcodeProgressStatus | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [linking, setLinking] = useState(false);
  const [syncingProgress, setSyncingProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const applyProgressResponse = (payload: LeetcodeProgressResponse) => {
    setProgress(payload.progress);
    if (payload.progress.leetcode_username) {
      setUsernameInput((prev) => prev || payload.progress.leetcode_username || "");
    }
  };

  useEffect(() => {
    let active = true;
    apiRequest<LeetcodeProgressResponse>("/leetcode/progress")
      .then((payload) => {
        if (!active) return;
        applyProgressResponse(payload);
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Unable to load LeetCode progress.";
        setErrorMessage(message);
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLinkUsername = async () => {
    const candidate = usernameInput.trim();
    if (!candidate) {
      setErrorMessage("Enter your LeetCode username.");
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setLinking(true);
    try {
      const payload = await apiRequest<LeetcodeProgressResponse>("/leetcode/progress/link", {
        method: "POST",
        body: JSON.stringify({ leetcode_username: candidate })
      });
      applyProgressResponse(payload);
      setUsernameInput(payload.progress.leetcode_username || candidate);
      setSuccessMessage("LeetCode username linked.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to link LeetCode username.";
      setErrorMessage(message);
    } finally {
      setLinking(false);
    }
  };

  const handleSyncProgress = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSyncingProgress(true);
    try {
      const payload = await apiRequest<LeetcodeProgressResponse>("/leetcode/progress/sync", {
        method: "POST"
      });
      applyProgressResponse(payload);
      setSuccessMessage("Progress synced from LeetCode.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sync LeetCode progress.";
      setErrorMessage(message);
    } finally {
      setSyncingProgress(false);
    }
  };

  const totalProgress = progress ? progress.progress_percent_total : 0;

  // Guide helpers
  const handleToggleGuide = () => {
    if (!openGuide) {
      // mark current step as visited when guide first opens
      setVisitedSteps((prev) => new Set(prev).add(currentStep));
    }
    setOpenGuide((v) => !v);
  };

  const goToStep = (index: number) => {
    // mark the destination step as visited on arrival
    setVisitedSteps((prev) => new Set(prev).add(index));
    setCurrentStep(index);
  };

  // Progress row values
  const stepsVisited = visitedSteps.size;
  const guideProgressPct = Math.min((stepsVisited / 3) * 100, 100);
  const guideBadge =
    stepsVisited === 0
      ? { label: "Not started", cls: "border-amber-200 bg-amber-50 text-amber-700" }
      : stepsVisited < 3
      ? { label: "In progress", cls: "border-amber-200 bg-amber-50 text-amber-700" }
      : { label: "Complete", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };

  return (
    <div className="mx-auto max-w-[900px] px-10 pt-7 pb-20 space-y-5">

      {/* ── Module header ────────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Module 08</p>
        <h1 className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] text-slate-900">LeetCode</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          LeetCode does not get you noticed — but it gets you past the technical screen once you do.
        </p>
      </div>

      {/* ── Progress row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <p className="flex-shrink-0 text-[12px] font-semibold text-slate-700">LeetCode</p>
        <div className="flex-1 h-1.5 rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full bg-indigo-500 transition-all"
            style={{ width: `${guideProgressPct}%` }}
          />
        </div>
        <p className="flex-shrink-0 text-[12px] text-slate-500">{stepsVisited}/3 steps</p>
        <span
          className={[
            "flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
            guideBadge.cls
          ].join(" ")}
        >
          {guideBadge.label}
        </span>
      </div>

      {/* ── Progress tracker (lc-hero) ───────────────────────────────────── */}
      <div className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[14px] font-bold text-slate-900">LeetCode Progress Tracker</p>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">
              This module is completion-based. Link your LeetCode username, sync progress, then reach{" "}
              <strong className="text-slate-700">50 solved total</strong> with at least{" "}
              <strong className="text-slate-700">30 medium</strong>.
            </p>
          </div>
          <p className="flex-shrink-0 text-[11px] text-slate-400">
            {progress ? `Last sync: ${formatDate(progress.last_synced_at)}` : "Last sync: —"}
          </p>
        </div>

        {loadingStatus ? (
          <div className="px-5 py-4">
            <p className="text-[12px] text-slate-500">Loading LeetCode progress…</p>
          </div>
        ) : null}

        {!loadingStatus && progress ? (
          progress.linked ? (
            <>
              {/* 4-col stats */}
              <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                <div className="py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400">Total Solved</p>
                  <p className="mt-1.5 text-[26px] font-extrabold leading-none text-indigo-600">{progress.total_solved}</p>
                  <p className="mt-1 text-[11px] text-slate-400">goal: 50</p>
                </div>
                <div className="py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400">Easy</p>
                  <p className="mt-1.5 text-[26px] font-extrabold leading-none text-emerald-600">{progress.easy_solved}</p>
                  <p className="mt-1 text-[11px] text-slate-400">—</p>
                </div>
                <div className="py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400">Medium</p>
                  <p className="mt-1.5 text-[26px] font-extrabold leading-none text-amber-700">{progress.medium_solved}</p>
                  <p className="mt-1 text-[11px] text-slate-400">goal: 30</p>
                </div>
                <div className="py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-slate-400">Hard</p>
                  <p className="mt-1.5 text-[26px] font-extrabold leading-none text-red-600">{progress.hard_solved}</p>
                  <p className="mt-1 text-[11px] text-slate-400">—</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-slate-700">Progress toward completion goal</p>
                  <p className="text-[12px] font-bold text-indigo-600">
                    {progress.total_solved} / {progress.total_target}
                  </p>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {progress.completion_target_met
                    ? "✓ Completion criteria met — 50 total and 30 medium solved."
                    : `${progress.total_solved}/50 total · ${progress.medium_solved}/30 medium. Keep going!`}
                </p>
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-5 py-3">
                <p className="text-[12px] text-slate-600">
                  Linked as <span className="font-semibold text-slate-800">@{progress.leetcode_username}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncProgress}
                    disabled={syncingProgress}
                    title={progress.sync_hint}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${syncingProgress ? "animate-spin" : ""}`} />
                    {syncingProgress ? "Syncing…" : "Sync Now"}
                  </button>
                  <a
                    href="https://neetcode.io/roadmap"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-[6px] border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    Go to NeetCode 150
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Update username */}
              <div className="border-t border-slate-100 px-5 py-3">
                <p className="mb-2 text-[11px] text-slate-400">Update linked username</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    disabled={linking}
                    placeholder="LeetCode username"
                    className="w-full rounded-[7px] border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleLinkUsername}
                    disabled={linking}
                    className="inline-flex items-center justify-center rounded-[7px] bg-slate-800 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {linking ? "Saving…" : "Update"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Disconnected state */
            <div className="space-y-4 px-5 py-5">
              <div>
                <p className="text-[14px] font-semibold text-slate-800">Step 1: Link your LeetCode username</p>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                  Enter your LeetCode username to sync progress. InternRoute will pull your solved count and
                  check against the completion criteria automatically.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-[9px] border border-indigo-200 bg-indigo-50 px-4 py-3">
                <span className="flex-shrink-0 text-[18px]">🎯</span>
                <p className="text-[12px] leading-5 text-indigo-800">
                  Completion target: <strong>50 total solved</strong> with at least{" "}
                  <strong>30 medium</strong>. Focus on understanding patterns — not memorizing solutions.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  disabled={linking}
                  placeholder="Enter LeetCode username"
                  className="w-full rounded-[7px] border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleLinkUsername}
                  disabled={linking}
                  className="inline-flex items-center justify-center rounded-[7px] bg-indigo-600 px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 whitespace-nowrap"
                >
                  {linking ? "Saving…" : "Link Username"}
                </button>
              </div>
            </div>
          )
        ) : null}

        {successMessage ? <p className="px-5 pb-3 text-[12px] text-emerald-700">{successMessage}</p> : null}
        {errorMessage ? <p className="px-5 pb-3 text-[12px] text-rose-600">{errorMessage}</p> : null}
      </div>

      {/* ── Learning guide ───────────────────────────────────────────────── */}
      {!openGuide ? (
        /* Closed state — full border, full radius */
        <div className="rounded-[13px] border border-slate-200 bg-white">
          <button
            type="button"
            onClick={handleToggleGuide}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[7px] bg-indigo-50 text-[18px]">
                📚
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Learning Guide</p>
                <p className="text-[12px] text-slate-500">3 steps to LeetCode mastery</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => {
                  const isCurrent = currentStep === i;
                  const isDone = visitedSteps.has(i) && !isCurrent;
                  return (
                    <div
                      key={i}
                      style={{ width: 22, height: 5, borderRadius: 3 }}
                      className={
                        isCurrent
                          ? "bg-indigo-500"
                          : isDone
                          ? "bg-emerald-500"
                          : "bg-slate-200"
                      }
                    />
                  );
                })}
              </div>
              <span className="text-[12px] text-slate-500">
                Open <ChevronDown className="inline h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        </div>
      ) : (
        /* Open state — header + nav + body + step-foot */
        <>
          {/* Guide header — top border + left + right, rounded top */}
          <div className="flex items-center justify-between rounded-t-[13px] border border-b-0 border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[7px] bg-indigo-50 text-[18px]">
                📚
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">Learning Guide</p>
                <p className="text-[12px] text-slate-500">3 steps to LeetCode mastery</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => {
                  const isCurrent = currentStep === i;
                  const isDone = visitedSteps.has(i) && !isCurrent;
                  return (
                    <div
                      key={i}
                      style={{ width: 22, height: 5, borderRadius: 3 }}
                      className={
                        isCurrent
                          ? "bg-indigo-500"
                          : isDone
                          ? "bg-emerald-500"
                          : "bg-slate-200"
                      }
                    />
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleToggleGuide}
                className="text-[12px] text-slate-500 hover:text-slate-700"
              >
                Close <ChevronDown className="inline h-3.5 w-3.5 rotate-180" />
              </button>
            </div>
          </div>

          {/* Guide nav tabs — underline style */}
          <div className="flex border-x border-slate-200 bg-white">
            {[0, 1, 2].map((i) => {
              const isCurrent = currentStep === i;
              const isDone = visitedSteps.has(i) && !isCurrent;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToStep(i)}
                  className={[
                    "flex flex-1 items-center gap-2 px-4 py-3 text-left text-[12px] font-semibold transition-colors border-b-2",
                    isCurrent
                      ? "border-indigo-600 text-indigo-600"
                      : "border-slate-200 text-slate-500 hover:text-slate-700"
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      isCurrent
                        ? "bg-indigo-600 text-white"
                        : isDone
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    ].join(" ")}
                  >
                    {isDone ? "✓" : i + 1}
                  </span>
                  {stepLabel(i)}
                </button>
              );
            })}
          </div>

          {/* Guide body — left + right border only */}
          <div className="border-x border-slate-200 bg-white">

            {/* ── Step 0: When to Start ──────────────────────────────────── */}
            {currentStep === 0 ? (
              <div className="px-9 pb-8 pt-8 space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Prerequisites</p>
                  <p className="mt-1.5 text-[19px] font-bold leading-tight text-slate-900">When to Start LeetCode</p>
                  <p className="mt-1 mb-5 text-[13px] leading-relaxed text-slate-600">
                    LeetCode does not get you noticed first. It mostly helps you pass OAs and technical interviews{" "}
                    <em>after</em> your profile is already strong enough to get callbacks.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[9px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-700">Start if</p>
                    <p className="mt-1.5 text-[12px] leading-5 text-slate-700">
                      You have good projects, solid software skills, and you are already getting OAs or interview
                      invitations.
                    </p>
                  </div>
                  <div className="rounded-[9px] border border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-rose-700">Hold off if</p>
                    <p className="mt-1.5 text-[12px] leading-5 text-slate-700">
                      You still struggle to build APIs, backend flows, or end-to-end project execution.
                    </p>
                  </div>
                </div>

                <div className="rounded-[9px] border border-indigo-200 bg-indigo-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-700">About NeetCode</p>
                  <p className="mt-1.5 text-[12px] leading-6 text-slate-700">
                    NeetCode is one of the most reliable resources in the industry for LeetCode-style interviews — even
                    experienced engineers use it. It is a proven roadmap built around pattern recognition: learn
                    patterns, then solve entire problem families from the same template.
                  </p>
                  <a
                    href="https://www.youtube.com/c/neetcode"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-[7px] bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    NeetCode YouTube (1M+)
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div>
                  <p className="text-[12px] font-semibold text-slate-700">The roadmap has two phases:</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-[9px] border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-indigo-600">Phase 1</p>
                      <p className="mt-1 text-[12px] font-semibold text-slate-800">Learn DSA</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">Data structures, patterns, and complexity</p>
                    </div>
                    <div className="rounded-[9px] border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-600">Phase 2</p>
                      <p className="mt-1 text-[12px] font-semibold text-slate-800">Grind NeetCode 150</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">Apply DSA through repetition</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── Step 1: Learn DSA First ────────────────────────────────── */}
            {currentStep === 1 ? (
              <div className="px-9 pb-8 pt-8 space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Step 1</p>
                  <p className="mt-1.5 text-[19px] font-bold leading-tight text-slate-900">Learn DSA First</p>
                  <p className="mt-1 mb-5 text-[13px] leading-relaxed text-slate-600">
                    A good DSA course should be practical: implementation, common patterns, and operation complexity
                    by data structure — not deep theory.
                  </p>
                </div>

                {/* Course options — 3-col grid */}
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-slate-700">Course options</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-[9px] border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-emerald-600">Best</p>
                      <p className="mt-1 text-[13px] font-bold text-slate-900">NeetCode Pro</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">Practical and interview-focused.</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">$119/year</p>
                      <a
                        href="https://neetcode.io/courses"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1 rounded-[6px] border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        View NeetCode Pro <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="rounded-[9px] border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-indigo-600">Free</p>
                      <p className="mt-1 text-[13px] font-bold text-slate-900">freeCodeCamp</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">Solid budget option.</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">$0</p>
                      <a
                        href="https://youtu.be/8hly31xKli0?si=QCOp_tNea5mJJpYV"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1 rounded-[6px] border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        Watch on YouTube <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="rounded-[9px] border border-slate-200 bg-white p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400">Paid</p>
                      <p className="mt-1 text-[13px] font-bold text-slate-900">Udemy</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">Cheaper paid alternative.</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">$10–20 on sale</p>
                      <a
                        href="https://www.udemy.com/course/data-structures-algorithms-python/"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1 rounded-[6px] border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        View on Udemy <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-[9px] border border-indigo-200 bg-indigo-50 px-4 py-3 text-[12px] leading-5 text-indigo-800">
                  <strong>Note:</strong> Free and cheaper options can work, but if you can afford NeetCode Pro, it is
                  usually the most practical path.
                </div>

                {/* 2-col: topics + build from scratch */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[9px] border border-slate-200 bg-white p-3">
                    <div className="text-[18px]">📋</div>
                    <p className="mt-1.5 text-[12px] font-semibold text-slate-800">Important Topics to Learn</p>
                    <p className="mt-1 text-[12px] text-slate-500 leading-5">
                      Use the NeetCode DSA for Beginners outline as a topic checklist even if you do not buy the course.
                    </p>
                    <a
                      href="https://neetcode.io/courses/dsa-for-beginners"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1 rounded-[6px] border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                      View Topics List <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="rounded-[9px] border border-slate-200 bg-white p-3">
                    <div className="text-[18px]">🔧</div>
                    <p className="mt-1.5 text-[12px] font-semibold text-slate-800">Additional: Build Structures From Scratch</p>
                    <p className="mt-1 text-[12px] text-slate-500 leading-5">
                      Build linked lists, stacks, queues, and helper operations manually. Deepens understanding of
                      tradeoffs and operations.
                    </p>
                    <a
                      href="https://neetcode.io/practice"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1 rounded-[6px] border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                      NeetCode Core Skills <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── Step 2: The Grind Strategy ─────────────────────────────── */}
            {currentStep === 2 ? (
              <div className="px-9 pb-8 pt-8 space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Step 2</p>
                  <p className="mt-1.5 text-[19px] font-bold leading-tight text-slate-900">The Grind Strategy</p>
                  <p className="mt-1 mb-5 text-[13px] leading-relaxed text-slate-600">
                    This is how to improve systematically. Most of this happens on NeetCode. Solve real practice
                    problems on LeetCode or NeetCode so this module can track your progress automatically.
                  </p>
                  <a
                    href="https://neetcode.io/roadmap"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-[6px] border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[12px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    Go to NeetCode 150
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* 5-step process */}
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-slate-700">The Process</p>
                  <div className="space-y-2">
                    {grindSteps.map((item, index) => (
                      <div key={item.title} className="flex items-start gap-2.5 rounded-[9px] border border-slate-200 bg-white px-3 py-2.5">
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="text-[12px] leading-5 text-slate-700">
                          <strong className="text-slate-900">{item.title}</strong>{" "}
                          {item.body}
                          {index === 2 ? (
                            <em className="text-slate-400"> It is completely fine to watch many video solutions at first. Pattern recognition improves with repetition.</em>
                          ) : null}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 80-20 — always shown */}
                <div className="rounded-[9px] border border-slate-200 bg-white p-4">
                  <p className="text-[12px] font-bold text-slate-800 mb-2">What to Prioritize (80-20 Rule)</p>
                  <p className="text-[12px] text-slate-500 mb-3">
                    Do not try to master everything in one pass. Focus on high-frequency fundamentals first.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[9px] border border-emerald-200 p-3">
                      <p className="text-[11px] font-bold text-emerald-700 mb-2">Focus on Basics First</p>
                      <div className="space-y-1">
                        {basicsFirst.map((it) => (
                          <p key={it} className="text-[12px] text-slate-600">{it}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[9px] border border-amber-200 p-3">
                      <p className="text-[11px] font-bold text-amber-700 mb-2">Add Later</p>
                      <div className="space-y-1">
                        {addLater.map((it) => (
                          <p key={it} className="text-[12px] text-slate-600">{it}</p>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">Add gradually once basics feel automatic.</p>
                    </div>
                  </div>
                  <p className="mt-3 rounded-[7px] border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                    <strong className="text-slate-800">Practical approach:</strong> Build confidence in fundamentals
                    first, then add advanced topics one at a time.
                  </p>
                </div>

                {/* Founder's Note */}
                <div className="border-l-[3px] border-l-indigo-400 pl-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-500">Founder's note</p>
                  <div className="mt-3 space-y-4">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">The 3-month grind</p>
                      <p className="mt-1.5 text-[12px] leading-6 text-slate-700">
                        I spent around 3 focused months building pattern intuition. I completed roughly 70–80 easy and
                        medium NeetCode 150 problems with deep understanding — moving category by category through
                        arrays, hashmaps, two pointers, sliding window, stacks, linked lists, and trees. I stopped
                        around graph-level material to avoid overload. The key was depth: understand why each approach
                        works, recognize the pattern, and explain time/space complexity.
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">Before the Amazon interview</p>
                      <p className="mt-1.5 text-[12px] leading-6 text-slate-700">
                        I had about 1 week to prepare. Because the foundation already existed, prep was mostly review.
                        In 3–4 days I reviewed 60+ previously solved problems to reactivate patterns and speed. I did
                        not need to relearn from scratch — and that preparation was enough.
                      </p>
                    </div>
                    <p className="text-[12px] leading-6 text-slate-600">
                      The initial 3-month grind is the hard part, but it creates a foundation that makes every future
                      interview cycle dramatically faster.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Step footer */}
          <div className="flex items-center justify-between rounded-b-[13px] border border-t-0 border-slate-200 bg-slate-50 px-5 py-[13px]">
            <p className="text-[12px] text-slate-500">Step {currentStep + 1} of 3</p>
            <div className="flex items-center gap-2">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={() => goToStep(currentStep - 1)}
                  className="inline-flex items-center gap-1.5 rounded-[7px] border border-slate-200 bg-white px-4 py-1.5 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  ← Previous
                </button>
              ) : null}
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={() => goToStep(currentStep + 1)}
                  className="inline-flex items-center gap-1.5 rounded-[7px] bg-indigo-600 px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-[7px] bg-emerald-100 px-4 py-1.5 text-[12px] font-semibold text-emerald-700 cursor-default"
                >
                  Done ✓
                </button>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
