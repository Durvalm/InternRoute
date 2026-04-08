"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  BookMarked,
  CheckCircle2,
  ChartColumn,
  Clock3,
  ChevronDown,
  ChevronUp,
  CircleDot,
  FileText,
  Globe,
  GitBranch,
  Lightbulb,
  Lock,
  Loader2,
  MessageCircle,
  Plus,
  Settings2,
  Users,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/api";

const inspirationProjects = [
  {
    title: "YourLifeSimplified",
    subtitle: "Task Manager",
    summary: "A simple productivity app. Strong first project for practicing backend endpoints and persistent task data.",
    stack: ["Python", "FastAPI", "SQL"],
    imageSrc: "/projects/your_life_simplified.png",
    imageAlt: "YourLifeSimplified task manager interface screenshot",
    githubUrl: "https://github.com/Durvalm/YourLifeSimplified"
  },
  {
    title: "RealEstate Platform",
    subtitle: "Listing Site",
    summary: "Property listings + favorites + profiles. Great practice for API flows and relational database modeling.",
    stack: ["Python", "FastAPI", "API + Data Layer"],
    imageSrc: "/projects/real_estate_2.png",
    imageAlt: "RealEstate Platform listings interface screenshot",
    githubUrl: "https://github.com/Durvalm/RealEstate"
  }
];

const portfolioCardBlueprint = [
  {
    key: "core_1",
    title: "Core Project 1",
    subtitle: "First Pass",
    description: "Your first verified backend project. Submit once the backend is solid and working end to end.",
    cta: "Submit with the form above"
  },
  {
    key: "core_2",
    title: "Core Project 2",
    subtitle: "Second Pass",
    description: "Your second verified backend project. Stronger scope, clearer backend depth, and better proof of consistency.",
    cta: "Locked until Core Project 1 passes"
  },
  {
    key: "bonus",
    title: "Bonus: Real-User Project",
    subtitle: "Optional +20%",
    description: "Deployed project used by real people. Valuable for interviews and resume impact.",
    cta: "Optional challenge"
  }
] as const;

const projectIdeaPrompts = [
  {
    title: "Solve a small real problem you understand",
    description:
      "Class schedules, club workflows, expense tracking, organizing notes. Build around problems you or people around you actually face."
  },
  {
    title: "Build real backend logic, not just pages",
    description:
      "Your project should store data, update it, and return it through APIs. Static pages do not show backend engineering ability."
  },
  {
    title: "Make sure users can perform actions",
    description:
      "Users should be able to create, edit, and delete meaningful data: tasks, bookings, posts, orders, profiles, and similar flows."
  },
  {
    title: "Do not worry about originality at first",
    description:
      "Cloning common app types is completely fine. What matters most is the engineering quality behind your implementation."
  }
] as const;

const projectIdeaExamples = [
  {
    title: "Campus Club Manager",
    summary: "Manage events, members, and attendance with roles and internal notes."
  },
  {
    title: "Assignment Tracker",
    summary: "Track deadlines, reminders, and coursework progress with user-specific views."
  },
  {
    title: "Order Tracker for Small Businesses",
    summary: "Simple order intake + status updates + searchable order history."
  },
  {
    title: "Appointment Booking System",
    summary: "Users schedule appointments while businesses manage availability and requests."
  }
];

const moduleOutcomes = [
  "2 project repositories that demonstrate backend ownership.",
  "Real understanding of request flow, backend logic, and data persistence.",
  "Resume-ready project entries with stronger technical depth.",
  "Optional bonus: one deployed project with real-user signals."
];

type ProjectsGuideStep = {
  id: string;
  label: string;
};

const PROJECTS_GUIDE_STEPS: ProjectsGuideStep[] = [
  {
    id: "why-backend",
    label: "Why Backend?"
  },
  {
    id: "how-to-learn",
    label: "How to Learn"
  },
  {
    id: "what-to-build",
    label: "What to Build"
  }
];

const backendWhyCards = [
  {
    title: "Applies to every direction",
    description:
      "Full stack, mobile, data-focused — almost every role needs a backend foundation to handle logic and data correctly.",
    icon: Globe
  },
  {
    title: "Closest to real engineering work",
    description:
      "Request flow, data persistence, API design — this is close to what you'll do on day one as a software engineer.",
    icon: Settings2
  },
  {
    title: "Resume proof, not just skills",
    description:
      "Two verified repos is concrete evidence. Much stronger than listing languages you \"know\" on a resume.",
    icon: FileText
  },
  {
    title: "Real interview material",
    description:
      "Real projects give you behavioral stories — architecture decisions, bugs you fixed, tradeoffs you made.",
    icon: MessageCircle
  }
] as const;

const backendLearningTopics = [
  "HTTP fundamentals",
  "APIs & REST APIs",
  "API endpoints and routing",
  "Request and response handling",
  "Data validation",
  "Databases and CRUD operations",
  "Authentication and security",
  "Backend project structure",
  "Reading and using documentation",
  "Testing APIs",
  "Deployment basics"
] as const;

const backendCourseRecommendations = [
  {
    label: "Paid Option",
    labelClassName: "text-amber-700",
    title: "FastAPI The Complete Course",
    description:
      "This course includes a project with a frontend UI website at the end. It is a very good way to start building projects while learning backend fundamentals.",
    href: "https://www.udemy.com/course/fastapi-the-complete-course/",
    cta: "Open Udemy Course"
  },
  {
    label: "Free Option",
    labelClassName: "text-emerald-700",
    title: "FastAPI Full Course (YouTube)",
    description:
      "This is an incredible course. It goes deep into backend topics like databases, SQL, and APIs. The downside: it does not build a UI website, so you will still need to apply this knowledge by building projects with an interface after finishing it.",
    href: "https://youtube.com/watch?v=0sOvCWFmrtA",
    cta: "Open YouTube Course"
  }
] as const;

const buildStrategySteps = [
  {
    step: "Step 1",
    title: "Learn backend development",
    description: "Use course content to internalize backend fundamentals."
  },
  {
    step: "Step 2",
    title: "Build your ideas",
    description: "Create your own projects and make real backend decisions."
  },
  {
    step: "Step 3",
    title: "Submit portfolio",
    description: "Share GitHub links to validate backend readiness."
  }
] as const;

const plateauingAdvice = [
  {
    icon: Users,
    text: "Build for real people. Family, friends, clubs, or local groups. This forces you to identify what users actually want, deploy your app, and iterate based on real feedback."
  },
  {
    icon: Lightbulb,
    text: "Pick a project that scares you. Choose one that requires at least one technology you don't know yet — for example, WebSockets for real-time messaging. Discomfort is the signal you're growing."
  },
  {
    icon: ChartColumn,
    text: "This is much stronger than projects nobody uses. You get resume metrics and behavioral interview material, including answers like: \"A time where your user changed your perspective on something.\""
  },
  {
    icon: MessageCircle,
    text: "If you build with someone else, even better. In behavioral interviews, you will answer questions about collaboration, conflict resolution, and team delivery — you need real examples."
  }
] as const;

type SubmissionStatus = "pending" | "pass" | "fail";

type ProjectSubmission = {
  id: number;
  repo_url: string;
  deployed_url: string | null;
  source_type: "github" | "upload";
  source_label: string | null;
  status: SubmissionStatus;
  review_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ProjectSubmissionsResponse = {
  submissions: ProjectSubmission[];
};

type ProjectSubmissionCreateResponse = {
  submission: ProjectSubmission;
};

type PortfolioCardState = "complete" | "active" | "locked";

const statusPillClasses: Record<SubmissionStatus, string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-700",
  pass: "bg-emerald-50 border-emerald-200 text-emerald-700",
  fail: "bg-red-50 border-red-200 text-red-700"
};

const statusLabel: Record<SubmissionStatus, string> = {
  pending: "Pending",
  pass: "Pass",
  fail: "Not Yet"
};

export default function ProjectsPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [deployedUrl, setDeployedUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [learningGuideOpen, setLearningGuideOpen] = useState(true);
  const [activeGuideStepIndex, setActiveGuideStepIndex] = useState(0);
  const [openGuideSituations, setOpenGuideSituations] = useState<Record<string, boolean>>({});

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const data = await apiRequest<ProjectSubmissionsResponse>("/projects/submissions");
      setSubmissions(data.submissions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load submissions.";
      setListError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  const statusSummary = useMemo(() => {
    let pending = 0;
    let pass = 0;
    let fail = 0;

    for (const submission of submissions) {
      if (submission.status === "pass") pass += 1;
      if (submission.status === "pending") pending += 1;
      if (submission.status === "fail") fail += 1;
    }
    return { pending, pass, fail };
  }, [submissions]);

  const portfolioCards = useMemo(() => {
    const passed = submissions.filter((submission) => submission.status === "pass");
    const passCount = passed.length;
    const hasBonusPass = passed.some((submission) => Boolean(submission.deployed_url));

    return portfolioCardBlueprint.map((card) => {
      if (card.key === "core_1") {
        const complete = passCount >= 1;
        return {
          ...card,
          state: (complete ? "complete" : "active") as PortfolioCardState,
          cta: complete ? "Completed" : "Submit with the form above",
        };
      }
      if (card.key === "core_2") {
        const unlocked = passCount >= 1;
        const complete = passCount >= 2;
        return {
          ...card,
          state: (complete ? "complete" : unlocked ? "active" : "locked") as PortfolioCardState,
          cta: complete
            ? "Completed"
            : unlocked
              ? "Need 1 more passed project"
              : "Locked until Core Project 1 passes",
        };
      }
      const unlocked = passCount >= 1;
      return {
        ...card,
        state: (hasBonusPass ? "complete" : unlocked ? "active" : "locked") as PortfolioCardState,
        cta: hasBonusPass
          ? "Completed (Bonus)"
          : unlocked
            ? "Pass a deployed project to complete bonus"
            : "Optional bonus unlocks after first pass",
      };
    });
  }, [submissions]);

  const activeGuideStep = PROJECTS_GUIDE_STEPS[activeGuideStepIndex] ?? PROJECTS_GUIDE_STEPS[0];

  const toggleGuideSituation = useCallback((key: string) => {
    setOpenGuideSituations((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!repoUrl.trim()) {
      setFormError("GitHub repository URL is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest<ProjectSubmissionCreateResponse>("/projects/submissions", {
        method: "POST",
        body: JSON.stringify({
          repo_url: repoUrl.trim(),
          deployed_url: deployedUrl.trim() || null
        })
      });

      setRepoUrl("");
      setDeployedUrl("");
      setSuccessMessage("Project submitted and evaluated by AI.");
      await loadSubmissions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit project.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [deployedUrl, loadSubmissions, repoUrl]);

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      <section id="portfolio-board" className="space-y-4">
        <div className="rounded-[13px] border border-slate-200 bg-white p-5 md:p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700">
              Module 03
            </span>
            <span className="text-[13px] font-semibold text-slate-500">Phase 2</span>
          </div>

          <div className="mt-4">
            <h1 className="text-[22px] font-bold leading-tight text-slate-950 md:text-[24px]">Backend Mastery</h1>
            <p className="mt-1.5 max-w-4xl text-[13px] leading-[1.6] text-slate-600">
              This is where you move from coding exercises to software engineering. You will learn to build complete
              backend systems and prove it with projects.
            </p>
          </div>

          <div className="mt-5 relative pl-8 space-y-6">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-indigo-200" />

            <article className="relative opacity-75">
              <span className="absolute -left-[29px] top-1.5 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              <h2 className="text-[19px] font-bold text-slate-600">Phase 1: Programming Language (Python)</h2>
              <div className="mt-1 inline-flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
                <Clock3 size={15} />
                2 Months
              </div>
              <p className="mt-2 text-[13px] leading-[1.65] text-slate-500">
                Syntax + logic foundation. This phase is complete and now you apply it to real software.
              </p>
            </article>

            <article className="relative">
              <span className="absolute -left-[29px] top-1.5 h-5 w-5 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
              <h2 className="text-[19px] font-bold text-indigo-900">Phase 2: Backend Development</h2>
              <div className="mt-1 inline-flex items-center gap-2 text-[13px] font-semibold text-indigo-700">
                <Clock3 size={15} />
                4 Months
              </div>
              <p className="mt-2 text-[13px] leading-[1.65] text-slate-600">
                Build APIs, connect databases, and ship projects that can go on your resume.
              </p>
            </article>
          </div>
        </div>

        <div className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold text-slate-950">Project Submission Lab</p>
                <p className="mt-1 text-[12px] text-slate-400">
                  Submit your GitHub repos. AI reviews the backend work and marks pass or not yet.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  <CircleDot size={13} />
                  Goal: 2 Verified Projects
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {statusSummary.pass} pass • {statusSummary.pending} pending • {statusSummary.fail} not yet
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 border-b border-slate-200 xl:grid-cols-[1fr_1.12fr]">
            <article className="border-r border-slate-200 px-5 py-[18px]">
              <p className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Submit Project</p>
              <h2 className="text-[14px] font-bold text-slate-800">Add GitHub Repository</h2>
              <p className="mt-1 text-[12px] leading-[1.55] text-slate-500">
                Submit your own project idea. Add a deployed URL if you have one, but GitHub is enough to start.
              </p>

              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="repo-url" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    GitHub URL
                  </label>
                  <input
                    id="repo-url"
                    type="url"
                    value={repoUrl}
                    onChange={(event) => setRepoUrl(event.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="w-full rounded-[7px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="deployed-url" className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Deployed URL <span className="normal-case tracking-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    id="deployed-url"
                    type="url"
                    value={deployedUrl}
                    onChange={(event) => setDeployedUrl(event.target.value)}
                    placeholder="https://your-app.com"
                    className="w-full rounded-[7px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {formError ? (
                  <p className="rounded-[7px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{formError}</p>
                ) : null}
                {successMessage ? (
                  <p className="rounded-[7px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                    {successMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[7px] bg-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <GitBranch size={15} />}
                  {isSubmitting ? "Submitting..." : "Submit Project"}
                </button>
              </form>
            </article>

            <article className="px-5 py-[18px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-[10px] text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Submission History</p>
                  <h2 className="text-[14px] font-bold text-slate-800">Evaluation Status</h2>
                  <p className="mt-1 text-[12px] leading-[1.55] text-slate-500">
                    Newest submissions appear here. If you submit many projects, scroll through the list.
                  </p>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
                  <FileText size={15} />
                </div>
              </div>

              {listError ? (
                <div className="mt-4 rounded-[7px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {listError}
                </div>
              ) : null}

              {isLoading ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-[9px] border border-slate-200 bg-slate-50 px-3 py-4 text-[12px] text-slate-600">
                  <Loader2 size={15} className="animate-spin" />
                  Loading submissions...
                </div>
              ) : null}

              {!isLoading && !listError && submissions.length === 0 ? (
                <div className="mt-4 rounded-[9px] border border-slate-200 bg-slate-50 px-3 py-4 text-[12px] text-slate-600">
                  No submissions yet. Submit your first project to start evaluation.
                </div>
              ) : null}

              {!isLoading && !listError && submissions.length > 0 ? (
                <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {submissions.map((submission) => {
                    const createdAt = submission.created_at
                      ? new Date(submission.created_at).toLocaleString()
                      : "Unknown time";
                    const showRepoLink = submission.source_type !== "upload";
                    const repoLabel = submission.source_type === "upload"
                      ? (submission.source_label || "Uploaded project")
                      : submission.repo_url;
                    return (
                      <div key={submission.id} className="rounded-[9px] border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          {showRepoLink ? (
                            <a
                              href={submission.repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="break-all text-[12px] font-semibold text-indigo-700 hover:underline"
                            >
                              {repoLabel}
                            </a>
                          ) : (
                            <p className="break-all text-[12px] font-semibold text-slate-700">{repoLabel}</p>
                          )}
                          <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold ${statusPillClasses[submission.status]}`}>
                            {submission.status === "pass" ? <CheckCircle2 size={12} className="mr-1" /> : null}
                            {submission.status === "fail" ? <XCircle size={12} className="mr-1" /> : null}
                            {submission.status === "pending" ? <AlertTriangle size={12} className="mr-1" /> : null}
                            {statusLabel[submission.status]}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">Submitted: {createdAt}</p>
                        {submission.deployed_url ? (
                          <a
                            href={submission.deployed_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex text-[11px] font-semibold text-slate-600 hover:text-slate-800 hover:underline"
                          >
                            Deployed URL
                          </a>
                        ) : null}
                        {submission.review_notes ? (
                          <p className="mt-2 rounded-[7px] border border-slate-200 bg-white px-2.5 py-2 text-[11px] leading-[1.55] text-slate-600">
                            Evaluator note: {submission.review_notes}
                          </p>
                        ) : (
                          <p className="mt-2 text-[11px] text-slate-400">No evaluator note yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </article>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {portfolioCards.map((card) => {
              const isLocked = card.state === "locked";
              const isComplete = card.state === "complete";
              return (
                <article
                  key={card.title}
                  className={`relative border-r border-slate-200 px-[18px] py-[15px] last:border-r-0 ${
                    isComplete
                      ? "bg-emerald-50/60"
                      : isLocked
                        ? "bg-slate-50/70 text-slate-400"
                        : "bg-white"
                  }`}
                >
                  {isLocked ? <span className="absolute right-4 top-4 text-sm">🔒</span> : null}
                  <p className={`text-[10px] font-bold uppercase tracking-[0.09em] ${isComplete ? "text-emerald-700" : isLocked ? "text-slate-400" : "text-slate-500"}`}>
                    {card.subtitle}
                  </p>
                  <h3 className={`mt-1 text-[13px] font-bold ${isComplete ? "text-emerald-900" : isLocked ? "text-slate-500" : "text-slate-800"}`}>
                    {card.title}
                  </h3>
                  <p className={`mt-1 text-[12px] leading-[1.55] ${isComplete ? "text-emerald-800/80" : isLocked ? "text-slate-400" : "text-slate-500"}`}>
                    {card.description}
                  </p>
                  <p className={`mt-[10px] text-[12px] font-semibold ${isComplete ? "text-emerald-700" : isLocked ? "text-slate-400" : "text-indigo-600"}`}>
                    {card.cta}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="flex items-start gap-[11px] border-t border-slate-200 bg-slate-50 px-[18px] py-[13px]">
            <BadgeCheck size={16} className="mt-0.5 shrink-0 text-amber-700" />
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-amber-900">How passing works</p>
              <p className="text-[12px] leading-[1.6] text-amber-900/90">
                A project is either <strong>pass</strong> or <strong>not yet</strong>. We are not grading polish. We are checking whether
                your app has a real backend you built yourself.
              </p>
              <p className="text-[12px] leading-[1.6] text-amber-900/90">
                In practice, a strong pass usually shows three things clearly: <strong>backend code</strong>, <strong>real data storage</strong>, and <strong>app rules</strong> beyond static pages.
              </p>
              <p className="text-[12px] leading-[1.6] text-amber-900/90">
                Build the backend yourself. Deployment is a bonus signal, not required.
              </p>
            </div>
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
              <BookMarked size={15} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-950">Learning Guide</p>
              <p className="mt-0.5 text-[12px] text-slate-400">Why backend, how to learn + courses, and what to build - 3 reads</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-[12px] font-semibold text-slate-400">
            <div className="flex gap-[5px]">
              {PROJECTS_GUIDE_STEPS.map((step, index) => {
                const completed = index < activeGuideStepIndex;
                const active = index === activeGuideStepIndex;
                return (
                  <span
                    key={`projects-guide-progress-${step.id}`}
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
              {PROJECTS_GUIDE_STEPS.map((step, index) => {
                const completed = index < activeGuideStepIndex;
                const active = index === activeGuideStepIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveGuideStepIndex(index)}
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
              {activeGuideStep.id === "why-backend" ? (
                <div className="border-b border-slate-200 px-9 py-8">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">The Big Picture</div>
                  <h2 className="mt-1.5 text-[19px] font-bold leading-[1.3] text-slate-950">Why Backend?</h2>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-slate-500">
                    These skills matter in almost every direction - full stack, mobile, and even data-focused roles. Real world
                    software applications need a backend foundation to handle logic and data correctly.
                  </p>

                  <p className="mt-6 text-[13px] leading-[1.75] text-slate-600">
                    Once you learn the skills that power real-world applications, you can build your own projects too.{" "}
                    <strong className="font-semibold text-slate-800">
                      This section is two wins in one: learn backend skills and create projects that prove experience and build your resume.
                    </strong>
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-[10px] md:grid-cols-2">
                    {backendWhyCards.map((card) => (
                      <div key={card.title} className="rounded-[9px] border border-slate-200 bg-white px-[15px] py-[13px]">
                        <p className="text-[12px] font-semibold text-slate-800">{card.title}</p>
                        <p className="mt-1 text-[12px] leading-[1.6] text-slate-500">{card.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeGuideStep.id === "how-to-learn" ? (
                <div className="border-b border-slate-200 px-9 py-8">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Learning Strategy</div>
                  <h2 className="mt-1.5 text-[19px] font-bold leading-[1.3] text-slate-950">How to learn backend</h2>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-slate-500">
                    Learn a Backend Framework - FastAPI is a strong choice to learn modern API development while building real projects.
                  </p>

                  <p className="mt-6 text-[13px] leading-[1.75] text-slate-600">
                    There are many backend frameworks: Django, Flask, FastAPI - and that is only in Python. Every programming language
                    has its own frameworks to build backend servers. The core goal is always the same: learn server logic, API
                    endpoints, and database integration well enough to build real products.
                  </p>

                  <div className="mt-4 rounded-[9px] border border-amber-200 bg-amber-50 px-[14px] py-[11px] text-[12px] leading-[1.6] text-amber-800">
                    If you use another language, apply this same roadmap with that language&apos;s backend frameworks.
                  </div>

                  <div className="mt-[10px] rounded-[9px] border border-indigo-200 bg-indigo-50 px-[14px] py-[11px] text-[12px] leading-[1.6] text-indigo-800">
                    Since these tools are used to build backend servers, these courses teach in a very practical way: setting up
                    databases, building APIs, and wiring real backend features. You might miss some theory at first, and that is fine.
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-[12px] font-semibold text-slate-800">What you&apos;ll learn to build</p>
                    <div className="flex flex-wrap gap-[5px]">
                      {backendLearningTopics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded-md border border-emerald-300 bg-emerald-50 px-[10px] py-1 text-[11px] font-medium text-emerald-800"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="my-6 h-px bg-slate-200" />

                  <p className="mb-3 text-[12px] font-semibold text-slate-800">Course Recommendations</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {backendCourseRecommendations.map((course) => (
                      <article key={course.title} className="rounded-[9px] border border-slate-200 bg-slate-50 px-[18px] py-4">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${course.labelClassName}`}>{course.label}</p>
                        <h3 className="mt-1.5 text-[14px] font-bold text-slate-800">{course.title}</h3>
                        <p className="mt-[7px] text-[13px] leading-[1.65] text-slate-500">{course.description}</p>
                        <a
                          href={course.href}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 hover:underline"
                        >
                          {course.cta}
                          <ArrowRight size={13} />
                        </a>
                      </article>
                    ))}
                  </div>

                  <div className="mt-[14px] rounded-[9px] border border-slate-200 bg-slate-50 px-[14px] py-3 text-[12px] leading-[1.6] text-slate-500">
                    <strong className="font-semibold text-slate-700">Focus on backend first. Add UI strategically.</strong> The
                    highest-leverage concepts are backend: system thinking, server flow, APIs, and data. Projects with a UI are nicer,
                    not strictly necessary. Use AI to generate UI code while you write the backend yourself.
                  </div>

                  <div className="mt-3 rounded-[9px] border border-slate-200 bg-slate-50 px-[14px] py-3 text-[12px] leading-[1.6] text-slate-500">
                    <strong className="font-semibold text-slate-700">Want to go deeper into full stack later?</strong> Look for
                    FastAPI + React courses, or pair another backend framework with a frontend web or mobile framework. The exact stack
                    can vary, but the system thinking you build here carries over.
                  </div>

                  <div className="mt-5 rounded-r-[9px] rounded-l-none border border-slate-200 border-l-[3px] border-l-indigo-600 bg-slate-50 px-4 py-[14px]">
                    <div className="mb-[9px] flex items-center gap-[6px] text-[10px] font-bold uppercase tracking-[0.09em] text-indigo-600">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">D</span>
                      Founder&apos;s Note
                    </div>
                    <p className="text-[12px] leading-[1.7] text-slate-600">
                      The paid option is what I&apos;d use starting today - the project at the end gives you something concrete for
                      Core Project 1. The free one goes deeper on backend concepts but you&apos;ll need to build the interface
                      yourself after.
                    </p>
                    <p className="mt-[7px] text-[12px] leading-[1.7] text-slate-600">
                      <strong className="font-semibold text-slate-700">
                        Either way: learn a concept, immediately implement it in your own code, stack skills over time.
                      </strong>{" "}
                      Don&apos;t move to the next concept until the current one works in something you actually built.
                    </p>
                  </div>
                </div>
              ) : null}

              {activeGuideStep.id === "what-to-build" ? (
                <div className="border-b border-slate-200 px-9 py-8">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Project Strategy</div>
                  <h2 className="mt-1.5 text-[19px] font-bold leading-[1.3] text-slate-950">What to build</h2>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-slate-500">
                    The goal is not to invent the next startup. It is to build something that demonstrates real engineering skills.
                  </p>

                  <div className="mb-6 mt-6 rounded-[9px] bg-[#1e1b4b] px-6 py-[22px]">
                    <h3 className="text-center text-[17px] font-bold text-white">Learn First. Then Build. Then Submit.</h3>
                    <p className="mx-auto mt-[5px] max-w-3xl text-center text-[13px] text-white/60">
                      The order matters. Do a course (or prove equivalent knowledge), then build your own projects, then submit your portfolio.
                    </p>

                    <div className="mt-[18px] grid grid-cols-1 gap-[10px] md:grid-cols-3">
                      {buildStrategySteps.map((step) => (
                        <div key={step.title} className="rounded-[9px] border border-white/15 bg-white/[0.08] px-[14px] py-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">{step.step}</p>
                          <p className="mt-[5px] text-[13px] font-semibold text-white">{step.title}</p>
                          <p className="mt-[3px] text-[12px] leading-[1.5] text-white/60">{step.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-[9px] border border-white/15 px-4 py-[14px]">
                      <div className="mb-[10px] flex items-center justify-between gap-3">
                        <p className="text-[12px] font-bold text-white">By the end of this module</p>
                        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-white/65">
                          Target: ~4 months
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-[6px] md:grid-cols-2">
                        {moduleOutcomes.map((outcome) => (
                          <div key={outcome} className="rounded-md border border-white/10 bg-white/[0.06] px-[10px] py-2 text-[12px] leading-[1.45] text-white/65">
                            {outcome}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mb-3 text-[12px] font-semibold text-slate-800">How to pick a good project</p>
                  <div className="mb-4 rounded-[9px] border border-indigo-200 bg-indigo-50 px-[14px] py-[10px] text-[12px] text-indigo-800">
                    <strong className="font-semibold">A strong backend project usually includes authentication, a database, and at least 3-4 API endpoints.</strong>
                  </div>

                  <div className="mb-5 flex flex-col gap-[9px]">
                    {projectIdeaPrompts.map((prompt) => (
                      <div key={prompt.title} className="flex items-start gap-[9px]">
                        <span className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full bg-slate-400" />
                        <p className="text-[13px] leading-[1.65] text-slate-500">
                          <strong className="font-semibold text-slate-700">{prompt.title}.</strong> {prompt.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleGuideSituation("project-ideas")}
                        className={`flex w-full items-center justify-between rounded-[9px] border px-4 py-[13px] text-left transition-colors ${
                          openGuideSituations["project-ideas"]
                            ? "rounded-b-none border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        <div className="flex items-center gap-[10px]">
                          <Lightbulb size={16} className="text-amber-500" />
                          <div>
                            <p className="text-[13px] font-semibold text-slate-700">Need project ideas?</p>
                            <p className="text-[12px] text-slate-400">Starter ideas + the founder&apos;s own first projects for reference</p>
                          </div>
                        </div>
                        {openGuideSituations["project-ideas"] ? <ChevronUp size={13} className="text-indigo-600" /> : <ChevronDown size={13} className="text-slate-400" />}
                      </button>

                      {openGuideSituations["project-ideas"] ? (
                        <div className="rounded-b-[9px] border border-t-0 border-indigo-300 bg-indigo-50 px-[18px] pb-2 pt-5">
                          <p className="mb-[10px] text-[12px] font-semibold text-slate-800">Starter ideas</p>
                          <div className="mb-[14px] grid grid-cols-1 gap-2 md:grid-cols-2">
                            {projectIdeaExamples.map((idea) => (
                              <div key={idea.title} className="rounded-[9px] border border-slate-200 bg-white px-[13px] py-[11px]">
                                <p className="text-[12px] font-semibold text-slate-800">{idea.title}</p>
                                <p className="mt-[3px] text-[11px] leading-[1.5] text-slate-500">{idea.summary}</p>
                              </div>
                            ))}
                          </div>

                          <p className="mb-1 text-[12px] font-semibold text-slate-800">
                            Some of the first projects I built <span className="text-[11px] font-normal text-slate-400">(for reference, not templates)</span>
                          </p>
                          <div className="mb-[14px] grid grid-cols-1 gap-3 md:grid-cols-2">
                            {inspirationProjects.map((project) => (
                              <article key={project.title} className="overflow-hidden rounded-[9px] border border-slate-200 bg-white">
                                <div className="relative h-[100px] border-b border-slate-200 bg-slate-900">
                                  <Image
                                    src={project.imageSrc}
                                    alt={project.imageAlt}
                                    fill
                                    className="object-cover"
                                    sizes="(min-width: 768px) 320px, 100vw"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-2 left-[10px] text-white">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] opacity-80">Project Preview</p>
                                    <p className="text-[13px] font-bold">{project.title}</p>
                                  </div>
                                </div>
                                <div className="px-[13px] py-[11px]">
                                  <p className="text-[13px] font-bold text-slate-800">{project.title}</p>
                                  <p className="mb-[5px] mt-[2px] text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-600">{project.subtitle}</p>
                                  <p className="text-[12px] leading-[1.5] text-slate-500">{project.summary}</p>
                                  <div className="mb-[9px] mt-[9px] flex flex-wrap gap-[5px]">
                                    {project.stack.map((tag) => (
                                      <span key={tag} className="rounded-[5px] border border-slate-200 bg-slate-50 px-[7px] py-[2px] text-[10px] font-medium text-slate-600">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <a
                                    href={project.githubUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-[5px] rounded-md border border-slate-200 bg-slate-50 px-[10px] py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                                  >
                                    Open GitHub repo
                                    <ArrowRight size={12} />
                                  </a>
                                </div>
                              </article>
                            ))}
                          </div>

                          <div className="mb-2 rounded-r-[9px] rounded-l-none border border-slate-200 border-l-[3px] border-l-indigo-600 bg-slate-50 px-4 py-[14px]">
                            <div className="mb-[9px] flex items-center gap-[6px] text-[10px] font-bold uppercase tracking-[0.09em] text-indigo-600">
                              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white">D</span>
                              Founder&apos;s Note
                            </div>
                            <p className="text-[12px] leading-[1.7] text-slate-600">These projects were not even in my first resume. I kept improving and started building more sophisticated projects over time.</p>
                            <p className="mt-[7px] text-[12px] leading-[1.7] text-slate-600">You will see my first resume in the Resume module, including some of the projects I had at that point.</p>
                            <p className="mt-[7px] text-[12px] leading-[1.7] text-slate-600">
                              <strong className="font-semibold text-slate-700">This is normal: our first projects usually are not great, but the concepts we learn from them are what move us forward.</strong>
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => toggleGuideSituation("plateauing")}
                        className={`flex w-full items-center justify-between rounded-[9px] border px-4 py-[13px] text-left transition-colors ${
                          openGuideSituations["plateauing"]
                            ? "rounded-b-none border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        <div className="flex items-center gap-[10px]">
                          <ChartColumn size={16} className="text-rose-400" />
                          <div>
                            <p className="text-[13px] font-semibold text-slate-700">Stuck or plateauing?</p>
                            <p className="text-[12px] text-slate-400">Ways to break through and build projects that actually stand out</p>
                          </div>
                        </div>
                        {openGuideSituations["plateauing"] ? <ChevronUp size={13} className="text-indigo-600" /> : <ChevronDown size={13} className="text-slate-400" />}
                      </button>

                      {openGuideSituations["plateauing"] ? (
                        <div className="rounded-b-[9px] border border-t-0 border-indigo-300 bg-indigo-50 px-[18px] pb-3 pt-5">
                          <div className="mb-3 flex flex-col gap-2">
                            {plateauingAdvice.map((item) => {
                              const Icon = item.icon;
                              return (
                                <div key={item.text} className="flex items-start gap-[11px] rounded-[9px] border border-slate-200 bg-white px-[14px] py-3">
                                  <Icon size={15} className="mt-0.5 shrink-0 text-slate-500" />
                                  <p className="text-[12px] leading-[1.6] text-slate-500">{item.text}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-[13px]">
              <p className="text-[12px] text-slate-400">Step {activeGuideStepIndex + 1} of {PROJECTS_GUIDE_STEPS.length}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveGuideStepIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={activeGuideStepIndex === 0}
                  className="rounded-[7px] border border-slate-200 bg-white px-4 py-[7px] text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  ← Previous
                </button>
                {activeGuideStepIndex < PROJECTS_GUIDE_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveGuideStepIndex((prev) => Math.min(prev + 1, PROJECTS_GUIDE_STEPS.length - 1))}
                    className="rounded-[7px] border border-indigo-600 bg-indigo-600 px-4 py-[7px] text-[12px] font-semibold text-white hover:bg-indigo-700"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="rounded-[7px] border border-emerald-300 bg-emerald-50 px-4 py-[7px] text-[12px] font-semibold text-emerald-600 opacity-70"
                  >
                    Done ✓
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-xl border border-indigo-600 bg-indigo-600 px-5 py-4 md:px-6 md:py-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-white">Ready to move on?</p>
          <p className="mt-1 text-sm text-indigo-100">Get 2 projects verified and you unlock the Resume module.</p>
        </div>
        <a
          href="/resume"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
        >
          Continue to Resume
          <ArrowRight size={16} />
        </a>
      </section>
    </div>
  );
}
