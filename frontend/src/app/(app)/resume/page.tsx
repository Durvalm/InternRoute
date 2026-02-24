"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  Users,
  XCircle,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

type TabType = "ats" | "philosophy" | "template" | "content" | "examples" | "scorer";

const tabs: Array<{ id: TabType; label: string; icon: LucideIcon }> = [
  { id: "ats", label: "ATS Filter", icon: Filter },
  { id: "philosophy", label: "The Philosophy", icon: Sparkles },
  { id: "template", label: "The Template", icon: FileText },
  { id: "content", label: "Writing Content", icon: Target },
  { id: "examples", label: "Real Examples", icon: Eye },
  { id: "scorer", label: "Score It", icon: Trophy }
];

const mockScore: ResumeScore = {
  overall: 78,
  formatting: 85,
  content: 72,
  ats: 80,
  impact: 75
};

const mockFeedback: FeedbackItem[] = [
  { category: "Formatting", type: "success", message: "Clean single-column layout detected - great for ATS!" },
  { category: "Content", type: "warning", message: "Only 2 out of 6 bullet points include quantified results. Aim for 70%+." },
  {
    category: "Content",
    type: "error",
    message: "Project titles are too generic. Embellish: 'WhatsApp Clone' -> 'Real-time Chat Application with WebSocket Protocol'"
  },
  { category: "ATS", type: "success", message: "No images or complex formatting - ATS-friendly" },
  { category: "ATS", type: "warning", message: "Missing keywords from typical CS job descriptions" },
  { category: "Impact", type: "error", message: "Projects lack GitHub links. Add repository URLs" },
  { category: "Content", type: "warning", message: "Resume is 0.65 pages. Fill one full page for better impact" },
  { category: "Content", type: "error", message: "Detected 'About Me' section - remove it, recruiters skip this" }
];

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
  const [activeTab, setActiveTab] = useState<TabType>("ats");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

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
    }, 2500);
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setUploadError(null);
    setAnalysisComplete(false);
    setScore(null);
    setFeedback([]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="text-center">
        <h1 className="text-lg md:text-xl font-bold text-slate-900 mb-3">How to Craft a Good Tech Resume</h1>
        <p className="text-base text-slate-600 max-w-3xl mx-auto">
          So now you have the skills and at least 2 cool projects built, let&apos;s build a resume that will catch the attention of recruiters.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8">
        {activeTab === "ats" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Filter className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">Understanding the First Filter: ATS</h2>
              <p className="text-slate-600">Before any human sees your resume, it goes through a robot first</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">Here&apos;s How Resume Screening Actually Works:</h3>
              <p className="text-slate-700 mb-4">
                When you apply to jobs nowadays, especially at larger companies, your resume doesn&apos;t go straight to a recruiter.
                <strong> It first goes through an ATS (Applicant Tracking System)</strong> - basically software that scans and filters resumes automatically.
              </p>
              <p className="text-slate-700">
                Think of it like this: <strong>Robot reads your resume first -> If it passes, then a human recruiter sees it.</strong>
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">What is ATS?</h3>
                <p className="text-slate-700 mb-4">
                  <strong>ATS stands for Applicant Tracking System.</strong> It&apos;s the software companies use to manage job applications.
                  The ATS scans your resume looking for:
                </p>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Keywords</strong> from the job description (programming languages, frameworks, tools)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Proper formatting</strong> that it can parse and understand
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Standard section headers</strong> like &quot;Experience&quot;, &quot;Education&quot;, &quot;Skills&quot;
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-rose-50 border-2 border-rose-300 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-rose-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-base font-bold text-rose-900 mb-3">The Scary Truth About ATS</h3>
                    <p className="text-slate-800 mb-3">
                      <strong>If your resume isn&apos;t formatted correctly, the ATS will reject it automatically</strong> - even if you&apos;re the perfect candidate!
                      The robot can&apos;t read fancy graphics, tables, or complex layouts. So it just rejects you.
                    </p>
                    <p className="text-slate-800">
                      No human ever sees your resume. You never get a chance. <strong>This is why format matters SO MUCH.</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-300 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">How to Beat the ATS (The Rules)</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">Use a Simple, Single-Column Format</p>
                      <p className="text-sm text-slate-700">
                        No fancy two-column layouts, no graphics, no text boxes. Keep it simple and clean.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">Use Standard Section Headers</p>
                      <p className="text-sm text-slate-700">
                        Stick with: Experience, Education, Projects, Skills. Don&apos;t get creative like &quot;My Journey&quot; - ATS might not recognize it.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">Avoid Images, Graphics, Tables</p>
                      <p className="text-sm text-slate-700">
                        That beautiful infographic resume in Canva? ATS can&apos;t read it. Stick to plain text formatting.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">Include Keywords from Job Descriptions</p>
                      <p className="text-sm text-slate-700">
                        If the job asks for a keyword, try to match the exact wording where honest and relevant.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">Save as PDF (Usually)</p>
                      <p className="text-sm text-slate-700">
                        Unless the application specifically asks for .docx, use PDF to preserve formatting.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-slate-900 mb-2">Remember:</p>
                    <p className="text-slate-700">
                      Your resume needs to be good for <strong>both</strong> ATS and human recruiters.
                      First, pass the ATS. Then, impress a human in 7 seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setActiveTab("philosophy")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Next: The Philosophy
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "philosophy" && (
          <div className="space-y-6 max-w-4xl mx-auto text-sm">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-sm md:text-base font-bold text-slate-900 mb-2">The Resume Philosophy</h2>
              <p className="text-slate-600">What you need to understand about resumes</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-600 rounded-r-lg p-6">
              <h3 className="text-sm md:text-base font-bold text-slate-900 mb-3">The Truth About Resumes</h3>
              <p className="text-slate-800 font-medium mb-3">
                Remember, your resume is where you can show off everything you have been working hard for. <strong>Don&apos;t be humble.</strong>
              </p>
              <p className="text-slate-700">
                The best thing you can do is to <strong>embellish your experiences so they look more impressive than what they actually are.</strong>
                At the end of the day, it doesn&apos;t matter your skill level - someone is checking a piece of paper (your resume).
                I&apos;ve seen many folks who were average technically getting top tier internships, and when I checked their resume,
                I thought they were the best coders ever.
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl border-2 border-amber-400 p-6">
              <div className="flex items-start gap-4">
                <Clock3 className="w-10 h-10 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 mb-4">The 7-Second Rule</h3>
                  <p className="text-slate-700 mb-4 text-sm">
                    <strong>A recruiter checks your resume for only 7 seconds on average.</strong> Yes, just 7 seconds.
                  </p>
                  <div className="bg-white rounded-lg border-2 border-amber-500 p-6 mb-5 shadow-sm">
                    <p className="text-center text-slate-800 font-semibold mb-2 text-sm">Your resume will only be ready when this happens:</p>
                    <p className="text-center text-sm font-bold text-amber-900 mb-2">&quot;Wow, this person is really technical!&quot;</p>
                    <p className="text-center text-slate-700">
                      When you glance at your resume for 5 seconds, that&apos;s what you should think.
                      <strong> If you don&apos;t get that feeling, it&apos;s not ready yet.</strong> Keep iterating.
                    </p>
                  </div>
                  <p className="text-slate-700">
                    Make sure it looks impressive at first sight. When they glance at it, they should immediately think you&apos;re an exceptional programmer.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-300 p-8">
              <div className="flex items-start gap-4 mb-6">
                <Star className="w-10 h-10 text-indigo-600 flex-shrink-0" />
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 mb-2">Embellishing: The Art of Looking Better</h3>
                  <p className="text-slate-700 text-sm mb-4">
                    This is the most important skill. You need to make your experiences look way more impressive than they are. Here&apos;s how:
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <h4 className="text-sm md:text-base font-bold text-slate-900">1. Project Titles Matter A LOT</h4>
                  </div>
                  <p className="text-slate-700 mb-4">
                    Don&apos;t call your project a &quot;WhatsApp Clone&quot; or &quot;Twitter Clone&quot;. That sounds like you just followed a tutorial.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <span className="font-bold text-rose-900">Bad (Sounds Like Tutorial)</span>
                      </div>
                      <p className="text-slate-700 font-medium">WhatsApp Clone</p>
                      <p className="text-slate-700 font-medium">Twitter Clone</p>
                      <p className="text-slate-700 font-medium">Todo App</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-emerald-900">Good (Sounds Professional)</span>
                      </div>
                      <p className="text-slate-700 font-medium">Real-time Chat Application</p>
                      <p className="text-slate-700 font-medium">Social Media Platform with Feed Algorithm</p>
                      <p className="text-slate-700 font-medium">Task Management System with Authentication</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-4 italic">
                    Same project, but one sounds way more professional and technical.
                  </p>
                </div>

                <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Target className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <h4 className="text-sm md:text-base font-bold text-slate-900">2. Add Numbers to Everything</h4>
                  </div>
                  <p className="text-slate-700 mb-4">Numbers make things sound real and impressive.</p>
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <p className="text-sm font-bold text-emerald-900 mb-1">Example 1:</p>
                      <p className="text-slate-700">Built a chat app -> Built real-time chat application <strong>serving 50+ daily users</strong></p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <p className="text-sm font-bold text-emerald-900 mb-1">Example 2:</p>
                      <p className="text-slate-700">Made it faster -> Optimized database queries, <strong>reducing load time by 40%</strong></p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <p className="text-sm font-bold text-emerald-900 mb-1">Example 3:</p>
                      <p className="text-slate-700">Built REST API -> Designed and implemented <strong>15+ RESTful API endpoints</strong> with authentication</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Zap className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <h4 className="text-sm md:text-base font-bold text-slate-900">3. Label Projects as Experiences</h4>
                  </div>
                  <p className="text-slate-700">
                    When you&apos;re starting out and don&apos;t have internships yet, you can call them Experience or Software Development Experience.
                    It sounds more professional and makes your resume look fuller. <strong>This is what I did on my first resume.</strong>
                  </p>
                </div>

                <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Code2 className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <h4 className="text-sm md:text-base font-bold text-slate-900">4. Make Technologies Sound Advanced</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Used React -> Built responsive UI with <strong>React hooks and Context API for state management</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Made a database -> Designed and implemented <strong>PostgreSQL database with normalized schema</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">Deployed the app -> Deployed to <strong>AWS EC2 with Nginx reverse proxy and SSL encryption</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-purple-100 border-2 border-purple-400 rounded-lg p-6">
                <p className="font-bold text-purple-900 mb-2 text-center text-sm">The Golden Rule of Embellishing:</p>
                <p className="text-slate-800 text-center">
                  You&apos;re not lying about what you did - you&apos;re describing it in the most impressive way possible.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 mb-2">Iterate Every Week</h3>
                  <p className="text-slate-700">
                    The way to have a great resume is to <strong>check it every week and improve continuously.</strong>
                    Every time you iterate, check if it looks more impressive at first sight.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setActiveTab("ats")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                Back
              </button>
              <button
                onClick={() => setActiveTab("template")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Next: The Template
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "template" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">The Template You Should Use</h2>
              <p className="text-slate-600">Don&apos;t reinvent the wheel - use what works</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300 p-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-base md:text-lg font-bold text-slate-900">Jake&apos;s Overleaf Resume Template</h3>
                <span className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase">Required</span>
              </div>

              <p className="text-slate-700 text-base mb-6">
                Seriously, just use this template. Don&apos;t waste time trying to make your resume unique with fancy designs.
                <strong> Jake&apos;s template is proven to work at FAANG companies</strong> and used by thousands of students.
              </p>

              <div className="bg-white rounded-lg p-6 border-2 border-indigo-200 mb-6">
                <h4 className="font-bold text-slate-900 mb-3 text-base">What is This Template?</h4>
                <p className="text-slate-700 mb-4">
                  It&apos;s a LaTeX template on Overleaf. You can use it in your browser, no installation needed.
                </p>
                <p className="text-slate-700">
                  Overleaf gives you a live preview, so you can see exactly what your resume looks like as you type.
                </p>
              </div>

              <div className="bg-emerald-50 rounded-lg p-6 border-2 border-emerald-300 mb-6">
                <h4 className="font-bold text-slate-900 mb-4 text-base">Why This Template is Perfect:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">ATS Can Parse It Perfectly</p>
                      <p className="text-sm text-slate-700">Single-column, clean formatting that robots can read without issues</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">Fits Everything on One Page</p>
                      <p className="text-sm text-slate-700">Optimized spacing so you can fit experiences without looking cramped</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">Clean and Professional Look</p>
                      <p className="text-sm text-slate-700">Recruiters recognize and trust this format</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">Proven to Work at FAANG</p>
                      <p className="text-sm text-slate-700">Students using this template have gotten offers at top companies</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-sm text-base"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Jake&apos;s Template in Overleaf
                </a>
              </div>

              <div className="mt-6 bg-amber-50 rounded-lg border border-amber-300 p-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                  <div className="text-sm text-slate-700">
                    <strong>Pro tip:</strong> Once you open the template in Overleaf, click Copy to create your own version.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setActiveTab("philosophy")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                Back
              </button>
              <button
                onClick={() => setActiveTab("content")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Next: Writing Content
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">Writing Great Resume Content</h2>
              <p className="text-slate-600">How to write bullet points that actually impress people</p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-400 rounded-xl p-6">
              <h3 className="text-base font-bold text-purple-900 mb-4 text-center">The Bullet Point Formula</h3>
              <div className="bg-white rounded-lg p-6 border-2 border-purple-300 text-center mb-6">
                <p className="text-sm md:text-base font-bold text-slate-900 mb-2">Action Verb + What You Did + Result/Impact</p>
                <p className="text-slate-600">(with a number if possible)</p>
              </div>

              <div className="space-y-5">
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span className="font-bold text-emerald-900 text-base">Great Example</span>
                  </div>
                  <p className="text-slate-800 font-semibold mb-3 text-base">
                    Optimized ETL pipeline using Python and SQL, reducing data processing time by 35%
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-emerald-200 text-sm text-slate-700">
                    Action Verb + Specific Tech + Quantified Result.
                  </div>
                </div>

                <div className="bg-rose-50 border-2 border-rose-300 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-6 h-6 text-rose-600" />
                    <span className="font-bold text-rose-900 text-base">Weak Example</span>
                  </div>
                  <p className="text-slate-800 font-semibold mb-3 text-base">Worked on improving the data pipeline</p>
                  <div className="bg-white rounded-lg p-4 border border-rose-200 text-sm text-slate-700">
                    Too vague, no tech depth, no measurable impact.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Use Strong Action Verbs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {["Built", "Developed", "Designed", "Implemented", "Optimized", "Engineered", "Architected", "Deployed"].map((verb) => (
                  <div key={verb} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center font-semibold text-slate-700">
                    {verb}
                  </div>
                ))}
              </div>
              <div className="bg-rose-50 rounded-lg border border-rose-200 p-4">
                <p className="text-sm text-slate-700">
                  <strong>Avoid weak verbs like:</strong> Helped with, Worked on, Responsible for, Assisted with.
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">How to Find Numbers/Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Performance Improvements:</p>
                    <p className="text-sm text-slate-700">Reduced load time by 2 seconds or improved response time by 40%</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Scale/Usage:</p>
                    <p className="text-sm text-slate-700">Serving 100+ daily users or processing 10K+ requests/day</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Features/Components:</p>
                    <p className="text-sm text-slate-700">Implemented 15+ API endpoints or built 8 reusable components</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm md:text-base font-bold text-slate-900 mb-3">How to Fill Your Resume (No Internship Yet)</h3>

              <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 mb-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">What NOT to do:</p>
                    <div className="space-y-2 text-sm text-slate-700">
                      <p>
                        <strong>&quot;About Me&quot; sections:</strong>{" "}
                        Recruiters skip these entirely. They want to see what you&apos;ve done, not read a paragraph about who you are.
                      </p>
                      <p>
                        <strong>Jobs unrelated to tech:</strong>{" "}
                        Being a cashier at Target or a server at a restaurant doesn&apos;t help your tech resume. Use that space for technical work instead.
                      </p>
                      <p>
                        <strong>Irrelevant skills:</strong>{" "}
                        Microsoft Office and Google Docs are expected. Don&apos;t waste resume space on them.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-900 mb-2">Fast additions that can become Projects/Experience entries:</p>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Small Python programs you already built (automation scripts, parsers, data cleaners)
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Class projects/labs you can polish with a clear README, GitHub link, and deployed demo
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Final course projects where you can show stack, features, and measurable impact
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    Any script/tool already used by classmates, friends, or family (even small usage counts)
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-lg border border-indigo-200 p-5">
              <h3 className="text-sm md:text-base font-bold text-slate-900 mb-3">Plateaued at 2 projects? How to level up from there</h3>
              <p className="text-slate-700 mb-4">
                If you already have two solid projects and feel stuck, this is where you add higher-signal experiences.
                These usually take longer, but they can change your interview outcomes.
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-3 mb-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    <h5 className="font-bold text-slate-900 text-base">Hackathons</h5>
                  </div>
                  <p className="text-sm text-slate-700">
                    Hackathons give fast team experience, strong project stories, and great names for your resume.
                    I used HackHarvard and HackPrinceton stories constantly in interviews.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-3 mb-2">
                    <Award className="w-6 h-6 text-purple-600" />
                    <h5 className="font-bold text-slate-900 text-base">Fellowships and Programs</h5>
                  </div>
                  <p className="text-sm text-slate-700">
                    Programs from companies like Wells Fargo, Goldman Sachs, and Google can add big brand signal before your first internship.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-3 mb-2">
                    <BookOpen className="w-6 h-6 text-green-600" />
                    <h5 className="font-bold text-slate-900 text-base">Research and Teaching Assistant</h5>
                  </div>
                  <p className="text-sm text-slate-700">
                    Research/TA work shows depth, communication, and consistency. Strong option while you build toward internship experience.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start gap-3 mb-2">
                    <Code2 className="w-6 h-6 text-amber-600" />
                    <h5 className="font-bold text-slate-900 text-base">Build Better Projects</h5>
                  </div>
                  <p className="text-sm text-slate-700">
                    Move from tutorial projects to real-user projects with modern stack and measurable outcomes.
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-blue-50 rounded-lg border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <p className="text-sm text-slate-700">
                    <strong>Pro tip:</strong> You don&apos;t need all of these. Pick 1-2 and do them really well.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 rounded-lg border border-cyan-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-3">Resume Tailoring (Advanced Strategy)</h3>
              <p className="text-slate-700 mb-4">
                Tailoring your resume for certain job posts can be <strong>very beneficial.</strong> Some companies hire very team-based and
                are interested in an exact match between the skills you know and what their team uses.
              </p>
              <p className="text-slate-700 mb-3">
                <strong>That was the case for me with Tesla.</strong> Tailoring your resume shows you&apos;re a perfect match for that team/project,
                and can significantly boost your chances.
              </p>
              <p className="text-sm text-slate-600 italic">I&apos;ll share tools for this in the Applications module.</p>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setActiveTab("template")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                Back
              </button>
              <button
                onClick={() => setActiveTab("examples")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Next: Real Examples
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "examples" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                <Eye className="w-8 h-8 text-pink-600" />
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">My Resume Journey</h2>
              <p className="text-slate-600">Real examples from my first resume to FAANG interviews</p>
            </div>

            <div className="space-y-10">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="px-4 py-2 bg-amber-100 text-amber-900 rounded-lg font-bold text-base">My First Resume</div>
                  <div className="text-slate-600">Got me Fidelity offer + P&amp;G interviews</div>
                </div>

                <a
                  href="/resume-examples/my_old_resume.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-slate-50 rounded-lg p-6 border border-slate-200 mb-5 hover:shadow-md transition-shadow"
                >
                  <Image
                    src="/resume-examples/my_old_resume.png"
                    alt="First resume"
                    width={1200}
                    height={1600}
                    className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
                  />
                  <p className="text-xs text-slate-500 text-center mt-3">Click to open full size</p>
                </a>

                <div className="space-y-5">
                  <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-3 text-base">The Story Behind This Resume:</h3>
                    <p className="text-slate-700 mb-3">
                      I focused heavily on the 7-second rule. With only 2 projects, I made sure a recruiter would be immediately impressed.
                    </p>
                    <p className="text-slate-700">
                      When you look at this resume for 5 seconds, it looks like I&apos;m a genius programmer. I also used coursework creatively
                      because I didn&apos;t have CS classes yet.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <span className="font-bold text-emerald-900 text-base">What Worked Really Well</span>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">-></span>
                          <div>
                            <p className="font-semibold">First Impression Impact</p>
                            <p>Looked impressive at first glance.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">-></span>
                          <div>
                            <p className="font-semibold">Smart Coursework Section</p>
                            <p>Listed Udemy/YouTube courses because I had no CS classes yet.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">-></span>
                          <div>
                            <p className="font-semibold">Labeled Projects as Experiences</p>
                            <p>Didn&apos;t call them projects - sounds more professional.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">-></span>
                          <div>
                            <p className="font-semibold">Put Experiences on Top</p>
                            <p>Education lower because experience carried more signal.</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-rose-50 border-2 border-rose-300 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <XCircle className="w-6 h-6 text-rose-600" />
                        <span className="font-bold text-rose-900 text-base">What Was Wrong</span>
                      </div>
                      <ul className="space-y-3 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-rose-600 font-bold">x</span>
                          <div>
                            <p className="font-semibold">Two-Column Template</p>
                            <p>Not advisable because ATS parsing can fail.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-600 font-bold">x</span>
                          <div>
                            <p className="font-semibold">Should Have Used Jake&apos;s Template</p>
                            <p>Same strong look, but ATS-safe.</p>
                          </div>
                        </li>
                      </ul>
                      <div className="mt-4 p-3 bg-white rounded-lg border border-rose-300">
                        <p className="text-sm font-semibold text-rose-900">The Fix:</p>
                        <p className="text-sm text-slate-700">Use Jake&apos;s Overleaf template from the start.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-300" />

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="px-4 py-2 bg-emerald-100 text-emerald-900 rounded-lg font-bold text-base">After My First Internship</div>
                  <div className="text-slate-600">Amazon, Tesla, Meta, Klaviyo, Goldman Sachs interviews</div>
                </div>

                <a
                  href="/resume-examples/first_internship_resume.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-slate-50 rounded-lg p-6 border border-slate-200 mb-5 hover:shadow-md transition-shadow"
                >
                  <Image
                    src="/resume-examples/first_internship_resume.png"
                    alt="Resume after internship"
                    width={1200}
                    height={1600}
                    className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
                  />
                  <p className="text-xs text-slate-500 text-center mt-3">Click to open full size</p>
                </a>

                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                    <span className="font-bold text-emerald-900 text-base">Major Improvements Made</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-slate-900">Switched to Better Template</p>
                        <p className="text-sm text-slate-700">Now ATS-optimized. No more two-column issues.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-slate-900">Better Bullet Point Length</p>
                        <p className="text-sm text-slate-700">Each bullet 1-2 lines max. More scannable.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-slate-900">Way More Metrics</p>
                        <p className="text-sm text-slate-700">Added quantifiable results to most bullets.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-slate-900">Still Prioritized Experiences and Projects</p>
                        <p className="text-sm text-slate-700">These remain top sections because they matter most.</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 p-4 bg-white rounded-lg border-2 border-emerald-400">
                    <p className="text-sm font-semibold text-emerald-900 mb-2">The Result:</p>
                    <p className="text-sm text-slate-700">
                      This version got interviews at <strong>Amazon, Tesla, Meta, Klaviyo, ZipRecruiter, and Goldman Sachs</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setActiveTab("content")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                Back
              </button>
              <button
                onClick={() => setActiveTab("scorer")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Next: Score Your Resume
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "scorer" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">Score Your Resume</h2>
              <p className="text-slate-600">Get instant feedback on what&apos;s working and what needs improvement</p>
            </div>

            {!analysisComplete ? (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-16 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="mx-auto w-20 h-20 bg-slate-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                      <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <p className="text-base font-semibold text-slate-900 mb-2">{uploadedFile ? uploadedFile.name : "Upload Your Resume"}</p>
                    <p className="text-sm text-slate-500">PDF format - Max 5MB</p>
                  </label>
                </div>

                {uploadError ? <p className="text-sm text-rose-600">{uploadError}</p> : null}

                {isAnalyzing ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="text-base font-semibold text-slate-900 mb-1">Analyzing your resume...</p>
                      <p className="text-sm text-slate-500">Checking formatting, content, ATS compatibility, and impact</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-4 border ${getScoreBg(score?.overall ?? 0)}`}>
                    <div>
                      <div className={`text-3xl font-bold ${getScoreColor(score?.overall ?? 0)}`}>{score?.overall}</div>
                      <div className="text-sm text-slate-600 font-medium">
                        {(score?.overall ?? 0) >= 80 ? "Excellent!" : (score?.overall ?? 0) >= 60 ? "Good" : "Needs Work"}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 mb-2">Resume Analysis Complete</h3>
                  <p className="text-slate-600">Here&apos;s how your resume performs across key metrics</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Formatting", value: score?.formatting ?? 0, icon: FileText },
                    { label: "Content", value: score?.content ?? 0, icon: Star },
                    { label: "ATS Score", value: score?.ats ?? 0, icon: Target },
                    { label: "Impact", value: score?.impact ?? 0, icon: Zap }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="bg-slate-50 rounded-lg p-4 text-center border border-slate-200">
                        <Icon className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                        <div className={`text-lg md:text-xl font-bold mb-1 ${getScoreColor(item.value)}`}>{item.value}</div>
                        <div className="text-xs text-slate-600 font-medium">{item.label}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 text-base">Detailed Feedback</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {feedback.map((item, idx) => {
                      const tone = getFeedbackTone(item.type);
                      return (
                        <div key={idx} className={`flex items-start gap-3 p-4 rounded-lg border ${tone.shell}`}>
                          {tone.icon}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900">{item.category}</div>
                            <div className="text-sm text-slate-700">{item.message}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={resetAnalysis}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Upload New Resume
                </button>
              </div>
            )}

            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 text-base">Key Takeaways:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                  <p className="text-slate-700">
                    <strong>Embellish your resume</strong> and make it look like you&apos;re more skilled than you are.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                  <p className="text-slate-700">
                    <strong>Format is critical.</strong> A great resume in the wrong format gets rejected.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                  <p className="text-slate-700">
                    <strong>Focus on what matters:</strong> Experience, Projects, Skills on top. Skip About Me sections.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
                  <p className="text-slate-700">
                    <strong>Keep iterating.</strong> Check your resume every week and improve continuously.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-start pt-4">
              <button
                onClick={() => setActiveTab("examples")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
