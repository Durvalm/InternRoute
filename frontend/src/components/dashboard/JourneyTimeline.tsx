"use client";

import { useMemo, type ElementType } from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle, Code2, Info, Mic, Search } from "lucide-react";
import type { JourneyPayload } from "@/components/dashboard/types";

type JourneyTimelineProps = {
  journey: JourneyPayload | null;
  onRebaseline: () => Promise<void>;
  rebasing: boolean;
};

type PostReadinessModule = {
  key: string;
  title: string;
  href: string;
  description: string;
  badge: string;
  icon: ElementType;
};

const MODULE_ROUTE_BY_KEY: Record<string, string> = {
  timeline: "/intro",
  intro: "/intro",
  coding: "/skills",
  projects: "/projects",
  resume: "/resume",
  applications: "/applications",
  interview_prep: "/interview-prep",
  leetcode: "/leetcode",
};

const POST_READINESS_MODULES: PostReadinessModule[] = [
  {
    key: "interview_prep",
    title: "Interview Prep",
    href: "/interview-prep",
    description: "Use this when screens start coming in. Focus on interview reps and communication.",
    badge: "After readiness",
    icon: Mic,
  },
  {
    key: "opportunities",
    title: "Opportunities",
    href: "/opportunities",
    description: "Support module while applying. Use it to find companies and keep your pipeline active.",
    badge: "After readiness",
    icon: Search,
  },
];

const LEETCODE_TRACK_MODULE: PostReadinessModule = {
  key: "leetcode",
  title: "LeetCode",
  href: "/leetcode",
  description: "Extra track that strengthens interview pattern depth for top-tier companies like Google and Meta. Start when your core modules are strong and you can commit consistently.",
  badge: "Extra track",
  icon: Code2,
};

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "TBD";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMonthYear(value: string | null | undefined): string {
  if (!value) return "TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "TBD";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dayDeltaLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (value === 0) return "today";
  if (value > 0) return `${value}d`;
  return `${Math.abs(value)}d late`;
}

export default function JourneyTimeline({ journey, onRebaseline, rebasing }: JourneyTimelineProps) {
  const readinessDayLabel = useMemo(() => {
    if (!journey) return "";
    const days = journey.days_to_readiness_target;
    if (days === 0) return "today";
    if (days > 0) return `${days}d`;
    return `${Math.abs(days)}d late`;
  }, [journey]);

  if (!journey) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">My Journey</h3>
        <p className="mt-2 text-sm text-slate-600">Roadmap data is not available yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">My Journey</h3>
          <p className="mt-1 text-sm text-slate-500">Your path from here to internship-ready</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Internship ready by</p>
          <p className="text-lg font-semibold text-emerald-900">
            {formatMonthYear(journey.readiness_target_date)} · {readinessDayLabel}
          </p>
        </div>
      </div>

      {journey.is_stale ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">Timeline is outdated</p>
            <p className="text-xs text-amber-800">Rebaseline to create new fixed future target dates.</p>
          </div>
          <button
            type="button"
            onClick={() => void onRebaseline()}
            disabled={rebasing}
            className="rounded-md border border-amber-400 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {rebasing ? "Rebaselining..." : "Rebaseline timeline"}
          </button>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {journey.modules.map((module, index) => {
          const isCompleted = module.status === "completed";
          const isCurrent = module.status === "current";
          const isLast = index === journey.modules.length - 1;
          const moduleHref = MODULE_ROUTE_BY_KEY[module.module_key] ?? "/dashboard";

          const nodeClass = isCompleted
            ? "border-emerald-300 bg-emerald-100 text-emerald-700"
            : isCurrent
              ? "border-indigo-300 bg-indigo-100 text-indigo-700"
              : "border-slate-300 bg-slate-100 text-slate-400";

          const lineClass = isCompleted ? "bg-emerald-300" : "bg-slate-200";

          const cardClass = isCurrent
            ? "border-indigo-400 bg-indigo-50/30"
            : isCompleted
              ? "border-slate-200 bg-white"
              : "border-slate-200 bg-slate-50/50";

          const statusBadgeClass = isCompleted
            ? "border-emerald-200 bg-emerald-100 text-emerald-800"
            : isCurrent
              ? "border-indigo-200 bg-indigo-100 text-indigo-800"
              : "border-amber-200 bg-amber-100 text-amber-800";

          const statusBadgeLabel = isCompleted ? "Done" : isCurrent ? "Active" : "Up next";
          const dayText = dayDeltaLabel(module.days_to_target);

          return (
            <Link
              key={module.module_key}
              href={moduleHref}
              className="group relative block pl-12"
              aria-label={`Open ${module.module_name}`}
            >
              <span className={`absolute left-[17px] top-11 ${isLast ? "bottom-[-16px]" : "bottom-[-20px]"} w-0.5 ${lineClass}`} aria-hidden="true" />
              <span className={`absolute left-0 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 ${nodeClass}`}>
                {isCompleted ? <Check size={16} /> : <Circle size={10} fill="currentColor" />}
              </span>

              <div className={`rounded-xl border p-3.5 transition-colors group-hover:border-slate-300 ${cardClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{module.module_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass}`}>{statusBadgeLabel}</span>
                      {isCurrent ? (
                        <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Focus now
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {isCompleted
                        ? `Completed ${formatDateLabel(module.completed_at ?? module.target_date)}`
                        : isCurrent
                          ? `${module.score}% toward ${module.unlock_threshold}% milestone`
                          : `Target ${formatDateLabel(module.target_date)}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-semibold text-slate-800">{formatDateLabel(module.target_date)}</p>
                    {!isCompleted ? (
                      <p className={`text-xs ${(module.days_to_target ?? 0) < 0 ? "text-red-600" : "text-slate-500"}`}>{dayText}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-slate-200">
                    <div
                      className={`h-1.5 rounded-full ${isCompleted ? "bg-emerald-500" : isCurrent ? "bg-indigo-600" : "bg-slate-300"}`}
                      style={{ width: `${Math.max(0, Math.min(100, module.score))}%` }}
                    />
                  </div>
                  <p className={`mt-1 text-right text-sm font-semibold ${isCompleted ? "text-emerald-600" : isCurrent ? "text-indigo-600" : "text-slate-500"}`}>
                    {module.score}%
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="relative mt-3 pl-12">
        <span className="absolute left-0 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-500 text-white">
          <Check size={16} />
        </span>
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-900">Start applying · {journey.readiness_threshold}% milestone</p>
              <p className="text-xs text-emerald-700">You should be ready to apply by this date. Recruiting windows may vary.</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-emerald-900">{formatMonthYear(journey.readiness_target_date)}</p>
              <p className="text-xs text-emerald-700">{readinessDayLabel}</p>
            </div>
          </div>
        </div>
        <span className="absolute bottom-[-18px] left-[17px] top-11 w-0.5 border-l border-dashed border-slate-300" aria-hidden="true" />
      </div>

      <div className="mt-6 pl-12">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              After {journey.readiness_threshold}% readiness
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-800">Support modules</p>
          </div>
          <p className="text-xs text-slate-500">No fixed deadlines here. Use these while applying.</p>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {POST_READINESS_MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.key}
                href={module.href}
                className="group rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600">
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{module.title}</span>
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                        {module.badge}
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-slate-400" />
                </div>

                <div className="mt-2">
                  <span className="group/tooltip relative inline-flex items-center gap-1 text-xs font-medium leading-none text-slate-600">
                    <span>When to use</span>
                    <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-indigo-600">
                      <Info size={12} />
                    </span>
                    <span className="pointer-events-none absolute left-0 top-6 z-20 w-64 rounded-md border border-indigo-200 bg-white px-2.5 py-2 text-xs font-medium leading-relaxed text-slate-700 opacity-0 shadow-sm transition-opacity group-hover/tooltip:opacity-100">
                      {module.description}
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pl-12">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              After {journey.readiness_threshold}% readiness
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-800">LeetCode track</p>
            <p className="mt-1 text-sm text-slate-600">Extra from the core plan. Helps unlock top-tier companies, but needs consistent commitment.</p>
          </div>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
            Extra track
          </span>
        </div>

        <Link
          href={LEETCODE_TRACK_MODULE.href}
          className="group mt-3 block rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 transition-colors hover:border-indigo-300"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-white text-indigo-700">
              <Code2 size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{LEETCODE_TRACK_MODULE.title}</span>
                <span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                  {LEETCODE_TRACK_MODULE.badge}
                </span>
              </span>
              <span className="mt-1 block text-sm text-slate-600">{LEETCODE_TRACK_MODULE.description}</span>
              <span className="mt-2 block">
                <span className="group/tooltip relative inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                  <span>When to use</span>
                  <span className="inline-flex h-4 w-4 items-center justify-center text-indigo-600">
                    <Info size={13} />
                  </span>
                  <span className="pointer-events-none absolute left-0 top-6 z-20 w-72 rounded-md border border-indigo-200 bg-white px-2.5 py-2 text-xs font-medium leading-relaxed text-slate-700 opacity-0 shadow-sm transition-opacity group-hover/tooltip:opacity-100">
                    Start only after core modules are complete and you can commit fully.
                  </span>
                </span>
              </span>
            </span>
            <ArrowRight size={16} className="mt-1 shrink-0 text-slate-400" />
          </div>
        </Link>
      </div>
    </section>
  );
}
