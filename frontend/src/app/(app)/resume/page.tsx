"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  RefreshCw,
  Upload,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type ResumeScore = {
  overall: number;
  bullet_quality_impact: number;
  technical_demonstration: number;
  writing_communication: number;
  formatting_ats: number;
};

type ResumeScoreResponse = {
  submission_id: number;
  overall_score: number;
  rubric_scores?: {
    bullet_quality_impact: number;
    technical_demonstration: number;
    writing_communication: number;
    formatting_ats: number;
  };
  dimension_scores: {
    formatting: number;
    content: number;
    ats: number;
    impact: number;
  };
  strengths?: string[];
  improvements?: string[];
  metadata: {
    page_count: number | null;
    provider: string;
    model: string;
    prompt_version: string;
  };
  progression: {
    resume_task_completed: boolean;
    category_resume: number;
    pass_threshold: number;
  };
};

type ResumeSubmissionHistoryItem = {
  id: number;
  status: "succeeded" | "failed";
  overall_score: number | null;
  dimension_scores: {
    formatting: number;
    content: number;
    ats: number;
    impact: number;
  } | null;
  metadata: {
    provider: string | null;
    model: string | null;
    prompt_version: string | null;
  };
  error_code: string | null;
  error_message: string | null;
  created_at: string | null;
};

type ResumeSubmissionsResponse = {
  submissions: ResumeSubmissionHistoryItem[];
};

type FeedbackItem = {
  category: string;
  type: "success" | "warning" | "error";
  message: string;
};

type ExampleTab = "first" | "after";
type ExpandKey = "atsHow" | "stuck" | "plateau" | "tailoring" | "badExample";

const guideSteps = [
  "ATS + Template",
  "The Philosophy",
  "Writing Content",
  "Real Examples"
] as const;

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-emerald-50 border-emerald-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
}

function getFeedbackTone(type: FeedbackItem["type"]) {
  if (type === "success") {
    return {
      shell: "bg-emerald-50 border-emerald-200",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    };
  }

  if (type === "warning") {
    return {
      shell: "bg-amber-50 border-amber-200",
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />
    };
  }

  return {
    shell: "bg-rose-50 border-rose-200",
    icon: <XCircle className="h-4 w-4 text-rose-600" />
  };
}

function buildFeedback(response: ResumeScoreResponse): FeedbackItem[] {
  const strengths = (response.strengths ?? []).slice(0, 2).map((message) => ({
    category: "Strength",
    type: "success" as const,
    message
  }));

  const improvements = (response.improvements ?? []).slice(0, 3).map((message, index) => ({
    category: "Improvement",
    type: index < 2 ? ("warning" as const) : ("error" as const),
    message
  }));

  return [...strengths, ...improvements];
}

function getDateLabel(isoDate: string | null): string {
  if (!isoDate) return "Unknown time";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "Unknown time";
  return parsed.toLocaleString();
}

function getHistoryBadge(item: ResumeSubmissionHistoryItem) {
  if (item.status === "failed") {
    return {
      label: "Failed",
      shell: "border-rose-200 bg-rose-50 text-rose-600"
    };
  }

  if ((item.overall_score ?? 0) >= 80) {
    return {
      label: "Passed",
      shell: "border-emerald-200 bg-emerald-50 text-emerald-600"
    };
  }

  return {
    label: "Scored",
    shell: "border-amber-200 bg-amber-50 text-amber-700"
  };
}

export default function ResumePage() {
  const hasLoadedHistory = useRef(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [progression, setProgression] = useState<ResumeScoreResponse["progression"] | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<ResumeSubmissionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [learningGuideOpen, setLearningGuideOpen] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState(0);
  const [visitedGuideSteps, setVisitedGuideSteps] = useState<boolean[]>([false, false, false, false]);
  const [expandedSections, setExpandedSections] = useState<Record<ExpandKey, boolean>>({
    atsHow: false,
    stuck: false,
    plateau: false,
    tailoring: false,
    badExample: false
  });
  const [exampleTab, setExampleTab] = useState<ExampleTab>("first");

  const loadSubmissionHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await apiRequest<ResumeSubmissionsResponse>("/resume/submissions");
      setSubmissionHistory(response.submissions ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load resume scoring history.";
      setHistoryError(message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedHistory.current) return;
    hasLoadedHistory.current = true;
    void loadSubmissionHistory();
  }, [loadSubmissionHistory]);

  const markStepVisited = useCallback((index: number) => {
    setVisitedGuideSteps((prev) => prev.map((visited, i) => (i === index ? true : visited)));
  }, []);

  const toggleLearningGuide = useCallback(() => {
    setLearningGuideOpen((prev) => {
      const next = !prev;
      if (next) {
        markStepVisited(activeGuideStep);
      }
      return next;
    });
  }, [activeGuideStep, markStepVisited]);

  const goToGuideStep = useCallback((index: number) => {
    setActiveGuideStep(index);
    markStepVisited(index);
  }, [markStepVisited]);

  const navigateGuide = useCallback((direction: -1 | 1) => {
    const nextIndex = activeGuideStep + direction;
    if (nextIndex < 0 || nextIndex >= guideSteps.length) return;
    goToGuideStep(nextIndex);
  }, [activeGuideStep, goToGuideStep]);

  const toggleExpand = useCallback((key: ExpandKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const scoreResume = async (file: File) => {
    setUploadedFile(file);
    setUploadError(null);
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setScore(null);
    setFeedback([]);
    setProgression(null);
    setSubmissionId(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiRequest<ResumeScoreResponse>("/resume/score", {
        method: "POST",
        body: formData
      });

      const rubric = {
        bullet_quality_impact: response.rubric_scores?.bullet_quality_impact ?? Math.round((response.dimension_scores.impact / 100) * 35),
        technical_demonstration: response.rubric_scores?.technical_demonstration ?? Math.round((response.dimension_scores.content / 100) * 30),
        writing_communication: response.rubric_scores?.writing_communication ?? Math.round((response.dimension_scores.content / 100) * 15),
        formatting_ats: response.rubric_scores?.formatting_ats ?? Math.round((response.dimension_scores.formatting / 100) * 20)
      };

      setScore({
        overall: response.overall_score,
        bullet_quality_impact: Math.round((rubric.bullet_quality_impact / 35) * 100),
        technical_demonstration: Math.round((rubric.technical_demonstration / 30) * 100),
        writing_communication: Math.round((rubric.writing_communication / 15) * 100),
        formatting_ats: Math.round((rubric.formatting_ats / 20) * 100)
      });
      setFeedback(buildFeedback(response));
      setSubmissionId(response.submission_id);
      setProgression(response.progression);
      setAnalysisComplete(true);
      await loadSubmissionHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze resume.";
      setUploadError(message);
      setAnalysisComplete(false);
      setFeedback([]);
      setScore(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdfType = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfType) {
      setUploadError("Please upload a PDF file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File is too large. Max size is 5MB.");
      return;
    }

    void scoreResume(file);
    event.target.value = "";
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setUploadError(null);
    setAnalysisComplete(false);
    setScore(null);
    setFeedback([]);
    setProgression(null);
    setSubmissionId(null);
  };

  const latestSucceededScore = submissionHistory.find((item) => item.status === "succeeded" && item.overall_score != null)?.overall_score ?? 0;
  const progressScore = analysisComplete && score ? score.overall : latestSucceededScore;
  const progressPercent = Math.max(0, Math.min(100, Math.round((progressScore / 80) * 100)));
  const passThreshold = progression?.pass_threshold ?? 80;
  const progressBadge =
    progressScore >= passThreshold
      ? "Passed"
      : progressScore > 0
        ? "In progress"
        : "Upload to start";

  const renderGuideFooter = () => (
    <div className="flex items-center justify-between border-x border-b border-slate-200 bg-slate-50 px-5 py-3 text-[12px] text-slate-400 md:px-6">
      <span>{`Step ${activeGuideStep + 1} of ${guideSteps.length}`}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigateGuide(-1)}
          disabled={activeGuideStep === 0}
          className="inline-flex items-center gap-1 rounded-[7px] border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        {activeGuideStep === guideSteps.length - 1 ? (
          <button
            type="button"
            disabled
            className="rounded-[7px] border border-emerald-200 bg-emerald-50 px-4 py-2 text-[12px] font-semibold text-emerald-600"
          >
            Done ✓
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigateGuide(1)}
            className="rounded-[7px] border border-indigo-600 bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[920px] space-y-5 pb-10">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-600">
            Module 04
          </span>
          <span className="text-[11px] font-medium text-slate-500">Present Your Work</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-slate-950">How to Craft a Good Tech Resume</h1>
        <p className="mt-1 max-w-[780px] text-[13px] leading-6 text-slate-500">
          So now you have the skills and at least 2 cool projects built, let&apos;s build a resume that will catch the attention of recruiters.
        </p>
      </div>

      <div className="rounded-[9px] border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-[13px] font-semibold text-amber-800">Before 100-300 Applications</p>
        <p className="mt-1 text-[12px] leading-5 text-amber-800">
          Sending 100-300 applications with a weak resume is usually wasted effort. Fix the resume first, then apply hard.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-[9px] border border-slate-200 bg-white px-4 py-3">
        <span className="whitespace-nowrap text-[12px] font-medium text-slate-500">Resume Score</span>
        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="whitespace-nowrap text-[13px] font-bold text-indigo-600">{`${progressScore} / ${passThreshold} to pass`}</span>
        <span className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          {progressBadge}
        </span>
      </div>

      <section className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-slate-950">Score Your Resume</h2>
            <p className="mt-1 text-[12px] text-slate-500">Get instant feedback on what&apos;s working and what needs improvement.</p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
            Pass threshold: {passThreshold}
          </span>
        </div>

        <div className="grid border-b border-slate-200 md:grid-cols-[1fr_1.1fr]">
          <div className="border-b border-slate-200 px-5 py-5 md:border-b-0 md:border-r">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Upload Resume</p>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="resume-upload"
              className="block cursor-pointer rounded-[9px] border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <Upload className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-3 text-[13px] font-semibold text-slate-800">{uploadedFile ? uploadedFile.name : "Upload Your Resume"}</p>
              <p className="mt-1 text-[12px] text-slate-400">PDF format - Max 5MB</p>
              <span className="mt-4 inline-flex rounded-[7px] bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white">
                Choose file
              </span>
            </label>
            {uploadError ? <p className="mt-3 text-[12px] text-rose-600">{uploadError}</p> : null}
            {isAnalyzing ? (
              <div className="mt-4 rounded-[9px] border border-indigo-200 bg-indigo-50 px-4 py-3 text-[12px] text-indigo-700">
                <p className="font-semibold">Analyzing your resume...</p>
                <p className="mt-1">Scoring bullet impact, technical depth, communication, and formatting/ATS.</p>
              </div>
            ) : null}
          </div>

          <div className="px-5 py-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Recent Scoring Attempts</p>
            {historyLoading ? (
              <div className="rounded-[9px] border border-slate-200 px-4 py-5 text-center text-[12px] text-slate-400">
                Loading attempts...
              </div>
            ) : historyError ? (
              <div className="rounded-[9px] border border-rose-200 bg-rose-50 px-4 py-4 text-[12px] text-rose-600">{historyError}</div>
            ) : submissionHistory.length === 0 ? (
              <div className="rounded-[9px] border border-slate-200 px-4 py-5 text-center text-[12px] text-slate-400">
                No attempts yet.
              </div>
            ) : (
              <div className="max-h-[292px] space-y-3 overflow-y-auto pr-1">
                {submissionHistory.map((item) => {
                  const badge = getHistoryBadge(item);
                  return (
                    <div key={item.id} className="rounded-[9px] border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-800">{`Submission #${item.id}`}</p>
                          <p className="mt-1 text-[12px] text-slate-500">{getDateLabel(item.created_at)}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.shell}`}>
                          {badge.label}
                        </span>
                      </div>
                      {item.overall_score != null ? (
                        <p className={`mt-3 text-[12px] font-semibold ${getScoreColor(item.overall_score)}`}>
                          Overall score: {item.overall_score}
                        </p>
                      ) : null}
                      {item.error_message ? (
                        <div className="mt-3 rounded-[7px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                          {item.error_message}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {analysisComplete && score ? (
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Latest Analysis</p>
                <p className="mt-1 text-[14px] font-bold text-slate-950">Resume analysis complete</p>
                {submissionId ? <p className="mt-1 text-[12px] text-slate-500">{`Submission #${submissionId}`}</p> : null}
              </div>
              <div className={`rounded-[9px] border px-4 py-3 text-center ${getScoreBg(score.overall)}`}>
                <div className={`text-[28px] font-bold leading-none ${getScoreColor(score.overall)}`}>{score.overall}</div>
                <div className="mt-1 text-[11px] font-medium text-slate-500">Overall</div>
              </div>
            </div>

            {progression ? (
              <div className={`mb-4 rounded-[9px] border px-4 py-3 ${progression.resume_task_completed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                <p className={`text-[12px] font-semibold ${progression.resume_task_completed ? "text-emerald-700" : "text-amber-700"}`}>
                  {progression.resume_task_completed
                    ? "Resume progression task completed."
                    : `Reach ${progression.pass_threshold} to complete the resume progression task.`}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">{`Resume category readiness: ${progression.category_resume}%`}</p>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-4">
              {[
                { label: "Bullet quality", value: score.bullet_quality_impact },
                { label: "Technical depth", value: score.technical_demonstration },
                { label: "Writing", value: score.writing_communication },
                { label: "Formatting + ATS", value: score.formatting_ats }
              ].map((item) => (
                <div key={item.label} className="rounded-[9px] border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                  <p className={`mt-2 text-[20px] font-bold ${getScoreColor(item.value)}`}>{item.value}%</p>
                </div>
              ))}
            </div>

            {feedback.length > 0 ? (
              <div className="mt-4 space-y-2">
                {feedback.map((item, idx) => {
                  const tone = getFeedbackTone(item.type);
                  return (
                    <div key={`${item.category}-${idx}`} className={`flex items-start gap-2 rounded-[9px] border px-3 py-3 ${tone.shell}`}>
                      {tone.icon}
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">{item.category}</p>
                        <p className="mt-1 text-[12px] leading-5 text-slate-600">{item.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <button
              type="button"
              onClick={resetAnalysis}
              className="mt-4 inline-flex items-center gap-2 rounded-[7px] bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Upload New Resume
            </button>
          </div>
        ) : null}

        <div className="bg-indigo-50 px-5 py-3 text-[11px] leading-5 text-indigo-700">
          This scorer relies on LLM guidance, not a perfect or final recruiter decision. Use it as a strong baseline, not absolute truth. Scores may vary between attempts.{" "}
          <strong>Target at least 80%. If you already have internship experience, target 85%+.</strong>
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={toggleLearningGuide}
          className={`flex w-full items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 text-left transition hover:bg-slate-50 ${learningGuideOpen ? "rounded-t-[13px]" : "rounded-[13px]"}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-950">Learning Guide</p>
              <p className="mt-0.5 text-[12px] text-slate-400">ATS + template, philosophy, writing content, real examples - 4 reads</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-[5px]">
              {guideSteps.map((_, index) => {
                const isCurrent = learningGuideOpen && index === activeGuideStep;
                const isVisited = visitedGuideSteps[index] && index !== activeGuideStep;
                return (
                  <span
                    key={index}
                    className={`h-[5px] w-[22px] rounded-full ${isCurrent ? "bg-indigo-600" : isVisited ? "bg-emerald-500" : "bg-slate-200"}`}
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
              {guideSteps.map((step, index) => {
                const isActive = index === activeGuideStep;
                const isVisited = visitedGuideSteps[index] && !isActive;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => goToGuideStep(index)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-[13px] font-medium ${isActive ? "border-indigo-600 bg-white text-indigo-600" : isVisited ? "border-transparent text-emerald-600" : "border-transparent text-slate-400"}`}
                  >
                    <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-bold ${isActive ? "bg-indigo-600 text-white" : isVisited ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {isVisited ? "✓" : index + 1}
                    </span>
                    {step}
                  </button>
                );
              })}
            </div>

            <div className="border-x border-slate-200 bg-white">
              {activeGuideStep === 0 ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Formatting First</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">Pass ATS + Use the Right Template</h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">Before any human sees your resume, it goes through a robot first.</p>

                  <button
                    type="button"
                    onClick={() => toggleExpand("atsHow")}
                    className={`mt-6 flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${expandedSections.atsHow ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[14px]">🤖</span>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">How does ATS screening actually work?</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">Skip if you already know what ATS is</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedSections.atsHow ? "rotate-180 text-indigo-600" : ""}`} />
                  </button>

                  {expandedSections.atsHow ? (
                    <div className="rounded-b-[9px] border border-t-0 border-indigo-300 bg-indigo-50 px-4 py-4 text-[13px] leading-7 text-indigo-700">
                      <p>
                        When you apply to jobs, especially at larger companies, your resume does not go straight to a recruiter.{" "}
                        <strong>It first goes through an ATS (Applicant Tracking System)</strong> - software that scans and filters resumes automatically.
                        The ATS scans for keywords from the job description, proper formatting it can parse, and standard section headers like
                        &quot;Experience&quot;, &quot;Education&quot;, and &quot;Skills&quot;.
                      </p>
                      <p className="mt-3 text-[12px] italic">Think of it: Robot reads resume first -&gt; if it passes, then a human recruiter sees it.</p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex gap-3 rounded-[9px] border border-rose-200 bg-rose-50 px-4 py-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                    <div>
                      <p className="text-[13px] font-bold text-rose-600">If your resume is not formatted correctly, it gets rejected automatically</p>
                      <p className="mt-2 text-[12px] leading-6 text-rose-600">
                        The robot cannot read fancy graphics, tables, or complex layouts - so it just rejects you. No human ever sees your resume.
                        You never get a chance. This is why format matters so much. Your resume needs to pass the robot and impress a human.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[9px] border border-indigo-200 bg-indigo-50 px-4 py-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-indigo-700">Jake&apos;s Overleaf Resume Template</h3>
                      <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">Use this</span>
                    </div>
                    <p className="text-[12px] leading-6 text-indigo-700">
                      Seriously, just use this template. Don&apos;t waste time trying to make your resume &quot;unique&quot; with fancy designs.{" "}
                      <strong>Jake&apos;s template is proven to work at FAANG companies and used by thousands of students.</strong>
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {[
                        ["ATS Can Parse It Perfectly", "Single-column, clean formatting that robots can parse without issues."],
                        ["Fits Everything on One Page", "Optimized spacing so you can fit experiences without looking cramped."],
                        ["Clean and Professional Look", "Recruiters recognize and trust this layout."],
                        ["Proven to Work at FAANG", "Students using this template have landed top internship interviews."]
                      ].map(([title, body]) => (
                        <div key={title} className="rounded-[9px] border border-indigo-200 bg-white px-3 py-3">
                          <p className="text-[12px] font-semibold text-indigo-700">{title}</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">{body}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <a
                        href="https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[7px] bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white"
                      >
                        Open Jake&apos;s Template
                      </a>
                      <span className="rounded-[7px] border border-indigo-200 bg-white px-3 py-2 text-[11px] text-indigo-600">
                        Pro tip: open template → click Copy → start filling sections.
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-[12px] font-semibold text-slate-700">ATS checklist (quick version)</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {[
                        "Use one-column layout",
                        "Keep standard headers",
                        "Avoid images/tables/text boxes",
                        "Match keywords honestly",
                        "Export PDF unless the application asks for \".docx\""
                      ].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-[9px] border border-slate-200 bg-white px-4 py-3 text-[12px] text-slate-600 ${index === 4 ? "md:col-span-2" : ""}`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeGuideStep === 1 ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Mindset</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">The Resume Philosophy</h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">What you need to understand about resumes</p>

                  <div className="mt-6 border-l-[3px] border-violet-500 bg-violet-50 px-4 py-4">
                    <p className="text-[13px] font-bold text-slate-900">The Truth About Resumes</p>
                    <p className="mt-4 text-[13px] leading-7 text-slate-600">
                      Remember, your resume is where you can show off everything you have been working hard for. <strong>Don&apos;t be humble.</strong>
                    </p>
                    <p className="mt-4 text-[13px] leading-7 text-slate-600">
                      The best thing you can do is to <strong>embellish your experiences so they look more impressive than what they actually are.</strong>{" "}
                      At the end of the day, it doesn&apos;t matter your skill level - someone is checking a piece of paper (your resume). I&apos;ve seen many friends
                      who were not that good technically getting top tier internships, and when I checked their resume, I was like &quot;wow&quot;.
                    </p>
                  </div>

                  <div className="mt-4 rounded-[9px] bg-indigo-950 px-4 py-4 text-white">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-white/80" />
                      <p className="text-[14px] font-bold">The 7-Second Rule</p>
                    </div>
                    <p className="mt-4 text-[13px] leading-7 text-white/80">
                      <strong className="text-white">A recruiter checks your resume for only 7 seconds on average.</strong> Yes, just 7 seconds. Make sure it looks
                      impressive at first sight - when they glance at it, they should immediately think you&apos;re an exceptional programmer.
                    </p>
                    <div className="mt-4 rounded-[9px] border border-white/15 bg-white/10 px-4 py-4 text-center">
                      <p className="text-[12px] text-white/55">Your resume will only be ready when this happens:</p>
                      <p className="mt-2 text-[16px] font-bold text-amber-300">&quot;Wow, this person is really technical!&quot;</p>
                      <p className="mt-2 text-[12px] leading-6 text-white/65">
                        When you glance at your resume for 5 seconds, that&apos;s what you should think. <strong className="text-white/85">If you don&apos;t get that feeling, it&apos;s not ready yet.</strong>{" "}
                        Keep iterating.
                      </p>
                    </div>
                    <p className="mt-4 text-[12px] leading-6 text-white/50">Check it every week and improve continuously. Every time you iterate, ask: does this look really technical at first glance?</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-[14px] font-bold text-slate-900">Embellishing: The Art of Looking Better</p>
                    <p className="mt-3 text-[13px] leading-6 text-slate-500">
                      This is the most important skill. You need to make your experiences look way more impressive than they are. Here&apos;s how:
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="overflow-hidden rounded-[9px] border border-indigo-200">
                      <div className="flex items-center gap-3 border-b border-indigo-200 bg-indigo-50 px-4 py-3">
                        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">1</span>
                        <p className="text-[13px] font-bold text-slate-900">Project Titles Matter A LOT</p>
                      </div>
                      <div className="px-4 py-4">
                        <p className="text-[13px] leading-6 text-slate-500">Don&apos;t call your project a &quot;WhatsApp Clone&quot; or &quot;Twitter Clone&quot;. That sounds like you just followed a tutorial.</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-[9px] border border-rose-200 bg-rose-50 px-4 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-rose-500">✕ Bad (sounds like tutorial)</p>
                            <div className="mt-3 space-y-2 text-[13px] text-rose-400 line-through">
                              <p>WhatsApp Clone</p>
                              <p>Twitter Clone</p>
                              <p>Todo App</p>
                            </div>
                          </div>
                          <div className="rounded-[9px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-500">✓ Good (sounds professional)</p>
                            <div className="mt-3 space-y-2 text-[13px] text-emerald-700">
                              <p>Real-time Chat Application</p>
                              <p>Social Media Platform with Feed Algorithm</p>
                              <p>Task Management System with Authentication</p>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-[11px] italic text-slate-400">Same project, but one sounds way more professional and technical.</p>
                      </div>
                    </div>

                    <div className="rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">2</span>
                        <p className="text-[13px] font-bold text-slate-900">Add Numbers to Everything</p>
                      </div>
                      <p className="mt-4 text-[13px] leading-6 text-slate-500">Numbers make things sound real and impressive.</p>
                      <div className="mt-4 space-y-2">
                        {[
                          "Built a chat app → Built real-time chat application serving 50+ daily users",
                          "Made it faster → Optimized database queries, reducing load time by 40%",
                          "Built REST API → Designed and implemented 15+ RESTful API endpoints with authentication"
                        ].map((item) => (
                          <div key={item} className="rounded-[9px] border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">3</span>
                        <p className="text-[13px] font-bold text-slate-900">Label Projects as Experiences</p>
                      </div>
                      <p className="mt-4 text-[13px] leading-6 text-slate-500">
                        When you&apos;re starting out and don&apos;t have internships yet, you can call them Experience or Software Development Experience. It sounds more professional and makes your resume look fuller.{" "}
                        <strong>This is what I did on my first resume.</strong>
                      </p>
                    </div>

                    <div className="rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">4</span>
                        <p className="text-[13px] font-bold text-slate-900">Make Technologies Sound Advanced</p>
                      </div>
                      <div className="mt-4 space-y-3 text-[13px] leading-6 text-slate-600">
                        <p>Used React → <strong className="text-slate-800">Built responsive UI with React hooks and Context API for state management</strong></p>
                        <p>Made a database → <strong className="text-slate-800">Designed and implemented PostgreSQL database with normalized schema</strong></p>
                        <p>Deployed the app → <strong className="text-slate-800">Deployed to AWS EC2 with Nginx reverse proxy and SSL encryption</strong></p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[9px] border border-violet-200 bg-violet-50 px-4 py-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-500">The Golden Rule of Embellishing:</p>
                    <p className="mt-3 text-[13px] text-slate-700">You&apos;re not lying about what you did - you&apos;re describing it in the most impressive way possible.</p>
                  </div>

                  <div className="mt-4 rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-[13px] font-bold text-slate-900">Same Work, Better Framing</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[9px] border border-rose-200 bg-rose-50 px-4 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-rose-500">✕ Not embellished</p>
                        <div className="mt-3 space-y-2 text-[13px] text-rose-400 line-through">
                          <p>Built a todo app with React</p>
                          <p>Made authentication for users</p>
                        </div>
                      </div>
                      <div className="rounded-[9px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-500">✓ Embellished (truthful)</p>
                        <div className="mt-3 space-y-2 text-[13px] text-emerald-700">
                          <p>Developed a task management platform with React + Firebase, supporting 120+ weekly active users</p>
                          <p>Implemented JWT-based authentication and role-based access across 6 protected routes</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-400">Same underlying project, better wording, clearer technical depth, and measurable impact.</p>
                  </div>
                </div>
              ) : null}

              {activeGuideStep === 2 ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">The Craft</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">Writing Great Resume Content</h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">How to write bullet points that actually impress people</p>

                  <div className="mt-6 rounded-[9px] border-2 border-violet-200 bg-violet-50 px-4 py-5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-500">The Bullet Point Formula</p>
                    <p className="mt-3 text-[15px] font-bold text-slate-900">Action Verb + What You Did + Result/Impact</p>
                    <p className="mt-1 text-[12px] text-slate-500">(with a number if possible)</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-[9px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-500">✓ Great example</p>
                      <p className="mt-3 text-[13px] font-semibold text-slate-800">Optimized ETL pipeline using Python and SQL, reducing data processing time by 35%</p>
                      <div className="mt-3 rounded-[7px] bg-white/80 px-3 py-2 text-[11px] text-slate-500">Action Verb + Specific Tech + Quantified Result.</div>
                    </div>

                    <div className="rounded-[9px] border border-rose-200 bg-rose-50 px-4 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-rose-500">✕ Weak example</p>
                      <p className="mt-3 text-[13px] font-semibold text-slate-800">Worked on improving the data pipeline</p>
                      <div className="mt-3 rounded-[7px] bg-white/80 px-3 py-2 text-[11px] text-slate-500">Too vague, no tech depth, no measurable impact.</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[13px] font-semibold text-slate-800">Use Strong Action Verbs</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Built", "Developed", "Designed", "Implemented", "Optimized", "Engineered", "Architected", "Deployed"].map((verb) => (
                        <span key={verb} className="rounded-[7px] border border-indigo-200 bg-indigo-50 px-3 py-2 text-[12px] font-semibold text-indigo-600">
                          {verb}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 rounded-[9px] border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-600">
                      <strong>Avoid weak verbs like:</strong> Helped with, Worked on, Responsible for, Assisted with.
                    </div>
                  </div>

                  <div className="mt-4 rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-[13px] font-bold text-slate-900">Resume Structure</p>
                    <p className="mt-3 text-[13px] leading-6 text-slate-500">
                      Before writing bullets, decide section order. For internship resumes, this is a common order:
                    </p>
                    <div className="mt-4 rounded-[9px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="space-y-2 text-[13px] text-slate-600">
                        <p>1. Education</p>
                        <p>2. Experience (you can include project work here as an embellishment strategy)</p>
                        <p>3. Projects</p>
                        <p>4. Skills</p>
                        <p>5. Other Sections</p>
                      </div>
                    </div>
                    <p className="mt-4 text-[12px] leading-6 text-slate-500">
                      Use your own judgment. Education was my weakest section when I was beginning, I placed it at the bottom and moved stronger sections up.
                    </p>
                    <p className="mt-2 text-[12px] italic text-slate-400">You&apos;ll see concrete structure examples in the Real Examples tab.</p>
                  </div>

                  <div className="mt-6 space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand("stuck")}
                      className={`flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${expandedSections.stuck ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[14px]">🤔</span>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-800">Stuck on your bullets?</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">How to find metrics + what content to add or avoid</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedSections.stuck ? "rotate-180 text-indigo-600" : ""}`} />
                    </button>

                    {expandedSections.stuck ? (
                      <div className="rounded-b-[9px] border border-t-0 border-indigo-300 bg-indigo-50 px-4 py-4">
                        <p className="text-[12px] font-bold text-indigo-700">How to Find Numbers/Metrics</p>
                        <div className="mt-3 space-y-2">
                          {[
                            ["Performance Improvements:", "Reduced load time by 2 seconds or improved response time by 40%"],
                            ["Scale/Usage:", "Serving 100+ daily users or processing 10K+ requests/day"],
                            ["Features/Components:", "Implemented 15+ API endpoints or built 8 reusable components"]
                          ].map(([label, body]) => (
                            <div key={label} className="flex gap-4 rounded-[9px] border border-slate-200 bg-white px-4 py-3 text-[12px]">
                              <span className="min-w-[145px] font-semibold text-indigo-700">{label}</span>
                              <span className="text-slate-500">{body}</span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-[12px] text-indigo-700">
                          If you can&apos;t find numbers for every bullet, that&apos;s totally fine. Try your best to quantify where it honestly makes sense.
                        </p>

                        <div className="my-4 h-px bg-indigo-200" />

                        <p className="text-[12px] font-bold text-indigo-700">How to Add More Relevant Content (Without Forcing It)</p>
                        <div className="mt-3 rounded-[9px] border border-amber-200 bg-amber-50 px-4 py-4 text-[12px] leading-6 text-amber-800">
                          <p className="font-bold">⚠ What NOT to do:</p>
                          <p className="mt-3"><strong>&quot;About Me&quot; sections:</strong> Recruiters skip these entirely. They want to see what you&apos;ve done.</p>
                          <p className="mt-2"><strong>Jobs unrelated to tech:</strong> Being a cashier at Target doesn&apos;t help your tech resume. Use that space for technical work.</p>
                          <p className="mt-2"><strong>Irrelevant skills:</strong> Microsoft Office and Google Docs are expected. Don&apos;t waste space on them.</p>
                        </div>
                        <div className="mt-3 rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                          <p className="text-[12px] font-semibold text-slate-700">Besides your main projects, look for work you can legitimately add:</p>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {[
                              "Small Python programs you already built",
                              "Class projects you built",
                              "Other experiences you find relevant",
                              "Any additional technical work you already did"
                            ].map((item) => (
                              <div key={item} className="text-[12px] text-emerald-600">
                                ✓ {item}
                              </div>
                            ))}
                          </div>
                          <p className="mt-3 text-[11px] leading-5 text-slate-400">
                            Also check whether current bullets can be split into stronger bullets with clearer impact. As a last resort, slightly increasing font size is okay.
                          </p>
                        </div>
                        <p className="mt-3 text-[12px] italic text-indigo-700">Learn this now, apply later. You do not need this to start.</p>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => toggleExpand("plateau")}
                      className={`flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${expandedSections.plateau ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[14px]">📈</span>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-800">Plateaued at 2 projects? How to level up from there</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">Future strategy - not something you need to do right now</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedSections.plateau ? "rotate-180 text-indigo-600" : ""}`} />
                    </button>

                    {expandedSections.plateau ? (
                      <div className="rounded-b-[9px] border border-t-0 border-indigo-300 bg-indigo-50 px-4 py-4">
                        <p className="text-[13px] leading-6 text-indigo-700">
                          <strong>This is a future strategy, not something you need to do right now.</strong> If you already have two solid projects and later feel stuck, this is where you add higher-signal experiences.
                        </p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {[
                            ["🏆", "Hackathons", "Fast team experience, strong project stories, and great names for your resume. I used HackHarvard and HackPrinceton stories constantly in interviews."],
                            ["🎓", "Fellowships and Programs", "Programs from companies like Wells Fargo, Goldman Sachs, and Google can add big brand signal before your first internship."],
                            ["📚", "Research and Teaching Assistant", "Shows depth, communication, and consistency. Strong option while you build toward internship experience."],
                            ["⌨️", "Build Better Projects", "Move from tutorial projects to real-user projects with modern stack and measurable outcomes."]
                          ].map(([emoji, title, body]) => (
                            <div key={title} className="rounded-[9px] border border-slate-200 bg-white px-4 py-4">
                              <p className="text-[12px] font-semibold text-slate-800">{`${emoji} ${title}`}</p>
                              <p className="mt-2 text-[12px] leading-6 text-slate-500">{body}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-[12px] font-semibold text-indigo-700">Pro tip: You don&apos;t need all of these. Pick 1-2 and do them really well.</p>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => toggleExpand("tailoring")}
                      className={`flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${expandedSections.tailoring ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[14px]">🎯</span>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-800">Resume Tailoring (Advanced Strategy)</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">Learn this now, apply it later when it matters</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedSections.tailoring ? "rotate-180 text-indigo-600" : ""}`} />
                    </button>

                    {expandedSections.tailoring ? (
                      <div className="rounded-b-[9px] border border-t-0 border-indigo-300 bg-indigo-50 px-4 py-4 text-[13px] leading-7 text-indigo-700">
                        <p>
                          Tailoring your resume for certain job posts can be <strong>very beneficial</strong> in some cases. For example, if a role emphasizes SQL and Python, include more of that SQL/Python work in your resume and reflect what the job description is asking for.
                        </p>
                        <p className="mt-4">
                          But don&apos;t get too fixated on manual tailoring for every application. It takes a lot of effort and often gives only a small lift. Use it when you really care about a role or when the match is obvious.
                        </p>
                        <p className="mt-4 text-[12px] italic">In the Applications module, I&apos;ll show a paid tool that can tailor resumes automatically.</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeGuideStep === 3 ? (
                <div className="border-b border-slate-200 px-7 py-8">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Proof It Works</p>
                  <h2 className="text-[19px] font-bold tracking-[-0.02em] text-slate-950">My Resume Journey</h2>
                  <p className="mt-1 text-[13px] leading-6 text-slate-500">Real examples from my first resume to FAANG interviews</p>

                  <button
                    type="button"
                    onClick={() => toggleExpand("badExample")}
                    className={`mt-6 flex w-full items-center justify-between rounded-[9px] border px-4 py-3 text-left transition ${expandedSections.badExample ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[14px]">🚫</span>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">See a really bad resume example first</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">What not to do - review this before looking at the good ones</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedSections.badExample ? "rotate-180 text-indigo-600" : ""}`} />
                  </button>

                  {expandedSections.badExample ? (
                    <div className="rounded-b-[9px] border border-t-0 border-indigo-300 bg-indigo-50 px-4 py-4">
                      <div className="rounded-[9px] border border-rose-200 bg-rose-50 px-4 py-4">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">What not to do</span>
                          <p className="text-[14px] font-bold text-rose-600">Really Bad Resume Example</p>
                        </div>
                        <p className="text-[12px] leading-6 text-rose-600">Start by reviewing this bad example, then compare it with the improved resumes below.</p>
                        <div className="mt-3 space-y-2 text-[12px] text-rose-600">
                          <p>✕ Useless &quot;About Me&quot; section.</p>
                          <p>✕ Useless soft-skills-heavy content that recruiters usually don&apos;t care about.</p>
                          <p>✕ These sections take space away from skills and projects and weaken your technical signal.</p>
                        </div>
                        <a
                          href="/resume-examples/bad_resume_example.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex rounded-[7px] bg-rose-600 px-4 py-2 text-[12px] font-semibold text-white"
                        >
                          Open Bad Resume (PDF)
                        </a>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 border-b border-slate-200">
                    <div className="flex overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setExampleTab("first")}
                        className={`px-4 py-3 text-[12px] font-medium ${exampleTab === "first" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-400"}`}
                      >
                        My first resume
                      </button>
                      <button
                        type="button"
                        onClick={() => setExampleTab("after")}
                        className={`px-4 py-3 text-[12px] font-medium ${exampleTab === "after" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-400"}`}
                      >
                        After my first internship
                      </button>
                    </div>
                  </div>

                  {exampleTab === "first" ? (
                    <div className="mt-4">
                      <p className="text-[13px] font-semibold text-slate-900">Got me Fidelity offer + P&amp;G interviews</p>
                      <a
                        href="/resume-examples/my_old_resume.png"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block overflow-hidden rounded-[9px] border border-slate-200 bg-white"
                      >
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-400">Click to open full size</div>
                        <div className="p-4">
                          <Image
                            src="/resume-examples/my_old_resume.png"
                            alt="My first resume"
                            width={1200}
                            height={1600}
                            className="h-auto w-full rounded-[7px]"
                          />
                        </div>
                      </a>

                      <div className="mt-4 rounded-[9px] border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-[13px] font-bold text-slate-900">The Story Behind This Resume:</p>
                        <p className="mt-3 text-[12px] leading-6 text-slate-600">I focused heavily on the 7-second rule. With only 2 projects, I made sure a recruiter would be immediately impressed.</p>
                        <p className="mt-4 text-[12px] leading-6 text-slate-600">
                          When you look at this resume for 5 seconds, it looks like I&apos;m a genius programmer. I also used coursework from Udemy because I didn&apos;t have CS classes yet.
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[9px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-500">✓ What worked really well</p>
                          <div className="mt-3 space-y-3 text-[12px] text-emerald-700">
                            <div>
                              <p className="font-semibold">First Impression Impact</p>
                              <p>Looked impressive at first glance.</p>
                            </div>
                            <div>
                              <p className="font-semibold">Smart Coursework Section</p>
                              <p>Listed Udemy/YouTube courses because I had no CS classes yet.</p>
                            </div>
                            <div>
                              <p className="font-semibold">Labeled Projects as Experiences</p>
                              <p>Didn&apos;t call them projects - sounds more professional.</p>
                            </div>
                            <div>
                              <p className="font-semibold">Put Experiences on Top</p>
                              <p>Education lower because experience carried more signal.</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[9px] border border-rose-200 bg-rose-50 px-4 py-4">
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-rose-500">✕ What was wrong</p>
                          <div className="mt-3 space-y-3 text-[12px] text-rose-600">
                            <div>
                              <p className="font-semibold">Two-Column Template</p>
                              <p>Not advisable because ATS parsing can fail.</p>
                            </div>
                            <div>
                              <p className="font-semibold">Should Have Used Jake&apos;s Template</p>
                              <p>Same strong look, but ATS-safe.</p>
                            </div>
                          </div>
                          <div className="mt-4 rounded-[9px] border border-rose-200 bg-white px-3 py-3">
                            <p className="text-[11px] font-bold text-slate-700">The Fix:</p>
                            <p className="mt-1 text-[12px] text-slate-600">Use Jake&apos;s Overleaf template from the start.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {exampleTab === "after" ? (
                    <div className="mt-4">
                      <p className="text-[13px] font-semibold text-slate-900">Amazon, Tesla, Meta, Goldman Sachs interviews</p>
                      <a
                        href="/resume-examples/first_internship_resume.png"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block overflow-hidden rounded-[9px] border border-slate-200 bg-white"
                      >
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-[11px] text-slate-400">Click to open full size</div>
                        <div className="p-4">
                          <Image
                            src="/resume-examples/first_internship_resume.png"
                            alt="Resume after first internship"
                            width={1200}
                            height={1600}
                            className="h-auto w-full rounded-[7px]"
                          />
                        </div>
                      </a>

                      <div className="mt-4">
                        <p className="text-[13px] font-semibold text-slate-900">↗ Major Improvements Made</p>
                        <div className="mt-4 space-y-3">
                          {[
                            ["Switched to Better Template", "Now ATS-optimized. No more two-column issues."],
                            ["Better Bullet Point Length", "Each bullet 1-2 lines max. More scannable."],
                            ["Way More Metrics", "Added quantifiable results to most bullets."],
                            ["Still Prioritized Experiences and Projects", "These remain top sections because they matter most."]
                          ].map(([title, body]) => (
                            <div key={title} className="rounded-[9px] border border-slate-200 bg-white px-4 py-3">
                              <p className="text-[12px] font-semibold text-slate-800">✓ {title}</p>
                              <p className="mt-1 text-[12px] text-slate-500">{body}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 rounded-[9px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700">
                          <strong>The Result:</strong> This version got interviews at Amazon, Tesla, Meta, Klaviyo, ZipRecruiter, and Goldman Sachs.
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {renderGuideFooter()}
          </>
        ) : null}
      </section>

      <div className="flex items-center justify-between gap-4 rounded-[9px] bg-indigo-600 px-5 py-4 text-white">
        <div>
          <p className="text-[14px] font-bold">Ready to move on?</p>
          <p className="mt-1 text-[12px] text-indigo-100">Score 80+ on your resume to unlock the Applications module.</p>
        </div>
        <a
          href="/applications"
          className="rounded-[7px] bg-white px-4 py-2.5 text-[13px] font-bold text-indigo-600"
        >
          Continue to Applications →
        </a>
      </div>
    </div>
  );
}
