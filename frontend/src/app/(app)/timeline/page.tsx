"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  FileText,
  HelpCircle,
  Target
} from "lucide-react";

type Season = {
  name: string;
  months: string;
  summary: string;
  details: string;
  tone: "peak" | "medium" | "quiet";
};

type RoadmapStep = {
  title: string;
  whyItMatters: string;
  output: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const seasons: Season[] = [
  {
    name: "Peak Recruiting Window",
    months: "August - December",
    summary: "Most internship listings open here, including many large companies and structured programs. (Cools down starting christmas time).",
    details:
      "If your goal is a summer internship, this is usually the highest-volume period to prepare for.",
    tone: "peak"
  },
  {
    name: "Lower Recruiting Window",
    months: "January - March",
    summary: "Some companies still open roles, especially smaller teams, local companies, etc...",
    details: "Useful window, but generally fewer opportunities than fall.",
    tone: "medium"
  },
  {
    name: "Build + Reset Window",
    months: "April - July",
    summary: "Fewer traditional summer listings are open; this is often preparation time for the next cycle.",
    details:
      "Off-season internships can exist (fall/spring), but they are less common and may require schedule flexibility.",
    tone: "quiet"
  }
];

const roadmap: RoadmapStep[] = [
  {
    title: "Coding Skills",
    whyItMatters: "You need practical technical fundamentals before you can build convincing work.",
    output: "You can solve scoped problems and ship core features reliably.",
    icon: Code2
  },
  {
    title: "Projects",
    whyItMatters: "Projects convert raw skills into concrete proof that you can build end-to-end.",
    output: "2-3 projects with clear scope, tradeoffs, and measurable impact.",
    icon: Target
  },
  {
    title: "Resume",
    whyItMatters: "Your resume is the compressed version of your work. It must show evidence, not claims.",
    output: "A resume with strong bullets sourced from real projects and technical depth.",
    icon: FileText
  },
  {
    title: "Interview Readiness",
    whyItMatters: "Once your profile is solid, you need to communicate and execute under interview pressure.",
    output: "A repeatable prep system for coding, behavioral, and project walkthroughs.",
    icon: CheckCircle2
  }
];

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
  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8 font-sans">
      <section className="rounded-2xl border border-white/60 bg-white/90 shadow-soft overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <Calendar size={14} />
            Module 01
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">Timeline & Strategy</h1>
          <p className="mt-3 max-w-3xl text-sm md:text-base text-slate-200">
            This page sets the operating system for the course: how internship timing works, what recruiting
            season means, and why modules are ordered the way they are.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50/80 border-t border-slate-100">
          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">What You Learn</p>
            <p className="mt-2 text-sm text-slate-700">How internship timelines actually map to school calendars.</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Core Principle</p>
            <p className="mt-2 text-sm text-slate-700">
              Skills become projects, projects become resume evidence.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Output</p>
            <p className="mt-2 text-sm text-slate-700">A clear plan for what to build first and why.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
        <div className="space-y-8">
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Clock3 size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">How The Internship Calendar Works</h2>
            </div>

            <p className="text-slate-600 mb-8 leading-relaxed">
              Most students first hear about recruiting season too late. The quick model: many internships happen
              in summer, but recruiting for those roles often starts in the previous fall.
            </p>

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
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">The Ecosystem: Why Modules Are Ordered This Way</h2>
            <p className="text-sm text-slate-500 mb-8">
              This is the core dependency chain for the course. Each step creates input for the next step.
            </p>

            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <div className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Step 1</div>
                <div className="font-bold text-slate-900 text-lg mb-1">Skills</div>
                <div className="text-xs text-slate-500">Programming, tools, fundamentals.</div>
              </div>

              <div className="hidden md:flex items-center justify-center text-slate-300">
                <ArrowRight size={24} />
              </div>

              <div className="flex-1 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-center">
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Step 2</div>
                <div className="font-bold text-slate-900 text-lg mb-1">Projects</div>
                <div className="text-xs text-slate-500">Proof that you can apply skills.</div>
              </div>

              <div className="hidden md:flex items-center justify-center text-slate-300">
                <ArrowRight size={24} />
              </div>

              <div className="flex-1 bg-purple-50 border border-purple-100 rounded-2xl p-5 text-center">
                <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Step 3</div>
                <div className="font-bold text-slate-900 text-lg mb-1">Resume Evidence</div>
                <div className="text-xs text-slate-500">Achievements and impact.</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 text-center">
              <span className="font-bold text-slate-900">Simple rule:</span> Learn skills to build projects, then
              use projects to produce strong resume bullets.
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-slate-100 text-slate-500 rounded-lg">
                <HelpCircle size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Quick Definitions</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "What is recruiting season?",
                  a: "It is the period where the highest volume of internship applications opens. For many students, that means preparing before fall."
                },
                {
                  q: "Are internships only in summer?",
                  a: "Summer is the most common window. Fall and spring exist but are less common and require schedule flexibility."
                },
                {
                  q: "What is a return offer (RO)?",
                  a: "A full-time offer received after an internship. It is one of the cleanest pathways to graduation with a secured job."
                }
              ].map((item) => (
                <article
                  key={item.q}
                  className="border border-slate-100 rounded-xl p-4 bg-slate-50 hover:bg-white hover:shadow-sm transition-all"
                >
                  <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    <ChevronRight size={14} className="text-slate-400" />
                    {item.q}
                  </h4>
                  <p className="text-xs text-slate-500 pl-6 leading-relaxed">{item.a}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-indigo-50 rounded-3xl border border-indigo-100 p-8">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">Context</div>
            <p className="text-indigo-900 text-sm leading-relaxed">
              You do not need to know everything yet. This module is for understanding the map first, so each next
              module feels purposeful instead of random.
            </p>
          </section>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Course Roadmap (And Why It Exists)</h2>
        <p className="text-slate-500 mb-8">
          This module sequence is built so each stage unlocks useful output for the next stage.
        </p>

        <div className="space-y-4">
          {roadmap.map((step, index) => (
            <div
              key={step.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start"
            >
              <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                <step.icon size={24} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {index + 1}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Why</span>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.whyItMatters}</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Output</span>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.output}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Next Module: Coding Skills</h2>
          <p className="mt-1 text-slate-500">
            Start building the technical foundation that powers the rest of this system.
          </p>
        </div>
        <Link
          href="/skills"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Go To Skills
          <ArrowRight size={20} />
        </Link>
      </section>
    </div>
  );
}
