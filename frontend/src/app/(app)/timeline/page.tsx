"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Code2,
  FileText,
  GraduationCap,
  Info,
  Lightbulb,
  Map,
  Target,
  XCircle,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type Season = {
  name: string;
  months: string;
  summary: string;
  details: string;
  tone: "peak" | "medium" | "quiet";
};

type RoadmapStep = {
  title: string;
  description: string;
  stageState: "current" | "next" | "later";
  icon: ComponentType<{ size?: number; className?: string }>;
};

type InfoCardProps = {
  icon: ComponentType<{ size?: number; className?: string }>;
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
};

const seasons: Season[] = [
  {
    name: "Peak Recruiting Window",
    months: "August - December",
    summary: "The main event. Big Tech, Fortune 500s, and structured programs open here.",
    details: "This is when the most spots are available. Competition is high, but volume is on your side.",
    tone: "peak"
  },
  {
    name: "Lower Recruiting Window",
    months: "January - March",
    summary: "Smaller teams, startups, and local companies hire now.",
    details: "Fewer spots, but often easier interviews, and less competition",
    tone: "medium"
  },
  {
    name: "Off-Season Window",
    months: "April - July",
    summary: "Preparation time for the next cycle.",
    details: "Little hiring happening, good time to build skills, projects, practice leetcode, etc...",
    tone: "quiet"
  }
];

const roadmap: RoadmapStep[] = [
  {
    title: "The Setup (You are here)",
    description: "Understand the game, the timeline, and the strategy.",
    stageState: "current",
    icon: Map
  },
  {
    title: "Coding Skills",
    description: "Build the technical foundation (language + fundamentals).",
    stageState: "next",
    icon: Code2
  },
  {
    title: "Killer Projects",
    description: "Build 2-3 projects that prove you can build real software and builds your resume.",
    stageState: "later",
    icon: Target
  },
  {
    title: "Resume & Brand",
    description: "Craft a resume that survives ATS and gets recruiter attention.",
    stageState: "later",
    icon: FileText
  },
  {
    title: "The Application Machine",
    description: "Applying to 100+ roles efficiently, learn the tools, get noticed, learn about OAs, etc...",
    stageState: "later",
    icon: CheckCircle2
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

export default function TimelinePage() {
  const [summary, setSummary] = useState<TimelineSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiRequest<TimelineSummary>("/dashboard/summary")
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setSummaryError("Unable to load your personalized timeline data.");
      });

    return () => {
      active = false;
    };
  }, []);

  const summersLeft = summary?.recruiting?.summers_left ?? null;
  const summersLeftLabel =
    summersLeft === null
      ? "Set your graduation date to calculate this."
      : `${summersLeft} ${summersLeft === 1 ? "summer" : "summers"} left`;

  const summersLeftDetail =
    summersLeft === null
      ? "Once your graduation date is set, we can map your realistic internship windows."
      : summersLeft <= 0
        ? "Summer windows are likely closed, but off-season internships and entry-level routes still matter."
        : summersLeft === 1
          ? "High urgency: this is likely your final summer internship window."
          : "You still have runway. Use each summer to ladder up in quality and brand signal.";

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

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Timeline & Strategy</h1>
          <p className="max-w-3xl text-lg text-indigo-100 leading-relaxed mb-8">
            Most students don’t miss internships because they’re bad at coding, they miss them because they don’t understand the hiring system.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Target Audience</div>
              <p className="text-sm font-medium text-white">Aspiring Software Engineers, the skills taught are also foundational for stuff like: (Web, Mobile, Systems, etc...)</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">The Goal</div>
              <p className="text-sm font-medium text-white">Get you "Market Ready" to compete for high-paying internships. Teach you how to stand out in recruiting windows.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Why It Works</div>
              <p className="text-sm font-medium text-white">We prioritize "Proof of Work" over grades and theory.</p>
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
            We recommend reaching <strong>70% Readiness</strong> before applying.
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
            If you only pursue grades, you will not build the skills to pass technical interviews. Without internships,
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
              those roles usually starts the previous year, often beginning in August. Which means it's important to get ready before or around August to start applying.
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
                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                  <li>Summer 1: Build fundamentals and projects.</li>
                  <li>Summer 2: Local company / startup internship.</li>
                  <li>Summer 3: Higher-tier internship and potential return offer.</li>
                </ul>
              </CollapsibleSection>

              <CollapsibleSection title="This is not only about summer">
                <p className="mb-2">
                  Off-season internships (Fall/Spring) exist. They are lower volume but can be great for first
                  experience if you missed a summer cycle.
                </p>
                <p>
                  During recruiting season, students should also watch for hackathons, programs, and other resume-building opportunities.
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
                <span><strong>Do not delay applying</strong> just to grind LC. Most local companies care more about your projects.</span>
              </li>
            </ul>
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
                "Delay graduation (e.g. May -> Dec) to buy time for one more summer internship.",
                "Apply to Masters programs to buy more time and upskill.",
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

      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-bold text-slate-900">Learning Path</h2>
          <p className="mt-2 text-slate-500">
            This platform is designed as a linear progression. Complete the stages in order to maximize your chances.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="absolute left-8 top-5 bottom-5 w-px bg-slate-200" />
          <div className="space-y-6">
            {roadmap.map((step, index) => (
              <div
                key={step.title}
                className="relative flex gap-6 items-start"
              >
                <div
                  className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center z-10 border ${step.stageState === "current"
                    ? "bg-slate-900 border-slate-900 text-white shadow-md"
                    : step.stageState === "next"
                      ? "bg-white border-indigo-400 text-indigo-600"
                      : "bg-white border-slate-300 text-slate-500"
                    }`}
                >
                  <step.icon size={24} />
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900">{step.title}</h3>
                    {step.stageState === "current" ? (
                      <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <p className="text-slate-500 mt-1 text-base md:text-lg leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ready to start?</h2>
          <p className="mt-1 text-slate-500">The first step is building your technical leverage.</p>
        </div>
        <Link
          href="/skills"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 w-full md:w-auto"
        >
          Begin Coding Skills Module
          <ArrowRight size={20} />
        </Link>
      </section>
    </div>
  );
}
