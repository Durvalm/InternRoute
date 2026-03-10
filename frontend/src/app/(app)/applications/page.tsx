"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Code2,
  DollarSign,
  ExternalLink,
  FileText,
  Filter,
  Github,
  Linkedin,
  Rocket,
  Search,
  Sparkles,
  Target,
  Users,
  Zap,
  type LucideIcon
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type ResourceCard = {
  title: string;
  eyebrow: string;
  description: string;
  href?: string;
  action?: string;
  icon: LucideIcon;
  shell: string;
  iconShell: string;
  buttonShell?: string;
  content?: ReactNode;
  contentBelowAction?: boolean;
};

type StoryStep = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconShell: string;
};

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

type TaskCompletionModuleProgress = {
  module_key: string;
  score: number;
};

type TaskCompletionResponse = {
  task_id: number;
  completed: boolean;
  module_progress: TaskCompletionModuleProgress[];
};

const moduleTopics = [
  "The right channels to find fresh internship postings",
  "How to apply the same way strong CS students do each semester",
  "What to automate so applications stay fast and repeatable",
  "How OAs fit into the process and what to expect from them",
  "How to track results and know if your resume is converting"
];

const semesterRhythm: StoryStep[] = [
  {
    title: "August: jobs start dropping",
    description: "This is when internship postings begin to come out. Once that starts, checking for jobs becomes part of your routine.",
    icon: Calendar,
    iconShell: "bg-amber-500 text-white"
  },
  {
    title: "Most of fall: search and apply every day",
    description: "Check LinkedIn Past 24 Hours and the GitHub Simplify list every day. Check LinkedIn Past 1 Hour a few times a day too, and apply to all new postings that make sense for you.",
    icon: Search,
    iconShell: "bg-blue-600 text-white"
  },
  {
    title: "Your edge is speed and consistency",
    description: "The students who do best usually have a fast system, a daily target, and enough emotional stamina to keep going through rejections.",
    icon: Zap,
    iconShell: "bg-indigo-600 text-white"
  },
  {
    title: "A few things finally break through",
    description: "Out of a large number of applications, a few may turn into recruiter screens, a few may turn into OAs, and a smaller number may turn into interviews.",
    icon: Code2,
    iconShell: "bg-emerald-600 text-white"
  }
];

const applicationPipeline: StoryStep[] = [
  {
    title: "You apply",
    description: "This should be fast once your resume and profile are ready.",
    icon: FileText,
    iconShell: "bg-slate-900 text-white"
  },
  {
    title: "ATS / automated filter",
    description: "A lot of applications end here before a person looks at them.",
    icon: Filter,
    iconShell: "bg-rose-500 text-white"
  },
  {
    title: "Maybe recruiter or resume review",
    description: "If you get past the automated screen, someone may review your resume.",
    icon: Users,
    iconShell: "bg-cyan-600 text-white"
  },
  {
    title: "Maybe OA",
    description: "Only some companies use OAs, and only some applicants will receive one.",
    icon: Code2,
    iconShell: "bg-emerald-600 text-white"
  },
  {
    title: "Interview(s)",
    description: "Once you get here, the process becomes more human and your odds improve.",
    icon: Briefcase,
    iconShell: "bg-purple-600 text-white"
  },
  {
    title: "Offer or rejection",
    description: "This is the output of the funnel. The system only needs to produce one good result.",
    icon: CheckCircle2,
    iconShell: "bg-emerald-600 text-white"
  }
];

const executionOutcomes = [
  "You may have applied to hundreds of jobs by the end of the season.",
  "You will have a faster system and a resume setup that lets you apply in minutes.",
  "You will have automated the repetitive parts instead of wasting time on every form.",
  "You may have received a few OAs and completed the ones that came your way.",
  "You will know whether your resume is converting or whether it needs to change.",
  "If you do all of this, you are following the same flow strong students go through every recruiting season."
];

const semesterRhythmStyles = [
  {
    shell: "border-amber-300 bg-amber-50/70",
    badge: "bg-amber-500"
  },
  {
    shell: "border-blue-300 bg-blue-50/70",
    badge: "bg-blue-500"
  },
  {
    shell: "border-purple-300 bg-purple-50/70",
    badge: "bg-purple-500"
  },
  {
    shell: "border-cyan-300 bg-cyan-50/70",
    badge: "bg-cyan-500"
  }
];

const pipelineCardStyles = [
  "border-slate-200 bg-white",
  "border-rose-200 bg-rose-50/70",
  "border-cyan-200 bg-cyan-50/70",
  "border-emerald-200 bg-emerald-50/70",
  "border-purple-200 bg-purple-50/70",
  "border-emerald-200 bg-emerald-50/70"
];

const keyTakeaways = [
  "Your edge is using the right channels, applying early, and staying consistent for months.",
  "Mass applying is the base system. Resume tweaks, referrals, and career fairs can help, but they do not replace volume.",
  "Automation matters because speed matters. The goal is to submit good applications while postings are still fresh.",
  "Track your results, and spend some time on creative opportunities too, because hidden programs and strong brand names can create extra edge."
];

const trackerOptions = [
  { title: "Google Sheets", description: "Fast, simple, free" },
  { title: "Notion Template", description: "Better views and richer workflow" },
  { title: "Simplify Tracker", description: "Automatic if you use the extension" }
];

const hiddenOpportunityIdeas = [
  "Hidden internship programs that are not heavily promoted",
  "Local companies and smaller employers near you",
  "Startups and lesser-known companies",
  "Career fairs and recruiter events"
];

const parallelApplyIdeas = [
  "Hackathons",
  "Company fellowships",
  "Short 1-month programs",
  "Externships and similar experiences"
];

const applicationCompletionItems = [
  "I know the main places to check: GitHub daily, LinkedIn daily, and LinkedIn last 1 hour a few times a day.",
  "I understand that mass applying and applying early is the base system, and speed matters more than over-editing each application.",
  "I understand what OAs are, when they show up, and how to prepare without over-prioritizing them too early.",
  "I have a plan to track my applications and spend some time on creative opportunities beyond the obvious internship listings."
];

const oaGroups = [
  {
    title: "Automatic OAs",
    description: "Some companies automatically send an OA to almost everyone who applies.",
    companies: ["JP Morgan", "IBM", "Roblox", "Barclays", "Snowflake", "Optiver"],
    shell: "bg-emerald-50 border-emerald-200",
    badgeShell: "border-emerald-300"
  },
  {
    title: "Selective OAs",
    description: "Other companies only send one after your resume passes an early screen and you are close to an interview.",
    companies: ["Netflix", "Meta", "Amazon", "GitHub"],
    shell: "bg-purple-50 border-purple-200",
    badgeShell: "border-purple-300"
  }
];

function LinkedInHackVisual() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Visual walkthrough</p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        <div className="border-b border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A66C2] text-lg font-bold text-white">
              in
            </div>
            <div className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700">
              software (intern)
            </div>
            <div className="hidden rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700 sm:block">
              United States
            </div>
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white">
              Jobs
            </div>
            <div className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700">
              Date posted
            </div>
            <div className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700">
              Experience level
            </div>
          </div>

          <div className="mt-3 max-w-xs rounded-2xl border border-slate-300 bg-white p-3 shadow-sm">
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-slate-400" />
                Any time
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-slate-400" />
                Past week
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                </span>
                <span className="font-semibold text-slate-900">Past 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Then change the URL</p>
        <div className="mt-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-[11px] text-slate-100">
          .../jobs/search/?f_TPR=r
          <span className="rounded bg-amber-300 px-1 font-bold text-slate-900">86400</span>
          ...
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
          <ArrowRight className="h-3.5 w-3.5" />
          Replace it with{" "}
          <span className="rounded bg-emerald-300 px-1 font-bold text-emerald-950">3600</span> to look at the last hour instead. You can also play around with other values to check different hour windows.
        </div>
      </div>
    </div>
  );
}

const primaryResourceCards: ResourceCard[] = [
  {
    title: "GitHub Internship List",
    eyebrow: "Main source for fresh internships",
    description:
      "Check the Simplify Jobs internship tracker daily. This is usually the fastest place to catch new internships in one central tracker.",
    href: "https://github.com/SimplifyJobs/Summer2026-Internships",
    action: "View GitHub",
    icon: Github,
    shell: "bg-white border-slate-200 hover:border-indigo-300",
    iconShell: "bg-slate-900 text-white",
    buttonShell: "bg-slate-900 text-white hover:bg-slate-800",
    contentBelowAction: true,
    content: (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Other useful lists</p>
        <a
          href="https://www.intern-list.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          <span>intern-list.com</span>
          <ExternalLink className="h-4 w-4 text-slate-500" />
        </a>
        <a
          href="https://www.ycombinator.com/internships"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          <span>Y Combinator Internships (for YC startups)</span>
          <ExternalLink className="h-4 w-4 text-slate-500" />
        </a>
      </div>
    )
  },
  {
    title: "LinkedIn 1-Hour Hack",
    eyebrow: "How you apply before most students",
    description:
      "LinkedIn already helps when you filter to the past 24 hours. The faster move is tightening that filter to the past hour so you can see jobs while they are still fresh.",
    icon: Linkedin,
    shell: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
    iconShell: "bg-blue-600 text-white",
    content: <LinkedInHackVisual />
  }
];

const supportingResourceCards: ResourceCard[] = [
  {
    title: "levels.fyi",
    eyebrow: "Pay research, not job discovery",
    description:
      "Use this after you find a role. It helps you compare compensation and decide which companies are worth prioritizing more aggressively.",
    href: "https://www.levels.fyi/internships/",
    action: "View Salaries",
    icon: DollarSign,
    shell: "bg-white border-slate-200 hover:border-emerald-300",
    iconShell: "bg-emerald-600 text-white",
    buttonShell: "bg-emerald-600 text-white hover:bg-emerald-700"
  },
  {
    title: "Join CS Communities",
    eyebrow: "Good for early signals and shared intel",
    description:
      "A lot of people benefit from insights from other folks during the job search. When it comes to interviews, OAs, new openings, and what companies are doing, it helps a lot to talk with other people instead of trying to figure everything out alone.",
    icon: Users,
    shell: "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
    iconShell: "bg-purple-600 text-white",
    content: (
      <div className="space-y-3 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-purple-600" />
          <span>Class Discords, engineering clubs, and campus groups</span>
        </div>
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-purple-600" />
          <span>Friend groups that share openings and OA experiences</span>
        </div>
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-purple-600" />
          <span>Online CS communities that repost opportunities quickly</span>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-white/80 p-3 text-slate-700">
          I will mention more opportunity sources in the Opportunities section too.
        </div>
      </div>
    )
  }
];

function ResourceSectionCard({
  action,
  buttonShell,
  content,
  contentBelowAction,
  description,
  href,
  icon: Icon,
  iconShell,
  shell,
  title,
  eyebrow
}: ResourceCard) {
  return (
    <div className={`rounded-3xl border-2 p-6 transition-colors ${shell}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconShell}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-xs font-semibold text-slate-500">{eyebrow}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{description}</p>
      {content && !contentBelowAction ? <div className="mt-4">{content}</div> : null}
      {href && action && buttonShell ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${buttonShell}`}
        >
          {action}
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
      {content && contentBelowAction ? <div className="mt-4">{content}</div> : null}
    </div>
  );
}

export default function ApplicationsPage() {
  const [applicationsTasks, setApplicationsTasks] = useState<ApplicationsTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [completionChecks, setCompletionChecks] = useState<boolean[]>(() => applicationCompletionItems.map(() => false));
  const [checklistHydrated, setChecklistHydrated] = useState(false);
  const [serverChecklistSynced, setServerChecklistSynced] = useState(false);
  const [syncingTaskId, setSyncingTaskId] = useState<number | null>(null);
  const [moduleScore, setModuleScore] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setChecklistHydrated(true);
      return;
    }

    const saved = window.localStorage.getItem("applications_completion_checks_v1");
    if (!saved) {
      setChecklistHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === applicationCompletionItems.length) {
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
    window.localStorage.setItem("applications_completion_checks_v1", JSON.stringify(completionChecks));
  }, [checklistHydrated, completionChecks]);

  useEffect(() => {
    let active = true;
    setTasksLoading(true);
    setTasksError(null);

    apiRequest<ApplicationsTasksResponse>("/dashboard/tasks?module_key=applications")
      .then((data) => {
        if (!active) return;
        const tasks = data.tasks ?? [];
        setApplicationsTasks(tasks);
        const firstTask = tasks[0];
        setModuleScore(firstTask?.is_completed ? 100 : 0);
      })
      .catch(() => {
        if (!active) return;
        setApplicationsTasks([]);
        setTasksError("Unable to load the applications checklist.");
      })
      .finally(() => {
        if (active) setTasksLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const applicationsTask = applicationsTasks[0] ?? null;
  const allChecksComplete = completionChecks.every(Boolean);

  const updateApplicationsTaskCompletion = useCallback(
    async (nextCompleted: boolean) => {
      if (!applicationsTask) {
        setTasksError("Applications completion task is not configured.");
        return;
      }
      if (syncingTaskId === applicationsTask.id) return;

      const previousCompleted = applicationsTask.is_completed;
      setTasksError(null);
      setSyncingTaskId(applicationsTask.id);
      setApplicationsTasks((prev) =>
        prev.map((item) => (item.id === applicationsTask.id ? { ...item, is_completed: nextCompleted } : item))
      );

      try {
        const data = await apiRequest<TaskCompletionResponse>(`/dashboard/tasks/${applicationsTask.id}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: nextCompleted })
        });
        const nextModuleState = data.module_progress.find((item) => item.module_key === "applications");
        setModuleScore(nextModuleState?.score ?? (nextCompleted ? 100 : 0));
      } catch (err) {
        setApplicationsTasks((prev) =>
          prev.map((item) => (item.id === applicationsTask.id ? { ...item, is_completed: previousCompleted } : item))
        );
        const message = err instanceof Error ? err.message : "Unable to save your checklist progress. Please try again.";
        setTasksError(message);
      } finally {
        setSyncingTaskId(null);
      }
    },
    [applicationsTask, syncingTaskId]
  );

  useEffect(() => {
    if (tasksLoading || !checklistHydrated || !applicationsTask || serverChecklistSynced) return;

    if (applicationsTask.is_completed && !allChecksComplete) {
      setCompletionChecks(applicationCompletionItems.map(() => true));
    }
    if (!applicationsTask.is_completed && allChecksComplete) {
      setCompletionChecks(applicationCompletionItems.map(() => false));
    }

    setServerChecklistSynced(true);
  }, [allChecksComplete, applicationsTask, checklistHydrated, serverChecklistSynced, tasksLoading]);

  const toggleCompletionCheck = (index: number) => {
    if (syncingTaskId !== null) return;

    const nextChecks = completionChecks.map((value, itemIndex) => (itemIndex === index ? !value : value));
    setCompletionChecks(nextChecks);

    if (!applicationsTask) return;

    const nextAllChecksComplete = nextChecks.every(Boolean);
    if (nextAllChecksComplete !== applicationsTask.is_completed) {
      void updateApplicationsTaskCompletion(nextAllChecksComplete);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
        <div className="grid gap-6 px-6 py-7 md:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              <Target className="h-3.5 w-3.5" />
              Application Strategy
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              How top CS students actually apply to internships
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Once your resume is good enough, the next problem is execution. This module is about using the
              right channels, applying fast, automating the repetitive parts, understanding what happens after
              you submit, and running the same recruiting flow strong students go through every semester.
            </p>
          </div>

          <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-5">
            <p className="text-sm font-semibold text-slate-900">What you will learn here</p>
            <div className="mt-4 space-y-3">
              {moduleTopics.map((topic) => (
                <div key={topic} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <p className="text-sm leading-6 text-slate-700">{topic}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-7 md:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          The Actual Rhythm, The Actual Funnel, and The Result You Want
        </h2>
        <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600">
          This is what a real recruiting season usually feels like for strong students: daily applications,
          a slowly-populated funnel, a lot of silence, and a few opportunities that finally break through.
        </p>

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <Calendar className="h-4 w-4 text-orange-500" />
              <h3 className="text-xl font-semibold">Your Semester Rhythm</h3>
            </div>
            <div className="mt-4 space-y-3">
              {semesterRhythm.map((step, index) => {
                const style = semesterRhythmStyles[index % semesterRhythmStyles.length];
                return (
                  <div key={step.title} className={`rounded-2xl border p-4 ${style.shell}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${style.badge}`}>
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{step.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <ArrowRight className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xl font-semibold">What Happens After You Apply</h3>
            </div>
            <div className="mt-4 space-y-3">
              {applicationPipeline.map((step, index) => {
                const Icon = step.icon;
                const shell = pipelineCardStyles[index % pipelineCardStyles.length];
                return (
                  <div key={step.title} className={`rounded-2xl border p-4 ${shell}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${step.iconShell}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{step.title}</h4>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-emerald-300 bg-emerald-50/70 p-5 md:p-6">
          <h3 className="text-2xl font-semibold text-emerald-950">Output at the End</h3>
          <p className="mt-3 text-base leading-7 text-slate-600">
            By the end of the semester, this is what you will have done:
          </p>
          <div className="mt-5 grid gap-x-8 gap-y-2 md:grid-cols-2">
            {executionOutcomes.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">The Reality: it is a numbers game</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-3xl font-bold text-amber-900">300+</p>
                <p className="mt-1 text-sm text-slate-700">Applications may be needed</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-3xl font-bold text-amber-900">Daily</p>
                <p className="mt-1 text-sm text-slate-700">You should check and apply regularly</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-3xl font-bold text-amber-900">&lt;3 min</p>
                <p className="mt-1 text-sm text-slate-700">Most applications should take less than this</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-800 md:text-base">
              Since this process is heavily automated by ATS filters, do not spend too much time optimizing each application or writing cover letters. Your edge is having a strong resume, applying to many companies, and applying fast, ideally as soon as the job opens.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-800 md:text-base">
              Get used to rejections. Getting noticed is usually the hardest part of the whole process, often harder than the interviews themselves, so be patient. You may spend most of the fall and part of the spring doing this. Once you get an interview, your chances improve a lot. The hardest part is usually getting through the first filter.
            </p>
            <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-semibold text-purple-900">What actually tends to work</p>
              <p className="mt-1 text-sm text-slate-700">
                Mass applying and applying early works best for most people. If you can contact recruiters, get referrals, or go to career fairs, absolutely do it because those things can help. But for most students, cold applying is still the main system, so that is where most of your time should go.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Where to Find Jobs</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          These are the core places to watch if your goal is catching fresh roles quickly and applying before the listing gets flooded.
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          By following this, you are avoiding a lot of mistakes I made at first, like checking for internships on Google and applying to outdated postings that had already been sitting there for months.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {primaryResourceCards.map((card) => (
            <ResourceSectionCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Other Resources</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          These are still useful, but they serve a different job: compensation research, context, and early signals from people around you.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {supportingResourceCards.map((card) => (
            <ResourceSectionCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              What top students use
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Simplify: automate the boring part so you can apply faster</h2>
            <p className="mt-2 text-slate-700">
              Strong CS students use tools like Simplify because manual form-filling is wasted time. The goal is not to be fancy. The goal is to remove friction so you can submit more good applications while roles are still fresh.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-indigo-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              <p className="font-semibold text-slate-900">Autofill for repeated forms</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">This is how you keep application time low when you are applying at scale.</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              <p className="font-semibold text-slate-900">Faster one-click workflows</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">Useful on common job boards where speed to submission matters.</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <p className="font-semibold text-slate-900">Resume tailoring</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">The paid version can tailor your resume for each application. I never tried it myself, but it might be interesting.</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <p className="font-semibold text-slate-900">Built-in tracking support</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">Nice if you want your application log in the same place as your applying tool.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="https://simplify.jobs/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Rocket className="h-5 w-5" />
            Get Simplify
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-sm text-slate-600">
            Always review the autofilled fields before submitting. Automation should increase speed, not create sloppy applications.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Code2 className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Online Assessments (OAs)</h2>
            <p className="mt-2 text-slate-700">
              OAs are coding challenges that companies usually send on platforms like HackerRank and CodeSignal. They show up after you apply and before interviews, and they are meant to filter applicants before a human conversation happens.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Not all companies use OAs, so do not feel intimidated by them. You may only get a few during one recruiting season, and they usually show up more often at more rigorous tech companies. When they do appear, the usual format is around 60 minutes for 2 questions, with the prompt on the left and the code editor on the right.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Question style</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              These are DSA problems, very similar to LeetCode, except OA questions usually have more words and more context.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">How to prepare</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              You can practice with LeetCode or directly on HackerRank and similar OA platforms, since they usually have practice problems too. But not all companies ask OAs or LeetCode-style questions, so this should become a serious focus only after your projects and core skills are already solid.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">How they are graded</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              After you submit, they run test cases against your solution. It is common to see around 15 tests per question, and a 15/15 plus a 9/15 can still be a solid result.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <img
              src="/oa.jpg"
              alt="Example online assessment interface with the problem on the left and the code editor on the right"
              className="h-auto w-full"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {oaGroups.map((group) => (
            <div key={group.title} className={`rounded-2xl border p-4 ${group.shell}`}>
              <div className="flex items-center gap-2">
                {group.title === "Automatic OAs" ? (
                  <Filter className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Award className="h-5 w-5 text-purple-600" />
                )}
                <p className="font-bold text-slate-900">{group.title}</p>
              </div>
              <p className="mt-2 text-sm text-slate-700">{group.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.companies.map((company) => (
                  <span
                    key={company}
                    className={`rounded-full border bg-white px-2.5 py-1 text-xs text-slate-700 ${group.badgeShell}`}
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border-2 border-rose-300 bg-rose-50 p-5">
          <p className="font-bold text-rose-900">Heads up: a lot of people cheat on OAs</p>
          <p className="mt-2 text-sm leading-6 text-slate-800">
            A lot of people cheat on those OAs. And part of the result is that OA questions have gotten inflated in difficulty. It is common for some OA questions to feel harder than interview questions.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-800">
            Do not let that stop you. Still do the OAs you get, use them as reps, the more you go through the flow top students go through, the more you'll learn and the more you'll become one, and if you are not strong at LeetCode yet, don't worry, most jobs won't ask OAs, and once you're ready, we have a section on Leetcode here.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-600">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Track Your Applications</h2>
            <p className="mt-2 text-slate-700">
              Tracking is how you get feedback on your own strategy. If you are 100 to 150 applications in and your resume is not converting, that is the signal to change something instead of blindly repeating the same process.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {trackerOptions.map((option) => (
                <div key={option.title} className="rounded-2xl border border-cyan-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">{option.title}</p>
                  <p className="mt-1 text-xs text-slate-700">{option.description}</p>
                </div>
              ))}
            </div>
            <a
              href="https://www.notion.com/templates/job-tracker-the-ultimate-job-search-companion"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-semibold text-cyan-800 transition-colors hover:bg-cyan-50"
            >
              Open Notion job tracker template
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <Search className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">Find creative, non-conventional opportunities too</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                While you are grinding the visible internship pipeline, spend some time on less obvious paths too.
                Hidden programs, local companies, startups, and career-fair leads can uncover opportunities other
                people miss.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {hiddenOpportunityIdeas.map((item) => (
              <div key={item} className="rounded-2xl border border-amber-200 bg-white/90 p-3 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>

          <details className="group mt-4 rounded-2xl border border-amber-200 bg-white/90 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900">
              Real example
              <ChevronRight className="h-4 w-4 text-amber-600 transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              In my first year recruiting, I took a list of Fortune 500 companies and searched them one by one to
              see if there were hidden internship programs. That is how I found a P&amp;G program that was not on
              LinkedIn, and I got interviews from it. I am not saying to copy that exact method, just showing you
              the kind of creative search that can uncover things other people miss.
            </p>
          </details>
        </div>

        <div className="rounded-3xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">Other things to apply to during the fall</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                You can also apply to things other than internships during this same window. Many of them open in
                the fall too, and they can still add strong experience and resume value.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {parallelApplyIdeas.map((item) => (
              <div key={item} className="rounded-2xl border border-violet-200 bg-white/90 p-3 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>

          <details className="group mt-4 rounded-2xl border border-violet-200 bg-white/90 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900">
              Why the resume value matters
              <ChevronRight className="h-4 w-4 text-violet-600 transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Resume value is one of the biggest reasons this matters. Strong company names, university names,
              and recognizable programs can make your resume read much stronger early on.
            </p>
          </details>

          <details className="group mt-4 rounded-2xl border border-violet-200 bg-white/90 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900">
              Why hackathons and programs are especially useful
              <ChevronRight className="h-4 w-4 text-violet-600 transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Hackathons can give you strong experience and strong resume value. I went to HackHarvard and
              HackPrinceton, and both were great examples of events that are relatively accessible but still very
              valuable.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              I will cover more of these in the Opportunities section, but many fellowships, externships, and
              short programs are things you should apply to during the fall alongside your internship applications.
            </p>
          </details>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <h2 className="text-center text-xl font-bold text-slate-900">Key Takeaways</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {keyTakeaways.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
              <p className="text-sm text-slate-800">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-indigo-200 pt-4">
          <p className="text-center font-semibold text-slate-800">
            You are building a system that only needs to produce one offer.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Do Not Skip Opportunities Programs</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              It is really important to apply to opportunities programs as well, not just internship
              job postings. Fellowships, externships, diversity programs, and communities can
              accelerate your recruiting outcomes and add real resume value.
            </p>
          </div>
          <a
            href="/opportunities"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            Open Opportunities Page
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Complete This Module</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Click through this checklist once the main ideas are clear. When every item is checked, this
              module is marked complete in your task system, just like the Timeline module.
            </p>
          </div>
          <a
            href="/interview-prep"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Continue to Interview Prep
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="space-y-3">
            {applicationCompletionItems.map((item, index) => (
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

          {tasksLoading ? <p className="mt-4 text-sm text-slate-500">Loading checklist...</p> : null}
          {tasksError ? <p className="mt-4 text-xs text-rose-600">{tasksError}</p> : null}

          <p className="mt-4 text-xs text-slate-500">
            {tasksLoading
              ? "Checking your task progress..."
              : moduleScore !== null
                ? `Applications module progress: ${moduleScore}%.`
                : applicationsTask
                  ? applicationsTask.is_completed
                    ? "Applications checklist complete."
                    : "Complete all checklist items to mark this module done."
                  : "Checklist task will sync here once it is available."}
          </p>
        </div>
      </section>
    </div>
  );
}
