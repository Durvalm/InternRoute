"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Lightbulb,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type TimelineSummary = {
  graduation_date: string | null;
  recruiting: {
    summers_left: number | null;
    next_peak_date: string;
  };
  module_progress: ModuleProgress[];
};

type ModuleProgress = {
  module_key: string;
  module_name: string;
  score: number;
  is_unlocked: boolean;
  unlock_threshold: number;
  has_tasks: boolean;
  has_bonus_tasks: boolean;
};

type TimelineTask = {
  id: number;
  title: string;
  description: string | null;
  weight: number;
  is_bonus: boolean;
  is_completed: boolean;
};

type TimelineTasksResponse = {
  module_key: string;
  tasks: TimelineTask[];
};

type TaskCompletionResponse = {
  task_id: number;
  completed: boolean;
  module_progress: ModuleProgress[];
};

type GuideStep = {
  id: "windows" | "system" | "full-picture";
  label: string;
};

type DisclosureKey =
  | "oneSummer"
  | "returnOffer"
  | "noExperience"
  | "opportunities"
  | "graduation"
  | "pay";

type WindowTone = "peak" | "lower" | "offseason";

type RecruitingWindow = {
  name: string;
  months: string;
  summary: string;
  details: string;
  tone: WindowTone;
};

const GUIDE_STEPS: GuideStep[] = [
  { id: "windows", label: "Recruiting Windows" },
  { id: "system", label: "The System" },
  { id: "full-picture", label: "The Full Picture" }
];

const CALENDAR_MONTHS: Array<{ label: string; tone: WindowTone }> = [
  { label: "Jan", tone: "lower" },
  { label: "Feb", tone: "lower" },
  { label: "Mar", tone: "lower" },
  { label: "Apr", tone: "offseason" },
  { label: "May", tone: "offseason" },
  { label: "Jun", tone: "offseason" },
  { label: "Jul", tone: "offseason" },
  { label: "Aug", tone: "peak" },
  { label: "Sep", tone: "peak" },
  { label: "Oct", tone: "peak" },
  { label: "Nov", tone: "peak" },
  { label: "Dec", tone: "peak" }
];

const RECRUITING_WINDOWS: RecruitingWindow[] = [
  {
    name: "Peak Recruiting Window",
    months: "August - December",
    summary: "The main event. Big Tech, Fortune 500s, and structured programs open here.",
    details:
      "62% readiness is the baseline where you can start competing. If you are below that, it is unlikely you can really compete yet. If you are above it, keep improving because stronger projects, resume work, and applications are what move you into better roles.",
    tone: "peak"
  },
  {
    name: "Lower Recruiting Window",
    months: "January - March",
    summary: "Smaller teams, startups, and local companies hire here.",
    details:
      "Fewer spots, but easier interviews and lower competition. It is a strong fallback if you missed August and a good parallel lane alongside peak applications.",
    tone: "lower"
  },
  {
    name: "Off-Season Window",
    months: "April - July",
    summary: "Preparation time for the next cycle.",
    details:
      "Use this period to build skills, finish projects, and tighten your resume. Some off-season roles exist, but the main opportunity here is being ready before August opens.",
    tone: "offseason"
  }
];

const CORE_FOUR: Array<{
  step: string;
  title: string;
  description: string;
  why: string;
  shell: string;
}> = [
  {
    step: "Step 1",
    title: "Coding Skills — Build Your Technical Foundation",
    description:
      "Learn how to code and solve practical challenges in a real workflow. We recommend Python for speed, but another language is fine if you already know it. The module includes fixed checkpoints and an in-browser IDE so you prove you can actually code, not just watch tutorials.",
    why:
      "Coding is the base layer. Interviews require it, projects require it, and you cannot build real momentum without it.",
    shell: "bg-indigo-50 text-indigo-700"
  },
  {
    step: "Step 2",
    title: "Projects — Build Projects and Create Proof",
    description:
      "Learn to build projects that include real backend work: APIs, business logic, and a database. We teach what makes a project strong, how to pick ideas, and how to build things that actually count as proof.",
    why:
      "Proof of work beats claims. Two strong repos tell recruiters more than a long skills list.",
    shell: "bg-indigo-50 text-indigo-700"
  },
  {
    step: "Step 3",
    title: "Resume — Present Your Work So Recruiters Understand It",
    description:
      "Use the right tools, ATS-safe structure, and framing strategy to turn beginner work into a resume recruiters can actually understand. We show you how to make your work look as strong as it really is.",
    why:
      "At the end of the day, no matter how good you are, this is what recruiters judge you on first.",
    shell: "bg-emerald-50 text-emerald-700"
  },
  {
    step: "Step 4",
    title: "Applications — Get in Front of Recruiters Consistently",
    description:
      "Learn the real application workflow: where top students find jobs, how to mass apply without losing quality, how to automate parts of the process, and how to track everything without chaos.",
    why:
      "Students who know the system move faster, stay more consistent, and create more interview chances.",
    shell: "bg-amber-50 text-amber-700"
  }
];

const SUPPORT_MODULES: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
  note: string;
  noteClassName: string;
}> = [
  {
    icon: Sparkles,
    title: "Interview Prep",
    body: "Behavioral strategy, technical interview tactics, and how to tell your story once interviews start happening.",
    note: "Most useful once interviews start",
    noteClassName: "text-emerald-700"
  },
  {
    icon: Lightbulb,
    title: "LeetCode",
    body: "Important if you want to level up into Big Tech and top-tier recruiting, but not what beginners should center first.",
    note: "Optional level-up after solid fundamentals",
    noteClassName: "text-amber-700"
  },
  {
    icon: Briefcase,
    title: "Opportunities",
    body: "Hackathons, fellowships, open source, and other parallel experiences that strengthen your profile.",
    note: "Run in parallel with applications",
    noteClassName: "text-emerald-700"
  }
];

const FAQ_ITEMS = [
  {
    key: "returnOffer" as const,
    question: "What is a Return Offer (RO)?",
    hint: "The safest path to a post-grad job",
    icon: Briefcase,
    answer:
      "A return offer is a full-time job offer you get at the end of an internship. That is why even a smaller internship matters so much: it can turn into a job before senior year recruiting chaos even starts."
  },
  {
    key: "noExperience" as const,
    question: "What if I have no experience at all?",
    hint: "That is exactly why projects exist",
    icon: Sparkles,
    answer:
      "That is normal. Projects are how you create experience when you do not have any yet. By the time you finish the Projects module, you should have real repositories that act as proof of work on your resume."
  },
  {
    key: "opportunities" as const,
    question: "What are Other Opportunities?",
    hint: "Parallel ways to strengthen your profile",
    icon: Lightbulb,
    answer:
      "Hackathons, fellowships, open source programs, and similar experiences can strengthen your resume while you are applying. They also tend to be less competitive than top internships because fewer students know how to use them well."
  }
];

const COMPENSATION_BANDS = [
  {
    label: "Small Firms",
    note: "Chase these first - easier to land, still real experience",
    value: "$20 - $40/hr",
    valueClassName: "text-amber-700"
  },
  {
    label: "Big/Mid Tech",
    note: "Usually needs LeetCode and stronger experience",
    value: "$50 - $80/hr",
    valueClassName: "text-amber-700"
  },
  {
    label: "Quant / HFT",
    note: "Highest tier - usually best students from top schools",
    value: "~$120+/hr",
    valueClassName: "text-indigo-700"
  }
];

function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), 12);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMonthYear(date: Date | null): string {
  if (!date) return "Set your graduation date";
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatLongDate(date: Date | null): string {
  if (!date) return "Set your graduation date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getDaysUntil(date: Date | null): number | null {
  if (!date) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getPhaseDetails(monthIndex: number): {
  label: string;
  body: string;
  pillClassName: string;
  iconClassName: string;
} {
  if (monthIndex >= 7) {
    return {
      label: "Peak Recruiting Window · Aug-Dec · Apply Mode",
      body: "Recruiting is open. Do not wait for perfection. Ship applications early and keep building in parallel.",
      pillClassName: "text-emerald-700",
      iconClassName: "text-emerald-700"
    };
  }

  if (monthIndex <= 2) {
    return {
      label: "Lower Recruiting Window · Jan-Mar · Keep Swinging",
      body: "This is still real recruiting time. Smaller firms, startups, and local companies are active here.",
      pillClassName: "text-amber-700",
      iconClassName: "text-amber-700"
    };
  }

  return {
    label: "Off-Season · Apr-Jul · Build Mode",
    body: "Recruiting is mostly closed right now. This is prep time, not panic time. Build skills and projects before August opens.",
    pillClassName: "text-indigo-700",
    iconClassName: "text-indigo-700"
  };
}

function windowShellClasses(tone: WindowTone) {
  if (tone === "peak") {
    return {
      shell: "border-emerald-200 bg-emerald-50",
      badge: "bg-emerald-600 text-white",
      bar: "bg-emerald-500"
    };
  }

  if (tone === "lower") {
    return {
      shell: "border-amber-200 bg-amber-50",
      badge: "bg-amber-700 text-white",
      bar: "bg-amber-500"
    };
  }

  return {
    shell: "border-slate-200 bg-slate-50",
    badge: "bg-slate-300 text-slate-700",
    bar: "bg-slate-300"
  };
}

export default function IntroPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<TimelineSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [timelineTasks, setTimelineTasks] = useState<TimelineTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [syncingTaskId, setSyncingTaskId] = useState<number | null>(null);
  const [learningGuideOpen, setLearningGuideOpen] = useState(true);
const [activeGuideStep, setActiveGuideStep] = useState(0);
  const [seenGuideSteps, setSeenGuideSteps] = useState<boolean[]>([false, false, false]);
  const [visitedGuideSteps, setVisitedGuideSteps] = useState<boolean[]>([false, false, false]);
  const [openDisclosures, setOpenDisclosures] = useState<Record<DisclosureKey, boolean>>({
    oneSummer: false,
    returnOffer: false,
    noExperience: false,
    opportunities: false,
    graduation: false,
    pay: false
  });

  useEffect(() => {
    let active = true;

    apiRequest<TimelineSummary>("/dashboard/summary")
      .then((data) => {
        if (active) {
          setSummary(data);
        }
      })
      .catch(() => {
        if (active) {
          setSummaryError("Unable to load your personalized timeline. Showing the standard intro layout.");
        }
      })
      .finally(() => {
        if (active) {
          setSummaryLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    apiRequest<TimelineTasksResponse>("/dashboard/tasks?module_key=timeline")
      .then((data) => {
        if (active) {
          setTimelineTasks(data.tasks ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setTasksError("Unable to sync intro completion right now.");
          setTimelineTasks([]);
        }
      })
      .finally(() => {
        if (active) {
          setTasksLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const timelineTask = timelineTasks[0] ?? null;
  const nextPeakDate = parseApiDate(summary?.recruiting?.next_peak_date);
  const graduationDate = parseApiDate(summary?.graduation_date);
  const summersLeft = summary?.recruiting?.summers_left ?? null;
  const daysUntilPeak = getDaysUntil(nextPeakDate);
  const currentMonth = new Date().getMonth();
  const phaseDetails = getPhaseDetails(currentMonth);
  const cycleYear = nextPeakDate?.getFullYear() ?? new Date().getFullYear();
  const targetInternshipYear = nextPeakDate ? nextPeakDate.getFullYear() + 1 : new Date().getFullYear() + 1;
  const guideProgressCount = seenGuideSteps.filter(Boolean).length;
  const guideProgressPercent = Math.round((guideProgressCount / GUIDE_STEPS.length) * 100);

  useEffect(() => {
    if (!timelineTask?.is_completed) return;
    setSeenGuideSteps([true, true, true]);
    setVisitedGuideSteps([true, true, true]);
    setActiveGuideStep(GUIDE_STEPS.length - 1);
  }, [timelineTask?.is_completed]);

  const toggleLearningGuide = () => {
    setLearningGuideOpen((prev) => {
      const next = !prev;
      if (next) {
        setSeenGuideSteps((current) => current.map((seen, index) => (index === activeGuideStep ? true : seen)));
      }
      return next;
    });
  };

  const goToGuideStep = (index: number) => {
    if (index === activeGuideStep) {
      setSeenGuideSteps((current) => current.map((seen, stepIndex) => (stepIndex === index ? true : seen)));
      return;
    }

    setVisitedGuideSteps((current) => current.map((visited, stepIndex) => (stepIndex === activeGuideStep ? true : visited)));
    setSeenGuideSteps((current) => current.map((seen, stepIndex) => (stepIndex === index ? true : seen)));
    setActiveGuideStep(index);
  };

  const navigateGuide = (direction: -1 | 1) => {
    const nextIndex = activeGuideStep + direction;
    if (nextIndex < 0 || nextIndex >= GUIDE_STEPS.length) return;
    goToGuideStep(nextIndex);
  };

  const toggleDisclosure = (key: DisclosureKey) => {
    setOpenDisclosures((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const handleGuideCompletion = () => {
    setVisitedGuideSteps([true, true, true]);
    setSeenGuideSteps([true, true, true]);

    if (!timelineTask || timelineTask.is_completed || syncingTaskId === timelineTask.id) return;

    setTasksError(null);
    setSyncingTaskId(timelineTask.id);

    void apiRequest<TaskCompletionResponse>(`/dashboard/tasks/${timelineTask.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true })
    })
      .then((data) => {
        setTimelineTasks((prev) =>
          prev.map((item) => (item.id === timelineTask.id ? { ...item, is_completed: true } : item))
        );
        setSummary((prev) =>
          prev
            ? { ...prev, module_progress: data.module_progress }
            : {
                graduation_date: null,
                recruiting: { summers_left: null, next_peak_date: "" },
                module_progress: data.module_progress
              }
        );
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Unable to save intro progress right now.";
        setTasksError(message);
      })
      .finally(() => {
        setSyncingTaskId(null);
      });
  };

  const progressBadge =
    guideProgressCount === GUIDE_STEPS.length
      ? {
          label: "Complete",
          className: "border-emerald-200 bg-emerald-50 text-emerald-700"
        }
      : guideProgressCount > 0
        ? {
            label: "In progress",
            className: "border-amber-200 bg-amber-50 text-amber-700"
          }
        : {
            label: "Not started",
            className: "border-slate-200 bg-slate-50 text-slate-600"
          };

  const summersLeftText =
    summaryLoading
      ? "Loading..."
      : summersLeft == null
        ? "Set grad date"
        : `${summersLeft} ${summersLeft === 1 ? "summer" : "summers"} left`;

  const summersLeftBody =
    summaryLoading
      ? "Calculating your runway."
      : summersLeft == null
        ? "Once your graduation date is set, this becomes personalized."
        : summersLeft <= 0
          ? "Summer windows are likely closed, but off-season roles and entry-level paths still matter."
          : summersLeft === 1
            ? "Likely your final summer internship window. Move faster, not later."
            : "Use each summer as a ladder. The first one creates leverage for the next.";

  const nextPeakBody =
    summaryLoading
      ? "Loading your next peak window."
      : nextPeakDate
        ? daysUntilPeak === 0
          ? "This recruiting window is open right now. This is when many of the biggest internship openings go live."
          : `${daysUntilPeak} days away. This is when many of the biggest internship openings go live.`
        : "Set your graduation date to personalize this.";

  const readinessBody = nextPeakDate
    ? `62% is the baseline where you can start competing for jobs. Try to reach that before August opens, then keep improving projects, resume, and applications to move upmarket.`
    : "62% is the baseline where you can start competing for jobs. After that, you keep improving to target stronger roles.";

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <section className="space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-600">
              Module 01
            </span>
            <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-[11px] font-medium text-indigo-600">
              Start Here
            </span>
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-slate-950">Intro</h1>
          <p className="mt-1 max-w-[860px] text-[13px] leading-6 text-slate-500">
            Most students do not miss internships because they are bad at coding. They miss them because they do not
            understand the hiring system: the windows, the timing, and the playbook.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-[9px] border border-slate-200 bg-white px-4 py-3">
          <span className="whitespace-nowrap text-[12px] font-medium text-slate-500">Intro</span>
          <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${guideProgressPercent}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-[13px] font-bold text-indigo-600">{`${guideProgressCount} / ${GUIDE_STEPS.length} steps`}</span>
          <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${progressBadge.className}`}>
            {progressBadge.label}
          </span>
        </div>

        <div className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-[18px] font-bold text-slate-950">Your Recruiting Timeline</h2>
              <p className="mt-1 text-[12px] text-slate-500">
                Based on your graduation date{graduationDate ? ` · ${formatMonthYear(graduationDate)}` : ""}.
                {graduationDate ? "" : " Update it in Settings to personalize this."}
              </p>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
              {summersLeftText}
            </span>
          </div>

          <div className="px-5 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{`${cycleYear} Recruiting Cycle`}</p>
            <div className="grid grid-cols-12 gap-[3px]">
              {CALENDAR_MONTHS.map((month, index) => {
                const isCurrent = index === currentMonth;
                const toneClassName =
                  month.tone === "peak"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : month.tone === "lower"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-slate-100 text-slate-500";

                return (
                  <div
                    key={month.label}
                    className={`relative flex h-[30px] items-center justify-center rounded-[5px] border text-[10px] font-bold uppercase tracking-[0.04em] ${toneClassName} ${
                      isCurrent ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-white" : ""
                    }`}
                  >
                    {month.label}
                    {isCurrent ? <span className="absolute -bottom-[9px] h-1 w-1 rounded-full bg-indigo-600" /> : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-12 gap-[3px] text-[9px] font-semibold uppercase tracking-[0.06em]">
              <div className="col-span-3 flex items-center justify-center rounded-[4px] bg-amber-50 py-1 text-amber-700">
                Lower · Jan-Mar
              </div>
              <div className="col-span-4 flex items-center justify-center rounded-[4px] bg-slate-100 py-1 text-slate-500">
                Off-Season · Apr-Jul
              </div>
              <div className="col-span-5 flex items-center justify-center rounded-[4px] bg-emerald-50 py-1 text-emerald-700">
                Peak · Aug-Dec → Summer {targetInternshipYear} jobs
              </div>
            </div>
          </div>

          <div className="grid border-y border-slate-200 md:grid-cols-3">
            <div className="border-b border-slate-200 px-5 py-4 md:border-b-0 md:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Your summers left</p>
              <p className="mt-2 text-[28px] font-bold leading-none text-amber-700">
                {summaryLoading ? "..." : summersLeft == null ? "-" : summersLeft}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-slate-500">{summersLeftBody}</p>
            </div>

            <div className="border-b border-slate-200 px-5 py-4 md:border-b-0 md:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Peak recruiting window</p>
              <p className="mt-2 text-[20px] font-bold leading-none text-indigo-600">{formatLongDate(nextPeakDate)}</p>
              <p className="mt-2 text-[12px] leading-5 text-slate-500">{nextPeakBody}</p>
            </div>

            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Readiness Target</p>
              <p className="mt-2 text-[20px] font-bold leading-none text-emerald-600">
                {nextPeakDate ? "62% before Aug" : "62% before Aug"}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-slate-500">{readinessBody}</p>
            </div>
          </div>

          <div className="bg-indigo-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <Calendar className={`mt-0.5 h-4 w-4 shrink-0 ${phaseDetails.iconClassName}`} />
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${phaseDetails.pillClassName}`}>{phaseDetails.label}</p>
                <p className="mt-1 text-[12px] leading-6 text-indigo-700">{phaseDetails.body}</p>
              </div>
            </div>
          </div>
        </div>

        {summaryError ? (
          <div className="rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
            {summaryError}
          </div>
        ) : null}
      </section>

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
              <p className="mt-0.5 text-[12px] text-slate-400">Recruiting windows, the system, and the full picture - 3 reads</p>
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
              <ChevronDown className={`h-4 w-4 transition-transform ${learningGuideOpen ? "rotate-180" : ""}`} />
            </div>
          </div>
        </button>

        {learningGuideOpen ? (
          <>
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

            <div className="border-x border-slate-200 bg-white">
              {GUIDE_STEPS[activeGuideStep]?.id === "windows" ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">When to Act</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">Recruiting Windows</h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    There are three distinct hiring periods in the year. Understanding this calendar is the single
                    biggest advantage a student can have.
                  </p>

                  <div className="mt-6 overflow-hidden rounded-[9px] border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Why this calendar exists</p>
                    </div>

                    <div className="grid md:grid-cols-[1fr_auto_1fr]">
                      <div className="px-4 py-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">The internship</p>
                        <p className="text-[14px] font-bold text-slate-900">Runs in summer</p>
                        <p className="mt-2 text-[12px] leading-6 text-slate-600">
                        Most CS internships are 10–14 week programs running June through August. Full-time work, real pay, real experience.
                        </p>

                        <div className="mt-3 grid grid-cols-8 gap-[3px]">
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((label, index) => (
                            <div
                              key={label}
                              className={`flex h-[22px] items-center justify-center rounded-[4px] border text-[9px] font-bold uppercase ${
                                index >= 5
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-100 text-slate-500"
                              }`}
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                        <p className="mt-1.5 text-[10px] font-semibold text-emerald-700">Internship months</p>
                      </div>

                      <div className="flex items-center justify-center border-y border-slate-200 bg-slate-50 px-3 py-4 text-slate-400 md:border-x md:border-y-0">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[18px]">→</span>
                          <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">so</span>
                        </div>
                      </div>

                      <div className="px-4 py-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-600">The recruiting</p>
                        <p className="text-[14px] font-bold text-slate-900">Happens the year before</p>
                        <p className="mt-2 text-[12px] leading-6 text-slate-600">
                        Companies open applications in August of the previous year. That's a full 10–12 months before the internship starts.
                        </p>

                        <div className="mt-3 grid grid-cols-8 gap-[3px]">
                          {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((label, index) => (
                            <div
                              key={label}
                              className={`flex h-[22px] items-center justify-center rounded-[4px] border text-[9px] font-bold uppercase ${
                                index <= 4
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                        <div className="mt-1.5 flex gap-3 text-[10px] font-semibold">
                          <span className="text-indigo-600">Peak window</span>
                          <span className="text-amber-700">Lower window</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-indigo-200 bg-indigo-50 px-4 py-3 text-[12px] leading-6 text-indigo-700">
                      <strong>The result:</strong> The result: Each summer you have is one recruiting cycle. To compete in Summer 2027, you apply in Fall 2026. That's why summers left is the clock that matters.
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {RECRUITING_WINDOWS.map((window) => {
                      const style = windowShellClasses(window.tone);
                      return (
                        <div key={window.name} className={`rounded-[9px] border px-4 py-4 ${style.shell}`}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-[14px] font-bold text-slate-900">{window.name}</p>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${style.badge}`}>
                              {window.months}
                            </span>
                          </div>
                          <div className={`mt-3 h-1 rounded-full ${style.bar}`} />
                          <p className="mt-3 text-[13px] font-semibold text-slate-800">{window.summary}</p>
                          <p className="mt-1.5 text-[12px] leading-6 text-slate-600">{window.details}</p>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleDisclosure("oneSummer")}
                    className={`mt-4 flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${
                      openDisclosures.oneSummer
                        ? "rounded-b-none border-indigo-200 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">What if I only have 1 summer left?</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">How to compress the strategy when time is short</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openDisclosures.oneSummer ? "rotate-180 text-indigo-600" : ""}`} />
                  </button>

                  {openDisclosures.oneSummer ? (
                    <div className="rounded-b-[9px] border border-t-0 border-indigo-200 bg-indigo-50 px-4 py-4 text-[12px] leading-6 text-indigo-700">
                      Move faster, not differently. Start applying in August even if you are not fully ready. Smaller
                      firms, off-season roles, and parallel opportunities can still create momentum. The playbook does
                      not change. The margin for delay just gets smaller.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {GUIDE_STEPS[activeGuideStep]?.id === "system" ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">What to Do</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">The System</h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    Four pillars work together as a system. Master them in order and you will have what you need to
                    compete.
                  </p>

                  <div className="mt-6 rounded-[9px] border border-indigo-200 bg-indigo-50 px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Interview signal loop</p>
                    <p className="mt-2 text-[13px] leading-6 text-indigo-700">
                      If you are not landing interviews, the reason is inside the four components below. One of them is
                      weak, and that weak link is the reason interviews are not happening.
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {CORE_FOUR.map((item) => (
                      <div key={item.step} className="rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                        <div className="flex gap-4">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-[10px] font-bold uppercase tracking-[0.05em] ${item.shell}`}>
                            {item.step.replace("Step ", "")}
                          </div>
                          <div>
                            <h3 className="text-[15px] font-bold text-slate-900">{item.title}</h3>
                            <p className="mt-1.5 text-[12px] leading-6 text-slate-600">{item.description}</p>
                            <p className="mt-2 text-[11px] leading-5 text-slate-500">
                              <strong className="text-slate-700">Why:</strong> {item.why}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="my-6 h-px bg-slate-200" />

                  <p className="text-[12px] font-semibold text-slate-800">Helpers Around the Core Four</p>
                  <p className="mt-2 text-[12px] leading-6 text-slate-600">
                    Most of the real work stays inside Coding Skills, Projects, Resume, and Applications. These
                    modules help around that system instead of replacing it.
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {SUPPORT_MODULES.map((item) => (
                      <div key={item.title} className="rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                        <item.icon className="h-4 w-4 text-slate-500" />
                        <h3 className="mt-3 text-[14px] font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-2 text-[12px] leading-6 text-slate-600">{item.body}</p>
                        <p className={`mt-3 text-[11px] font-semibold ${item.noteClassName}`}>{item.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {GUIDE_STEPS[activeGuideStep]?.id === "full-picture" ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Why It Works</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">The Full Picture</h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">
                    This is the context behind the system: what students usually get wrong, and why this playbook works.
                  </p>

                  <div className="mt-6 rounded-r-[9px] border-l-[3px] border-l-indigo-300 bg-indigo-50 px-4 py-4">
                    <p className="text-[13px] leading-7 text-slate-700">
                      If you&apos;re in the U.S. read this: <strong className="text-slate-900">getting internships is
                      not about how insanely talented you are</strong> or being a developer since you were 14 years old.
                      Let me explain.
                    </p>
                    <p className="mt-3 text-[13px] leading-7 text-slate-700">
                      There are brilliant developers all around the world, in many countries, who will never have the
                      opportunities you have just because they are not in the U.S. <strong className="text-slate-900">So
                      you see, it&apos;s not about skills.</strong>
                    </p>
                    <p className="mt-3 text-[13px] leading-7 text-slate-700">
                      At the end of the day, it&apos;ll be someone checking a piece of paper. Skills are an important
                      part of it, but there&apos;s a <strong className="text-slate-900">playbook to get a job as a
                      Software Engineer</strong> that kids in top schools know. A lot of them have relatives who work in
                      the field, and they know exactly what they need to do.
                    </p>
                    <p className="mt-3 text-[13px] font-semibold leading-7 text-indigo-700">
                      You need to work smart, not harder, and do the things that can actually get you a job.
                    </p>
                  </div>

                  <div className="my-6 h-px bg-slate-200" />

                  <p className="text-[12px] font-semibold text-slate-800">The Two Traps Most Students Fall Into</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[9px] border border-amber-200 bg-amber-50 px-4 py-4">
                      <p className="text-[14px] font-bold text-amber-900">The LeetCode Trap</p>
                      <p className="mt-2 text-[12px] leading-6 text-amber-900">
                        LeetCode is a <strong>bonus</strong> that unlocks top-tier companies. It is not the entry point.
                        Do not delay applications just to grind interview questions for months.
                      </p>
                      <p className="mt-3 text-[11px] italic text-amber-800">
                        If you do not know what LeetCode is yet, that is fine. It will make sense later.
                      </p>
                    </div>

                    <div className="rounded-[9px] bg-slate-950 px-4 py-4">
                      <p className="text-[14px] font-bold text-white">The Grades Trap</p>
                      <p className="mt-2 text-[12px] leading-6 text-white/75">
                        If you only optimize for grades, you will not build the experience that gets you hired.
                        <strong className="text-white"> Even a 4.0 GPA struggles without proof of work.</strong>
                      </p>
                      <p className="mt-3 text-[11px] italic text-white/45">
                        A CS degree still matters. It just is not enough by itself.
                      </p>
                    </div>
                  </div>

                  <div className="my-6 h-px bg-slate-200" />

                  <p className="text-[12px] font-semibold text-slate-800">FAQ</p>
                  <div className="mt-4 space-y-3">
                    {FAQ_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.key}>
                          <button
                            type="button"
                            onClick={() => toggleDisclosure(item.key)}
                            className={`flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${
                              openDisclosures[item.key]
                                ? "rounded-b-none border-indigo-200 bg-indigo-50"
                                : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-slate-400" />
                              <div>
                                <p className="text-[12px] font-semibold text-slate-800">{item.question}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{item.hint}</p>
                              </div>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openDisclosures[item.key] ? "rotate-180 text-indigo-600" : ""}`} />
                          </button>

                          {openDisclosures[item.key] ? (
                            <div className="rounded-b-[9px] border border-t-0 border-indigo-200 bg-indigo-50 px-4 py-4 text-[12px] leading-6 text-indigo-700">
                              {item.answer}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}

                    <div>
                      <button
                        type="button"
                        onClick={() => toggleDisclosure("graduation")}
                        className={`flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${
                          openDisclosures.graduation
                            ? "rounded-b-none border-indigo-200 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GraduationCap className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-[12px] font-semibold text-slate-800">Approaching graduation without internships?</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">Common paths people actually take</p>
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openDisclosures.graduation ? "rotate-180 text-indigo-600" : ""}`} />
                      </button>

                      {openDisclosures.graduation ? (
                        <div className="rounded-b-[9px] border border-t-0 border-indigo-200 bg-indigo-50 px-4 py-4">
                          <p className="text-[12px] leading-6 text-indigo-700">
                            If you are close to graduating without internships, common paths people actually take include delaying graduation for one more cycle, applying to master&apos;s programs, targeting startups and local firms, or starting in adjacent roles and building up from there.
                          </p>
                          <div className="mt-3 space-y-2">
                            {[
                              "Delay graduation to buy time for one more summer internship window.",
                              "Apply to master&apos;s programs to buy time and keep leveling up.",
                              "Work in startups or local companies that care less about pedigree.",
                              "Take a lower-tier engineering or adjacent role and build upward from there."
                            ].map((item) => (
                              <div key={item} className="rounded-[7px] border border-indigo-200 bg-white px-3 py-2 text-[12px] leading-6 text-indigo-700">
                                {item}
                              </div>
                            ))}
                          </div>
                          <p className="mt-3 text-[11px] italic text-indigo-700">
                            A CS degree still matters. It just takes more work to start without internships.
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => toggleDisclosure("pay")}
                        className={`flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${
                          openDisclosures.pay
                            ? "rounded-b-none border-indigo-200 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Banknote className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-[12px] font-semibold text-slate-800">What do internships actually pay in the US?</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">Hourly ranges by company tier</p>
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openDisclosures.pay ? "rotate-180 text-indigo-600" : ""}`} />
                      </button>

                      {openDisclosures.pay ? (
                        <div className="rounded-b-[9px] border border-t-0 border-indigo-200 bg-indigo-50 px-4 py-4">
                          <div className="overflow-hidden rounded-[9px] border border-slate-200 bg-white">
                            {COMPENSATION_BANDS.map((item, index) => (
                              <div
                                key={item.label}
                                className={`flex items-start justify-between gap-3 px-4 py-3 ${
                                  index < COMPENSATION_BANDS.length - 1 ? "border-b border-slate-200" : ""
                                }`}
                              >
                                <div>
                                  <p className="text-[12px] font-semibold text-slate-800">{item.label}</p>
                                  <p className="mt-0.5 text-[11px] text-slate-500">{item.note}</p>
                                </div>
                                <p className={`text-[13px] font-bold ${item.valueClassName}`}>{item.value}</p>
                              </div>
                            ))}
                          </div>
                          <p className="mt-3 text-[11px] italic text-indigo-700">
                            Strategy: land the first role you can, then use that proof to target bigger companies next cycle.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 rounded-r-[9px] border border-slate-200 border-l-[3px] border-l-indigo-600 bg-slate-50 px-4 py-4">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.09em] text-indigo-600">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[8px] text-white">D</span>
                      Where This Comes From
                    </div>
                    <p className="text-[12px] leading-7 text-slate-700">
                      I&apos;ve lived this process from the inside and helped many others do the same. I know the tools
                      strong CS candidates use to get hired, and the skills companies actually screen for.
                    </p>
                    <p className="mt-3 text-[12px] leading-7 text-slate-700">
                      I landed internships at Fidelity, Tesla, and Amazon while in community college. I learned what
                      actually matters, cut the noise, and built this guide around that exact process.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-x border-b border-slate-200 rounded-b-[13px] bg-slate-50 px-5 py-4">
              <span className="text-[12px] text-slate-500">{`Step ${activeGuideStep + 1} of ${GUIDE_STEPS.length}`}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateGuide(-1)}
                  disabled={activeGuideStep === 0}
                  className="inline-flex items-center gap-1 rounded-[7px] border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                {activeGuideStep === GUIDE_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleGuideCompletion}
                    className="inline-flex items-center gap-1 rounded-[7px] border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    Done
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigateGuide(1)}
                    className="inline-flex items-center gap-1 rounded-[7px] bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>

      {tasksLoading ? (
        <div className="rounded-[9px] border border-slate-200 bg-white px-4 py-3 text-[12px] text-slate-500">
          Loading intro completion status...
        </div>
      ) : null}

      {tasksError ? (
        <div className="rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
          {tasksError}
        </div>
      ) : null}

      {syncingTaskId !== null ? (
        <div className="rounded-[9px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700">
          Saving intro completion...
        </div>
      ) : null}

    </div>
  );
}
