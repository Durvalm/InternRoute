"use client";

import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Code2,
  DollarSign,
  ExternalLink,
  FileText,
  Filter,
  Github,
  Info,
  Linkedin,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
  type LucideIcon
} from "lucide-react";

type ResourceCard = {
  title: string;
  eyebrow: string;
  description: string;
  href?: string;
  action?: string;
  icon: LucideIcon;
  shell: string;
  iconShell: string;
  buttonShell?: string;
  content?: ReactNode;
};

type ProcessStep = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconShell: string;
};

const moduleTopics = [
  "When recruiting season actually starts",
  "How to mass apply without getting lost",
  "What to automate so speed becomes your edge",
  "Where OAs fit and what they really mean",
  "How to track results and fix weak conversion"
];

const processSteps: ProcessStep[] = [
  {
    title: "Resume ready",
    description: "Now that your resume is stronger, this section is about turning that preparation into actual interview chances.",
    icon: FileText,
    iconShell: "bg-slate-900 text-white"
  },
  {
    title: "Recruiting opens",
    description: "When July and August hit, new internships start dropping. That is when the daily application routine begins.",
    icon: Calendar,
    iconShell: "bg-amber-500 text-white"
  },
  {
    title: "Find fresh roles",
    description: "Check the best sources every day so you catch postings while they are still new.",
    icon: Search,
    iconShell: "bg-blue-600 text-white"
  },
  {
    title: "Apply fast at scale",
    description: "Mass applying and applying early is the repeatable strategy that consistently beats waiting too long.",
    icon: Zap,
    iconShell: "bg-indigo-600 text-white"
  },
  {
    title: "Take OAs if asked",
    description: "Some companies send coding screens after you apply. Not every company uses them, and not every applicant gets one.",
    icon: Code2,
    iconShell: "bg-emerald-600 text-white"
  },
  {
    title: "Track and iterate",
    description: "Keep a record of what you applied to so you can change your resume or strategy when it is not converting.",
    icon: BarChart3,
    iconShell: "bg-cyan-600 text-white"
  },
  {
    title: "Interviews and offers",
    description: "The goal is not perfection on every application. The goal is to push enough quality attempts through the funnel to earn interviews.",
    icon: Briefcase,
    iconShell: "bg-purple-600 text-white"
  }
];

const keyTakeaways = [
  "Strong students do not just have a better resume. They also run a better application system.",
  "Applying early and at volume is usually more important than waiting for the perfect customized application.",
  "Automation matters because speed matters in a crowded pipeline.",
  "Not every company uses OAs, but when they appear they are a major filter.",
  "Tracking your funnel is how you learn whether your resume is working."
];

const trackerOptions = [
  { title: "Google Sheets", description: "Fast, simple, free" },
  { title: "Notion Template", description: "Better views and richer workflow" },
  { title: "Simplify Tracker", description: "Automatic if you use the extension" }
];

const oaGroups = [
  {
    title: "Automatic OAs",
    description: "Some companies automatically send an OA to almost everyone who applies.",
    companies: ["JP Morgan", "IBM", "Roblox", "Barclays", "Snowflake"],
    shell: "bg-emerald-50 border-emerald-200",
    badgeShell: "border-emerald-300"
  },
  {
    title: "Selective OAs",
    description: "Other companies only send one after your resume passes an early screen.",
    companies: ["Netflix", "Meta", "Amazon", "GitHub"],
    shell: "bg-purple-50 border-purple-200",
    badgeShell: "border-purple-300"
  }
];

function LinkedInHackVisual() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Visual walkthrough</p>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        <div className="border-b border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A66C2] text-lg font-bold text-white">
              in
            </div>
            <div className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700">
              software (intern)
            </div>
            <div className="hidden rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700 sm:block">
              United States
            </div>
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white">
              Jobs
            </div>
            <div className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700">
              Date posted
            </div>
            <div className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700">
              Experience level
            </div>
          </div>

          <div className="mt-3 max-w-xs rounded-2xl border border-slate-300 bg-white p-3 shadow-sm">
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-slate-400" />
                Any time
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-slate-400" />
                Past week
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                </span>
                <span className="font-semibold text-slate-900">Past 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Then change the URL</p>
        <div className="mt-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-[11px] text-slate-100">
          .../jobs/search/?f_TPR=r
          <span className="rounded bg-amber-300 px-1 font-bold text-slate-900">86400</span>
          ...
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
          <ArrowRight className="h-3.5 w-3.5" />
          Replace it with{" "}
          <span className="rounded bg-emerald-300 px-1 font-bold text-emerald-950">3600</span> to look at the last hour instead.
        </div>
      </div>
    </div>
  );
}

const primaryResourceCards: ResourceCard[] = [
  {
    title: "GitHub Internship List",
    eyebrow: "Main source for fresh internships",
    description:
      "Check the Simplify Jobs GitHub org daily. This is usually the fastest place to catch new internships in one central tracker.",
    href: "https://github.com/SimplifyJobs",
    action: "View GitHub",
    icon: Github,
    shell: "bg-white border-slate-200 hover:border-indigo-300",
    iconShell: "bg-slate-900 text-white",
    buttonShell: "bg-slate-900 text-white hover:bg-slate-800"
  },
  {
    title: "LinkedIn 1-Hour Hack",
    eyebrow: "How you apply before most students",
    description:
      "LinkedIn already helps when you filter to the past 24 hours. The faster move is tightening that filter to the past hour so you can see jobs while they are still fresh.",
    icon: Linkedin,
    shell: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
    iconShell: "bg-blue-600 text-white",
    content: <LinkedInHackVisual />
  }
];

const supportingResourceCards: ResourceCard[] = [
  {
    title: "levels.fyi",
    eyebrow: "Pay research, not job discovery",
    description:
      "Use this after you find a role. It helps you compare compensation and decide which companies are worth prioritizing more aggressively.",
    href: "https://www.levels.fyi/internships/",
    action: "View Salaries",
    icon: DollarSign,
    shell: "bg-white border-slate-200 hover:border-emerald-300",
    iconShell: "bg-emerald-600 text-white",
    buttonShell: "bg-emerald-600 text-white hover:bg-emerald-700"
  },
  {
    title: "Join CS Communities",
    eyebrow: "Good for early signals and shared intel",
    description:
      "Communities matter because opportunities, OA heads-ups, and new postings often move through people before they move through polished feeds.",
    icon: Users,
    shell: "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
    iconShell: "bg-purple-600 text-white",
    content: (
      <div className="space-y-2 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-purple-600" />
          <span>Class Discords, engineering clubs, and campus groups</span>
        </div>
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-purple-600" />
          <span>Friend groups that share openings and OA experiences</span>
        </div>
        <div className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 text-purple-600" />
          <span>Online CS communities that repost opportunities quickly</span>
        </div>
      </div>
    )
  }
];

function ResourceSectionCard({
  action,
  buttonShell,
  content,
  description,
  href,
  icon: Icon,
  iconShell,
  shell,
  title,
  eyebrow
}: ResourceCard) {
  return (
    <div className={`rounded-3xl border-2 p-6 transition-colors ${shell}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconShell}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-xs font-semibold text-slate-500">{eyebrow}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{description}</p>
      {content ? <div className="mt-4">{content}</div> : null}
      {href && action && buttonShell ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${buttonShell}`}
        >
          {action}
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}

export default function ApplicationsPage() {
  const [expandedOA, setExpandedOA] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Application Strategy</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
          This section teaches you how strong applicants turn a solid resume into interviews during recruiting season.
        </p>
      </section>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              <Target className="h-3.5 w-3.5" />
              Why This Matters
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">A good resume is only the starting point</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
              Now that your resume is in better shape, the next problem is distribution. Students miss interviews not just because their resume is weak, but because they apply too late, apply too little, do not know where to look, or do not understand what happens after they hit submit.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
              This module is here to make the process legible. By the end, the user should understand what the application funnel looks like, where the important bottlenecks are, and how to run it with less confusion.
            </p>
          </div>

          <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-5">
            <p className="text-sm font-semibold text-slate-900">What you will learn here</p>
            <div className="mt-4 space-y-3">
              {moduleTopics.map((topic) => (
                <div key={topic} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <p className="text-sm text-slate-700">{topic}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Big picture</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">How the recruiting flow actually works</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            This is the order that matters. OAs are part of the process, but they only show up after applying and they are not universal.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${step.iconShell}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-slate-700">
            Important: not every company has an OA. Many students only see a handful in one recruiting season, usually from larger or more selective tech-heavy companies.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">The Reality: it is a numbers game</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-3xl font-bold text-amber-900">300+</p>
                <p className="mt-1 text-sm text-slate-700">Applications may be needed</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-3xl font-bold text-amber-900">Daily</p>
                <p className="mt-1 text-sm text-slate-700">You should check and apply regularly</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-3xl font-bold text-amber-900">&lt;3 min</p>
                <p className="mt-1 text-sm text-slate-700">Is realistic when your setup is ready</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-800 md:text-base">
              Once recruiting opens, expect to check for roles every day and apply every day. Rejections are normal, and the process is often automated, so your emotional strategy matters too: do not tie your self-worth to one company or one role.
            </p>
            <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-semibold text-purple-900">What actually tends to work</p>
              <p className="mt-1 text-sm text-slate-700">
                Mass applying and applying early is the most repeatable edge. Referrals can help, but they are not the core system most students should rely on.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Where to Find Jobs</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          These are the core places to watch if your goal is catching fresh roles quickly and applying before the listing gets flooded.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {primaryResourceCards.map((card) => (
            <ResourceSectionCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900">Other Resources</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          These are still useful, but they serve a different job: compensation research, context, and early signals from people around you.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {supportingResourceCards.map((card) => (
            <ResourceSectionCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              What top students use
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Simplify: automate the boring part so you can apply faster</h2>
            <p className="mt-2 text-slate-700">
              Strong CS students use tools like Simplify because manual form-filling is wasted time. The goal is not to be fancy. The goal is to remove friction so you can submit more good applications while roles are still fresh.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-indigo-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              <p className="font-semibold text-slate-900">Autofill for repeated forms</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">This is how you keep application time low when you are applying at scale.</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              <p className="font-semibold text-slate-900">Faster one-click workflows</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">Useful on common job boards where speed to submission matters.</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <p className="font-semibold text-slate-900">Lighter resume tailoring</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">Helpful when you want some targeting without slowing your whole pipeline down.</p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <p className="font-semibold text-slate-900">Built-in tracking support</p>
            </div>
            <p className="mt-2 text-sm text-slate-700">Nice if you want your application log in the same place as your applying tool.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="https://simplify.jobs/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Rocket className="h-5 w-5" />
            Get Simplify
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-sm text-slate-600">
            Always review the autofilled fields before submitting. Automation should increase speed, not create sloppy applications.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Code2 className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Online Assessments (OAs)</h2>
            <p className="mt-2 text-slate-700">
              OAs are timed coding tests on platforms like HackerRank or CodeSignal. They usually show up after you apply and before interviews, and they are meant to filter applicants before a human conversation happens.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">What they are</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Usually one or two data-structures-and-algorithms style coding problems in a timed environment.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">When they appear</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              After the application. Some companies send them immediately, while others only send one after an early resume screen.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">How common they are</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Not every company uses OAs. They are more common at larger, more selective, and more technically rigorous employers.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
            <span className="rounded-full bg-white px-3 py-1">Apply</span>
            <ArrowRight className="h-4 w-4 text-blue-500" />
            <span className="rounded-full bg-white px-3 py-1">OA if company uses one</span>
            <ArrowRight className="h-4 w-4 text-blue-500" />
            <span className="rounded-full bg-white px-3 py-1">Interview or rejection</span>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            This matters because students often think OAs are the whole recruiting process. They are not. They are one checkpoint inside the larger application funnel.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {oaGroups.map((group) => (
            <div key={group.title} className={`rounded-2xl border p-4 ${group.shell}`}>
              <div className="flex items-center gap-2">
                {group.title === "Automatic OAs" ? (
                  <Filter className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Award className="h-5 w-5 text-purple-600" />
                )}
                <p className="font-bold text-slate-900">{group.title}</p>
              </div>
              <p className="mt-2 text-sm text-slate-700">{group.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.companies.map((company) => (
                  <span
                    key={company}
                    className={`rounded-full border bg-white px-2.5 py-1 text-xs text-slate-700 ${group.badgeShell}`}
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setExpandedOA((current) => !current)}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          <Info className="h-4 w-4" />
          {expandedOA ? "Hide" : "Show"} what catches students off guard
          <ChevronRight className={`h-4 w-4 transition-transform ${expandedOA ? "rotate-90" : ""}`} />
        </button>

        <div
          className={`grid transition-all duration-300 ${expandedOA ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 shrink-0 text-rose-600" />
                <div>
                  <p className="font-bold text-rose-900">OAs can feel unfair, but they still matter</p>
                  <p className="mt-2 text-sm leading-6 text-slate-800">
                    The process is imperfect and can be frustrating, but the practical takeaway is still the same: do the OAs you get, use them as reps, and learn the format now so the next one feels less intimidating.
                  </p>
                  <div className="mt-3 rounded-2xl border border-rose-300 bg-white p-3">
                    <p className="text-sm text-slate-800">
                      Even if you are not fully LeetCode-ready, seeing real OA questions teaches you what companies expect.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-slate-700">
            Do not assume every application leads to an OA. Many will not. That is normal. When one does arrive, treat it as an important opportunity, because it means you moved one step deeper into the funnel.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-600">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">Track Your Applications</h2>
            <p className="mt-2 text-slate-700">
              Tracking is how you get feedback on your own strategy. If you are 100 to 150 applications in and your resume is not converting, that is the signal to change something instead of blindly repeating the same process.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {trackerOptions.map((option) => (
                <div key={option.title} className="rounded-2xl border border-cyan-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">{option.title}</p>
                  <p className="mt-1 text-xs text-slate-700">{option.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Minimum fields to track</p>
              <p className="mt-2 text-sm text-slate-700">
                Company, role, date applied, source, resume version, OA received, interview stage, and final outcome.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <h2 className="text-center text-xl font-bold text-slate-900">Key Takeaways</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {keyTakeaways.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
              <p className="text-sm text-slate-800">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-indigo-200 pt-4">
          <p className="text-center font-semibold text-slate-800">
            You are building a system that only needs to produce one offer.
          </p>
        </div>
      </section>
    </div>
  );
}
