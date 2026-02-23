"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Code2,
  ExternalLink,
  Eye,
  FileText,
  RefreshCw,
  Rocket,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Upload,
  Users,
  XCircle,
  Zap
} from "lucide-react";

type StepTab = "start" | "build" | "feedback";

type ResumeScore = {
  overall: number;
  formatting: number;
  content: number;
  ats: number;
  impact: number;
};

type FeedbackItem = {
  category: string;
  type: "success" | "warning" | "error";
  message: string;
};

const mockScore: ResumeScore = {
  overall: 78,
  formatting: 85,
  content: 72,
  ats: 80,
  impact: 75
};

const mockFeedback: FeedbackItem[] = [
  { category: "Formatting", type: "success", message: "Clean single-column layout detected. ATS can parse this structure well." },
  { category: "Formatting", type: "success", message: "Standard section headers found: Experience, Education, Projects, Skills." },
  { category: "Content", type: "warning", message: "Only 2 out of 6 bullets include quantified results. Target at least 70%." },
  { category: "Content", type: "warning", message: "Weak verbs found: 'Helped with', 'Worked on'. Use stronger verbs like Built, Designed, Implemented." },
  { category: "ATS", type: "warning", message: "Missing target-role keywords from target internship job descriptions." },
  { category: "Impact", type: "error", message: "Projects section lacks GitHub links. Add repository URLs for proof of work." },
  { category: "Impact", type: "success", message: "Strong technical stack listed with modern frameworks and tools." },
  { category: "Content", type: "warning", message: "Resume is short (~0.7 page). Expand impact bullets to fill one strong full page." }
];

const improvementIdeas = [
  {
    title: "Hackathons",
    detail: "Hackathons create teamwork stories, fast execution examples, and project outcomes that strengthen your interview narrative.",
    icon: Users,
    shell: "bg-blue-50 border-blue-200 text-blue-700"
  },
  {
    title: "Fellowships",
    detail: "Early-career programs can add strong names to your resume and help you stand out before your first internship.",
    icon: Award,
    shell: "bg-purple-50 border-purple-200 text-purple-700"
  },
  {
    title: "Research / TA",
    detail: "Research and TA roles demonstrate depth, communication, and ownership in technical environments.",
    icon: BookOpen,
    shell: "bg-emerald-50 border-emerald-200 text-emerald-700"
  },
  {
    title: "Better Projects",
    detail: "Projects used by real people are stronger than tutorial clones. Show decisions, architecture, and measurable outcomes.",
    icon: Code2,
    shell: "bg-amber-50 border-amber-200 text-amber-700"
  }
];

function scoreTone(value: number) {
  if (value >= 80) {
    return {
      text: "text-emerald-700",
      badge: "bg-emerald-50 border-emerald-200",
      bar: "bg-emerald-500"
    };
  }
  if (value >= 60) {
    return {
      text: "text-amber-700",
      badge: "bg-amber-50 border-amber-200",
      bar: "bg-amber-500"
    };
  }
  return {
    text: "text-rose-700",
    badge: "bg-rose-50 border-rose-200",
    bar: "bg-rose-500"
  };
}

function feedbackTone(type: FeedbackItem["type"]) {
  if (type === "success") {
    return {
      shell: "bg-emerald-50 border-emerald-200",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    };
  }
  if (type === "warning") {
    return {
      shell: "bg-amber-50 border-amber-200",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
    };
  }
  return {
    shell: "bg-rose-50 border-rose-200",
    icon: <XCircle className="w-5 h-5 text-rose-600" />
  };
}

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState<StepTab>("start");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File is too large. Max size is 5MB.");
      return;
    }

    setUploadError(null);
    setUploadedFile(file);
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    window.setTimeout(() => {
      setScore(mockScore);
      setFeedback(mockFeedback);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 2200);
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setScore(null);
    setFeedback([]);
    setUploadError(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-sky-50 p-6 md:p-8 shadow-sm">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            <Sparkles size={14} />
            Resume Building
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">
            Turn your work into a resume that gets interviews
          </h1>
          <p className="text-slate-600 text-sm md:text-base mt-3 leading-relaxed">
            Now that you have at least 2 projects, this module helps you turn them into strong resume signals.
            You&apos;ll structure your resume the right way, write better bullets, and improve it with focused feedback.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              key: "start" as StepTab,
              icon: Rocket,
              title: "1. Start Here",
              subtitle: "Template + setup"
            },
            {
              key: "build" as StepTab,
              icon: FileText,
              title: "2. Build It",
              subtitle: "Guide + examples"
            },
            {
              key: "feedback" as StepTab,
              icon: Target,
              title: "3. Get Feedback",
              subtitle: "Score + action plan"
            }
          ].map((step) => {
            const active = activeTab === step.key;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => setActiveTab(step.key)}
                className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                  active ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <step.icon size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${active ? "text-indigo-700" : "text-slate-900"}`}>{step.title}</p>
                    <p className={`text-xs mt-1 ${active ? "text-indigo-600" : "text-slate-500"}`}>{step.subtitle}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "start" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-6">
            <h2 className="text-2xl font-bold text-slate-900">Start with a proven format</h2>
            <p className="text-slate-700 mt-2 max-w-3xl">
              Don&apos;t waste time designing from scratch. Start with a clean ATS-friendly template, then focus on content quality.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <FileText size={22} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-slate-900">Jake&apos;s Overleaf Template</h3>
                  <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">Recommended</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  ATS-safe layout, clean visual hierarchy, and easy to update every week.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    Single-column format that parses reliably.
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    One-page balance without looking cramped.
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    Standard section labels recruiters scan quickly.
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                    Easy to version and iterate frequently.
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    <ExternalLink size={15} />
                    Open Template
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">Template ready?</p>
                <p className="text-indigo-100 text-sm">Go to the writing guide and strengthen your bullets.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("build")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                Next: Build It
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "build" ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Star size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Golden rules for impact</h2>
                <div className="space-y-3 mt-4">
                  <div className="rounded-lg border border-amber-200 bg-white p-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <Eye size={15} className="text-amber-600" />
                      7-second scan rule
                    </p>
                    <p className="mt-1">
                      Recruiters scan quickly. Make titles strong, sections clear, and bullets outcome-focused.
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-white p-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <Sparkles size={15} className="text-amber-600" />
                      Show ownership
                    </p>
                    <p className="mt-1">
                      Don&apos;t undersell your work. Explain what you built, how you built it, and what changed because of it.
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-white p-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <Clock3 size={15} className="text-amber-600" />
                      Iterate weekly
                    </p>
                    <p className="mt-1">
                      Improve wording, metrics, and role relevance every week instead of waiting for a full rewrite.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Target size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900">Bullet point formula</h3>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 mt-3">
                  <p className="text-indigo-900 font-semibold text-center">
                    Action Verb + What You Did + Result / Impact (with a number when possible)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-800">Strong bullet</p>
                    <p className="text-sm text-slate-700 mt-1">
                      "Optimized ETL pipeline using Python and SQL, reducing data processing time by 35%."
                    </p>
                  </div>
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm font-semibold text-rose-800">Weak bullet</p>
                    <p className="text-sm text-slate-700 mt-1">"Worked on improving the data pipeline."</p>
                  </div>
                </div>
                <ul className="space-y-2 mt-4 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                    Start with verbs like Built, Implemented, Designed, Optimized.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                    Mention concrete technologies and architecture choices.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                    Quantify outcomes: speed, users, conversion, error reduction, time saved.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">ATS checklist</h3>
            <p className="text-sm text-slate-600 mt-1">
              Keep formatting parseable and keyword alignment intentional.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
              {[
                "Use standard headers: Experience, Projects, Education, Skills.",
                "Avoid tables, text boxes, and decorative graphics.",
                "Prefer one-column layout with predictable order.",
                "Tailor keywords to the target internship role."
              ].map((item) => (
                <div key={item} className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-slate-700 flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-blue-600 mt-0.5 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              <h3 className="text-xl font-semibold text-slate-900">How to improve without internship experience</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {improvementIdeas.map((idea) => (
                <div key={idea.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${idea.shell}`}>
                    <idea.icon size={17} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-3">{idea.title}</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{idea.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Resume journey: before and after</h3>
            <p className="text-sm text-slate-600 mt-1">
              Click each image to open it in full size.
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-900">Before</p>
                  <span className="text-xs text-amber-700">Early recruiting cycle</span>
                </div>
                <a
                  href="/resume-examples/my_old_resume.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block rounded-lg border border-amber-300 bg-white p-2 hover:shadow-md transition-shadow"
                >
                  <Image
                    src="/resume-examples/my_old_resume.png"
                    alt="Old resume example"
                    width={1200}
                    height={1600}
                    className="w-full h-auto rounded"
                  />
                </a>
                <p className="text-xs text-amber-800 mt-2">Open full-size image</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-emerald-900">After first internship</p>
                  <span className="text-xs text-emerald-700">Improved recruiting cycle</span>
                </div>
                <a
                  href="/resume-examples/first_internship_resume.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block rounded-lg border border-emerald-300 bg-white p-2 hover:shadow-md transition-shadow"
                >
                  <Image
                    src="/resume-examples/first_internship_resume.png"
                    alt="Resume after first internship"
                    width={1200}
                    height={1600}
                    className="w-full h-auto rounded"
                  />
                </a>
                <p className="text-xs text-emerald-800 mt-2">Open full-size image</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
            <h3 className="text-xl font-semibold text-slate-900">Key takeaways</h3>
            <div className="space-y-2 mt-3 text-sm text-slate-700">
              <p className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                Prioritize format first, then optimize content and outcomes.
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                Keep Experience, Projects, Skills, Education high on page one.
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                Iterate weekly and tailor for target roles before each application batch.
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">Ready to score your current resume?</p>
                <p className="text-indigo-100 text-sm">Upload it and get a focused action plan.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("feedback")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                Next: Get Feedback
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "feedback" ? (
        <div className="space-y-6">
          {!analysisComplete ? (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Upload your resume</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Get a score breakdown and clear feedback on formatting, content quality, ATS readiness, and impact.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/60 transition-colors">
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer block">
                    <div className="w-16 h-16 rounded-full bg-white border border-slate-200 mx-auto flex items-center justify-center">
                      <Upload size={26} className="text-slate-500" />
                    </div>
                    <p className="text-base font-semibold text-slate-900 mt-4">
                      {uploadedFile ? uploadedFile.name : "Click to upload your resume"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PDF only, max 5MB</p>
                  </label>
                </div>

                {uploadError ? <p className="text-sm text-rose-600 mt-3">{uploadError}</p> : null}

                {isAnalyzing ? (
                  <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-700">
                    <RefreshCw size={16} className="animate-spin" />
                    <p className="text-sm font-medium">Analyzing resume formatting, content, ATS fit, and impact...</p>
                  </div>
                ) : null}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">What this feedback focuses on</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm text-slate-700">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
                    <FileText size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                    Resume structure and section clarity.
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
                    <Star size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                    Bullet quality and action verb strength.
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
                    <Target size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                    ATS alignment and keyword coverage.
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
                    <Zap size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                    Impact signal and measurable outcomes.
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              <section className={`rounded-2xl border-2 p-6 shadow-sm ${scoreTone(score?.overall ?? 0).badge}`}>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Resume Score</p>
                    <p className="text-sm text-slate-600 mt-1">Based on formatting, content quality, ATS readiness, and impact.</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className={`text-5xl font-bold ${scoreTone(score?.overall ?? 0).text}`}>{score?.overall}%</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {(score?.overall ?? 0) >= 80 ? "Excellent" : (score?.overall ?? 0) >= 60 ? "Good foundation" : "Needs improvement"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  {[
                    { label: "Formatting", value: score?.formatting ?? 0, icon: FileText },
                    { label: "Content", value: score?.content ?? 0, icon: Star },
                    { label: "ATS", value: score?.ats ?? 0, icon: Target },
                    { label: "Impact", value: score?.impact ?? 0, icon: Zap }
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <item.icon size={14} />
                          {item.label}
                        </div>
                        <span>{item.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2">
                        <div className={`h-full rounded-full ${scoreTone(item.value).bar}`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Detailed feedback</h3>
                <div className="space-y-3 mt-4">
                  {feedback.map((item, index) => {
                    const tone = feedbackTone(item.type);
                    return (
                      <div key={`${item.category}-${index}`} className={`rounded-lg border p-3 flex items-start gap-3 ${tone.shell}`}>
                        {tone.icon}
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.category}</p>
                          <p className="text-sm text-slate-700 mt-1">{item.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
                <div className="flex items-start gap-3">
                  <TrendingUp size={18} className="text-indigo-600 mt-0.5" />
                  <div>
                    <h3 className="text-base font-semibold text-indigo-900">Recommended next actions</h3>
                    <ul className="space-y-2 text-sm text-indigo-900/90 mt-2">
                      <li className="flex items-start gap-2">
                        <ArrowRight size={14} className="mt-0.5 shrink-0" />
                        Add measurable impact to at least 70% of bullets.
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight size={14} className="mt-0.5 shrink-0" />
                        Add GitHub links for each project entry.
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight size={14} className="mt-0.5 shrink-0" />
                        Tailor keywords to your target internship role.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={resetAnalysis}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw size={15} />
                  Upload New Resume
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("build")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <BookOpen size={15} />
                  Back to Guide
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
