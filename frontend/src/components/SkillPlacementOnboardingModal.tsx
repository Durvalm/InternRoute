"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  FileCode2,
  GraduationCap,
  Link2,
  Loader2,
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

type OnboardingTimelinePlan = {
  estimated_ready_date: string;
  estimated_duration_weeks: number;
  season_at_ready: "peak" | "lower" | "off";
  peak_cycle_open: string;
  peak_reference_is_current_cycle: boolean;
  next_peak_open: string;
  next_lower_open: string;
  recommended_start_date: string;
  recommended_season: "peak" | "lower" | "off";
  recommendation_key: string;
  recommendation_title: string;
  recommendation_summary: string;
  peak_hiring_note: string;
  season_explainer: string;
  ready_after_graduation: boolean;
  graduates_before_next_peak: boolean;
  graduation_date: string | null;
};

type FinalizeAssessmentResponse = {
  assessment_id: number;
  track_key: string;
  track: TrackPayload;
  can_skip_coding_skills: boolean;
  coding_skip_confidence: number | null;
  project_pass_count: number;
  resume_score: number | null;
  timeline_plan?: OnboardingTimelinePlan | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  userName?: string | null;
};

type TrackKey = "foundation_start" | "coding_base_build_depth" | "emerging_builder" | "strong_builder_needs_positioning" | "acceleration_track";
type ModuleStatus = "todo" | "skip" | "partial";
type TrackModule = {
  id: string;
  name: string;
  icon: string;
  status: ModuleStatus;
  time: string;
  description: string;
  badge?: string;
};
type TrackRoadmap = {
  title: string;
  tagline: string;
  summary: string;
  totalTime: string;
  icon: string;
  modules: TrackModule[];
};
type AssessmentSnapshot = {
  projectPassCount: number;
  resumeScore: number | null;
  canSkipCodingSkills: boolean;
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

const TRACK_ROADMAPS: Record<TrackKey, TrackRoadmap> = {
  foundation_start: {
    title: "Foundation Start",
    tagline: "Building from the ground up.",
    summary:
      "You're starting from scratch. That's okay. The gap right now is core coding logic and project proof. First we lock in fundamentals, then we build two backend projects you can use as real experience. This roadmap takes you from zero to internship-ready in the most direct path possible.",
    totalTime: "7 months",
    icon: "🏗️",
    modules: [
      {
        id: "intro",
        name: "Intro (Timeline & Strategy)",
        icon: "🗺️",
        status: "todo",
        time: "1 week",
        description: "Learn the recruiting timeline so you apply at the right time. Most students miss this and apply too late.",
      },
      {
        id: "coding",
        name: "Coding Skills",
        icon: "💻",
        status: "todo",
        time: "~2 months",
        description: "Focus on real programming logic: variables, conditionals, loops, functions, and problem breakdown. This is the base for everything else.",
      },
      {
        id: "projects",
        name: "Projects",
        icon: "🛠️",
        status: "todo",
        time: "~4 months",
        description: "Build 2 meaningful backend projects with APIs and a database. This turns your skills into proof and experience for your resume.",
        badge: "Most time-intensive",
      },
      {
        id: "resume",
        name: "Resume",
        icon: "📄",
        status: "todo",
        time: "2-3 weeks",
        description: "Write a clear one-page resume that shows impact and technical depth.",
      },
      {
        id: "applications",
        name: "Applications",
        icon: "📬",
        status: "todo",
        time: "ongoing",
        description: "Learn where to apply, when to apply, and how to track your pipeline without burning out.",
      },
    ],
  },
  coding_base_build_depth: {
    title: "Coding Base",
    tagline: "Strong fundamentals. Time to build.",
    summary:
      "You already have strong coding skills. That's your advantage. The issue is backend depth: your projects didn't show enough API/database work yet. To fix that, you'll build real backend projects. That gives you credible experience to put on your resume and talk about in interviews.",
    totalTime: "5 months",
    icon: "⚡",
    modules: [
      {
        id: "intro",
        name: "Intro (Timeline & Strategy)",
        icon: "🗺️",
        status: "todo",
        time: "1 week",
        description: "Set your recruiting timeline now so your execution matches real hiring windows.",
      },
      {
        id: "coding",
        name: "Coding Skills",
        icon: "💻",
        status: "skip",
        time: "credited",
        description: "You're already strong here, so this module is credited.",
      },
      {
        id: "projects",
        name: "Projects",
        icon: "🛠️",
        status: "todo",
        time: "~4 months",
        description: "Main focus: build 2 meaningful backend projects with API + database depth, then be ready to explain architecture and tradeoffs.",
        badge: "Your main focus",
      },
      {
        id: "resume",
        name: "Resume",
        icon: "📄",
        status: "todo",
        time: "2-3 weeks",
        description: "Once your projects are strong, we'll package them into a resume that gets interviews.",
      },
      {
        id: "applications",
        name: "Applications",
        icon: "📬",
        status: "todo",
        time: "ongoing",
        description: "Then run a structured application pipeline so opportunities don't slip.",
      },
    ],
  },
  emerging_builder: {
    title: "Emerging Builder",
    tagline: "One project down. One more to go.",
    summary:
      "You already have strong coding and backend signal, plus one meaningful project. That's good progress. To become interview-ready, you now need two things in parallel: one more strong project and a sharper resume built from both projects. The second project gives depth, and the resume turns that depth into interview conversion.",
    totalTime: "2 months",
    icon: "🌱",
    modules: [
      {
        id: "intro",
        name: "Intro (Timeline & Strategy)",
        icon: "🗺️",
        status: "todo",
        time: "1 week",
        description: "Align your timeline so you can hit the next recruiting window with momentum.",
      },
      {
        id: "coding",
        name: "Coding Skills",
        icon: "💻",
        status: "skip",
        time: "credited",
        description: "Your current project signal already proves this baseline, so it's credited.",
      },
      {
        id: "projects",
        name: "Projects",
        icon: "🛠️",
        status: "partial",
        time: "~1 month",
        description: "Add one more meaningful backend project with API + database depth so you have 2 strong projects on your profile.",
        badge: "40% complete - almost there",
      },
      {
        id: "resume",
        name: "Resume",
        icon: "📄",
        status: "todo",
        time: "2-3 weeks",
        description: "Use your projects to build a resume that clearly sells your experience.",
      },
      {
        id: "applications",
        name: "Applications",
        icon: "📬",
        status: "todo",
        time: "ongoing",
        description: "Once project + resume are aligned, start applying with a tracked strategy.",
      },
    ],
  },
  strong_builder_needs_positioning: {
    title: "Strong Builder",
    tagline: "Great projects. Now the story must match.",
    summary:
      "Your project proof is strong. The issue now is your resume. Before sending out hundreds of applications, you need a resume that clearly sells your impact. We'll help you build a killer resume so your current work turns into interview calls.",
    totalTime: "1 month",
    icon: "🔥",
    modules: [
      {
        id: "intro",
        name: "Intro (Timeline & Strategy)",
        icon: "🗺️",
        status: "todo",
        time: "1 week",
        description: "Quickly align your recruiting timeline so you move fast in the right windows.",
      },
      {
        id: "coding",
        name: "Coding Skills",
        icon: "💻",
        status: "skip",
        time: "credited",
        description: "Your projects already prove your coding baseline, so this is credited.",
      },
      {
        id: "projects",
        name: "Projects",
        icon: "🛠️",
        status: "skip",
        time: "credited",
        description: "You already have 2 strong backend projects, so this is credited. Focus shifts to resume quality.",
      },
      {
        id: "resume",
        name: "Resume",
        icon: "📄",
        status: "todo",
        time: "2-3 weeks",
        description: "This is your bottleneck. Before scaling applications, build a sharp resume that highlights impact and gets recruiters to say yes to interviews.",
        badge: "Main focus",
      },
      {
        id: "applications",
        name: "Applications",
        icon: "📬",
        status: "todo",
        time: "ongoing",
        description: "After resume improvements, launch a targeted application pipeline and track conversion.",
      },
    ],
  },
  acceleration_track: {
    title: "Acceleration Track",
    tagline: "You're ready. Execute hard.",
    summary:
      "You're internship-ready now. If recruiting season is open, go straight to Applications and execute. But your journey is not over - you're just starting to become competitive. From here, keep building depth through stronger projects, better experience, and consistent LeetCode prep. If interviews are not coming in, one of three things is broken: projects, resume, or application strategy. Find the weak point and fix it fast.",
    totalTime: "1 week",
    icon: "🚀",
    modules: [
      {
        id: "intro",
        name: "Intro (Timeline & Strategy)",
        icon: "🗺️",
        status: "todo",
        time: "1 week",
        description: "Quick calibration so your outreach is timed correctly.",
      },
      {
        id: "coding",
        name: "Coding Skills",
        icon: "💻",
        status: "skip",
        time: "credited",
        description: "Already proven and credited.",
      },
      {
        id: "projects",
        name: "Projects",
        icon: "🛠️",
        status: "skip",
        time: "credited",
        description: "You already have 2 strong backend projects, so this is credited.",
      },
      {
        id: "resume",
        name: "Resume",
        icon: "📄",
        status: "skip",
        time: "credited",
        description: "Resume is already strong enough for this stage, so it's credited.",
      },
      {
        id: "applications",
        name: "Applications",
        icon: "📬",
        status: "todo",
        time: "start now",
        description: "Learn how to apply the right way so you don't waste cycles: target roles well, use the right tools, and track outcomes like top students.",
        badge: "Start here",
      },
    ],
  },
};

function asTrackKey(value: string | null | undefined): TrackKey {
  if (!value) return "foundation_start";
  if (value in TRACK_ROADMAPS) return value as TrackKey;
  return "foundation_start";
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "TBD";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "TBD";
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatMonthYearLabel(value: string | null | undefined): string {
  if (!value) return "TBD";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "TBD";
  return parsed.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatPeakWindowLabel(peakStartDateValue: string | null | undefined): string {
  if (!peakStartDateValue) return "TBD";
  const peakStart = new Date(`${peakStartDateValue}T12:00:00`);
  if (Number.isNaN(peakStart.getTime())) return "TBD";
  const peakYear = peakStart.getFullYear();
  return `Aug ${peakYear} - Mar ${peakYear + 1}`;
}

function seasonLabel(value: "peak" | "lower" | "off"): string {
  if (value === "peak") return "Main hiring window";
  if (value === "lower") return "Smaller hiring window";
  return "Limited hiring window";
}

function getTimelineGuidance(plan: OnboardingTimelinePlan): { title: string; summary: string } {
  if (plan.recommendation_key === "apply_in_peak") {
    return {
      title: "You can compete in this recruiting window",
      summary:
        "Internship applications usually open in August and stay active through March. You'll be ready inside this window, so start applying as soon as you hit readiness.",
    };
  }
  if (plan.recommendation_key === "lower_then_peak" || plan.recommendation_key === "off_then_peak") {
    return {
      title: "You're in time for this cycle - use the extra runway",
      summary:
        "You can compete in this recruiting cycle. Use this lead time to sharpen projects and resume, then push hard when August opens and listings increase.",
    };
  }
  if (plan.recommendation_key === "lower_no_wait" || plan.recommendation_key === "off_no_wait") {
    return {
      title: "Don't wait for a later cycle",
      summary:
        "Because of your graduation timeline, apply as soon as you're ready. Focus on internships at local companies and startups, and keep improving while you apply.",
    };
  }
  if (plan.recommendation_key === "urgent_no_wait") {
    return {
      title: "Apply immediately and expand your target",
      summary:
        "You're near or past graduation timing, so waiting is risky. Target startup/local internships and add new-grad full-time opportunities while you keep improving weekly.",
    };
  }
  return {
    title: "Keep following this roadmap and prepare to apply",
    summary: "You're on the right path. Finish the key modules, then begin applications in the best hiring window.",
  };
}

export default function SkillPlacementOnboardingModal({ open, onClose, userName }: Props) {
  const [stepIndex, setStepIndex] = useState(0);

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
  const [trackKey, setTrackKey] = useState<string | null>(null);
  const [assessmentSnapshot, setAssessmentSnapshot] = useState<AssessmentSnapshot | null>(null);
  const [timelinePlan, setTimelinePlan] = useState<OnboardingTimelinePlan | null>(null);
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
    setTrackKey(null);
    setAssessmentSnapshot(null);
    setTimelinePlan(null);

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

      setTrackKey(response.track_key);
      setAssessmentSnapshot({
        projectPassCount: response.project_pass_count,
        resumeScore: response.resume_score,
        canSkipCodingSkills: Boolean(response.can_skip_coding_skills),
      });
      setTimelinePlan(response.timeline_plan ?? null);
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
    const shouldSkip = typeof window === "undefined"
      ? true
      : window.confirm(
        hasAnyProjectSignal
          ? "If you skip projects, we might place you in a lower track than your real level. Are you sure you want to skip?"
          : "No projects yet is totally fine. We'll place you in a beginner track if you skip. Do you want to continue?",
      );
    if (!shouldSkip) return;

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

          <div className="px-8 py-10 md:px-12 md:py-12">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#3f32d5] text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <p className="text-2xl font-semibold text-slate-900">InternRoute</p>
            </div>

            <h2 id="onboarding-analysis-title" className="mt-7 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Let&apos;s build your{" "}
              <span className="text-[#3f32d5]">personalized roadmap.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
              {userName ? `${userName}, ` : ""}2 quick steps. We&apos;ll review what you&apos;ve built so far and give you a clear plan:
              what to focus on, what can be credited, and when you should start applying.
            </p>

            <div className="mt-7 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-sm font-semibold text-indigo-700">
                  1
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Show us your best projects</p>
                  <p className="text-base text-slate-500">GitHub URL or file upload.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-sm font-semibold text-indigo-700">
                  2
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Upload your current resume</p>
                  <p className="text-base text-slate-500">Or skip if you don&apos;t have one yet.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStepIndex(1)}
              className="mt-8 w-full rounded-xl bg-[#3f32d5] px-6 py-4 text-xl font-semibold text-white hover:bg-[#3428bc]"
            >
              Show me where I stand
            </button>
            <p className="mt-4 text-center text-sm text-slate-500">Takes about 5 minutes. You can update this later.</p>
          </div>
        </div>
      </div>
    );
  }

  const isProjectStep = currentStep === "projects";
  const isResumeStep = currentStep === "resume";
  const showStepCounter = isProjectStep || isResumeStep;
  const resolvedTrackKey = asTrackKey(trackKey);
  const effectiveTrack = TRACK_ROADMAPS[resolvedTrackKey] ?? TRACK_ROADMAPS.foundation_start;
  const projectSubmittedCount = projects.filter((project) =>
    project.inputMode === "repo" ? project.repoUrl.trim().length > 0 : Boolean(project.sourceFile),
  ).length;
  const firstActionableIndex = effectiveTrack.modules.findIndex((module) => module.status !== "skip");
  const creditedModuleCount = effectiveTrack.modules.filter((module) => module.status === "skip").length;
  const resumeScore = assessmentSnapshot?.resumeScore ?? null;
  const hasResumeSubmission = Boolean(resumeSubmissionId) || resumeScore != null;
  const signalPills: string[] = [
    projectSubmittedCount === 0
      ? "No projects submitted"
      : assessmentSnapshot && assessmentSnapshot.projectPassCount > 0
        ? `${assessmentSnapshot.projectPassCount} project${assessmentSnapshot.projectPassCount === 1 ? "" : "s"} passed review`
        : `${projectSubmittedCount} project${projectSubmittedCount === 1 ? "" : "s"} submitted`,
    assessmentSnapshot?.canSkipCodingSkills ? "Coding signal detected" : "Coding signal still developing",
    hasResumeSubmission
      ? resumeScore != null && resumeScore >= 80
        ? "Resume signal strong"
        : "Resume submitted"
      : "No resume submitted",
  ];

  const roadmapNodes = effectiveTrack.modules.map((module, index) => ({
    id: module.id,
    name: module.name,
    detail: module.description,
    moduleStatus: module.status,
    time: module.time,
    badge: module.badge,
    isStartHere: firstActionableIndex >= 0 && index === firstActionableIndex,
  }));
  const effectiveTimelinePlan = timelinePlan;
  const timelineGuidance = effectiveTimelinePlan ? getTimelineGuidance(effectiveTimelinePlan) : null;
  const moduleStatusStyle: Record<ModuleStatus, { card: string; chip: string; node: string; line: string; label: string }> = {
    skip: {
      card: "border-emerald-200 bg-emerald-50/50",
      chip: "border-emerald-200 bg-emerald-100 text-emerald-700",
      node: "border-emerald-300 bg-emerald-100",
      line: "bg-emerald-200",
      label: "Credited ✓",
    },
    partial: {
      card: "border-amber-200 bg-amber-50/60",
      chip: "border-amber-200 bg-amber-100 text-amber-700",
      node: "border-amber-300 bg-amber-100",
      line: "bg-amber-200",
      label: "In progress",
    },
    todo: {
      card: "border-slate-200 bg-white",
      chip: "border-slate-200 bg-slate-100 text-slate-600",
      node: "border-slate-300 bg-white",
      line: "bg-slate-200",
      label: "To do",
    },
  };

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
            {isProjectStep ? "Project Showcase" : isResumeStep ? "Technical Assessment" : "Your Personalized Plan"}
          </h2>
          <p className="text-sm text-slate-500 md:text-base">
            {isProjectStep ? "Reviewing your proof" : isResumeStep ? "Resume verification" : "Your recommended next path"}
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
            <section className="mx-auto max-w-5xl bg-white px-8 py-8 md:px-10 md:py-10">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-20 bg-indigo-500" />
                <p className="text-sm font-semibold text-indigo-600">Step 3 of 3 · Your track</p>
              </div>

              <div className="mb-6 border-b border-slate-200 pb-6">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-6 py-6 md:px-7">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-indigo-200 bg-white text-lg">
                      {effectiveTrack.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Your track</p>
                      <h3 className="text-[40px] font-bold leading-tight text-slate-900">{effectiveTrack.title}</h3>
                      <p className="mt-1 text-[24px] font-semibold leading-tight text-slate-800">{effectiveTrack.tagline}</p>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-slate-700">{effectiveTrack.summary}</p>

                  <div className="mt-5 border-t border-indigo-200 pt-4">
                    <p className="text-xs font-semibold tracking-[0.06em] text-indigo-700">Based on your submissions</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {signalPills.map((signal) => (
                        <span
                          key={signal}
                          className="inline-flex items-center rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-sm text-slate-700"
                        >
                          <span className="mr-1 text-indigo-600">✓</span>
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex items-start justify-between gap-4 px-1">
                <div>
                  <h4 className="text-2xl font-bold text-slate-900">Your roadmap</h4>
                  <p className="mt-1 text-sm text-slate-600">The modules that matter, in the order that works.</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                  <p className="text-[11px] text-slate-500">Estimated time</p>
                  <p className="text-lg font-semibold text-slate-900">{effectiveTrack.totalTime}</p>
                </div>
              </div>

              {creditedModuleCount > 0 ? (
                <div className="mx-1 mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <span className="font-semibold">{creditedModuleCount} module{creditedModuleCount === 1 ? "" : "s"} credited</span>{" "}
                  based on your submissions - already counted toward your readiness score. Nothing to do here.
                </div>
              ) : null}

              <div className="space-y-0 px-1">
                {roadmapNodes.map((node, index) => {
                  const styles = moduleStatusStyle[node.moduleStatus];
                  const statusLabel = node.moduleStatus === "todo" ? node.time : styles.label;
                  return (
                    <div key={`${node.id}-${index}`} className="grid grid-cols-[40px_1fr] gap-4">
                      <div className="relative flex flex-col items-center pt-1">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${styles.node}`}>
                          {node.moduleStatus === "skip" ? (
                            <span className="text-emerald-700">✓</span>
                          ) : node.moduleStatus === "partial" ? (
                            <span className="text-amber-700">○</span>
                          ) : (
                            <span className="text-slate-500">{index + 1}</span>
                          )}
                        </div>
                        {index < roadmapNodes.length ? <div className={`mt-2 h-[26px] w-px ${styles.line}`} /> : null}
                      </div>

                      <div className={`mb-3 rounded-lg border px-5 py-4 ${styles.card}`}>
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-slate-900">{node.name}</p>
                          <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-semibold ${styles.chip}`}>
                            {statusLabel}
                          </span>
                          {node.isStartHere && node.moduleStatus !== "skip" ? (
                            <span className="rounded-sm border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                              Start here
                            </span>
                          ) : null}
                          {node.badge ? <span className="rounded-sm border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">{node.badge}</span> : null}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">{node.detail}</p>
                        {node.moduleStatus === "skip" ? (
                          <p className="mt-1.5 text-sm font-medium text-emerald-700">
                            Already counted toward your readiness score - nothing to do here.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                <div className="grid grid-cols-[40px_1fr] gap-4">
                  <div className="relative flex flex-col items-center pt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300 bg-emerald-500 text-sm text-white">
                      ✓
                    </div>
                  </div>
                  <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-lg font-semibold text-emerald-900">Internship ready · start applying</p>
                      <span className="rounded-sm border border-emerald-200 bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Target ready: {effectiveTimelinePlan ? formatMonthYearLabel(effectiveTimelinePlan.estimated_ready_date) : "TBD"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-emerald-800">
                      62% readiness reached - now you&apos;re ready to compete for internships.
                    </p>
                  </div>
                </div>
              </div>

              {effectiveTimelinePlan ? (
                <div className="mx-1 mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-3">
                    <p className="text-sm font-semibold text-slate-900">Your internship readiness timeline</p>
                  </div>
                  <div className="grid md:grid-cols-2">
                    <div className="border-b border-slate-200 px-5 py-4 md:border-b-0 md:border-r">
                      <p className="text-xs font-medium text-slate-500">You&apos;ll be ready by</p>
                      <p className="mt-1.5 text-3xl font-bold leading-none tracking-tight text-slate-900">
                        {formatMonthYearLabel(effectiveTimelinePlan.estimated_ready_date)}
                      </p>
                      <p className="mt-1.5 text-sm text-slate-500">Based on this track&apos;s pace</p>
                    </div>
                    <div className="bg-emerald-50/70 px-5 py-4">
                      <p className="text-xs font-medium text-slate-500">
                        {effectiveTimelinePlan.recommended_season === "peak" ? "Hiring window you should target" : "Suggested month to start applying"}
                      </p>
                      <p className="mt-1.5 text-3xl font-bold leading-none tracking-tight text-emerald-700">
                        {effectiveTimelinePlan.recommended_season === "peak"
                          ? formatPeakWindowLabel(
                            effectiveTimelinePlan.peak_reference_is_current_cycle
                              ? effectiveTimelinePlan.peak_cycle_open
                              : effectiveTimelinePlan.next_peak_open,
                          )
                          : formatMonthYearLabel(effectiveTimelinePlan.recommended_start_date)}
                      </p>
                      <p className="mt-1.5 text-sm text-emerald-700">
                        {effectiveTimelinePlan.recommended_season === "peak"
                          ? effectiveTimelinePlan.recommendation_key === "apply_in_peak"
                            ? `You'll be ready in ${formatMonthYearLabel(effectiveTimelinePlan.estimated_ready_date)}, inside this window`
                            : `You'll be ready in ${formatMonthYearLabel(effectiveTimelinePlan.estimated_ready_date)}, before this window opens`
                          : seasonLabel(effectiveTimelinePlan.recommended_season)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`border-t px-5 py-4 ${
                      effectiveTimelinePlan.ready_after_graduation || effectiveTimelinePlan.graduates_before_next_peak
                        ? "bg-amber-50"
                        : "bg-white"
                    }`}
                  >
                    <p className="text-xl leading-none text-emerald-600">✓</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                      {timelineGuidance ? timelineGuidance.title : effectiveTimelinePlan.recommendation_title}
                    </p>
                    <p className="mt-1 text-base leading-relaxed text-slate-700">
                      {timelineGuidance ? timelineGuidance.summary : effectiveTimelinePlan.recommendation_summary}
                    </p>
                    <p className="mt-1.5 text-sm text-slate-500">
                      {effectiveTimelinePlan.graduation_date
                        ? `Graduating ${formatMonthYearLabel(effectiveTimelinePlan.graduation_date)}`
                        : "Graduation date not set"}
                    </p>
                  </div>
                </div>
              ) : null}
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
