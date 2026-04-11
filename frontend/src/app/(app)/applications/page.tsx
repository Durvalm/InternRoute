"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  FileText,
  Filter,
  Github,
  Linkedin,
  Rocket,
  Users,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type ApplicationsTask = {
  id: number;
  title: string;
  description: string | null;
  weight: number;
  is_bonus: boolean;
  is_completed: boolean;
};

type ApplicationsTasksResponse = {
  module_key: string;
  tasks: ApplicationsTask[];
};

type TaskCompletionResponse = {
  task_id: number;
  completed: boolean;
  module_progress: Array<{ module_key: string; score: number }>;
};

type GuideStep = {
  id: "mindset" | "sources" | "system" | "beyond";
  label: string;
};

type DisclosureKey = "tracker" | "oaPrep" | "tailoring";

const GUIDE_STEPS: GuideStep[] = [
  { id: "mindset", label: "The Mindset" },
  { id: "sources", label: "Where to Find Jobs" },
  { id: "system", label: "Apply Fast" },
  { id: "beyond", label: "OAs & Beyond" }
];

const semesterRhythm = [
  {
    number: "01",
    title: "August: jobs start dropping",
    description: "Internship postings begin. Checking for jobs becomes part of your daily routine.",
    badge: "bg-amber-500"
  },
  {
    number: "02",
    title: "August through March: keep searching and applying",
    description: "Fall is busiest, but roles still open through winter and into March. Stay in the market the whole cycle.",
    badge: "bg-blue-600"
  },
  {
    number: "03",
    title: "Your edge is speed and consistency",
    description: "A fast system, a daily target, and enough stamina to keep showing up for months.",
    badge: "bg-indigo-600"
  },
  {
    number: "04",
    title: "Rejections are normal, not personal",
    description: "Hundreds of rejections can happen before one offer. Keep running the system and let probability work.",
    badge: "bg-emerald-600"
  }
];

const applicationPipeline = [
  { title: "You apply", note: "Should be fast once ready", icon: FileText, shell: "bg-slate-100 text-slate-700" },
  { title: "ATS / automated filter", note: "Many end here", icon: Filter, shell: "bg-red-50 text-red-700" },
  { title: "Maybe OA", note: "Some companies send this first", icon: Code2, shell: "bg-emerald-50 text-emerald-700" },
  { title: "Maybe recruiter or resume review", note: "If you pass ATS or OA", icon: Users, shell: "bg-cyan-50 text-cyan-700" },
  { title: "Interview(s)", note: "Odds improve here", icon: Briefcase, shell: "bg-purple-50 text-purple-700" },
  { title: "Offer or rejection", note: "System needs one good result", icon: CheckCircle2, shell: "bg-emerald-50 text-emerald-700" }
];

const keyTools = [
  { label: "Simplify", href: "https://simplify.jobs/", highlight: true, note: "Main daily tool" },
  { label: "GitHub Internship List", href: "https://github.com/SimplifyJobs/Summer2026-Internships" },
  { label: "LinkedIn Jobs", href: "https://www.linkedin.com/jobs/" },
  { label: "Levels.fyi", href: "https://www.levels.fyi/internships/", note: "Salary research" }
];

const oaGroups = [
  {
    title: "Automatic OAs",
    description: "Almost everyone who applies gets one.",
    companies: ["JP Morgan", "IBM", "Roblox", "Barclays", "Snowflake", "Optiver"],
    shell: "bg-emerald-50 border-emerald-200",
    badgeShell: "border-emerald-300 text-emerald-700"
  },
  {
    title: "Selective OAs",
    description: "Only after your resume passes an early screen.",
    companies: ["Netflix", "Meta", "Amazon", "GitHub"],
    shell: "bg-purple-50 border-purple-200",
    badgeShell: "border-purple-300 text-purple-700"
  }
];

const trackerOptions = [
  { title: "Google Sheets", description: "Fast, simple, free" },
  { title: "Notion Template", description: "Better views and richer workflow" },
  { title: "Simplify Tracker", description: "Automatic if you use the extension" }
];

function LinkedInHackVisual() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">Visual walkthrough</p>

      <div className="overflow-hidden rounded-[9px] border border-slate-200 bg-slate-100">
        <div className="border-b border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#0A66C2] text-sm font-bold text-white">
              in
            </div>
            <div className="flex-1 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700">
              software (intern)
            </div>
          </div>
        </div>
        <div className="px-3 py-3">
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-semibold text-white">Jobs</div>
            <div className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700">
              Date posted
            </div>
          </div>
          <div className="mt-2 max-w-[200px] rounded-[9px] border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="space-y-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                Any time
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                Past week
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-indigo-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                </span>
                <span className="font-semibold text-slate-900">Past 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[9px] border border-slate-700 bg-slate-900 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Then change the URL</p>
        <div className="mt-2 rounded-[7px] border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-[10px] text-slate-100">
          .../jobs/search/?f_TPR=r
          <span className="rounded bg-amber-300 px-1 font-bold text-slate-900">86400</span>
          ...
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-300">
          <ArrowRight className="h-3 w-3" />
          Replace with{" "}
          <span className="rounded bg-emerald-300 px-1 font-bold text-emerald-950">3600</span>{" "}
          to see the last hour instead
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [tasks, setTasks] = useState<ApplicationsTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [syncingTaskId, setSyncingTaskId] = useState<number | null>(null);

  const [learningGuideOpen, setLearningGuideOpen] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState(0);
  const [seenGuideSteps, setSeenGuideSteps] = useState<boolean[]>([false, false, false, false]);
  const [visitedGuideSteps, setVisitedGuideSteps] = useState<boolean[]>([false, false, false, false]);
  const [openDisclosures, setOpenDisclosures] = useState<Record<DisclosureKey, boolean>>({
    tracker: false,
    oaPrep: false,
    tailoring: false
  });

  useEffect(() => {
    let active = true;
    setTasksLoading(true);
    setTasksError(null);

    apiRequest<ApplicationsTasksResponse>("/dashboard/tasks?module_key=applications")
      .then((data) => {
        if (!active) return;
        const taskList = data.tasks ?? [];
        setTasks(taskList);
        if (taskList[0]?.is_completed) {
          const all = [true, true, true, true];
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

    return () => {
      active = false;
    };
  }, []);

  const applicationsTask = tasks[0] ?? null;
  const guideProgressCount = seenGuideSteps.filter(Boolean).length;
  const guideProgressPercent = Math.round((guideProgressCount / GUIDE_STEPS.length) * 100);

  const progressBadge =
    guideProgressCount === GUIDE_STEPS.length
      ? { label: "Complete", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
      : guideProgressCount > 0
        ? { label: "In progress", className: "border-amber-200 bg-amber-50 text-amber-700" }
        : { label: "Not started", className: "border-slate-200 bg-slate-50 text-slate-600" };

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

  const toggleDisclosure = (key: DisclosureKey) => {
    setOpenDisclosures((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleGuideCompletion = useCallback(() => {
    const all = [true, true, true, true];
    setVisitedGuideSteps(all);
    setSeenGuideSteps(all);

    if (!applicationsTask || applicationsTask.is_completed || syncingTaskId === applicationsTask.id) return;

    setSyncingTaskId(applicationsTask.id);
    setTasksError(null);

    void apiRequest<TaskCompletionResponse>(`/dashboard/tasks/${applicationsTask.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true })
    })
      .then(() => {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === applicationsTask.id ? { ...item, is_completed: true } : item
          )
        );
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unable to save progress right now.";
        setTasksError(message);
      })
      .finally(() => setSyncingTaskId(null));
  }, [applicationsTask, syncingTaskId]);

  const isLastStep = activeGuideStep === GUIDE_STEPS.length - 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* ── Module Header ── */}
      <section className="space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-600">
              Module 05
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              Core Four
            </span>
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-slate-950">Applications</h1>
          <p className="mt-1 max-w-[860px] text-[13px] leading-6 text-slate-500">
            Once your resume is good enough, the next problem is execution. This module covers the right channels,
            applying fast, automating the repetitive parts, and running the same recruiting flow strong students
            go through every semester. This cycle can run from August through March, so expect a long process and do
            not take rejections personally.
          </p>
        </div>

        <div className="rounded-[9px] border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-amber-800">August to March mindset</p>
          <p className="mt-1.5 text-[12px] leading-6 text-amber-900">
            This could be a 7-month grind, not a 2-week sprint. Be patient, expect heavy rejection volume, and
            keep your pace steady through the full window.
          </p>
        </div>

        {/* Progress row */}
        <div className="flex items-center gap-3 rounded-[9px] border border-slate-200 bg-white px-4 py-3">
          <span className="whitespace-nowrap text-[12px] font-medium text-slate-500">Applications</span>
          <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${guideProgressPercent}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-[13px] font-bold text-indigo-600">
            {guideProgressCount} / {GUIDE_STEPS.length} steps
          </span>
          <span
            className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${progressBadge.className}`}
          >
            {progressBadge.label}
          </span>
        </div>

        {/* ── Primary Action Hero ── */}
        <div className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-[18px] font-bold text-slate-950">Application Process Overview</h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Your August-to-March rhythm and what happens after you hit submit
            </p>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-2">
            {/* Semester Rhythm */}
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Your Semester Rhythm
              </p>
              <div className="space-y-3">
                {semesterRhythm.map((step) => (
                  <div key={step.number} className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${step.badge}`}
                    >
                      {step.number}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{step.title}</p>
                      <p className="mt-0.5 text-[12px] leading-5 text-slate-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline */}
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                After You Apply
              </p>
              <div className="space-y-1.5">
                {applicationPipeline.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className={`flex items-center justify-between rounded-[7px] px-3 py-2 ${step.shell}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-[12px] font-semibold">{step.title}</span>
                      </div>
                      <span className="text-[11px] opacity-60">{step.note}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid border-t border-slate-200 md:grid-cols-3">
            {[
              { value: "300+", label: "Applications may be needed" },
              { value: "Aug-Mar", label: "Consistency across the full cycle matters" },
              { value: "<3 min", label: "Most applications should take less" }
            ].map((stat, i) => (
              <div
                key={stat.value}
                className={`px-5 py-4 ${i < 2 ? "border-b border-slate-200 md:border-b-0 md:border-r" : ""}`}
              >
                <p className="text-[26px] font-bold leading-none text-slate-900">{stat.value}</p>
                <p className="mt-1.5 text-[12px] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Key tools */}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Key Tools</span>
              {keyTools.map((tool) => (
                <a
                  key={tool.label}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    tool.highlight
                      ? "border-indigo-700 bg-indigo-700 text-white hover:border-indigo-800 hover:bg-indigo-800"
                      : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
                  }`}
                >
                  {tool.label}
                  {tool.note ? (
                    <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]">
                      {tool.note}
                    </span>
                  ) : null}
                  <ArrowRight className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Learning Guide ── */}
      <section>
        <button
          type="button"
          onClick={toggleLearningGuide}
          className={`flex w-full items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 text-left transition hover:bg-slate-50 ${
            learningGuideOpen ? "rounded-t-[13px]" : "rounded-[13px]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-950">Learning Guide</p>
              <p className="mt-0.5 text-[12px] text-slate-400">
                The mindset, finding jobs, applying fast, OAs and beyond — 4 reads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-[5px]">
              {GUIDE_STEPS.map((step, index) => {
                const isCurrent = learningGuideOpen && index === activeGuideStep;
                const isVisited = visitedGuideSteps[index] && index !== activeGuideStep;
                return (
                  <span
                    key={step.id}
                    className={`h-[5px] w-[22px] rounded-full ${
                      isCurrent ? "bg-indigo-600" : isVisited ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-1 text-[12px] font-semibold text-slate-400">
              {learningGuideOpen ? "Close" : "Open"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${learningGuideOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </button>

        {learningGuideOpen ? (
          <>
            {/* Step tab nav */}
            <div className="flex overflow-x-auto border-x border-b border-slate-200 bg-slate-50">
              {GUIDE_STEPS.map((step, index) => {
                const isActive = index === activeGuideStep;
                const isVisited = visitedGuideSteps[index] && !isActive;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToGuideStep(index)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-[13px] font-medium ${
                      isActive
                        ? "border-indigo-600 bg-white text-indigo-600"
                        : isVisited
                          ? "border-transparent text-emerald-600"
                          : "border-transparent text-slate-400"
                    }`}
                  >
                    <span
                      className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold ${
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

            {/* Step content */}
            <div className="border-x border-slate-200 bg-white">

              {/* ── Step 1: The Mindset ── */}
              {GUIDE_STEPS[activeGuideStep]?.id === "mindset" ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">The Mindset</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">The Numbers Game</h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    The core insight most students miss: this process is a volume + speed problem, not a crafting problem.
                  </p>

                  {/* Funnel math — why 300+ makes sense */}
                  <div className="mt-6 overflow-hidden rounded-[9px] border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                        Why 300+ applications is a real number
                      </p>
                    </div>
                    <div className="flex items-center overflow-x-auto px-4 py-4">
                      {[
                        { value: "300+", label: "you apply", color: "bg-slate-100 text-slate-700", bar: "bg-slate-300" },
                        { value: "~25–45", label: "pass ATS", color: "bg-red-50 text-red-700", bar: "bg-red-300" },
                        { value: "~5–15", label: "get recruiter eyes", color: "bg-amber-50 text-amber-700", bar: "bg-amber-400" },
                        { value: "~2–5", label: "get interviews", color: "bg-indigo-50 text-indigo-700", bar: "bg-indigo-400" },
                        { value: "1", label: "offer needed", color: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" }
                      ].map((stage, i, arr) => (
                        <div key={stage.value} className="flex items-center">
                          <div className={`flex min-w-[72px] flex-col items-center rounded-[7px] px-3 py-3 ${stage.color}`}>
                            <p className="text-[18px] font-bold leading-none">{stage.value}</p>
                            <p className="mt-1 text-center text-[10px] leading-4">{stage.label}</p>
                          </div>
                          {i < arr.length - 1 ? (
                            <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-slate-300" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-[11px] leading-5 text-slate-600">
                      The funnel is brutal but predictable. Volume creates enough chances for probability to work in your favor. One good offer is all the system needs to produce.
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-[13px] leading-6 text-slate-700">
                    <p>
                      Since this process is heavily automated by ATS filters, do not spend too much time optimizing
                      each application or writing cover letters. Your edge is a strong resume, many companies, and
                      applying fast — ideally as soon as the job opens.
                    </p>
                    <p>
                      Get used to rejections. Getting noticed is usually the hardest part of the whole process, often
                      harder than the interviews themselves. Once you get an interview, your chances improve a lot.
                    </p>
                  </div>

                  <div className="mt-5 rounded-[9px] border border-amber-200 bg-amber-50 px-4 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-amber-800">
                      What actually works
                    </p>
                    <p className="mt-2 text-[12px] leading-6 text-slate-700">
                      Mass applying and applying early is the base system. If you can reach out to recruiters,
                      get referrals, or go to career fairs, absolutely do it — those things can help. But for most
                      students, cold applying at volume is still the main system. That is where most of your time
                      should go.
                    </p>
                  </div>

                  <div className="mt-5 rounded-[9px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[12px] font-semibold text-slate-800">The system only needs to produce one offer.</p>
                    <p className="mt-1.5 text-[12px] leading-5 text-slate-600">
                      Every rejection is just the funnel working as expected. Keep going. The next three steps show you exactly how to build and run this system.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* ── Step 2: Where to Find Jobs ── */}
              {GUIDE_STEPS[activeGuideStep]?.id === "sources" ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Your Sources</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">Where to Find Jobs</h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    The channels top students use daily to catch fresh roles before the listing gets flooded.
                  </p>

                  {/* Strategy framing */}
                  <div className="mt-6 rounded-[9px] border border-indigo-200 bg-indigo-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-700">The strategy</p>
                    <p className="mt-1.5 text-[12px] leading-6 text-slate-700">
                      Apply in mass and apply the moment jobs come out. Early applicants get reviewed first — when the queue is short
                      and a recruiter still has bandwidth. That is exactly why we teach the LinkedIn URL trick below: so you
                      can catch listings within the first hour, before most students even notice them.
                    </p>
                  </div>

                  {/* GitHub Simplify */}
                  <div className="mt-4 overflow-hidden rounded-[9px] border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-slate-900 text-white">
                        <Github className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-900">GitHub Internship List</p>
                        <p className="text-[11px] text-slate-500">Main source — check daily</p>
                      </div>
                      <a
                        href="https://github.com/SimplifyJobs/Summer2026-Internships"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1.5 rounded-[7px] bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="px-4 py-3 text-[12px] leading-6 text-slate-600">
                      The Simplify Jobs internship tracker is usually the fastest place to catch new internships in
                      one central list. Check it every day during recruiting season.
                    </div>
                    <div className="border-t border-slate-100 px-4 py-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Other useful lists
                      </p>
                      <div className="space-y-2">
                        {[
                          { label: "intern-list.com", href: "https://www.intern-list.com/" },
                          { label: "Y Combinator Internships", href: "https://www.ycombinator.com/internships" }
                        ].map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-[7px] border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            {link.label}
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* LinkedIn hack */}
                  <div className="mt-4 rounded-[9px] border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-blue-600 text-white">
                        <Linkedin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-900">LinkedIn — Speed is your moat</p>
                        <p className="text-[11px] text-slate-500">How you get seen before most students even notice the listing</p>
                      </div>
                    </div>

                    <p className="mt-3 text-[12px] leading-6 text-slate-700">
                      The standard filter is "Past 24 hours." A better move: change the URL to see any time window
                      you want — the last hour, 2 hours, 4 hours, or 6 hours. Do this multiple times a day during
                      peak season to catch postings the moment they go live.
                    </p>
                    <div className="mt-4">
                      <LinkedInHackVisual />
                    </div>

                    <div className="mt-3 rounded-[7px] border border-blue-200 bg-white px-3 py-2.5 text-[11px] leading-5 text-slate-600">
                      <strong className="text-slate-800">Make this a daily habit:</strong> Check GitHub list + LinkedIn last 24h once a day.
                      Check LinkedIn last 1–2h a few times a day during peak season. Apply to anything that fits — immediately.
                    </div>
                  </div>

                  {/* CS communities */}
                  <div className="mt-4 rounded-[9px] border border-purple-200 bg-purple-50 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <p className="text-[13px] font-semibold text-slate-900">Join CS communities</p>
                    </div>
                    <p className="mt-2 text-[12px] leading-6 text-slate-600">
                      These are where you hear about OA experiences, new openings, and insider intel before it shows
                      up anywhere else. Most strong students are plugged into at least a few of these.
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {[
                        "Class Discords, engineering clubs, and campus groups",
                        "Friend groups that share openings and OA experiences",
                        "Online CS communities that repost opportunities quickly"
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2 text-[12px] text-slate-700">
                          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <a
                      href="/opportunities"
                      className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 hover:underline"
                    >
                      More opportunity sources in the Opportunities module <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Founder note — always last */}
                  <div className="mt-6 rounded-r-[9px] border-l-[3px] border-l-indigo-300 bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                        D
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">
                        Founder's Note
                      </p>
                    </div>
                    <p className="mt-2 text-[12px] leading-[1.7] text-slate-700">
                      By following this, you are avoiding a lot of mistakes I made at first — like checking for
                      internships on Google and applying to outdated postings that had already been sitting there for
                      months. The GitHub list and the LinkedIn 1-hour filter are where the freshest roles show up.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* ── Step 3: Apply Fast ── */}
              {GUIDE_STEPS[activeGuideStep]?.id === "system" ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Your System</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">
                    Apply Fast, Automate the Boring Parts
                  </h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    How to cut application time to under 3 minutes per role and stay consistent through the August-to-March cycle.
                  </p>

                  {/* Simplify */}
                  <div className="mt-6 rounded-[9px] border border-indigo-200 bg-indigo-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-indigo-600 text-white">
                        <Rocket className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-950">Simplify (Main Daily Tool)</p>
                        <p className="text-[11px] font-semibold text-indigo-600">Set this up first, then use it every day you apply</p>
                      </div>
                      <a
                        href="https://simplify.jobs/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1.5 rounded-[7px] bg-indigo-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700"
                      >
                        Get Simplify <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="mt-3 text-[12px] leading-6 text-slate-700">
                      If you are applying at volume, Simplify is your core workflow. Every manual form you fill from
                      scratch is time you could have spent applying to the next role. Simplify autofills your
                      information across job boards so each application stays under 3 minutes.
                    </p>
                    <div className="mt-3 rounded-[7px] border border-indigo-200 bg-white px-3 py-2.5 text-[11px] leading-5 text-indigo-700">
                      Use Simplify as your default every single day in-season. Over August to March, this saved time is
                      what makes 300+ applications realistic.
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {[
                      {
                        icon: CheckCircle2,
                        title: "Autofill across job boards",
                        body: "Fills your information automatically so each application takes under 3 minutes."
                      },
                      {
                        icon: Zap,
                        title: "Faster one-click workflows",
                        body: "Useful on common job boards where speed to submission matters."
                      },
                      {
                        icon: BarChart3,
                        title: "Built-in tracking support",
                        body: "Logs applications automatically if you use the extension — no separate spreadsheet needed."
                      }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-indigo-600" />
                            <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
                          </div>
                          <p className="mt-1.5 text-[12px] leading-5 text-slate-600">{item.body}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-[9px] border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[12px] leading-5 text-amber-800">
                      <strong>Always review autofilled fields before submitting.</strong> Automation should increase
                      speed, not create sloppy applications.
                    </p>
                  </div>

                  {/* Daily routine */}
                  <div className="mt-5 overflow-hidden rounded-[9px] border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                        Your daily loop — August through March
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {/* Phase: Find */}
                      <div className="px-4 py-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                            1 · Find
                          </span>
                        </div>
                        <div className="space-y-1.5 pl-1">
                          <div className="flex items-start gap-3 text-[12px] text-slate-700">
                            <span className="mt-0.5 w-[80px] shrink-0 text-[10px] font-semibold text-slate-400">Once a day</span>
                            <span>Check GitHub Internship List (Simplify) for new postings</span>
                          </div>
                          <div className="flex items-start gap-3 text-[12px] text-slate-700">
                            <span className="mt-0.5 w-[80px] shrink-0 text-[10px] font-semibold text-slate-400">Once a day</span>
                            <span>Search LinkedIn Jobs → filter "Past 24 hours"</span>
                          </div>
                          <div className="flex items-start gap-3 text-[12px] text-slate-700">
                            <span className="mt-0.5 w-[80px] shrink-0 text-[10px] font-semibold text-slate-400">2–3× a day</span>
                            <span>Change the LinkedIn URL to show past 1–2 hours (catch listings the moment they go live)</span>
                          </div>
                        </div>
                      </div>
                      {/* Phase: Apply */}
                      <div className="px-4 py-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                            2 · Apply
                          </span>
                        </div>
                        <div className="space-y-1.5 pl-1">
                          <div className="flex items-start gap-3 text-[12px] text-slate-700">
                            <span className="mt-0.5 w-[80px] shrink-0 text-[10px] font-semibold text-slate-400">Immediately</span>
                            <span>Apply to anything that fits — use Simplify to autofill and keep it under 3 minutes. Do not wait.</span>
                          </div>
                        </div>
                      </div>
                      {/* Phase: Monitor */}
                      <div className="px-4 py-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                            3 · Monitor
                          </span>
                        </div>
                        <div className="space-y-1.5 pl-1">
                          <div className="flex items-start gap-3 text-[12px] text-slate-700">
                            <span className="mt-0.5 w-[80px] shrink-0 text-[10px] font-semibold text-slate-400">As you go</span>
                            <span>Log each application in your tracker (Simplify does this automatically if you use the extension)</span>
                          </div>
                          <div className="flex items-start gap-3 text-[12px] text-slate-700">
                            <span className="mt-0.5 w-[80px] shrink-0 text-[10px] font-semibold text-slate-400">At ~100–150</span>
                            <span>Review your conversion rate — if you are not getting any responses, it may be time to tweak your resume</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Disclosure: tracker */}
                  <button
                    type="button"
                    onClick={() => toggleDisclosure("tracker")}
                    className={`mt-4 flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${
                      openDisclosures.tracker
                        ? "rounded-b-none border-indigo-200 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">How do I track my applications?</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Tracking is how you get feedback on your own strategy
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        openDisclosures.tracker ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>
                  {openDisclosures.tracker ? (
                    <div className="rounded-b-[9px] border border-t-0 border-indigo-200 bg-indigo-50 px-4 py-4">
                      <p className="mb-3 text-[12px] leading-6 text-indigo-700">
                        If you are 100 to 150 applications in and your resume is not converting, that is the signal
                        to change something. Pick a tracker and use it consistently.
                      </p>
                      <div className="grid gap-2 md:grid-cols-3">
                        {trackerOptions.map((opt) => (
                          <div key={opt.title} className="rounded-[7px] border border-indigo-200 bg-white px-3 py-2.5">
                            <p className="text-[12px] font-semibold text-slate-900">{opt.title}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">{opt.description}</p>
                          </div>
                        ))}
                      </div>
                      <a
                        href="https://www.notion.com/templates/job-tracker-the-ultimate-job-search-companion"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-[7px] border border-indigo-200 bg-white px-3 py-2 text-[12px] font-semibold text-indigo-700 transition-colors hover:bg-white/80"
                      >
                        Open Notion template <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : null}

                  {/* Disclosure: resume tailoring */}
                  <button
                    type="button"
                    onClick={() => toggleDisclosure("tailoring")}
                    className={`mt-4 flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${
                      openDisclosures.tailoring
                        ? "rounded-b-none border-indigo-200 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">Should I tailor my resume for specific jobs?</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          When it can help — and when to skip it
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        openDisclosures.tailoring ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>
                  {openDisclosures.tailoring ? (
                    <div className="rounded-b-[9px] border border-t-0 border-indigo-200 bg-indigo-50 px-4 py-4">
                      <p className="text-[12px] leading-6 text-indigo-700">
                        At volume, tailoring every resume is not realistic or worth it. But for roles you really want —
                        or where you genuinely have a strong match — it can make a difference. The key signal is when your
                        background closely mirrors what the job description actually asks for: same tech stack, same type of
                        project, overlapping domain.
                      </p>
                      <p className="mt-2 text-[12px] leading-6 text-indigo-700">
                        Simplify offers a paid resume tailoring tool that automatically adjusts your resume to match a
                        job description. The founder has not personally tested it, but it exists if you want to explore it
                        for your highest-priority applications.
                      </p>
                      {/* Founder note */}
                      <div className="mt-4 rounded-r-[9px] border-l-[3px] border-l-indigo-300 bg-white px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                            D
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">
                            Founder's Note
                          </p>
                        </div>
                        <p className="mt-2 text-[12px] leading-[1.7] text-slate-700">
                          I got a job at Tesla not because my resume was perfectly tailored — but because my project work
                          matched what they were actually building. Same type of embedded system, same type of technologies.
                          The fit was obvious without me doing much. That is the kind of case where tailoring helps: not
                          just keyword matching, but a genuine overlap in the work you have already done. For most roles in
                          a high-volume campaign, spend that energy applying to more jobs instead.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* ── Step 4: OAs & Beyond ── */}
              {GUIDE_STEPS[activeGuideStep]?.id === "beyond" ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">
                    Beyond the Funnel
                  </p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">
                    OAs, Tracking & Hidden Opportunities
                  </h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    What happens after you apply, how to read your own results, and where others aren't looking.
                  </p>

                  {/* OA explanation */}
                  <div className="mt-6 overflow-hidden rounded-[9px] border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                      <Code2 className="h-4 w-4 text-slate-500" />
                      <p className="text-[14px] font-bold text-slate-900">Online Assessments (OAs)</p>
                    </div>
                    <div className="px-4 py-4">
                      <p className="text-[12px] leading-6 text-slate-600">
                        OAs are coding challenges companies send on platforms like HackerRank and CodeSignal. They
                        show up after you apply and before interviews, meant to filter applicants before a human
                        conversation happens. Not all companies use them — do not feel intimidated.
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {[
                          {
                            title: "Question style",
                            body: "DSA problems, similar to LeetCode, but with more words and business context."
                          },
                          {
                            title: "Grading",
                            body: "Test cases run against your solution. A 15/15 + 9/15 can still be a solid result."
                          },
                          {
                            title: "Format",
                            body: "Usually ~60 minutes for 2 questions. Prompt on the left, code editor on the right."
                          }
                        ].map((item) => (
                          <div
                            key={item.title}
                            className="rounded-[7px] border border-slate-200 bg-slate-50 px-3 py-3"
                          >
                            <p className="text-[12px] font-semibold text-slate-900">{item.title}</p>
                            <p className="mt-1.5 text-[11px] leading-5 text-slate-600">{item.body}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 overflow-hidden rounded-[9px] border border-slate-200 shadow-sm">
                        <img
                          src="/oa.jpg"
                          alt="Example online assessment interface with the problem on the left and the code editor on the right"
                          className="h-auto w-full"
                        />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {oaGroups.map((group) => (
                          <div key={group.title} className={`rounded-[7px] border px-3 py-3 ${group.shell}`}>
                            <p className="text-[12px] font-bold text-slate-900">{group.title}</p>
                            <p className="mt-1 text-[11px] text-slate-600">{group.description}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {group.companies.map((c) => (
                                <span
                                  key={c}
                                  className={`rounded-full border bg-white px-2 py-0.5 text-[10px] font-semibold ${group.badgeShell}`}
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* OA cheating warning */}
                  <div className="mt-4 rounded-[9px] border border-red-200 bg-red-50 px-4 py-4">
                    <p className="text-[12px] font-bold text-red-900">A lot of people cheat on OAs</p>
                    <p className="mt-2 text-[12px] leading-6 text-slate-700">
                      OA questions have gotten inflated in difficulty partly because of cheating. Some OA questions
                      feel harder than interview questions. Still do them — use them as reps. Most jobs won't ask OAs,
                      and once you're ready, we have a full LeetCode section here.
                    </p>
                  </div>

                  {/* Disclosure: OA prep */}
                  <button
                    type="button"
                    onClick={() => toggleDisclosure("oaPrep")}
                    className={`mt-4 flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${
                      openDisclosures.oaPrep
                        ? "rounded-b-none border-indigo-200 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Code2 className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">What if I get an OA?</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          How to prepare without over-prioritizing too early
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        openDisclosures.oaPrep ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>
                  {openDisclosures.oaPrep ? (
                    <div className="rounded-b-[9px] border border-t-0 border-indigo-200 bg-indigo-50 px-4 py-4 text-[12px] leading-6 text-indigo-700">
                      Practice with LeetCode or directly on HackerRank and similar platforms — they usually have
                      practice problems too. But this should become a serious focus only after your projects and core
                      skills are already solid. Do the OAs you get now regardless; use them as reps to understand
                      the format.
                    </div>
                  ) : null}

                  <div className="my-6 h-px bg-slate-100" />

                  {/* Creative opportunities */}
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Beyond the Obvious</p>
                  <p className="mt-2 text-[13px] font-semibold text-slate-900">
                    Run a parallel lane while you mass apply
                  </p>
                  <p className="mt-1.5 text-[12px] leading-6 text-slate-600">
                    The internship pipeline is the main game, but a parallel lane of less obvious paths can open
                    doors the pipeline won't. These are active moves — you go find them, they don't come to you.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        Also apply to during the fall
                      </p>
                      <p className="mb-3 text-[11px] leading-5 text-slate-500">
                        These open in fall too. Strong company names and programs add real resume value early.
                      </p>
                      <div className="space-y-1.5">
                        {["Hackathons", "Company fellowships", "Short 1-month programs", "Externships and similar experiences", "Underclassmen Internships"].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-[12px] text-slate-700">
                            <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        Less obvious sourcing strategies
                      </p>
                      <div className="space-y-1.5">
                        {[
                          "Referrals from people you know or connections at target companies",
                          "Hidden internship programs on company career pages",
                          "Cold outreach to recruiters on LinkedIn",
                          "Alumni at target companies (email or LinkedIn)",
                          "Local companies and smaller employers nearby",
                          "Startups — often more flexible, faster to respond",
                          "Career fairs and on-campus recruiter events",
                          "Research labs and university-affiliated programs"
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-2 text-[12px] text-slate-700">
                            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Founder note — P&G / hidden programs only */}
                  <div className="mt-5 rounded-r-[9px] border-l-[3px] border-l-indigo-300 bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                        D
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">
                        Founder's Note
                      </p>
                    </div>
                    <p className="mt-2 text-[12px] leading-[1.7] text-slate-700">
                      In my first year recruiting, I took a list of Fortune 500 companies and searched them one by
                      one on each company's career page to see if there were hidden internship programs — programs
                      that were not on LinkedIn at all. That is how I found a P&G program and got interviews from it.
                      Most students never look beyond the obvious job boards. That gap is where the edge is.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Step footer */}
            <div className="flex items-center justify-between rounded-b-[13px] border-x border-b border-slate-200 bg-slate-50 px-7 py-4">
              <span className="text-[12px] text-slate-500">
                Step {activeGuideStep + 1} of {GUIDE_STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateGuide(-1)}
                  disabled={activeGuideStep === 0}
                  className="inline-flex items-center gap-1.5 rounded-[7px] border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                {isLastStep ? (
                  <button
                    type="button"
                    onClick={handleGuideCompletion}
                    disabled={syncingTaskId !== null}
                    className="inline-flex items-center gap-1.5 rounded-[7px] bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Done ✓
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigateGuide(1)}
                    className="inline-flex items-center gap-1.5 rounded-[7px] bg-indigo-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>

      {/* ── CTA ── */}
      <div className="flex items-center justify-between gap-4 rounded-[9px] bg-indigo-600 px-5 py-4 text-white">
        <div>
          <p className="text-[14px] font-bold">Up next: Opportunities</p>
          <p className="mt-1 text-[12px] text-indigo-100">
            Run programs, fellowships, and hackathons in parallel with your internship applications.
          </p>
        </div>
        <a
          href="/opportunities"
          className="rounded-[7px] bg-white px-4 py-2.5 text-[13px] font-bold text-indigo-600"
        >
          Continue to Opportunities →
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
