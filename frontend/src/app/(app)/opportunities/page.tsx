"use client";

import { ExternalLink, Github, Sparkles, Users, Zap } from "lucide-react";

const opportunityTypes = [
  {
    tag: "Freshmen / Sophomore focused",
    title: "Underclassmen Internships",
    body: "Internships specifically for first and second year students. Top companies run early-talent tracks so you can compete before junior year.",
    tagColor: "text-blue-600"
  },
  {
    tag: "Career access + community",
    title: "Diversity Programs",
    body: "Programs supporting underrepresented students with mentorship, coaching, and direct company connections.",
    tagColor: "text-purple-600"
  },
  {
    tag: "Usually 6-12 weeks",
    title: "Fellowships",
    body: "Structured programs combining skill-building, community, and sometimes direct internship placement.",
    tagColor: "text-rose-600"
  },
  {
    tag: "Hosted by NPOs / VCs",
    title: "Internship-Matching Fellowships",
    body: "Fellowships that directly place you at a company. You get both the credential and internship experience.",
    tagColor: "text-emerald-600"
  },
  {
    tag: "Usually 1-5 days",
    title: "Externships",
    body: "Short company shadowing or project experiences with lower time commitment but solid resume signal.",
    tagColor: "text-amber-600"
  },
  {
    tag: "Hidden edge",
    title: "Other Special Programs",
    body: "Paid open source, research placements, and other programs that do not fit standard categories.",
    tagColor: "text-indigo-600"
  }
];

const additionalLists = [
  {
    label: "Open Source Internship Programs",
    href: "https://github.com/deepanshu1422/List-Of-Open-Source-Internships-Programs"
  },
  {
    label: "Research Internships for Undergraduates",
    href: "https://github.com/zapplyjobs/Research-Internships-for-Undergraduates"
  },
  {
    label: "CS Everything But Internships",
    href: "https://github.com/Julian048/CS-Everything-but-Internships"
  },
  {
    label: "CS Tech Resource Hub (Fellowships)",
    href: "https://github.com/cslegasse/CS-Tech-Resource-Hub#Fellowships"
  }
];

const diversityProgramExamples = [
  {
    name: "Rewriting the Code",
    note: "Community for women and non-binary students in tech with mentorship and recruiting support."
  },
  {
    name: "Code2040",
    note: "Early-career network and programs focused on career access for Black and Latinx technologists."
  },
  {
    name: "NSBE / SHPE Campus Chapters",
    note: "Student communities that often share opportunities, referrals, and alumni mentoring."
  }
];

const hackathonPlatforms = [
  {
    name: "Devpost Hackathons",
    href: "https://devpost.com/hackathons"
  },
  {
    name: "MLH Season Events",
    href: "https://mlh.io/seasons"
  }
];

export default function OpportunitiesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <section className="space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-600">
              Module 06
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              Run in Parallel
            </span>
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-slate-950">Opportunities</h1>
          <p className="mt-1 max-w-[860px] text-[13px] leading-6 text-slate-500">
            Recruiting is more than submitting applications. Use this page as a simple hub for programs,
            communities, and hackathons that run in parallel with your internship cycle.
          </p>
        </div>

        <div className="rounded-[9px] border border-indigo-200 bg-indigo-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-700">
            Best used during recruiting season
          </p>
          <p className="mt-1.5 text-[12px] leading-6 text-indigo-900">
            Apply to internships and these opportunities in parallel. Fellowships, communities, and hackathons can
            strengthen your resume and network.
          </p>
        </div>

        <div className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-[18px] font-bold text-slate-950">What These Opportunities Mean</h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Six categories to run in parallel with your internship applications
            </p>
          </div>

          <div className="grid gap-px bg-slate-200 md:grid-cols-2 lg:grid-cols-3">
            {opportunityTypes.map((type) => (
              <div key={type.title} className="bg-white px-5 py-4">
                <p className={`text-[10px] font-bold uppercase tracking-[0.08em] ${type.tagColor}`}>{type.tag}</p>
                <p className="mt-1 text-[13px] font-semibold text-slate-900">{type.title}</p>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">{type.body}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-[11px] text-slate-500">
              <strong className="text-slate-700">Keep searching beyond these lists.</strong>{" "}
              New programs open, some close, and timelines shift each season.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[13px] border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-[18px] font-bold text-slate-950">Starter Resources</h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            One clear section per category: underclassmen lists, diversity communities, and hackathons.
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <article className="rounded-[10px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-slate-900 text-white">
                <Github className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-900">Underclassmen Internships</p>
                <p className="text-[11px] text-slate-500">Main repo for freshman/sophomore tracks</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-slate-600">
              Start here if you are targeting your first internship. This list is actively maintained and usually the
              fastest way to find early-talent openings.
            </p>
            <a
              href="https://github.com/zapplyjobs/underclassmen-internships"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-[7px] bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-slate-800"
            >
              View Repository <ExternalLink className="h-3 w-3" />
            </a>
          </article>

          <article className="rounded-[10px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-indigo-100 text-indigo-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-900">Other Opportunity Lists</p>
                <p className="text-[11px] text-slate-500">Extra repositories for discovery</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {additionalLists.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-[7px] border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {link.label}
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Some entries can overlap or be outdated, so cross-check dates and eligibility.
            </p>
          </article>

          <article className="rounded-[10px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-indigo-600 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-900">Diversity Programs & Communities</p>
                <p className="text-[11px] text-slate-500">Network + mentorship + company access</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-slate-600">
              Join at least one community early. These networks repost opportunities fast and can lead to direct
              recruiter access.
            </p>
            <a
              href="https://www.colorstack.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-[7px] bg-indigo-600 px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Visit ColorStack <ExternalLink className="h-3 w-3" />
            </a>
            <div className="mt-3 space-y-2 rounded-[8px] border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Community examples to explore
              </p>
              {diversityProgramExamples.map((program) => (
                <div key={program.name}>
                  <p className="text-[12px] font-semibold text-slate-900">{program.name}</p>
                  <p className="text-[11px] text-slate-500">{program.note}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[10px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-amber-100 text-amber-700">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-slate-900">Hackathons</p>
                <p className="text-[11px] text-slate-500">Fast project experience + portfolio signal</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-slate-600">
              Hackathons can become strong resume bullets quickly. Document your build with a Devpost submission and a
              clear GitHub README.
            </p>
            <div className="mt-3 space-y-2">
              {hackathonPlatforms.map((platform) => (
                <a
                  key={platform.href}
                  href={platform.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-[7px] border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {platform.name}
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              ))}
            </div>
          </article>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 rounded-[9px] bg-indigo-600 px-5 py-4 text-white">
        <div>
          <p className="text-[14px] font-bold">Up next: Interview Prep</p>
          <p className="mt-1 text-[12px] text-indigo-100">
            Once interviews start landing, switch to focused behavioral and technical prep.
          </p>
        </div>
        <a
          href="/interview-prep"
          className="rounded-[7px] bg-white px-4 py-2.5 text-[13px] font-bold text-indigo-600"
        >
          Continue to Interview Prep →
        </a>
      </div>
    </div>
  );
}
