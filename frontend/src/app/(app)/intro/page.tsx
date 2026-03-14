"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  GraduationCap,
  Info,
  Lightbulb,
  Map,
  Sparkles,
  Trophy,
  Briefcase,
  FileText,
  Code2,
  Target,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type Season = {
  name: string;
  months: string;
  summary: string;
  details: string;
  tone: "peak" | "medium" | "quiet";
};

type InfoCardProps = {
  icon: ComponentType<{ size?: string | number; className?: string }>;
  title: string;
  children: ReactNode;
  colorClass?: string;
};

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

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

const completionItems = [
  "I should target around 62% readiness before applying, while still avoiding perfection paralysis.",
  "I should ideally be ready before August for applications, but if not, the sooner I start the better.",
  "Most internships run in the summer; applications happen the year before, mainly August-December and often stretching into March.",
  "I understand that summers-left matters for planning, but I should also chase off-season internships, hackathons, and other opportunities."
];

const seasons: Season[] = [
  {
    name: "Peak Recruiting Window",
    months: "August - December",
    summary: "The main event. Big Tech, Fortune 500s, and structured programs open here.",
    details: "You want to reach 62% Readiness before this window, but if not, the sooner you start the better. You want to be ready to apply like crazy once august starts.",
    tone: "peak"
  },
  {
    name: "Lower Recruiting Window",
    months: "January - March",
    summary: "Smaller teams, startups, and local companies hire now.",
    details: "Fewer spots, but often easier interviews and less competition (most top students already commited to their offers).",
    tone: "medium"
  },
  {
    name: "Off-Season Window",
    months: "April - July",
    summary: "Preparation time for the next cycle.",
    details: "Less hiring happens in this period; it is a good time to build skills, projects, and practice LeetCode.",
    tone: "quiet"
  }
];

function InfoCard({ icon: Icon, title, children, colorClass = "text-indigo-600 bg-indigo-50" }: InfoCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center h-full">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${colorClass}`}>
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-slate-900 mb-2 text-lg">{title}</h3>
      <div className="text-sm text-slate-500 leading-relaxed w-full">{children}</div>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-bold text-slate-900">{title}</span>
        {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 text-sm text-slate-600 border-t border-slate-100 mt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

function seasonStyles(tone: Season["tone"]) {
  if (tone === "peak") {
    return {
      shell: "bg-emerald-50 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-500"
    };
  }
  if (tone === "medium") {
    return {
      shell: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      bar: "bg-amber-500"
    };
  }
  return {
    shell: "bg-slate-50 border-slate-200",
    badge: "bg-slate-200 text-slate-700",
    bar: "bg-slate-400"
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
  const [completionChecks, setCompletionChecks] = useState<boolean[]>(() => completionItems.map(() => false));
  const [checklistHydrated, setChecklistHydrated] = useState(false);
  const [serverChecklistSynced, setServerChecklistSynced] = useState(false);
  const [syncingTaskId, setSyncingTaskId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    apiRequest<TimelineSummary>("/dashboard/summary")
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setSummaryError("Unable to load your personalized intro data.");
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setChecklistHydrated(true);
      return;
    }
    const saved = window.localStorage.getItem("intro_completion_checks_v1");
    if (!saved) {
      setChecklistHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === completionItems.length) {
        setCompletionChecks(parsed.map(Boolean));
      }
    } catch {
      // ignore corrupted local storage
    }
    setChecklistHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!checklistHydrated) return;
    window.localStorage.setItem("intro_completion_checks_v1", JSON.stringify(completionChecks));
  }, [completionChecks, checklistHydrated]);

  useEffect(() => {
    let active = true;
    setTasksLoading(true);
    setTasksError(null);

    apiRequest<TimelineTasksResponse>("/dashboard/tasks?module_key=timeline")
      .then((data) => {
        if (active) setTimelineTasks(data.tasks ?? []);
      })
      .catch(() => {
        if (active) {
          setTimelineTasks([]);
          setTasksError("Unable to load intro checklist.");
        }
      })
      .finally(() => {
        if (active) setTasksLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const summersLeft = summary?.recruiting?.summers_left ?? null;
  const summersLeftLabel =
    summaryLoading
      ? "Loading personalized intro..."
      : summersLeft === null
        ? "Set your graduation date to calculate this."
        : `${summersLeft} ${summersLeft === 1 ? "summer" : "summers"} left`;

  const summersLeftDetail =
    summaryLoading
      ? "We are calculating your intro context."
      : summersLeft === null
        ? "Once your graduation date is set, we can map your realistic internship windows."
        : summersLeft <= 0
          ? "Summer windows are likely closed, but off-season internships and entry-level routes still matter."
          : summersLeft === 1
            ? "High urgency: this is likely your final summer internship window."
            : "You still have runway. Use each summer to ladder up in quality and brand signal.";
  const timelineModule = summary?.module_progress.find((module) => module.module_key === "timeline");
  const timelineTask = timelineTasks[0] ?? null;
  const allChecksComplete = completionChecks.every(Boolean);

  const updateTimelineTaskCompletion = useCallback(async (nextCompleted: boolean) => {
    if (!timelineTask) {
      setTasksError("Intro completion task is not configured.");
      return;
    }
    if (syncingTaskId === timelineTask.id) return;
    const previousCompleted = timelineTask.is_completed;
    setTasksError(null);
    setSyncingTaskId(timelineTask.id);
    setTimelineTasks((prev) => prev.map((item) => (item.id === timelineTask.id ? { ...item, is_completed: nextCompleted } : item)));

    try {
      const data = await apiRequest<TaskCompletionResponse>(`/dashboard/tasks/${timelineTask.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: nextCompleted })
      });
      setSummary((prev) =>
        prev
          ? { ...prev, module_progress: data.module_progress }
          : {
            graduation_date: null,
            recruiting: { summers_left: null, next_peak_date: "" },
            module_progress: data.module_progress
          }
      );
    } catch (err) {
      setTimelineTasks((prev) => prev.map((item) => (item.id === timelineTask.id ? { ...item, is_completed: previousCompleted } : item)));
      const message = err instanceof Error ? err.message : "Unable to save your checklist progress. Please try again.";
      setTasksError(message);
    } finally {
      setSyncingTaskId(null);
    }
  }, [timelineTask, syncingTaskId]);

  useEffect(() => {
    if (tasksLoading || !checklistHydrated || !timelineTask || serverChecklistSynced) return;
    if (timelineTask.is_completed && !allChecksComplete) {
      setCompletionChecks(completionItems.map(() => true));
    }
    if (!timelineTask.is_completed && allChecksComplete) {
      setCompletionChecks(completionItems.map(() => false));
    }
    setServerChecklistSynced(true);
  }, [tasksLoading, checklistHydrated, timelineTask, serverChecklistSynced, allChecksComplete]);

  const toggleCompletionCheck = (index: number) => {
    if (syncingTaskId !== null) return;
    const nextChecks = completionChecks.map((value, i) => (i === index ? !value : value));
    setCompletionChecks(nextChecks);
    if (!timelineTask) return;
    const nextAllChecksComplete = nextChecks.every(Boolean);
    if (nextAllChecksComplete !== timelineTask.is_completed) {
      void updateTimelineTaskCompletion(nextAllChecksComplete);
    }
  };

  const handleCompleteAndContinue = () => {
    router.push("/skills");
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8 font-sans">
      <section className="rounded-3xl bg-[#1e1b4b] text-white overflow-hidden shadow-xl relative">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Calendar size={200} />
        </div>

        <div className="p-8 md:p-12 relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Calendar size={14} />
              Module 01
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Intro</h1>
          <p className="max-w-3xl text-lg text-indigo-100 leading-relaxed mb-8">
            Most students don’t miss internships because they’re bad at coding, they miss them because they don’t understand the hiring system. Miss recruiting windows, miss opportunities, etc...
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Target Audience</div>
              <p className="text-sm font-medium text-white">Aspiring software engineers. The skills taught here are foundational for getting jobs in tech.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">The Goal</div>
              <p className="text-sm font-medium text-white">Use the information top students use to get internships to get you market-ready and stand out in recruiting windows, cut the non-important stuff and focus on what gets you hired.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Why It Works</div>
              <p className="text-sm font-medium text-white">We prioritize "Proof of Work" over grades and theory. CS is a very large field, but skills needed to get internships are very specific and can be learned in a short amount of time.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
            <Info size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-indigo-900">Where this comes from?</h2>
            <p className="mt-1 text-sm text-indigo-900/90 leading-relaxed">
              I've lived this process from the inside and helped many others do the same.
              I know the tools strong CS candidates use to get hired, and the skills companies actually screen for. I'm here to teach you everything I learned.
            </p>
            <div className="mt-3 relative inline-block group">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                Hear my story
              </button>
              <div className="pointer-events-none absolute left-0 top-full mt-2 w-80 rounded-xl border border-indigo-200 bg-white p-3 text-xs text-slate-600 shadow-lg opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 z-20">
                I landed internships at Fidelity, Tesla, and Amazon while in community college. I learned what
                actually matters, cut the noise, and built this guide around that exact process.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard icon={Banknote} title="Internship Compensation USA" colorClass="bg-emerald-100 text-emerald-600">
          <div className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden text-left">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-3 py-2.5 border-b border-slate-200">
              <div className="min-w-0">
                <p className="text-[12px] leading-tight font-medium text-slate-700">Small Firms</p>
                <p className="text-[11px] leading-snug text-slate-500 mt-0.5">Chase this first</p>
              </div>
              <p className="text-sm font-bold text-slate-700 whitespace-nowrap">$20 - $40 / hr</p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-3 py-2.5 border-b border-slate-200">
              <div className="min-w-0">
                <p className="text-[12px] leading-tight font-medium text-slate-700">Big/Mid Tech</p>
                <p className="text-[11px] leading-snug text-slate-500 mt-0.5">
                  Usually needs LeetCode and stronger experience
                </p>
              </div>
              <p className="text-sm font-bold text-slate-700 whitespace-nowrap">$50 - $80 / hr</p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[12px] leading-tight font-medium text-slate-700">Quant / HFT</p>
                <p className="text-[11px] leading-snug text-slate-500 mt-0.5">Highest compensation tier (usually the best students from top schools)</p>
              </div>
              <p className="text-sm font-bold text-emerald-600 whitespace-nowrap">~$120+ / hr</p>
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={Clock3} title="Time to Readiness" colorClass="bg-blue-100 text-blue-600">
          <p className="mb-3">
            We recommend reaching <strong>62% Readiness</strong> in our progress tracker before applying. This will help you start competing for internships, but you'll need more for better ones.
          </p>
          <div className="bg-slate-50 rounded-lg p-2 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">From Scratch:</span>
              <span className="font-bold text-slate-700">~6 Months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Some Programming:</span>
              <span className="font-bold text-slate-700">~4 Months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Solid Projects:</span>
              <span className="font-bold text-slate-700">~1 Month</span>
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={AlertTriangle} title="The Degree Gap" colorClass="bg-amber-100 text-amber-600">
          <p className="mb-2">
            <strong>Grades != Jobs.</strong>
          </p>
          <p className="text-xs">
            If you only pursue grades, you will not build the skills to get a job. Without internships,
            even a 4.0 GPA struggles to get top-tier offers.
          </p>
        </InfoCard>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
        <div className="space-y-8">
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Internship Basics + Your Summers Left</h2>
            <p className="text-sm text-slate-500 mb-6">
              Most CS internships run in the summer (usually around 10-14 weeks). The key detail: recruiting for
              those roles usually starts the previous year, often beginning in August. That is why it is important to get ready before (or around) August of the previous year and start applying early.
            </p>

            <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Your Summers Left</p>
              <p className="mt-1 text-lg font-bold text-indigo-900">{summersLeftLabel}</p>
              <p className="mt-1 text-sm text-indigo-900/90">{summersLeftDetail}</p>
              <p className="mt-3 text-xs text-indigo-800">
                Important: summers-left is a planning metric, not the full strategy. Off-season internships,
                startup roles, hackathons, and programs can still create strong momentum.
              </p>
              {summaryError ? <p className="mt-2 text-xs text-indigo-700">{summaryError}</p> : null}
            </div>

            <div className="space-y-3">
              <CollapsibleSection title="Why track summers?">
                <p className="mb-2">
                  You have a limited number of summers before you graduate. Each one is an opportunity to ladder up.
                </p>
                <p className="mb-2">Each summer is an opportunity to get a job, the months prior to it is a good opportunity to level up your skills and projects.</p>
                <p className="mb-2">Even if you already found an internship, your next summers will be an opportunity to pepare and get better offers.</p>
                <p>
                  From now on, you should <strong>orient your learning based on the next summers you have and recruiting windows.</strong> August of the previous year is when jobs and other opportunities open up, summer is when jobs actually start.
                </p>
              </CollapsibleSection>

              <CollapsibleSection title="This is not only about summer">
                <p className="mb-2">
                  Off-season internships (Fall/Spring) exist. They are lower volume but can be great for first
                  experience if you missed a summer cycle.
                </p>
                <p>
                  During recruiting season, you should also apply for hackathons, programs, off-season internships, fellowships, and other resume-building opportunities. You should be applying to all these duting recruiting season, they also open during this time. More information about these in the 'opportunities' module.
                </p>
              </CollapsibleSection>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Map size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Recruiting Windows Explained</h2>
                <p className="text-sm text-slate-500">Now that timing is clear, this is how the year is split.</p>
              </div>
            </div>

            <div className="space-y-4">
              {seasons.map((season) => {
                const style = seasonStyles(season.tone);
                return (
                  <article
                    key={season.name}
                    className={`rounded-2xl border p-6 transition-all hover:shadow-md ${style.shell}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                      <h3 className="text-lg font-bold text-slate-900">{season.name}</h3>
                      <span
                        className={`self-start md:self-auto rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${style.badge}`}
                      >
                        {season.months}
                      </span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full ${style.bar} opacity-30 mb-4`}>
                      <div className={`h-full rounded-full ${style.bar} w-full`} />
                    </div>
                    <p className="text-slate-800 font-medium text-sm mb-2">{season.summary}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{season.details}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex gap-3">
              <Lightbulb size={20} className="text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900">
                <strong className="block mb-1 text-indigo-800">Why this matters:</strong>
                For Summer internships, applications often open in August of the previous year. If you wait until
                spring, many of the highest-volume roles are already gone.
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-100 rounded-full -mr-12 -mt-12 opacity-50" />
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2 relative z-10">
              <BrainCircuit size={20} className="text-amber-500" />
              The LeetCode Trap
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              <strong>Do not get stuck here.</strong>
            </p>
            <ul className="space-y-3 text-sm text-slate-600 mb-4">
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>LeetCode is a <strong>Bonus</strong>. It unlocks top-tier companies (Big Tech, Quant).</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>It takes months to master.</span>
              </li>
              <li className="flex gap-2">
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <span><strong>Do not delay applying</strong> just to grind LC. Most other companies care more about your projects and experiences.</span>
              </li>
            </ul>
            <p className="text-[11px] leading-relaxed text-slate-500">
              If you do not know what LeetCode is yet, do not worry and do not focus on it right now. We have a dedicated module for it, and it will make sense when you get there.
            </p>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Info size={24} className="text-slate-400" />
              <h2 className="text-xl font-bold text-slate-900">FAQ</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "What is a Return Offer (RO)?",
                  a: "A full-time job offer given at the end of an internship. It is the safest way to secure a job post-grad."
                },
                {
                  q: "What if I have no experience?",
                  a: "That is why we build projects. Projects = Experience when you are starting out."
                },
                {
                  q: "Other Opportunities?",
                  a: "During recruiting season, also look for Hackathons, Fellowships, and Open Source programs."
                }
              ].map((item) => (
                <div key={item.q} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{item.q}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-50 rounded-3xl border border-slate-200 p-8">
            <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold text-sm uppercase tracking-wide">
              <GraduationCap size={16} className="text-indigo-500" />
              Approaching Graduation?
            </div>
            <p className="text-xs text-slate-500 mb-4">
              If you are close to graduating without internships, here are common paths people take (no recommendations, just things people actually do):
            </p>
            <ul className="space-y-2">
              {[
                "Delay graduation (e.g. May -> December) to buy time for one more summer internship.",
                "Apply to master's programs to buy more time and upskill.",
                "Work in startups and local companies (which possibly care less about internships).",
                "Find lower tier jobs than Software Engineering and build up from there."
              ].map((item) => (
                <li key={item} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="block w-1 h-1 bg-slate-400 rounded-full mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 italic">
              Remember: A CS degree is still very valuable. It just takes more work to start without internships.
            </div>
          </section>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Understanding the Playbook</h2>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target size={18} className="text-indigo-600" />
            The Core Philosophy
          </h3>
          <div className="mt-4 space-y-4 text-slate-600 text-[15px] leading-relaxed">
            <p>
              If you&apos;re in the U.S. read this: <strong>getting internships is not about how insanely talented you are</strong> or being a
              developer since you were 14 years old. Let me explain.
            </p>
            <p>
              There are brilliant developers all around the world, in many countries, who will never have the
              opportunities you have just because they are not in the U.S. <strong>So you see, it&apos;s not about skills.</strong>
            </p>
            <p>
              At the end of the day, it&apos;ll be someone checking a piece of paper (your resume). Skills are an important part of it, but there&apos;s a <strong>playbook to get a job as a Software Engineer</strong>{" "}
              that kids in top schools know. A lot of them have relatives who work in the field, and they know exactly
              what they need to do.
            </p>
            <p className="font-semibold text-indigo-700">
              You need to work smart, not harder, do the things that can
              actually get you a job. If you follow this path, you&apos;ll learn it.
            </p>
          </div>
        </article>

        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            The Core Four: Your Foundation
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            These four pillars work together as a system. Master these, and you&apos;ll have what you need to compete.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: "Step 1",
              icon: Code2,
              iconShell: "bg-gradient-to-br from-indigo-500 to-blue-500 text-white",
              title: "Coding Skills - Build Your Technical Foundation",
              what: "Learn how to code and solve challenges in a practical way, we recommend Python, but if you already know another language it's fine. We have a built in IDE for you to showcase some of your coding skills and pass this module.",
              why: "Basic coding is fundamental, a lot of a Software Engineer's job is to write and read code, you need to get really good at this. Interviews require solving challenges, and building software requires a lot of coding, so don't skip this."
            },
            {
              step: "Step 2",
              icon: Target,
              iconShell: "bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white",
              title: "Projects - Build Real World Software & Populate Your Resume with Proof",
              what: "Learn backend development and build 2–3 real projects that demonstrate your skills. Your projects should include things like a backend framework, APIs, and a database.",
              why: "That's how real applications work: servers, APIs, and databases. This is much closer to what you’ll actually do in a software engineering job. Projects will populate your resume and show recruiters proof that you can build real software, not just solve coding challenges."
            },
            {
              step: "Step 3",
              icon: FileText,
              iconShell: "bg-emerald-500 text-white",
              title: "Resume - Present Your Work to Get Hired",
              what: "We teach you how to use the right tools and build a resume that passes ATS and gets attention from recruiters. More importantly, we teach you how to do that even as a beginner with not-so-impressive projects yet, by framing your work the right way and showing clear proof of skills.",
              why: "At the end of the day, it is a person checking a resume. It does not even matter how good you are if your resume does not communicate it fast. This is one of the most important parts: if you are mass applying with a bad resume, you are mostly wasting time."
            },
            {
              step: "Step 4",
              icon: CheckCircle2,
              iconShell: "bg-amber-500 text-white",
              title: "Applications - Get in Front of Recruiters",
              what: "We teach you the real application workflow: how many applications to send, where to find them, how to uncover hidden opportunities, and how to track everything without chaos. You will learn the tools top CS students use, including automation workflows, so you can apply at scale while still keeping quality.",
              why: "There is a specific strategy to applying. If you do not learn it, you will spend too much time applying, apply to too few roles, miss early openings, and lose opportunities. The students who know the system move faster, stay consistent, and get more interview chances."
            }
          ].map((item) => (
            <article key={item.step} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${item.iconShell}`}>
                  <item.icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{item.step}</p>
                  <h4 className="mt-1 text-xl font-bold text-slate-900">{item.title}</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">What</p>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{item.what}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Why</p>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{item.why}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div>
          <h3 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={20} className="text-indigo-500" />
            Beyond the Basics
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            These modules help you level up once you&apos;ve mastered the fundamentals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="rounded-2xl border border-slate-200 p-5 bg-white">
            <h4 className="text-2xl font-bold text-slate-900">Interview Prep</h4>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Getting the interview is half the battle. Learn behavioral interview strategies, technical interview tips,
              and how to tell your story effectively.
            </p>
            <p className="mt-4 text-sm font-medium text-indigo-600 flex items-center gap-2">
              <Sparkles size={14} />
              Be ready to perform
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 p-5 bg-white">
            <h4 className="text-2xl font-bold text-slate-900">LeetCode</h4>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              LeetCode is important for Big Tech and top-tier companies, but it&apos;s <strong>not required for beginners</strong>.
              Focus on solid projects first, then come back to this when you&apos;re ready to target FAANG-level roles.
            </p>
            <p className="mt-4 text-sm font-medium text-amber-600 flex items-center gap-2">
              <AlertTriangle size={14} />
              Advanced, skip if starting out
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 p-5 bg-white">
            <h4 className="text-2xl font-bold text-slate-900">Opportunities</h4>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Discover programs, fellowships, diversity initiatives, and other experiences that can strengthen your
              resume beyond traditional internships.
            </p>
            <p className="mt-4 text-sm font-medium text-indigo-600 flex items-center gap-2">
              <Briefcase size={14} />
              Expand your options
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold text-slate-900">Before Continuing</h2>
        <p className="mt-1 text-sm text-slate-500">
          Mark these once you understand them. This is how you complete this section.
        </p>

        <div className="mt-5 space-y-2.5">
          {tasksLoading ? <p className="text-sm text-slate-500">Loading checklist...</p> : null}

          {!tasksLoading && !tasksError && timelineTasks.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              No checklist tasks are configured for this module yet.
            </p>
          ) : null}

          {!tasksLoading && timelineTask
            ? completionItems.map((item, index) => (
              <label
                key={item}
                className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition-colors ${syncingTaskId !== null ? "opacity-70 cursor-wait" : "cursor-pointer hover:bg-slate-100"}`}
              >
                <input
                  type="checkbox"
                  checked={completionChecks[index]}
                  onChange={() => toggleCompletionCheck(index)}
                  disabled={syncingTaskId !== null}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-60"
                />
                <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
              </label>
            ))
            : null}
        </div>

        {tasksError ? <p className="mt-4 text-xs text-red-500">{tasksError}</p> : null}

        <p className="mt-4 text-xs text-slate-500">
          {timelineModule
            ? `Intro progress: ${timelineModule.score}%.`
            : allChecksComplete
              ? "Checklist complete. Syncing progress..."
              : "Complete checklist tasks to build momentum for the next module."}
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Step 1: Coding Skills</h2>
          <p className="mt-1 text-slate-500">The first step is building your technical leverage.</p>
        </div>
        <button
          type="button"
          onClick={handleCompleteAndContinue}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold transition-all w-full md:w-auto bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          Continue to Coding Skills
          <ArrowRight size={20} />
        </button>
      </section>
    </div>
  );
}
