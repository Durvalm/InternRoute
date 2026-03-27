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

import { ApiError, apiRequest } from "@/lib/api";

type StepKey = "analysis" | "projects" | "resume" | "roadmap";
type ProjectInputMode = "repo" | "upload";

type ProjectDraft = {
  inputMode: ProjectInputMode;
  repoUrl: string;
  sourceFile: File | null;
  hasError: boolean;
  errorNote: string;
};

type TrackPayload = {
  title: string;
  summary: string;
  sequence: string[];
};

type AnalyzeProjectApiResponse = {
  assessment_id: number;
  slot: {
    slot_index: number;
    input_mode: ProjectInputMode;
    repo_url: string | null;
  };
};

type ResumeScoreResponse = {
  submission_id: number;
};

type FinalizeAssessmentResponse = {
  assessment_id: number;
  track_key: string;
  track: TrackPayload;
  can_skip_coding_skills: boolean;
  coding_skip_confidence: number | null;
  project_pass_count: number;
  resume_score: number | null;
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
  hasError: false,
  errorNote: "",
});

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

export default function SkillPlacementOnboardingModal({ open, onClose, userName }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);

  const [projects, setProjects] = useState<ProjectDraft[]>([emptyProjectDraft(), emptyProjectDraft()]);
  const [isProjectAnalyzing, setIsProjectAnalyzing] = useState(false);
  const [projectsAnalyzed, setProjectsAnalyzed] = useState(false);
  const [projectStepError, setProjectStepError] = useState<string | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeSubmissionId, setResumeSubmissionId] = useState<number | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isResumeAnalyzing, setIsResumeAnalyzing] = useState(false);

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [track, setTrack] = useState<TrackPayload | null>(null);
  const [canSkipCodingSkills, setCanSkipCodingSkills] = useState(false);
  const [codingSkipConfidence, setCodingSkipConfidence] = useState<number | null>(null);
  const [projectPassCount, setProjectPassCount] = useState(0);
  const [finalResumeScore, setFinalResumeScore] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const currentStep: StepKey =
    stepIndex === 0 ? "analysis" : stepIndex === 1 ? "projects" : stepIndex === 2 ? "resume" : "roadmap";

  const hasAnyProjectSignal = useMemo(
    () =>
      projects.some((project) =>
        project.inputMode === "repo" ? project.repoUrl.trim().length > 0 : Boolean(project.sourceFile),
      ),
    [projects],
  );

  if (!open) return null;

  const resetAndClose = () => {
    setStepIndex(0);
    setAssessmentId(null);

    setProjects([emptyProjectDraft(), emptyProjectDraft()]);
    setIsProjectAnalyzing(false);
    setProjectsAnalyzed(false);
    setProjectStepError(null);

    setResumeFile(null);
    setResumeSubmissionId(null);
    setResumeError(null);
    setIsResumeAnalyzing(false);

    setIsFinalizing(false);
    setFinalizeError(null);
    setTrack(null);
    setCanSkipCodingSkills(false);
    setCodingSkipConfidence(null);
    setProjectPassCount(0);
    setFinalResumeScore(null);

    onClose();
  };

  const updateProject = (index: number, patch: Partial<ProjectDraft>) => {
    setProjects((previous) =>
      previous.map((project, currentIndex) => {
        if (index !== currentIndex) return project;
        return {
          ...project,
          ...patch,
          hasError: false,
          errorNote: "",
        };
      }),
    );
    setProjectsAnalyzed(false);
    setProjectStepError(null);
    setFinalizeError(null);
  };

  const onProjectFileChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > MAX_PROJECT_FILE_SIZE) {
      updateProject(index, {
        sourceFile: null,
        hasError: true,
        errorNote: "File is too large. Max size is 8MB.",
      });
      event.target.value = "";
      return;
    }

    updateProject(index, { sourceFile: file });
    event.target.value = "";
  };

  const analyzeProjects = async (): Promise<boolean> => {
    setProjectStepError(null);
    setFinalizeError(null);

    if (!hasAnyProjectSignal) {
      setProjects((previous) =>
        previous.map((project) => ({
          ...project,
          hasError: false,
          errorNote: "",
        })),
      );
      setProjectsAnalyzed(true);
      return true;
    }

    setIsProjectAnalyzing(true);
    try {
      const analyzedProjects = await Promise.all(
        projects.map(async (project, index) => {
          const hasInput =
            project.inputMode === "repo" ? project.repoUrl.trim().length > 0 : Boolean(project.sourceFile);

          if (!hasInput) {
            return {
              ...project,
              hasError: false,
              errorNote: "",
            };
          }

          try {
            const formData = new FormData();
            formData.append("input_mode", project.inputMode);
            formData.append("slot_index", String(index));

            if (project.inputMode === "repo") {
              formData.append("repo_url", project.repoUrl.trim());
            } else if (project.sourceFile) {
              formData.append("file", project.sourceFile);
            }

            const response = await apiRequest<AnalyzeProjectApiResponse>("/onboarding/projects/analyze", {
              method: "POST",
              body: formData,
            });

            setAssessmentId(response.assessment_id);

            return {
              ...project,
              repoUrl: response.slot.repo_url ?? project.repoUrl,
              hasError: false,
              errorNote: "",
            };
          } catch (error) {
            return {
              ...project,
              hasError: true,
              errorNote: toErrorMessage(error, "Could not analyze this project. Please check and retry."),
            };
          }
        }),
      );

      const hasError = analyzedProjects.some((project) => project.hasError);
      setProjects(analyzedProjects);
      setProjectsAnalyzed(!hasError);
      if (hasError) {
        setProjectStepError("One or more project submissions failed to analyze. Please fix and retry.");
        return false;
      }
      return true;
    } finally {
      setIsProjectAnalyzing(false);
    }
  };

  const handleResumeUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setResumeError("Please upload a PDF file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_RESUME_FILE_SIZE) {
      setResumeError("File is too large. Max size is 5MB.");
      event.target.value = "";
      return;
    }

    setResumeError(null);
    setResumeFile(file);
    setResumeSubmissionId(null);
    setFinalizeError(null);
    event.target.value = "";
  };

  const analyzeResume = async (): Promise<boolean> => {
    if (!resumeFile) {
      setResumeError("No resume yet? Totally fine. You can continue without uploading.");
      return false;
    }

    setIsResumeAnalyzing(true);
    setResumeError(null);
    setFinalizeError(null);
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const response = await apiRequest<ResumeScoreResponse>("/resume/score?context=onboarding", {
        method: "POST",
        body: formData,
      });

      setResumeSubmissionId(response.submission_id);
      return true;
    } catch (error) {
      setResumeError(toErrorMessage(error, "Could not analyze resume right now. Please retry."));
      return false;
    } finally {
      setIsResumeAnalyzing(false);
    }
  };

  const finalizeAssessment = async (): Promise<boolean> => {
    setIsFinalizing(true);
    setFinalizeError(null);

    try {
      const payload = resumeSubmissionId ? { resume_submission_id: resumeSubmissionId } : {};
      const response = await apiRequest<FinalizeAssessmentResponse>("/onboarding/finalize", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setAssessmentId(response.assessment_id);
      setTrack(response.track);
      setCanSkipCodingSkills(Boolean(response.can_skip_coding_skills));
      setCodingSkipConfidence(response.coding_skip_confidence);
      setProjectPassCount(response.project_pass_count);
      setFinalResumeScore(response.resume_score);
      setStepIndex(3);
      return true;
    } catch (error) {
      setFinalizeError(toErrorMessage(error, "Could not finalize diagnosis right now. Please retry."));
      return false;
    } finally {
      setIsFinalizing(false);
    }
  };

  const goBack = () => {
    if (isProjectAnalyzing || isResumeAnalyzing || isFinalizing) return;
    if (stepIndex === 0) return;
    setStepIndex((prev) => Math.max(0, prev - 1));
    setFinalizeError(null);
  };

  const goNext = async () => {
    if (currentStep === "analysis") {
      setStepIndex(1);
      return;
    }

    if (currentStep === "projects") {
      if (!projectsAnalyzed) {
        const success = await analyzeProjects();
        if (!success) return;
        setStepIndex(2);
        return;
      }
      setStepIndex(2);
      return;
    }

    if (currentStep === "resume") {
      if (resumeFile && resumeSubmissionId === null) {
        const analyzed = await analyzeResume();
        if (!analyzed) return;
      }
      await finalizeAssessment();
      return;
    }

    resetAndClose();
  };

  const skipProjects = () => {
    if (isProjectAnalyzing || isResumeAnalyzing || isFinalizing) return;
    setProjects((previous) =>
      previous.map((project) => ({
        ...project,
        hasError: false,
        errorNote: "",
      })),
    );
    setProjectsAnalyzed(true);
    setProjectStepError(null);
    setStepIndex(2);
  };

  const skipResume = async () => {
    if (isProjectAnalyzing || isResumeAnalyzing || isFinalizing) return;
    setResumeFile(null);
    setResumeSubmissionId(null);
    setResumeError(null);
    await finalizeAssessment();
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
                <div className="h-full rounded-full bg-[#3f32d5]" style={{ width: isProjectStep ? "50%" : "100%" }} />
              </div>
            </div>
          ) : null}
          <h2 id="onboarding-step-title" className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
            {isProjectStep ? "Project Showcase" : isResumeStep ? "Technical Assessment" : "Diagnosis"}
          </h2>
          <p className="text-sm text-slate-500 md:text-base">
            {isProjectStep ? "Reviewing your proof" : isResumeStep ? "Resume verification" : "Your placement result"}
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
                  disabled={isProjectAnalyzing || isFinalizing}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Skip for now
                </button>
              </div>

              <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Upload help (ZIP or single file)</summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  For a full project, compress the project folder into a <code>.zip</code> file and upload it. If your project is small,
                  uploading a single source file is also acceptable.
                </p>
              </details>

              <div className="space-y-4">
                {projects.map((project, index) => (
                  <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
                    <p className="text-xl font-bold text-slate-900">Project {index + 1}</p>

                    <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => updateProject(index, { inputMode: "repo", sourceFile: null })}
                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                          project.inputMode === "repo" ? "bg-[#3f32d5] text-white" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        GitHub URL
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProject(index, { inputMode: "upload", repoUrl: "" })}
                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                          project.inputMode === "upload" ? "bg-[#3f32d5] text-white" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Upload File / ZIP
                      </button>
                    </div>

                    {project.inputMode === "repo" ? (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                        <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">GitHub repo URL</label>
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
                          {project.sourceFile ? <p className="mt-1 text-xs font-medium text-indigo-700">Attached: {project.sourceFile.name}</p> : null}
                        </label>
                      </div>
                    )}

                    {project.hasError ? <p className="mt-3 text-sm text-rose-600">{project.errorNote}</p> : null}
                  </article>
                ))}
              </div>

              {projectStepError ? <p className="text-sm font-medium text-rose-600">{projectStepError}</p> : null}
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
                <button
                  type="button"
                  onClick={() => {
                    void skipResume();
                  }}
                  disabled={isResumeAnalyzing || isFinalizing}
                  className="font-semibold text-indigo-700 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
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
                    {(track?.sequence ?? ["Coding", "Projects", "Resume"]).map((phase, index) => (
                      <div key={`${phase}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                        <p className={`text-sm font-semibold ${index === 0 ? "text-indigo-700" : "text-slate-700"}`}>{phase}</p>
                        <p className="mt-1 text-xs text-slate-500">{index === 0 ? "Current" : index === 1 ? "Next" : "Then"}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    Project signal passed {projectPassCount}/2. Resume signal {finalResumeScore ?? "not submitted"}.{" "}
                    {track?.summary ?? "We prepared your next sequence based on the current evidence."}
                  </p>
                  {assessmentId ? <p className="mt-2 text-xs text-slate-400">Assessment #{assessmentId}</p> : null}
                </article>

                <article className="rounded-2xl bg-[#3f32d5] p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-100">Track identified</p>
                  <p className="mt-2 text-3xl font-extrabold leading-tight">{track?.title ?? "Foundation Start"}</p>
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

              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Coding module decision</p>
                {canSkipCodingSkills ? (
                  <p className="mt-1">
                    You can skip coding challenges. Confidence: {codingSkipConfidence !== null ? `${Math.round(codingSkipConfidence * 100)}%` : "N/A"}.
                  </p>
                ) : (
                  <p className="mt-1">You&apos;ll start with coding challenges first to build fundamentals.</p>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <footer className="border-t border-slate-200 bg-white px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={isProjectAnalyzing || isResumeAnalyzing || isFinalizing || stepIndex === 0}
              className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Back
            </button>

            <div className="flex flex-col items-end gap-2">
              {finalizeError ? <p className="text-sm font-medium text-rose-600">{finalizeError}</p> : null}
              <button
                type="button"
                onClick={() => {
                  void goNext();
                }}
                disabled={isProjectAnalyzing || isResumeAnalyzing || isFinalizing}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3f32d5] px-7 py-2.5 text-base font-semibold text-white hover:bg-[#3428bc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFinalizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finalizing...
                  </>
                ) : currentStep === "roadmap" ? (
                  <>
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
