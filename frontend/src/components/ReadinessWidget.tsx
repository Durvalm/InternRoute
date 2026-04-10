import type { ElementType } from "react";
import { TrendingUp, FileText, Code2, Briefcase, Target } from "lucide-react";

type CategoryProgressProps = {
  icon: ElementType;
  label: string;
  percentage: number;
  color: string;
  bgColor: string;
  bgLight: string;
  details: string;
};

type ReadinessWidgetProps = {
  progress: number;
  readinessThreshold?: number;
  categories?: {
    coding: number;
    projects: number;
    resume: number;
    leetcode?: number;
  };
};

export default function ReadinessWidget({ progress, readinessThreshold = 62, categories }: ReadinessWidgetProps) {
  const coding = categories?.coding ?? 0;
  const projects = categories?.projects ?? 0;
  const resume = categories?.resume ?? 0;
  const leetcode = categories?.leetcode ?? 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp size={20} className="text-slate-700" />
          <div>
            <h2 className="text-[14px] font-semibold text-slate-950">Overall Readiness</h2>
            <p className="text-[13px] text-slate-500">Your preparedness for the recruiting season</p>
          </div>
        </div>
        <span className="text-[22px] font-bold text-indigo-600">{progress}%</span>
      </div>

      <div className="relative mb-8 pb-3">
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="relative h-4 rounded-full bg-indigo-600 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute bottom-0 left-0 right-0 top-0 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%]"></div>
          </div>
          <div
            className="pointer-events-none absolute -bottom-1 -top-1 w-0.5 -translate-x-1/2 rounded-full bg-slate-400"
            style={{ left: `${readinessThreshold}%` }}
            aria-hidden="true"
          />
        </div>
        <p
          className="pointer-events-none absolute top-4 -translate-x-1/2 text-xs font-medium text-slate-500"
          style={{ left: `${readinessThreshold}%` }}
          aria-hidden="true"
        >
          {readinessThreshold}%
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CategoryProgress
          icon={Code2}
          label="Coding Skills"
          percentage={coding}
          color="text-emerald-600"
          bgColor="bg-emerald-600"
          bgLight="bg-emerald-50"
          details="On Track"
        />
        <CategoryProgress
          icon={Briefcase}
          label="Projects"
          percentage={projects}
          color="text-amber-600"
          bgColor="bg-amber-600"
          bgLight="bg-amber-50"
          details="Needs Attention"
        />
        <CategoryProgress
          icon={FileText}
          label="Resume"
          percentage={resume}
          color="text-blue-600"
          bgColor="bg-blue-600"
          bgLight="bg-blue-50"
          details="Almost Ready"
        />
        <CategoryProgress
          icon={Target}
          label="LeetCode"
          percentage={leetcode}
          color="text-violet-600"
          bgColor="bg-violet-600"
          bgLight="bg-violet-50"
          details={leetcode >= 100 ? "Target Met" : leetcode >= 70 ? "Strong Grind" : "In Progress"}
        />
      </div>
    </section>
  );
}

function CategoryProgress({
  icon: Icon,
  label,
  percentage,
  color,
  bgColor,
  bgLight,
  details,
}: CategoryProgressProps) {
  return (
    <article className={`rounded-xl border border-slate-100 p-4 ${bgLight}`}>
      <div className="mb-2 flex items-start justify-between">
        <div className={`rounded-md bg-white p-1.5 shadow-sm ${color}`}>
          <Icon size={16} />
        </div>
        <span className={`text-[14px] font-bold ${color}`}>{percentage}%</span>
      </div>
      <h3 className="mb-1 text-[14px] font-semibold text-slate-900">{label}</h3>
      <p className="mb-3 text-[12px] text-slate-500">{details}</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white">
        <div className={`h-2 rounded-full ${bgColor}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </article>
  );
}
