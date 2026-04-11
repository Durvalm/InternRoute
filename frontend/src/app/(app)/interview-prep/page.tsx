"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  Lightbulb,
  Mail,
  MessageSquare,
  Search,
  Wrench
} from "lucide-react";
import { apiRequest } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type InterviewPrepTask = {
  id: number;
  title: string;
  description: string | null;
  weight: number;
  is_bonus: boolean;
  is_completed: boolean;
};

type InterviewPrepTasksResponse = {
  module_key: string;
  tasks: InterviewPrepTask[];
};

type TaskCompletionResponse = {
  task_id: number;
  completed: boolean;
  module_progress: Array<{ module_key: string; score: number }>;
};

type GuideStep = {
  id: "behavioral" | "technical" | "after";
  label: string;
};

const GUIDE_STEPS: GuideStep[] = [
  { id: "behavioral", label: "Behavioral & Recruiter Prep" },
  { id: "technical", label: "Technical Interviews" },
  { id: "after", label: "During & After" }
];

// ── Static data ───────────────────────────────────────────────────────────────

const roundTypes = [
  {
    tag: "Online Assessment",
    tagColor: "text-blue-700",
    name: "OA",
    body: "Some companies send this after you apply. Some skip it completely. Usually timed coding on HackerRank or CodeSignal."
  },
  {
    tag: "Recruiter Screen",
    tagColor: "text-violet-700",
    name: "15–30 min",
    body: "Usually a light check on basics, timeline, and resume. They are confirming you are real and can communicate clearly."
  },
  {
    tag: "Behavioral",
    tagColor: "text-pink-700",
    name: '"Tell me about a time..."',
    body: "Questions about communication, teamwork, ownership, and handling failure."
  },
  {
    tag: "Technical",
    tagColor: "text-emerald-700",
    name: "Coding or practical",
    body: "Could be LeetCode-style, code reading, debugging, or a project deep dive. Format varies a lot by company."
  }
];

const behavioralSteps = [
  {
    num: "1",
    title: "Research the company",
    body: "Research what matters: products, mission, values, leadership principles, culture, and what this company actually builds."
  },
  {
    num: "2",
    title: "Turn your research into one prep document",
    body: 'Write mission/values notes, "why I want to work here", "why I am a great fit", likely behavioral prompts, and rough answers.'
  },
  {
    num: "3",
    title: "Adapt answers to their values",
    body: "Keep your stories true, but emphasize the traits this company rewards (ownership, collaboration, speed, quality, etc.).",
    note: 'In my Klaviyo interview, Klaviyo emphasized ambition and ownership. When discussing my Fidelity internship and other projects, I intentionally framed things with language like "I led..." and "I owned..." to match what they were looking for.'
  },
  {
    num: "4",
    title: "Draft common behavioral answers",
    body: "Prepare categories like teamwork, conflict, failure, leadership, adaptability, and initiative. Use STAR structure for each. Check Glassdoor for questions this company asks frequently."
  },
  {
    num: "5",
    title: "Build a story bank",
    body: "This is to avoid freezing in interviews. Keep short notes from your experiences so you can quickly pull a relevant story and turn it into STAR on the spot. Categories: Teamwork · Communication · Conflict · Failure · Leadership · Initiative · Ambiguity · Resilience · Ownership · Motivation"
  },
  {
    num: "6",
    title: "Practice out loud (last step)",
    body: 'Practice saying your answers, elevator pitch, company-fit points, and "why I want to work here" out loud so delivery is natural.'
  }
];

const storyBankRows = [
  "Challenges",
  "Mistakes / Failures",
  "Experiences Enjoyed",
  "Leadership",
  "Conflicts",
  "What You'd Do Differently"
];

const technicalResearchLinks = [
  { label: "Glassdoor — recent interview reports", href: "https://www.glassdoor.com" },
  { label: "Reddit — candidate experiences", href: "https://www.reddit.com" },
  { label: "CSCareers Discord", href: "https://discord.com/invite/cscareers" },
  { label: "LinkedIn — message past interns", href: "https://www.linkedin.com" }
];

const codingSteps = [
  { title: "1. Read carefully first", body: "Do not rush to code. Restate the question and constraints in your own words." },
  { title: "2. Ask clarifying questions", body: 'Do not assume. "Is money an integer or float?" "Can input be empty?"' },
  { title: "3. Explain approaches", body: "Mention brute force first, then the improved approach and why you picked it." },
  { title: "4. Talk while coding", body: "If you get stuck, say what you are checking and what you will try next." },
  { title: "5. Analyze and test", body: "Walk through sample cases, then discuss time and space complexity." }
];

const nonLcFormats = [
  {
    id: "fmt-resume",
    title: "1. Resume and project deep dive",
    subtitle: "Very common — they start from your own work.",
    prompts: 'Typical prompts: "Tell me about a project you built", "Walk me through the architecture", "Why did you choose this technology?", "What challenges did you face?"',
    example: { label: "Example", text: "If you built an image-upload web app, be ready to explain data flow, framework choice, tradeoffs, and what would break at 10x traffic." },
    evaluating: "They are evaluating technical depth, decision making, tradeoffs, and explanation clarity."
  },
  {
    id: "fmt-code",
    title: "2. Code reading interview",
    subtitle: "Common for interns — analyze code instead of writing from scratch.",
    prompts: '"What does this do?", "What bugs might exist?", "How can this be improved?"',
    codeSnippet: `def get_average(nums):\n    total = 0\n    for i in range(len(nums)):\n        total += nums[i]\n    return total / len(nums)`,
    followUp: "Follow-ups you may get: empty list behavior, clearer implementation, time complexity, and Pythonic alternatives.",
    evaluating: "They are evaluating debugging ability, edge-case reasoning, and code quality awareness."
  },
  {
    id: "fmt-debug",
    title: "3. Debugging interview",
    subtitle: "Real-engineering style — diagnose why something fails.",
    prompts: '"Why does this crash?", "Why is output wrong?", "How would you debug this?"',
    codeSnippet: `def divide(a, b):\n    return a / b`,
    followUp: "Follow-ups you may get: zero division handling, preventive checks, and tests to avoid regressions.",
    evaluating: "They are evaluating structured debugging process, root-cause analysis, and practical engineering mindset."
  },
  {
    id: "fmt-system",
    title: "4. Small system design",
    subtitle: "Simplified system design questions for intern roles.",
    prompts: "Common prompts: URL shortener, notification system, rate limiter, caching layer.",
    example: { label: "Example prompt", text: '"Design a URL shortener like bit.ly." Be ready for endpoints, data model, short-code generation, and scaling to millions of users.' },
    evaluating: "They are evaluating how you break down systems, reason about architecture, and think about scaling."
  }
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function InterviewPrepPage() {
  const [tasks, setTasks] = useState<InterviewPrepTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [syncingTaskId, setSyncingTaskId] = useState<number | null>(null);

  const [learningGuideOpen, setLearningGuideOpen] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState(0);
  const [seenGuideSteps, setSeenGuideSteps] = useState<boolean[]>([false, false, false]);
  const [visitedGuideSteps, setVisitedGuideSteps] = useState<boolean[]>([false, false, false]);
  const [openDisclosures, setOpenDisclosures] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    setTasksLoading(true);
    setTasksError(null);

    apiRequest<InterviewPrepTasksResponse>("/dashboard/tasks?module_key=interview_prep")
      .then((data) => {
        if (!active) return;
        const taskList = data.tasks ?? [];
        setTasks(taskList);
        if (taskList[0]?.is_completed) {
          const all = [true, true, true];
          setSeenGuideSteps(all);
          setVisitedGuideSteps(all);
          setActiveGuideStep(GUIDE_STEPS.length - 1);
        }
      })
      .catch(() => {
        if (!active) return;
        setTasks([]);
        setTasksError("Unable to load module progress.");
      })
      .finally(() => {
        if (active) setTasksLoading(false);
      });

    return () => { active = false; };
  }, []);

  const interviewPrepTask = tasks[0] ?? null;
  const guideProgressCount = seenGuideSteps.filter(Boolean).length;
  const guideProgressPercent = Math.round((guideProgressCount / GUIDE_STEPS.length) * 100);

  const progressBadge =
    guideProgressCount === GUIDE_STEPS.length
      ? { label: "Complete", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
      : guideProgressCount > 0
        ? { label: "In progress", className: "border-amber-200 bg-amber-50 text-amber-700" }
        : { label: "Not started", className: "border-slate-200 bg-slate-50 text-slate-500" };

  const toggleDisclosure = (key: string) => {
    setOpenDisclosures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleLearningGuide = () => {
    setLearningGuideOpen((prev) => {
      const next = !prev;
      if (next) {
        setSeenGuideSteps((current) =>
          current.map((seen, index) => (index === activeGuideStep ? true : seen))
        );
      }
      return next;
    });
  };

  const goToGuideStep = (index: number) => {
    if (index === activeGuideStep) return;
    setVisitedGuideSteps((current) =>
      current.map((visited, i) => (i === activeGuideStep ? true : visited))
    );
    setSeenGuideSteps((current) =>
      current.map((seen, i) => (i === index ? true : seen))
    );
    setActiveGuideStep(index);
  };

  const navigateGuide = (direction: -1 | 1) => {
    const nextIndex = activeGuideStep + direction;
    if (nextIndex < 0 || nextIndex >= GUIDE_STEPS.length) return;
    goToGuideStep(nextIndex);
  };

  const handleGuideCompletion = useCallback(() => {
    const all = [true, true, true];
    setVisitedGuideSteps(all);
    setSeenGuideSteps(all);

    if (!interviewPrepTask || interviewPrepTask.is_completed || syncingTaskId === interviewPrepTask.id) return;

    setSyncingTaskId(interviewPrepTask.id);
    setTasksError(null);

    void apiRequest<TaskCompletionResponse>(`/dashboard/tasks/${interviewPrepTask.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true })
    })
      .then(() => {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === interviewPrepTask.id ? { ...item, is_completed: true } : item
          )
        );
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unable to save progress right now.";
        setTasksError(message);
      })
      .finally(() => setSyncingTaskId(null));
  }, [interviewPrepTask, syncingTaskId]);

  const isLastStep = activeGuideStep === GUIDE_STEPS.length - 1;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-16">

      {/* ── Module header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Module 07</p>
          <h1 className="mt-0.5 text-[22px] font-bold tracking-[-0.02em] text-slate-900">Interview Prep</h1>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-700">
          After Readiness
        </span>
      </div>

      <p className="text-[13px] leading-6 text-slate-500">
        If you made it to interviews, you already did hard work — skills, projects, applications, and often OAs. Now
        the goal is focused preparation so you can convert interviews into offers.
      </p>

      {/* Progress row */}
      {!tasksLoading ? (
        <div className="flex items-center gap-3 rounded-[9px] border border-slate-200 bg-white px-4 py-2.5">
          <span className="whitespace-nowrap text-[12px] font-semibold text-slate-600">Interview Prep</span>
          <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${guideProgressPercent}%` }} />
          </div>
          <span className="whitespace-nowrap text-[12px] font-semibold text-slate-500">
            {guideProgressCount} / {GUIDE_STEPS.length} steps
          </span>
          <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${progressBadge.className}`}>
            {progressBadge.label}
          </span>
        </div>
      ) : null}

      {/* ── Hero: How Interviews Work ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-[16px] font-bold text-slate-900">How Tech Interviews Usually Work</p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Companies usually evaluate both behavioral and technical skills. Sometimes in separate rounds, sometimes
            combined.
          </p>
        </div>

        {/* 4 round types */}
        <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
          {roundTypes.map((rt) => (
            <div key={rt.name} className="bg-white px-[18px] py-4">
              <p className={`text-[10px] font-bold uppercase tracking-[0.08em] ${rt.tagColor} mb-1.5`}>{rt.tag}</p>
              <p className="text-[13px] font-bold text-slate-900 mb-1.5">{rt.name}</p>
              <p className="text-[11px] leading-[1.55] text-slate-500">{rt.body}</p>
            </div>
          ))}
        </div>

        {/* 2 prep types */}
        <div className="grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200">
          <div className="bg-white px-5 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 mb-1">Interview Type 1</p>
            <p className="text-[13px] font-bold text-slate-900 mb-1">Behavioral / Recruiter</p>
            <p className="text-[12px] leading-[1.55] text-slate-500">
              Prepare stories, company-fit messaging, and clear STAR responses. Research the company first.
            </p>
          </div>
          <div className="bg-white px-5 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 mb-1">Interview Type 2</p>
            <p className="text-[13px] font-bold text-slate-900 mb-1">Technical</p>
            <p className="text-[12px] leading-[1.55] text-slate-500">
              First identify format (LeetCode vs. practical), then train for that format specifically. Don't prep the
              wrong thing.
            </p>
          </div>
        </div>

        {/* Disclaimer — bottom */}
        <div className="flex items-start gap-2.5 border-t border-amber-200 bg-amber-50 px-5 py-3">
          <span className="shrink-0 text-[15px]">⚠️</span>
          <p className="text-[12px] leading-6 text-amber-900">
            <strong>Prep disclaimer:</strong> before each round, confirm if it is behavioral, technical, or mixed.
            That one answer changes your prep plan entirely.
          </p>
        </div>
      </div>

      {/* ── Learning Guide ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">

        {/* Toggle header */}
        <button
          type="button"
          onClick={toggleLearningGuide}
          className="flex w-full items-center justify-between gap-4 px-5 py-[15px] text-left transition hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">Learning Guide</p>
              <p className="mt-0.5 text-[12px] text-slate-400">
                Behavioral prep, technical interviews, and performing on the day — 3 reads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex gap-[5px]">
              {GUIDE_STEPS.map((step, index) => {
                const isCurrent = learningGuideOpen && index === activeGuideStep;
                const isVisited = visitedGuideSteps[index] && index !== activeGuideStep;
                return (
                  <span
                    key={step.id}
                    className={`h-[5px] w-[22px] rounded-full transition-colors ${
                      isCurrent ? "bg-indigo-600" : isVisited ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-1 text-[12px] font-semibold text-slate-400">
              {learningGuideOpen ? "Close" : "Open"}
              <ChevronDown className={`h-4 w-4 transition-transform ${learningGuideOpen ? "rotate-180" : ""}`} />
            </div>
          </div>
        </button>

        {learningGuideOpen ? (
          <>
            {/* Step tabs */}
            <div className="flex overflow-x-auto border-t border-slate-200 bg-slate-50 [scrollbar-width:none]">
              {GUIDE_STEPS.map((step, index) => {
                const isActive = index === activeGuideStep;
                const isVisited = visitedGuideSteps[index] && !isActive;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToGuideStep(index)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-[18px] py-[11px] text-[13px] font-medium transition-colors ${
                      isActive
                        ? "border-indigo-600 bg-white text-indigo-600"
                        : isVisited
                          ? "border-transparent text-emerald-600 hover:bg-white"
                          : "border-transparent text-slate-400 hover:bg-white hover:text-slate-700"
                    }`}
                  >
                    <span
                      className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : isVisited
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isVisited ? "✓" : index + 1}
                    </span>
                    {step.label}
                  </button>
                );
              })}
            </div>

            {/* ── Step 1: Behavioral Prep ────────────────────────────────── */}
            {GUIDE_STEPS[activeGuideStep]?.id === "behavioral" ? (
              <div className="border-t border-slate-200 px-9 py-8">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">
                  Behavioral & Recruiter
                </p>
                <h2 className="mb-1 text-[19px] font-bold leading-[1.3] text-slate-900">
                  Behavioral & Recruiter Prep
                </h2>
                <p className="mb-6 text-[13px] leading-6 text-slate-500">
                  This is where most candidates can gain edge quickly. The goal is to make your stories clear,
                  relevant, and easy to deliver under pressure.
                </p>

                {/* 6-step list */}
                <p className="mb-2.5 text-[12px] font-semibold text-slate-700">
                  The 6-Step Behavioral Prep Process
                </p>
                <div className="mb-5 flex flex-col gap-2">
                  {behavioralSteps.map((step) => (
                    <div
                      key={step.num}
                      className="flex gap-3 rounded-[9px] border border-slate-200 bg-white px-[14px] py-3"
                    >
                      <div className="mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-pink-100 text-[10px] font-extrabold text-pink-700">
                        {step.num}
                      </div>
                      <div>
                        <p className="mb-[3px] text-[12px] font-bold text-indigo-800">{step.title}</p>
                        <p className="text-[12px] leading-[1.55] text-slate-500">{step.body}</p>
                        {step.note ? (
                          <p className="mt-1 text-[12px] italic leading-[1.55] text-slate-400">{step.note}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* STAR method */}
                <div className="mb-3 rounded-[9px] border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-[12px] font-bold text-slate-900">
                    STAR Method (Use this for behavioral answers)
                  </p>
                  <p className="mb-3 text-[12px] leading-6 text-slate-500">
                    Structure answers as Situation, Task, Action, Result. This keeps answers concise and easier for
                    the interviewer to follow.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Situation", hint: "set the scene briefly" },
                      { label: "Task", hint: "your specific responsibility" },
                      { label: "Action", hint: "what you specifically did" },
                      { label: "Result", hint: "the outcome, quantified if possible" }
                    ].map((part) => (
                      <div
                        key={part.label}
                        className="rounded-[7px] border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600"
                      >
                        <strong className="text-slate-900">{part.label}</strong> — {part.hint}
                      </div>
                    ))}
                  </div>
                </div>

                {/* STAR example — expandable */}
                <div className="mb-5 overflow-hidden rounded-[9px] border border-slate-200">
                  <button
                    type="button"
                    onClick={() => toggleDisclosure("star-example")}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${openDisclosures["star-example"] ? "border-b border-indigo-200 bg-indigo-50" : "bg-white hover:bg-indigo-50"}`}
                  >
                    <p className={`text-[12px] font-semibold ${openDisclosures["star-example"] ? "text-indigo-800" : "text-slate-700"}`}>
                      Show STAR example answer
                    </p>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openDisclosures["star-example"] ? "rotate-180 text-indigo-500" : ""}`} />
                  </button>
                  {openDisclosures["star-example"] ? (
                    <div className="border-indigo-200 bg-indigo-50 px-4 py-4">
                      <p className="mb-2 text-[12px] font-semibold text-slate-900">
                        Question: Tell me about a time you had to meet a tight deadline.
                      </p>
                      <div className="space-y-2 text-[12px]">
                        <div className="rounded-[7px] border border-violet-100 bg-violet-50 p-2.5">
                          <span className="font-semibold text-violet-900">Situation:</span>{" "}
                          <span className="text-slate-700">Group assignment due in 3 days, one teammate dropped out last minute.</span>
                        </div>
                        <div className="rounded-[7px] border border-pink-100 bg-pink-50 p-2.5">
                          <span className="font-semibold text-pink-900">Task:</span>{" "}
                          <span className="text-slate-700">Finish both my part and the missing part before deadline.</span>
                        </div>
                        <div className="rounded-[7px] border border-rose-100 bg-rose-50 p-2.5">
                          <span className="font-semibold text-rose-900">Action:</span>{" "}
                          <span className="text-slate-700">Re-scoped to core deliverables, prioritized, worked late, and updated the professor proactively.</span>
                        </div>
                        <div className="rounded-[7px] border border-amber-100 bg-amber-50 p-2.5">
                          <span className="font-semibold text-amber-900">Result:</span>{" "}
                          <span className="text-slate-700">Submitted on time, earned a high grade, and learned prioritization under pressure.</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Story bank table */}
                <div className="mb-3 rounded-[9px] border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-1.5 text-[12px] font-bold text-slate-900">
                    Story Bank Grid (idea from <em>Cracking the Coding Interview</em>)
                  </p>
                  <p className="mb-3 text-[12px] text-slate-500">
                    Map each experience to common behavioral categories so when a question comes, you can pick the
                    right story and build a STAR answer quickly.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-200">
                          <th className="border border-slate-300 px-2.5 py-[7px] text-left font-semibold text-slate-600">
                            Common Topics
                          </th>
                          {["Job 1", "Job 2", "Project 1", "Project 2"].map((col) => (
                            <th
                              key={col}
                              className="border border-slate-300 px-2.5 py-[7px] text-center font-semibold text-slate-600"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {storyBankRows.map((row) => (
                          <tr key={row}>
                            <td className="border border-slate-200 px-2.5 py-[7px] text-slate-600">{row}</td>
                            <td className="border border-slate-200 bg-indigo-50 px-2.5 py-[7px]" />
                            <td className="border border-slate-200 bg-indigo-50 px-2.5 py-[7px]" />
                            <td className="border border-slate-200 bg-indigo-50 px-2.5 py-[7px]" />
                            <td className="border border-slate-200 bg-indigo-50 px-2.5 py-[7px]" />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">Build the bank once so examples are always ready.</p>
                </div>

                {/* How to build story bank — expandable */}
                <div className="overflow-hidden rounded-[9px] border border-slate-200">
                  <button
                    type="button"
                    onClick={() => toggleDisclosure("story-bank")}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${openDisclosures["story-bank"] ? "border-b border-indigo-200 bg-indigo-50" : "bg-white hover:bg-indigo-50"}`}
                  >
                    <p className={`text-[12px] font-semibold ${openDisclosures["story-bank"] ? "text-indigo-800" : "text-slate-700"}`}>
                      How to build your story bank
                    </p>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openDisclosures["story-bank"] ? "rotate-180 text-indigo-500" : ""}`} />
                  </button>
                  {openDisclosures["story-bank"] ? (
                    <div className="border-indigo-200 bg-indigo-50 px-4 py-4">
                      <div className="grid gap-2 text-[12px] md:grid-cols-3">
                        {[
                          { step: "Step 1", text: "Pick one experience: internship, project, class, club, or even a non-tech job." },
                          { step: "Step 2", text: "For that experience, write a challenge, failure, initiative, conflict, and impact." },
                          { step: "Step 3", text: "Repeat for every project and experience. Use these to build a STAR answer on the spot." }
                        ].map((item) => (
                          <div key={item.step} className="rounded-[7px] border border-indigo-200 bg-white p-2.5">
                            <p className="mb-0.5 text-[11px] font-bold text-indigo-900">{item.step}</p>
                            <p className="text-[11px] leading-5 text-slate-700">{item.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-[7px] border border-slate-200 bg-white p-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                          Example card
                        </p>
                        <p className="mb-1.5 text-[12px] font-semibold text-slate-900">Fidelity Internship</p>
                        <div className="space-y-1 text-[11px] leading-5 text-slate-600">
                          <p><span className="font-semibold text-slate-800">Challenge:</span> Built a solo data pipeline flexible enough for multiple data sources.</p>
                          <p><span className="font-semibold text-slate-800">Failure:</span> Missed early alignment with manager before a business presentation.</p>
                          <p><span className="font-semibold text-slate-800">Initiative:</span> Proposed an automation step that removed repeated manual checks.</p>
                          <p><span className="font-semibold text-slate-800">Conflict:</span> Resolved requirement mismatch by resetting expectations with stakeholders.</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* ── Step 2: Technical Interviews ──────────────────────────── */}
            {GUIDE_STEPS[activeGuideStep]?.id === "technical" ? (
              <div className="border-t border-slate-200 px-9 py-8">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Technical</p>
                <h2 className="mb-1 text-[19px] font-bold leading-[1.3] text-slate-900">Technical Interviews</h2>
                <p className="mb-6 text-[13px] leading-6 text-slate-500">
                  Research the format first. If you prep for LeetCode but get a practical interview, you lose time.
                  If you prep practical but get LeetCode, same problem.
                </p>

                {/* Research the format */}
                <div className="mb-4 rounded-[9px] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 text-slate-500" />
                    <p className="text-[12px] font-bold text-slate-900">Research the format first</p>
                  </div>
                  <p className="mb-3 text-[12px] leading-6 text-slate-500">
                    Use these resources before starting prep. In CSCareers Discord, use the search button with your
                    company name, read existing interview mentions in chats, then ask in-channel or DM people who
                    recently interviewed.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {technicalResearchLinks.map((r) => (
                      <a
                        key={r.label}
                        href={r.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-[6px] border border-indigo-200 bg-indigo-50 px-2.5 py-[5px] text-[12px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white"
                      >
                        {r.label}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* LeetCode-style vs not LeetCode — 2-col */}
                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  {/* If LeetCode */}
                  <div className="rounded-[9px] border border-slate-200 bg-white p-4">
                    <div className="mb-2.5 flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5 text-slate-600" />
                      <p className="text-[12px] font-bold text-slate-900">If LeetCode-style</p>
                    </div>

                    <p className="mb-1 text-[12px] font-semibold text-slate-700">Set realistic expectations</p>
                    <p className="mb-2.5 text-[12px] leading-[1.55] text-slate-500">
                      LeetCode and DSA take months to build. If you are short on time, focus on high-yield categories
                      and interview behavior instead of trying to cover everything.
                    </p>

                    <p className="mb-1 text-[12px] font-semibold text-slate-700">
                      Flow A: already did NC150 (or similar)
                    </p>
                    <p className="mb-2.5 text-[12px] leading-[1.55] text-slate-500">
                      You can usually review most key patterns in about a week, skip hard problems in a crunch, and
                      spend extra time on tagged questions.
                    </p>

                    <div className="mb-2.5 rounded-[6px] border border-amber-200 bg-amber-50 p-2.5">
                      <p className="mb-1 text-[11px] font-bold text-amber-800">Flow B: new to DSA / LeetCode</p>
                      <p className="text-[11px] leading-[1.55] text-amber-900">
                        Prioritize easiest high-yield topics first: arrays, hash maps, linked lists, and binary
                        search. Best return with limited prep time.
                      </p>
                    </div>

                    <div className="mb-3 rounded-[6px] border border-slate-200 bg-slate-50 p-2.5 text-[11px] leading-[1.55] text-slate-600">
                      LeetCode tagged questions are problems reported by people interviewing at that specific company.
                      Get them through LeetCode Premium, or gather them from communities and peers. Both flows should
                      use tagged questions.
                    </div>

                    {/* Amazon prep — expandable */}
                    <div className="overflow-hidden rounded-[7px] border border-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleDisclosure("amazon-prep")}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors ${openDisclosures["amazon-prep"] ? "border-b border-slate-200 bg-emerald-50" : "bg-slate-50 hover:bg-emerald-50"}`}
                      >
                        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <p className={`flex-1 text-[12px] font-semibold ${openDisclosures["amazon-prep"] ? "text-emerald-800" : "text-slate-700"}`}>
                          How I prepared for Amazon (after NC150 baseline)
                        </p>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openDisclosures["amazon-prep"] ? "rotate-180" : ""}`} />
                      </button>
                      {openDisclosures["amazon-prep"] ? (
                        <div className="bg-white px-3 py-3">
                          <p className="mb-2 text-[12px] leading-6 text-slate-700">
                            In 5 days I reviewed key NC150 patterns, skipped hard problems, and prioritized
                            Amazon-tagged reports. I got asked LRU Cache, which was in my review set.
                          </p>
                          <div className="overflow-hidden rounded-[7px] border border-slate-200">
                            <Image
                              src="/interview/common_questions.png"
                              alt="Amazon interview prep notes with common and tagged coding questions"
                              width={1600}
                              height={1300}
                              className="h-auto w-full"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* If not LeetCode */}
                  <div className="rounded-[9px] border border-slate-200 bg-white p-4">
                    <div className="mb-2.5 flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-slate-600" />
                      <p className="text-[12px] font-bold text-slate-900">If not LeetCode</p>
                    </div>
                    <p className="mb-3 text-[12px] leading-6 text-slate-500">
                      Format varies a lot by company and team. Research is even more important here. Common types of
                      non-LeetCode technical interviews:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {nonLcFormats.map((item) => (
                        <div key={item.id} className="overflow-hidden rounded-[7px] border border-slate-200">
                          <button
                            type="button"
                            onClick={() => toggleDisclosure(item.id)}
                            className={`flex w-full items-start justify-between px-3 py-2.5 text-left transition-colors ${openDisclosures[item.id] ? "border-b border-slate-200 bg-slate-100" : "bg-slate-50 hover:bg-slate-100"}`}
                          >
                            <div>
                              <p className="text-[12px] font-semibold text-slate-900">{item.title}</p>
                              <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                            </div>
                            <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${openDisclosures[item.id] ? "rotate-180" : ""}`} />
                          </button>
                          {openDisclosures[item.id] ? (
                            <div className="space-y-2.5 bg-white px-3 py-3">
                              <p className="text-[12px] leading-6 text-slate-600">{item.prompts}</p>
                              {item.example ? (
                                <div className="rounded-[7px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{item.example.label}</p>
                                  <p className="text-[12px] leading-6 text-slate-700">{item.example.text}</p>
                                </div>
                              ) : null}
                              {item.codeSnippet ? (
                                <div className="rounded-[7px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Example snippet</p>
                                  <pre className="text-[11px] leading-5 text-slate-700">{item.codeSnippet}</pre>
                                </div>
                              ) : null}
                              {item.followUp ? (
                                <p className="text-[12px] leading-6 text-slate-600">{item.followUp}</p>
                              ) : null}
                              {item.evaluating ? (
                                <p className="text-[11px] leading-5 text-slate-400">{item.evaluating}</p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coding question process */}
                <div className="rounded-[9px] border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-[12px] font-bold text-slate-900">How to Solve Coding Questions</p>
                  <p className="mb-3 text-[12px] text-slate-500">
                    You do not need to be perfect. You need a clear process and strong communication.
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {codingSteps.map((step) => (
                      <div key={step.title} className="rounded-[7px] border border-slate-200 bg-white p-2.5">
                        <p className="mb-1 text-[11px] font-bold text-slate-900">{step.title}</p>
                        <p className="text-[11px] leading-[1.5] text-slate-500">{step.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5">
                    <a
                      href="https://youtu.be/1qw5ITr3k9E?si=0Cut-Mdxu2aoHzZg"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-[6px] border border-indigo-200 bg-indigo-50 px-2.5 py-[5px] text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white"
                    >
                      Optional: watch a simple mock coding interview (freeCodeCamp)
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── Step 3: During & After ─────────────────────────────────── */}
            {GUIDE_STEPS[activeGuideStep]?.id === "after" ? (
              <div className="border-t border-slate-200 px-9 py-8">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">
                  Closing the Loop
                </p>
                <h2 className="mb-1 text-[19px] font-bold leading-[1.3] text-slate-900">
                  During & After the Interview
                </h2>
                <p className="mb-6 text-[13px] leading-6 text-slate-500">
                  What you do at the end of every interview, and how to follow up, matters more than most students
                  realize.
                </p>

                <div className="mb-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[9px] border border-slate-200 bg-white px-[15px] py-[13px]">
                    <div className="mb-1.5 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      <p className="text-[12px] font-semibold text-slate-900">
                        Ask thoughtful questions before wrapping up
                      </p>
                    </div>
                    <p className="text-[12px] leading-6 text-slate-500">
                      Examples: "What makes an intern successful here?" and "What projects did past interns usually
                      work on?" These show genuine interest and give you real information about the role.
                    </p>
                  </div>
                  <div className="rounded-[9px] border border-slate-200 bg-white px-[15px] py-[13px]">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <p className="text-[12px] font-semibold text-slate-900">Send a short thank-you email after</p>
                    </div>
                    <p className="text-[12px] leading-6 text-slate-500">
                      Thank them for their time, mention one specific discussion point, and restate your interest.
                      Most candidates don't do this. It takes 3 minutes and leaves a lasting impression.
                    </p>
                  </div>
                </div>

                {/* Dark conclusion block */}
                <div className="rounded-[9px] bg-[#1e1b4b] px-[22px] py-5 text-center">
                  <p className="mb-3 text-[14px] font-bold text-white">Conclusion</p>
                  <p className="mb-3 text-[13px] leading-7 text-white/70">
                    If your resume reached interview stage, the company already believes you could be a hire. They are
                    not spending an engineer hour interviewing someone they see as impossible to hire. Recruiters are
                    also measured on successful hires, so everyone involved wants this to work.
                  </p>
                  <p className="mb-4 text-[13px] leading-7 text-white/70">
                    I have passed interviews where I did not fully solve the coding question. What matters most is
                    being likable, showing genuine interest, thinking clearly, asking good questions, collaborating
                    with the interviewer, and staying steady when things get uncomfortable.
                  </p>
                  <div className="inline-block rounded-[9px] bg-white/10 px-[18px] py-2.5 text-[13px] font-semibold leading-6 text-white">
                    You do not need perfect answers.<br />
                    You need clear thinking, communication, and good collaboration signals.
                  </div>
                </div>
              </div>
            ) : null}

            {/* Guide footer */}
            <div className="flex items-center justify-between rounded-b-[13px] border-t border-slate-200 bg-slate-50 px-5 py-[13px]">
              <span className="text-[12px] text-slate-400">
                Step {activeGuideStep + 1} of {GUIDE_STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateGuide(-1)}
                  disabled={activeGuideStep === 0}
                  className="inline-flex items-center gap-1.5 rounded-[7px] border border-slate-200 bg-white px-3 py-[7px] text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                {isLastStep ? (
                  <button
                    type="button"
                    onClick={handleGuideCompletion}
                    disabled={syncingTaskId !== null}
                    className="inline-flex items-center gap-1.5 rounded-[7px] bg-emerald-600 px-4 py-[7px] text-[12px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Done ✓
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigateGuide(1)}
                    className="inline-flex items-center gap-1.5 rounded-[7px] bg-indigo-600 px-3 py-[7px] text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-[9px] bg-indigo-600 px-5 py-4 text-white">
        <div>
          <p className="text-[14px] font-bold">Up next: LeetCode</p>
          <p className="mt-1 text-[12px] text-indigo-100">
            Optional advanced track for algorithm-heavy interview pipelines.
          </p>
        </div>
        <a
          href="/leetcode"
          className="rounded-[7px] bg-white px-4 py-2.5 text-[13px] font-bold text-indigo-600"
        >
          Continue to LeetCode →
        </a>
      </div>

      {tasksError ? (
        <div className="rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          {tasksError}
        </div>
      ) : null}
    </div>
  );
}
