import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Code2,
  DollarSign,
  ExternalLink,
  FileText,
  Search,
  Users
} from "lucide-react";

type Resource = {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  external?: boolean;
};

const resources: Resource[] = [
  {
    name: "Resume Evaluator",
    description: "Go to Resume and use the Score It tab.",
    href: "/resume?tab=scorer",
    icon: FileText,
    color: "text-blue-700",
    bg: "bg-blue-50"
  },
  {
    name: "GitHub Internship List",
    description: "Simplify tracker for new internship openings.",
    href: "https://github.com/SimplifyJobs/Summer2026-Internships",
    icon: Search,
    color: "text-slate-700",
    bg: "bg-slate-100",
    external: true
  },
  {
    name: "Simplify",
    description: "Apply faster and track internship applications.",
    href: "https://simplify.jobs/",
    icon: Search,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    external: true
  },
  {
    name: "levels.fyi Compensation",
    description: "Compensation benchmarking for offer quality.",
    href: "https://www.levels.fyi/internships/",
    icon: DollarSign,
    color: "text-green-700",
    bg: "bg-green-50",
    external: true
  },
  {
    name: "Jake's Resume Template",
    description: "Recommended ATS-friendly resume template.",
    href: "https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs",
    icon: FileText,
    color: "text-sky-700",
    bg: "bg-sky-50",
    external: true
  },
  {
    name: "NeetCode 150",
    description: "Core problem set for interview prep.",
    href: "https://neetcode.io/practice",
    icon: Code2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    external: true
  },
  {
    name: "CSCareers Discord",
    description: "Community signal on OAs, interviews, and openings.",
    href: "https://discord.com/invite/cscareers",
    icon: Users,
    color: "text-violet-700",
    bg: "bg-violet-50",
    external: true
  }
];

export default function QuickResourcesWidget() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-bold text-slate-900 mb-4">Quick Resources</h3>
      <p className="text-xs text-slate-500 mb-4">Top links pulled from your modules.</p>

      <div className="space-y-2">
        {resources.map((resource) => (
          <LinkRow key={resource.name} resource={resource} />
        ))}
      </div>
    </div>
  );
}

function LinkRow({ resource }: { resource: Resource }) {
  const content = (
    <>
      <div className={`mt-0.5 p-2 rounded-md ${resource.bg} ${resource.color}`}>
        <resource.icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">
          {resource.name}
        </p>
        <p className="text-xs text-slate-500 truncate">{resource.description}</p>
      </div>
      {resource.external ? (
        <ExternalLink size={14} className="shrink-0 text-slate-300 group-hover:text-indigo-500 transition-colors" />
      ) : (
        <ArrowRight size={14} className="shrink-0 text-slate-300 group-hover:text-indigo-500 transition-colors" />
      )}
    </>
  );

  const shellClassName = "group flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-2.5 transition-colors hover:bg-slate-50 hover:border-indigo-200";

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
