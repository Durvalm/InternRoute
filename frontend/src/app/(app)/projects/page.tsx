"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  BadgeCheck,
  BookMarked,
  CheckCircle2,
  CircleDot,
  Clock3,
  Code2,
  FileText,
  GitBranch,
  FlaskConical,
  Globe,
  Lightbulb,
  Lock,
  Loader2,
  Plus,
  Sparkles,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/api";

const inspirationProjects = [
  {
    title: "YourLifeSimplified",
    subtitle: "Task Manager",
    summary: "A simple productivity app. Strong first project for practicing backend endpoints and persistent task data.",
    stack: ["Python", "Django", "SQL"],
    imageSrc: "/projects/your_life_simplified.png",
    imageAlt: "YourLifeSimplified task manager interface screenshot",
    githubUrl: "https://github.com/Durvalm/YourLifeSimplified"
  },
  {
    title: "RealEstate Platform",
    subtitle: "Listing Site",
    summary: "Property listings + favorites + profiles. Great practice for API flows and relational database modeling.",
    stack: ["Python", "Django", "API + Data Layer"],
    imageSrc: "/projects/real_estate_2.png",
    imageAlt: "RealEstate Platform listings interface screenshot",
    githubUrl: "https://github.com/Durvalm/RealEstate"
  }
];

const portfolioCards = [
  {
    title: "Core Project 1",
    subtitle: "Course Outcome",
    description: "First complete project from your learning path. Submit when your backend is solid.",
    cta: "Submit with the form above",
    state: "active"
  },
  {
    title: "Core Project 2",
    subtitle: "Independent Build",
    description: "Your own idea, built end-to-end without tutorial hand-holding.",
    cta: "Locked",
    state: "locked"
  },
  {
    title: "Bonus: Real-User Project",
    subtitle: "Optional +20%",
    description: "Deployed project used by real people. Valuable for interviews and resume impact.",
    cta: "Locked",
    state: "locked"
  }
] as const;

const projectIdeaPrompts = [
  "Solve a real problem you already understand (class schedule, club workflow, family business task).",
  "Pick a project where users can create/read/update data and not just view static content.",
  "If stuck, clone a familiar product category: task app, booking app, listings app, tracker app.",
  "Original ideas are better long-term, but copying a known idea is totally fine when you are starting."
];

const projectIdeaExamples = [
  {
    title: "Campus Club Ops",
    summary: "Manage events, members, and attendance with roles and internal notes."
  },
  {
    title: "Student Deadline Radar",
    summary: "Track assignment deadlines and reminders with user-specific dashboards."
  },
  {
    title: "Family Business Orders Hub",
    summary: "Simple order intake + status updates + searchable order history."
  },
  {
    title: "Neighborhood Service Booking",
    summary: "Book appointments, manage availability, and handle user requests."
  }
];

const moduleOutcomes = [
  "2 project repositories that demonstrate backend ownership.",
  "Real understanding of request flow, backend logic, and data persistence.",
  "Resume-ready project entries with stronger technical depth.",
  "Optional bonus: one deployed project with real-user signals."
];

type SubmissionStatus = "pending" | "pass" | "fail";

type ProjectSubmission = {
  id: number;
  repo_url: string;
  deployed_url: string | null;
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

const statusPillClasses: Record<SubmissionStatus, string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-700",
  pass: "bg-emerald-50 border-emerald-200 text-emerald-700",
  fail: "bg-rose-50 border-rose-200 text-rose-700"
};

const statusLabel: Record<SubmissionStatus, string> = {
  pending: "Pending Review",
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
      setSuccessMessage("Project submitted. Status set to pending review.");
      await loadSubmissions();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit project.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [deployedUrl, loadSubmissions, repoUrl]);

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-7">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-6">
          <div>
            <div className="inline-flex items-center gap-3">
              <span className="rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-bold tracking-wider uppercase">
                Module 03
              </span>
              <span className="text-sm font-medium text-slate-500">Phase 2</span>
            </div>

            <h1 className="mt-4 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Backend Mastery
            </h1>
            <p className="mt-3 max-w-3xl text-xs md:text-sm leading-relaxed text-slate-600">
              This is where you move from coding exercises to software engineering. You will learn to build complete
              backend systems and prove it with projects.
            </p>

            <div className="mt-8 relative pl-10 space-y-8">
              <div className="absolute left-4 top-1 bottom-1 w-px bg-indigo-200" />

              <article className="relative opacity-65">
                <span className="absolute -left-[30px] top-1 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <h2 className="text-base md:text-lg font-bold text-slate-800">Phase 1: Programming Language (Python)</h2>
                <div className="mt-2 inline-flex items-center gap-2 text-emerald-700 text-xs md:text-sm font-semibold">
                  <Clock3 size={16} />
                  2 Months
                </div>
                <p className="mt-2 text-xs md:text-sm text-slate-600">
                  Syntax + logic foundation. This phase is complete and now you apply it to real software.
                </p>
              </article>

              <article className="relative">
                <span className="absolute -left-[30px] top-1 h-5 w-5 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
                <h2 className="text-base md:text-lg font-bold text-indigo-900">Phase 2: Backend Development</h2>
                <div className="mt-2 inline-flex items-center gap-2 text-indigo-600 text-xs md:text-sm font-semibold">
                  <Clock3 size={16} />
                  4 Months
                </div>
                <p className="mt-2 text-xs md:text-sm text-slate-600">
                  Build APIs, connect databases, and ship projects that can go on your resume.
                </p>
              </article>
            </div>
          </div>

          <aside className="rounded-3xl bg-[#101a46] text-white p-6 border border-indigo-950/30 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 text-indigo-300/10">
              <Code2 size={170} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg md:text-xl font-bold">Why Backend?</h3>
              <p className="mt-3 text-xs md:text-sm leading-relaxed text-indigo-100">
                These skills matter in almost every direction: full stack, mobile, and even data-focused roles.
                Most products need a backend foundation to handle logic and data correctly.
              </p>
              <p className="mt-3 text-xs md:text-sm leading-relaxed text-indigo-100">
                If you want mobile, that is fine. Learn backend deeply here and use AI for mobile/frontend speed if needed.
                What matters most in this phase is proving backend knowledge.
              </p>
              <div className="mt-4 rounded-xl border border-indigo-300/20 bg-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Modern Tip</p>
                <p className="mt-1 text-xs text-indigo-100">
                  You can use AI for UI speed, but do not outsource your backend learning.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BookMarked size={20} className="text-indigo-600" />
          <h2 className="text-lg md:text-xl font-bold text-slate-900">Learning Path (Course Options)</h2>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Why Django for Beginners</h3>
              <p className="mt-3 text-xs md:text-sm text-slate-600 leading-relaxed">
                Django is a <strong>backend framework</strong> built with Python. For beginners, it is one of the fastest ways
                to build real software with useful backend concepts.
              </p>
              <p className="mt-3 text-xs md:text-sm text-slate-600 leading-relaxed">
                You can build full projects with minimal setup and learn the core flow: server logic, API endpoints,
                and database integration. It is a practical way to get your first full-stack project shipped.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Backend Framework", "API Layer", "Database Layer", "Server Logic", "HTML Basics"].map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-xs md:text-sm font-semibold text-amber-900 leading-relaxed">
                  If you use another language or do not want Django, find another backend framework for that language.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <article className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-700 border border-indigo-200">
                  <FlaskConical size={17} />
                </div>
                <p className="mt-3 text-sm font-bold text-slate-900">Paid Option: Django Practical Guide</p>
                <p className="mt-2 text-xs md:text-sm text-slate-600 leading-relaxed">
                  In this course you learn Django and build a full-stack Blog project while touching databases, HTML,
                  and backend architecture.
                </p>
                <a
                  href="https://www.udemy.com/course/python-django-the-practical-guide/?couponCode=NEWYEARCAREER"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-indigo-700"
                >
                  Open Udemy Course
                </a>
              </article>

              <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-700 border border-emerald-200">
                  <Code2 size={17} />
                </div>
                <p className="mt-3 text-sm font-bold text-slate-900">Free Option: YouTube Course</p>
                <p className="mt-2 text-xs md:text-sm text-slate-600 leading-relaxed">
                  Free Django path. Goal is the same: learn backend fundamentals and build one real project with API + data handling.
                </p>
                <a
                  href="https://www.youtube.com/watch?v=PtQiiknWUcI"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-700"
                >
                  Open YouTube Course
                </a>
              </article>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs md:text-sm text-slate-700">
                Already have backend skills and strong projects? Skip the course and submit directly when submissions are enabled.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-indigo-800 bg-gradient-to-br from-indigo-700 to-indigo-900 p-7 md:p-9 text-white shadow-lg">
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center">Learn First. Then Build. Then Submit.</h2>
          <p className="text-indigo-100 text-sm md:text-base text-center">
            The order matters. Do a course (or prove equivalent knowledge), then build your own projects, then submit your portfolio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-100">Step 1</p>
              <p className="mt-1 text-base font-semibold">Learn backend development</p>
              <p className="mt-2 text-sm text-indigo-100">Use course content to internalize backend fundamentals.</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-100">Step 2</p>
              <p className="mt-1 text-base font-semibold">Build your ideas</p>
              <p className="mt-2 text-sm text-indigo-100">Create your own projects and make real backend decisions.</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-indigo-100">Step 3</p>
              <p className="mt-1 text-base font-semibold">Submit portfolio</p>
              <p className="mt-2 text-sm text-indigo-100">Share GitHub links to validate backend readiness.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg md:text-xl font-bold text-slate-900">By the End of This Module</h2>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Target: ~4 Months
          </span>
        </div>
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {moduleOutcomes.map((outcome) => (
            <li key={outcome} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
              {outcome}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb size={19} className="text-amber-500" />
          <h2 className="text-lg md:text-xl font-bold text-slate-900">Pick Your Project Ideas</h2>
        </div>
        <p className="text-xs md:text-sm text-slate-500">
          Start with ideas that are useful and realistic. Original ideas are better, but it is okay to copy familiar app types to learn faster.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-4">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-bold text-slate-900">How to Pick Well</h3>
            <ul className="mt-3 space-y-2">
              {projectIdeaPrompts.map((prompt) => (
                <li key={prompt} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                  <span>{prompt}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-bold text-slate-900">Original Idea Starters</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projectIdeaExamples.map((idea) => (
                <div key={idea.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{idea.title}</p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{idea.summary}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-500" />
          <h2 className="text-lg md:text-xl font-bold text-slate-900">Some of the First Projects I Built (for reference)</h2>
        </div>
        <p className="text-xs md:text-sm text-slate-500">
          These are examples for direction and scope. Use them as reference, not templates.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inspirationProjects.map((project) => (
            <article key={project.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <a
                href={project.imageSrc}
                target="_blank"
                rel="noreferrer"
                className="block h-36 rounded-xl relative overflow-hidden border border-slate-200"
              >
                <Image
                  src={project.imageSrc}
                  alt={project.imageAlt}
                  fill
                  sizes="(max-width: 1280px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute left-3 bottom-3 text-white">
                  <p className="text-[10px] uppercase tracking-wider font-bold opacity-90">Project Preview</p>
                  <p className="text-sm font-semibold">{project.title}</p>
                </div>
              </a>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{project.title}</h3>
                  <p className="text-[11px] uppercase tracking-wider text-indigo-600 font-bold">{project.subtitle}</p>
                </div>
                <Sparkles size={16} className="text-slate-400 mt-1" />
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{project.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.stack.map((item) => (
                  <span
                    key={`${project.title}-${item}`}
                    className="text-[10px] px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 font-semibold"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <GitBranch size={13} />
                Open GitHub repo
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Your Portfolio Board</h2>
            <p className="mt-1 text-sm text-slate-500">Submit GitHub links now. Manual review status appears below.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CircleDot size={14} />
              Goal: 2 Verified Projects
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              {statusSummary.pass} pass • {statusSummary.pending} pending • {statusSummary.fail} not yet
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.25fr] gap-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-9 w-9 rounded-full border flex items-center justify-center mb-4 bg-white">
              <Plus size={18} className="text-indigo-600" />
            </div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Submit Project</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Add GitHub Repository</h3>
            <p className="mt-2 text-sm text-slate-600">
              Submit your own project idea. We review backend quality and mark pass/fail.
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="repo-url" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  GitHub URL
                </label>
                <input
                  id="repo-url"
                  type="url"
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="deployed-url" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Deployed URL (Optional)
                </label>
                <input
                  id="deployed-url"
                  type="url"
                  value={deployedUrl}
                  onChange={(event) => setDeployedUrl(event.target.value)}
                  placeholder="https://your-app.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {formError ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
              ) : null}
              {successMessage ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <GitBranch size={15} />}
                {isSubmitting ? "Submitting..." : "Submit Project"}
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-9 w-9 rounded-full border flex items-center justify-center mb-4 bg-white">
              <FileText size={16} className="text-slate-600" />
            </div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Submission History</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Review Status</h3>
            <p className="mt-2 text-sm text-slate-600">Statuses update to pending, pass, or not yet after review.</p>

            {listError ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {listError}
              </div>
            ) : null}

            {isLoading ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600 inline-flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" />
                Loading submissions...
              </div>
            ) : null}

            {!isLoading && !listError && submissions.length === 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No submissions yet. Submit your first project to start review.
              </div>
            ) : null}

            {!isLoading && !listError && submissions.length > 0 ? (
              <div className="mt-4 space-y-3">
                {submissions.map((submission) => {
                  const createdAt = submission.created_at
                    ? new Date(submission.created_at).toLocaleString()
                    : "Unknown time";
                  return (
                    <div key={submission.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <a
                          href={submission.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-indigo-700 hover:underline break-all"
                        >
                          {submission.repo_url}
                        </a>
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold ${statusPillClasses[submission.status]}`}>
                          {submission.status === "pass" ? <CheckCircle2 size={12} className="mr-1" /> : null}
                          {submission.status === "fail" ? <XCircle size={12} className="mr-1" /> : null}
                          {submission.status === "pending" ? <AlertTriangle size={12} className="mr-1" /> : null}
                          {statusLabel[submission.status]}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Submitted: {createdAt}</p>
                      {submission.deployed_url ? (
                        <a
                          href={submission.deployed_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex text-xs font-semibold text-slate-600 hover:text-slate-800 hover:underline"
                        >
                          Deployed URL
                        </a>
                      ) : null}
                      {submission.review_notes ? (
                        <p className="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600">
                          Reviewer note: {submission.review_notes}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-400">No reviewer note yet.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </article>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {portfolioCards.map((card) => {
            const isLocked = card.state === "locked";
            return (
              <article
                key={card.title}
                className={`rounded-2xl border p-5 transition-colors ${isLocked
                  ? "border-slate-200 bg-slate-50/70 text-slate-400"
                  : "border-slate-200 bg-white shadow-sm"
                  }`}
              >
                <div className="h-9 w-9 rounded-full border flex items-center justify-center mb-4 bg-white">
                  {isLocked ? <Lock size={16} /> : <Plus size={18} className="text-indigo-600" />}
                </div>
                <p className={`text-[11px] uppercase tracking-wider font-bold ${isLocked ? "text-slate-400" : "text-slate-500"}`}>
                  {card.subtitle}
                </p>
                <h3 className={`mt-1 text-xl font-bold ${isLocked ? "text-slate-500" : "text-slate-900"}`}>{card.title}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${isLocked ? "text-slate-400" : "text-slate-600"}`}>{card.description}</p>
                <p className={`mt-5 pt-4 border-t text-sm font-semibold ${isLocked ? "border-slate-200 text-slate-400" : "border-slate-200 text-indigo-600"}`}>
                  {card.cta}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <BadgeCheck size={18} className="text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">Pass/Fail Rule (No Grades)</h2>
        </div>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          A project is either <strong>Pass</strong> or <strong>Not Yet</strong>. Review focuses on backend quality:
          can your system handle requests through a backend layer and correctly manage persistent data.
        </p>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          You should genuinely understand and implement the backend yourself. Frontend/mobile can be AI-assisted.
          Deployment is a bonus, not required.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-7">
        <div className="flex items-start gap-3">
          <Globe size={20} className="text-indigo-600 mt-0.5" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Plateauing?</h2>
            <p className="mt-2 text-slate-600 leading-relaxed">
              Build for real people: family, friends, clubs, or local groups. This forces you to identify what users
              actually want, deploy your app, and iterate based on real feedback.
            </p>
            <p className="mt-2 text-slate-600 leading-relaxed">
              This is much stronger than projects nobody uses. You get resume metrics and behavioral interview material,
              including answers like: "A time where your user changed your perspective on something."
            </p>
            <p className="mt-2 text-slate-600 leading-relaxed">
              If you build with someone else, even better. In behavioral interviews, you will be able to answer questions
              about collaboration, conflict resolution, and team delivery with real examples.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
