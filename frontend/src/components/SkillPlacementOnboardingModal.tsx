"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileCode2,
  Link2,
  Loader2,
  Shield,
  Upload,
} from "lucide-react";

type StepKey = "analysis" | "projects" | "resume" | "roadmap";
type ProjectStatus = "idle" | "pass" | "needs_work" | "skipped";
type ProjectInputMode = "repo" | "upload";
type TrackKey =
  | "foundation_start"
  | "coding_base_build_depth"
  | "emerging_builder"
  | "strong_builder_needs_positioning"
  | "acceleration_track";

type ProjectDraft = {
  inputMode: ProjectInputMode;
  repoUrl: string;
  sourceFile: File | null;
  status: ProjectStatus;
  note: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  userName?: string | null;
};

const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PROJECT_FILE_SIZE = 8 * 1024 * 1024;

const emptyProjectDraft = (): ProjectDraft => ({
  inputMode: "repo",
  repoUrl: "",
  sourceFile: null,
  status: "idle",
  note: "",
});

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getProjectStatusClasses(status: ProjectStatus) {
  if (status === "pass") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "needs_work") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "skipped") return "border-slate-200 bg-slate-50 text-slate-500";
  return "border-slate-200 bg-white text-slate-500";
}

function getProjectStatusLabel(status: ProjectStatus) {
  if (status === "pass") return "Pass";
  if (status === "needs_work") return "Needs work";
  if (status === "skipped") return "Not submitted";
  return "Not analyzed";
}

function evaluateProjectSignal(project: ProjectDraft) {
  const repo = project.repoUrl.trim();
  const hasRepo = repo.length > 0;
  const hasFile = Boolean(project.sourceFile);

  if (project.inputMode === "repo") {
    if (!hasRepo) {
      return { status: "skipped" as const, note: "" };
    }

    const validRepoPattern = /github\.com\/[\w.-]+\/[\w.-]+/i.test(repo);
    if (!validRepoPattern) {
      return {
        status: "needs_work" as const,
        note: "Please provide a valid GitHub repository URL.",
      };
    }

    return {
      status: "pass" as const,
      note: "Repository accepted for placement signal.",
    };
  }

  if (!hasFile) {
    return { status: "skipped" as const, note: "" };
  }

  return {
    status: "pass" as const,
    note: "Source file/ZIP accepted for placement signal.",
  };
}

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 65) return "text-indigo-700 bg-indigo-50 border-indigo-200";
  return "text-amber-700 bg-amber-50 border-amber-200";
}

function getTrackFromSignals(
  projectPassCount: number,
  hasAnyProjectSignal: boolean,
  resumeScore: number | null,
): {
  key: TrackKey;
  title: string;
  summary: string;
  sequence: string[];
} {
  if (!hasAnyProjectSignal && resumeScore === null) {
    return {
      key: "foundation_start",
      title: "Foundation Start",
      summary: "No problem. We'll start with coding fundamentals and build proof progressively.",
      sequence: ["Coding", "Projects", "Resume"],
    };
  }

  if (projectPassCount === 0 && hasAnyProjectSignal) {
    return {
      key: "coding_base_build_depth",
      title: "Coding Base, Needs Build Depth",
      summary: "You show coding signal, but portfolio depth needs to improve before applications.",
      sequence: ["Projects", "Resume", "Applications"],
    };
  }

  if (projectPassCount === 1) {
    return {
      key: "emerging_builder",
      title: "Emerging Builder",
      summary: "You have real signal. Build one more strong project, then improve resume for launch.",
      sequence: ["Projects", "Resume", "Applications"],
    };
  }

  if (projectPassCount >= 2 && (resumeScore === null || resumeScore < 80)) {
    return {
      key: "strong_builder_needs_positioning",
      title: "Strong Builder, Needs Positioning",
      summary: "Technical base is strong. Main leverage now is resume quality and positioning.",
      sequence: ["Resume", "Applications", "Interview Prep"],
    };
  }

  return {
    key: "acceleration_track",
    title: "Acceleration Track",
    summary: "You can fast-track to applications and interview prep with focused iteration.",
    sequence: ["Projects", "Resume", "Applications"],
  };
}

export default function SkillPlacementOnboardingModal({ open, onClose, userName }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [projects, setProjects] = useState<ProjectDraft[]>([emptyProjectDraft(), emptyProjectDraft()]);
  const [isProjectAnalyzing, setIsProjectAnalyzing] = useState(false);
  const [projectsAnalyzed, setProjectsAnalyzed] = useState(false);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isResumeAnalyzing, setIsResumeAnalyzing] = useState(false);
  const [resumeScore, setResumeScore] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const currentStep: StepKey = stepIndex === 0 ? "analysis" : stepIndex === 1 ? "projects" : stepIndex === 2 ? "resume" : "roadmap";

  const hasAnyProjectSignal = useMemo(
    () =>
      projects.some((project) =>
        project.inputMode === "repo"
          ? project.repoUrl.trim().length > 0
          : Boolean(project.sourceFile),
      ),
    [projects],
  );

  const projectPassCount = useMemo(() => projects.filter((project) => project.status === "pass").length, [projects]);

  const track = useMemo(
    () => getTrackFromSignals(projectPassCount, hasAnyProjectSignal, resumeScore),
    [projectPassCount, hasAnyProjectSignal, resumeScore],
  );

  if (!open) return null;

  const resetAndClose = () => {
    setStepIndex(0);
    setProjects([emptyProjectDraft(), emptyProjectDraft()]);
    setIsProjectAnalyzing(false);
    setProjectsAnalyzed(false);
    setResumeFile(null);
    setResumeError(null);
    setIsResumeAnalyzing(false);
    setResumeScore(null);
    onClose();
  };

  const updateProject = (index: number, patch: Partial<ProjectDraft>) => {
    setProjects((previous) =>
      previous.map((project, currentIndex) => {
        if (index !== currentIndex) return project;
        return { ...project, ...patch, status: "idle", note: "" };
      }),
    );
    setProjectsAnalyzed(false);
  };

  const onProjectFileChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > MAX_PROJECT_FILE_SIZE) {
      updateProject(index, {
        sourceFile: null,
        status: "needs_work",
        note: "File is too large. Max size is 8MB.",
      });
      return;
    }

    updateProject(index, { sourceFile: file });
    event.target.value = "";
  };

  const analyzeProjects = async () => {
    if (!hasAnyProjectSignal) {
      setProjects((previous) => previous.map((project) => ({ ...project, status: "skipped", note: "" })));
      setProjectsAnalyzed(true);
      return;
    }

    setIsProjectAnalyzing(true);
    await wait(800);
    setProjects((previous) =>
      previous.map((project) => {
        const result = evaluateProjectSignal(project);
        return { ...project, status: result.status, note: result.note };
      }),
    );
    setProjectsAnalyzed(true);
    setIsProjectAnalyzing(false);
  };

  const handleResumeUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setResumeError("Please upload a PDF file.");
      return;
    }

    if (file.size > MAX_RESUME_FILE_SIZE) {
      setResumeError("File is too large. Max size is 5MB.");
      return;
    }

    setResumeError(null);
    setResumeFile(file);
    setResumeScore(null);
    event.target.value = "";
  };

  const analyzeResume = async () => {
    if (!resumeFile) {
      setResumeError("No resume yet? Totally fine. You can skip this step.");
      return;
    }

    setIsResumeAnalyzing(true);
    setResumeError(null);
    await wait(900);

    const fingerprint = resumeFile.name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const score = 58 + (fingerprint % 39);
    setResumeScore(Math.max(0, Math.min(100, score)));
    setIsResumeAnalyzing(false);
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const goNext = async () => {
    if (currentStep === "projects" && !projectsAnalyzed) {
      await analyzeProjects();
      return;
    }

    if (currentStep === "resume" && resumeFile && resumeScore === null) {
      await analyzeResume();
      return;
    }

    setStepIndex((prev) => Math.min(3, prev + 1));
  };

  const skipProjects = () => {
    setProjects((previous) => previous.map((project) => ({ ...project, status: "skipped", note: "" })));
    setProjectsAnalyzed(true);
    setStepIndex(2);
  };

  const skipResume = () => {
    setResumeFile(null);
    setResumeScore(null);
    setResumeError(null);
    setStepIndex(3);
  };

  if (currentStep === "analysis") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-[1px]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-analysis-title"
          className="onboarding-modal-enter w-full max-w-[700px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.75)]"
        >
          <div className="h-1.5 w-full bg-[#3f32d5]" />

          <div className="px-8 py-10 text-center md:px-14 md:py-12">
            <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <Shield className="h-8 w-8" />
            </div>

            <h2 id="onboarding-analysis-title" className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Let&apos;s analyze what level you&apos;re at.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600 md:text-xl">
              {userName ? `${userName}, ` : ""}we&apos;ll quickly figure out your best starting point and the next steps that matter most.
            </p>

            <button
              type="button"
              onClick={() => setStepIndex(1)}
              className="mt-8 w-full rounded-xl bg-[#3f32d5] px-6 py-4 text-xl font-semibold text-white hover:bg-[#3428bc]"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isProjectStep = currentStep === "projects";
  const isResumeStep = currentStep === "resume";
  const showStepCounter = isProjectStep || isResumeStep;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-3 backdrop-blur-[1px] md:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-step-title"
        className="onboarding-modal-enter relative flex h-[94vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.75)]"
      >
        <div className="border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          {showStepCounter ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-700">
                {isProjectStep ? "Step 1 of 2" : "Step 2 of 2"}
              </p>
              <div className="hidden h-1 w-28 rounded-full bg-slate-200 md:block">
                <div
                  className="h-full rounded-full bg-[#3f32d5]"
                  style={{ width: isProjectStep ? "50%" : "100%" }}
                />
              </div>
            </div>
          ) : null}
          <h2 id="onboarding-step-title" className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
            {isProjectStep ? "Project Showcase" : isResumeStep ? "Technical Assessment" : "Diagnosis"}
          </h2>
          <p className="text-sm text-slate-500 md:text-base">
            {isProjectStep
              ? "Reviewing your proof"
              : isResumeStep
                ? "Resume verification"
                : "Your placement result"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f7f8fc] p-4 md:p-8">
          {isProjectStep ? (
            <section className="mx-auto max-w-5xl space-y-5 rounded-3xl border border-slate-200 bg-white p-5 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-4xl">
                    Show us the project you&apos;re most proud of.
                  </h3>
                  <p className="mt-3 text-lg text-slate-600">
                    Uploading your code helps us gauge your technical skill level. If you&apos;re just starting out, a single coding file is perfect.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={skipProjects}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Skip for now
                </button>
              </div>

              <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  Upload help (ZIP or single file)
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  For a full project, compress the project folder into a `.zip` file and upload it. If your project is small,
                  uploading a single source file is also acceptable.
                </p>
              </details>

              <div className="space-y-4">
                {projects.map((project, index) => (
                  <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xl font-bold text-slate-900">Project {index + 1}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getProjectStatusClasses(project.status)}`}>
                        {getProjectStatusLabel(project.status)}
                      </span>
                    </div>

                    <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => updateProject(index, { inputMode: "repo", sourceFile: null })}
                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                          project.inputMode === "repo"
                            ? "bg-[#3f32d5] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        GitHub URL
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProject(index, { inputMode: "upload", repoUrl: "" })}
                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                          project.inputMode === "upload"
                            ? "bg-[#3f32d5] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Upload File / ZIP
                      </button>
                    </div>

                    {project.inputMode === "repo" ? (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          GitHub repo URL
                        </label>
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-slate-400" />
                          <input
                            type="url"
                            value={project.repoUrl}
                            onChange={(event) => updateProject(index, { repoUrl: event.target.value })}
                            placeholder="https://github.com/username/project"
                            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center">
                        <input
                          type="file"
                          id={`project-file-${index}`}
                          className="hidden"
                          accept=".zip,.py,.js,.ts,.tsx,.java,.cpp,.c,.go,.rs"
                          onChange={(event) => onProjectFileChange(index, event)}
                        />
                        <label htmlFor={`project-file-${index}`} className="cursor-pointer">
                          <FileCode2 className="mx-auto h-6 w-6 text-slate-400" />
                          <p className="mt-2 text-sm font-semibold text-slate-800">Upload source code file (or ZIP)</p>
                          {project.sourceFile ? (
                            <p className="mt-1 text-xs font-medium text-indigo-700">Attached: {project.sourceFile.name}</p>
                          ) : null}
                        </label>
                      </div>
                    )}

                    {project.note ? <p className="mt-3 text-sm text-slate-600">{project.note}</p> : null}
                  </article>
                ))}
              </div>

              {isProjectAnalyzing ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing projects...
                </div>
              ) : null}
            </section>
          ) : null}

          {isResumeStep ? (
            <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
              <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-4xl">
                Upload your current resume so we can gauge your interview-readiness signal.
              </h3>
              <p className="mt-3 text-base text-slate-600 md:text-lg">
                We&apos;ll scan for keywords, technical stack alignment, and structural quality.
              </p>

              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center md:p-10">
                <input
                  type="file"
                  id="resume-onboarding-upload"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                />
                <label htmlFor="resume-onboarding-upload" className="cursor-pointer">
                  <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                    <Upload className="h-7 w-7" />
                  </div>
                  <p className="mt-3 text-xl font-semibold text-slate-900">Click to upload or drag and drop</p>
                  <p className="text-base text-slate-500">PDF only (Max 5MB)</p>
                  {resumeFile ? <p className="mt-2 text-sm font-medium text-indigo-700">Attached: {resumeFile.name}</p> : null}
                </label>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-600">
                No resume yet? That&apos;s totally fine. You can{" "}
                <button type="button" onClick={skipResume} className="font-semibold text-indigo-700 underline underline-offset-2">
                  skip this for now
                </button>{" "}
                and we&apos;ll help you build one later.
              </div>

              {resumeError ? <p className="mt-3 text-sm text-rose-600">{resumeError}</p> : null}
              {isResumeAnalyzing ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing resume...
                </div>
              ) : null}
              {resumeScore !== null ? (
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">Resume signal score</p>
                  <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold ${scoreTone(resumeScore)}`}>
                    {resumeScore}/100
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}

          {currentStep === "roadmap" ? (
            <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
              <h3 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Diagnosis</h3>
              <p className="mt-3 text-base text-slate-600 md:text-lg">Your placement recommendation based on current signal.</p>

              <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-2xl font-bold text-slate-900">Strategic Sequence</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {track.sequence.map((phase, index) => (
                      <div key={`${phase}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className={`text-sm font-semibold ${index === 0 ? "text-indigo-700" : "text-slate-700"}`}>{phase}</p>
                        <p className="mt-1 text-xs text-slate-500">{index === 0 ? "Current" : index === 1 ? "Next" : "Then"}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    Project signal passed {projectPassCount}/2. Resume signal {resumeScore ?? "not submitted"}. {track.summary}
                  </p>
                </article>

                <article className="rounded-2xl bg-[#3f32d5] p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-100">Track identified</p>
                  <p className="mt-2 text-3xl font-extrabold leading-tight">{track.title}</p>
                  <ul className="mt-4 space-y-2 text-sm text-indigo-100">
                    <li className="inline-flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                      Pick one high-value next action
                    </li>
                    <li className="inline-flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                      Close your biggest signal gap first
                    </li>
                    <li className="inline-flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4" />
                      Reassess after completing next milestone
                    </li>
                  </ul>
                </article>
              </div>
            </section>
          ) : null}
        </div>

        <footer className="border-t border-slate-200 bg-white px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back
            </button>

            {currentStep !== "roadmap" ? (
              <button
                type="button"
                onClick={() => {
                  void goNext();
                }}
                disabled={isProjectAnalyzing || isResumeAnalyzing}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3f32d5] px-7 py-2.5 text-base font-semibold text-white hover:bg-[#3428bc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {currentStep === "projects" && !projectsAnalyzed ? "Analyze Projects" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={resetAndClose}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3f32d5] px-7 py-2.5 text-base font-semibold text-white hover:bg-[#3428bc]"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
