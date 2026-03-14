"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ChevronDown, ChevronUp, Flag } from "lucide-react";

type ModuleProgress = {
  module_key: string;
  module_name: string;
  overall_weight?: number;
  score: number;
};

type ReadinessBreakdownWidgetProps = {
  modules: ModuleProgress[];
  readyThreshold?: number;
};

type VisualModule = {
  module_key: string;
  module_name: string;
  display_name: string;
  weight: number;
  score: number;
  barClass: string;
  chipClass: string;
};

const DEFAULT_MODULE_WEIGHTS: Record<string, number> = {
  timeline: 5,
  intro: 5,
  coding: 20,
  projects: 30,
  resume: 10,
  applications: 5,
  interview_prep: 5,
  leetcode: 25,
};

const MODULE_COLORS = [
  { barClass: "bg-indigo-600", chipClass: "bg-indigo-50 text-indigo-700" },
  { barClass: "bg-emerald-500", chipClass: "bg-emerald-50 text-emerald-700" },
  { barClass: "bg-amber-500", chipClass: "bg-amber-50 text-amber-700" },
  { barClass: "bg-blue-500", chipClass: "bg-blue-50 text-blue-700" },
  { barClass: "bg-fuchsia-500", chipClass: "bg-fuchsia-50 text-fuchsia-700" },
  { barClass: "bg-teal-500", chipClass: "bg-teal-50 text-teal-700" },
  { barClass: "bg-violet-500", chipClass: "bg-violet-50 text-violet-700" },
];

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function moduleDisplayName(module: ModuleProgress): string {
  if (module.module_key === "timeline" || module.module_key === "intro") {
    return "Intro";
  }
  return module.module_name;
}

export default function ReadinessBreakdownWidget({
  modules,
  readyThreshold = 62,
}: ReadinessBreakdownWidgetProps) {
  const [showMilestoneGuide, setShowMilestoneGuide] = useState(false);
  const visualModules = useMemo<VisualModule[]>(() => {
    return modules
      .map((module, index) => {
        const fallbackWeight = DEFAULT_MODULE_WEIGHTS[module.module_key] ?? 0;
        const weight = Number.isFinite(module.overall_weight)
          ? Number(module.overall_weight)
          : fallbackWeight;
        const palette = MODULE_COLORS[index % MODULE_COLORS.length];
        return {
          module_key: module.module_key,
          module_name: module.module_name,
          display_name: moduleDisplayName(module),
          weight: Math.max(0, weight),
          score: clampScore(module.score),
          barClass: palette.barClass,
          chipClass: palette.chipClass,
        };
      })
      .filter((module) => module.weight > 0);
  }, [modules]);

  const totalWeight = useMemo(
    () => visualModules.reduce((sum, module) => sum + module.weight, 0),
    [visualModules]
  );

  const scoreByKey = useMemo(
    () => Object.fromEntries(visualModules.map((module) => [module.module_key, module.score])),
    [visualModules]
  );
  const introScore = scoreByKey.timeline ?? scoreByKey.intro ?? 0;
  const codingScore = scoreByKey.coding ?? 0;
  const projectsScore = scoreByKey.projects ?? 0;
  const resumeScore = scoreByKey.resume ?? 0;
  const meetsMinimumMilestone =
    introScore >= 100 && codingScore >= 100 && projectsScore >= 80 && resumeScore >= 80;

  if (!visualModules.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">How Readiness Is Calculated</h3>
          <p className="mt-1 text-sm text-slate-500">
            Static module weights total {totalWeight}%. This distribution is the same for all users.
          </p>
        </div>
      </div>

      <div className="mt-4 h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
        {visualModules.map((module) => {
          const segmentWidth = totalWeight > 0 ? (module.weight / totalWeight) * 100 : 0;
          return (
            <div
              key={module.module_key}
              className={module.barClass}
              style={{ width: `${segmentWidth}%` }}
              aria-label={`${module.display_name} weight ${module.weight}%`}
              title={`${module.display_name}: ${module.weight}%`}
            />
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {visualModules.map((module) => (
          <div
            key={module.module_key}
            className="rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-slate-700">{module.display_name}</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${module.chipClass}`}>
              {module.weight}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setShowMilestoneGuide((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          aria-expanded={showMilestoneGuide}
        >
          <Flag size={14} />
          Recommended point milestone to start applying
          {showMilestoneGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showMilestoneGuide ? (
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-indigo-900">
              Minimum recommended checkpoint to start competing for internships:
            </p>
            <ul className="text-sm text-indigo-900 space-y-1 list-disc pl-5">
              <li>Intro: 100%</li>
              <li>Coding Skills: 100%</li>
              <li>Projects: 80%</li>
              <li>Resume: 80%</li>
              <li>{readyThreshold}% readiness: minimum to start competing for internships</li>
            </ul>

            <p className="text-sm text-indigo-900">
              As your readiness progresses beyond this milestone, you improve your chances of landing stronger internships.
            </p>

            <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2 flex items-start gap-2">
              <CalendarClock size={16} className="text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-700">
                This is why tracking <strong>Summers Left</strong> matters (as explained in Intro): it tells you how much runway
                you have to level up before key recruiting windows.
              </p>
            </div>

            <p className={`text-xs font-semibold ${meetsMinimumMilestone ? "text-emerald-700" : "text-amber-700"}`}>
              {meetsMinimumMilestone
                ? "You currently meet this minimum milestone."
                : "You are not at this minimum milestone yet."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
