import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

type Resource = {
  name: string;
  description: string;
  href: string;
  emoji: string;
  external?: boolean;
};

const resources: Resource[] = [
  {
    name: "Simplify",
    description: "Apply faster and track applications in one place.",
    href: "https://simplify.jobs/",
    emoji: "⚡",
    external: true,
  },
  {
    name: "levels.fyi Compensation",
    description: "Benchmark internship pay and compare offer quality.",
    href: "https://www.levels.fyi/internships/",
    emoji: "💰",
    external: true,
  },
  {
    name: "Jake's Resume Template",
    description: "Recommended ATS-friendly template for the resume module.",
    href: "https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs",
    emoji: "📋",
    external: true,
  },
  {
    name: "NeetCode 150",
    description: "Core interview set once your fundamentals are strong.",
    href: "https://neetcode.io/practice",
    emoji: "💻",
    external: true,
  },
  {
    name: "CSCareers Discord",
    description: "Community signal on OAs, interviews, and openings.",
    href: "https://discord.com/invite/cscareers",
    emoji: "💬",
    external: true,
  },
  {
    name: "Resume Evaluator",
    description: "Use the Resume scorer to check structure and signal.",
    href: "/resume?tab=scorer",
    emoji: "🧾",
  },
  {
    name: "GitHub Internship List",
    description: "Simplify's maintained internship openings tracker.",
    href: "https://github.com/SimplifyJobs/Summer2026-Internships",
    emoji: "🔎",
    external: true,
  },
  {
    name: "Underclassmen Internships",
    description: "Freshman and sophomore internship list.",
    href: "https://github.com/zapplyjobs/underclassmen-internships",
    emoji: "🌱",
    external: true,
  },
];

export default function QuickResourcesWidget() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">Quick Resources</h3>
        <p className="mt-1 text-sm text-slate-500">Top links pulled from your modules.</p>
      </div>

      <div className="max-h-[420px] space-y-1 overflow-y-auto px-2 py-2">
        {resources.map((resource) => (
          <LinkRow key={resource.name} resource={resource} />
        ))}
      </div>
    </section>
  );
}

function LinkRow({ resource }: { resource: Resource }) {
  const content = (
    <>
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
        {resource.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900 transition-colors group-hover:text-indigo-700">
          {resource.name}
        </span>
        <span className="block truncate text-sm text-slate-500">{resource.description}</span>
      </span>
      {resource.external ? (
        <ExternalLink size={14} className="mt-1 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500" />
      ) : (
        <ArrowRight size={14} className="mt-1 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500" />
      )}
    </>
  );

  const shellClassName =
    "group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50";

  if (resource.external) {
    return (
      <a href={resource.href} target="_blank" rel="noreferrer noopener" className={shellClassName}>
        {content}
      </a>
    );
  }

  return (
    <Link href={resource.href} className={shellClassName}>
      {content}
    </Link>
  );
}
