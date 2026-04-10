"use client";

import { useMemo, type ElementType } from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle, Code2, Info, Mic, Search } from "lucide-react";
import type { JourneyPayload, TimelinePlan } from "@/components/dashboard/types";

type JourneyTimelineProps = {
  journey: JourneyPayload | null;
  timelinePlan: TimelinePlan | null;
  graduationDate: string | null;
  summersLeft: number | null;
  nextPeakDate: string | null;
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

const TRACK_META: Record<
  string,
  {
    title: string;
    summary: string;
  }
> = {
  foundation_start: {
    title: "Foundation Start",
    summary:
      "Starting from scratch. Core coding logic, then projects, then resume, then applications. Most direct path to internship-ready.",
  },
  coding_base_build_depth: {
    title: "Coding Base, Needs Build Depth",
    summary:
      "You already show coding ability. The leverage now is building stronger projects, turning them into resume proof, then applying with a real pipeline.",
  },
  emerging_builder: {
    title: "Emerging Builder",
    summary:
      "You already have real builder signal. Push one more strong project, tighten resume positioning, then ramp applications harder.",
  },
  strong_builder_needs_positioning: {
    title: "Strong Builder, Needs Positioning",
    summary:
      "Your technical base is already strong. Biggest leverage now is sharper resume positioning and a cleaner applications system.",
  },
  acceleration_track: {
    title: "Acceleration Track",
    summary:
      "You can move quickly. Tighten weak spots, get your pipeline running, and use interview reps to convert stronger opportunities.",
  },
};

const MODULE_DETAILS: Record<
  string,
  {
    description: string;
    duration?: string;
    emphasis?: string;
  }
> = {
  timeline: {
    description: "Learn the recruiting timeline so you apply at the right time. Most students miss this and apply too late.",
  },
  intro: {
    description: "Learn the recruiting timeline so you apply at the right time. Most students miss this and apply too late.",
  },
  coding: {
    description: "Focus on real programming logic: variables, conditionals, loops, functions, and problem breakdown.",
    duration: "~2 months",
  },
  projects: {
    description: "Build 2 meaningful projects with APIs and a database. This turns your skills into proof for your resume.",
    duration: "~4 months",
    emphasis: "Most time-intensive",
  },
  resume: {
    description: "Write a clear one-page resume that shows impact and technical depth.",
    duration: "~2-3 weeks",
  },
  applications: {
    description: "Learn where to apply, how top students find openings, and how to run a tracked application system.",
    duration: "ongoing",
  },
};

const POST_READINESS_MODULES: PostReadinessModule[] = [
  {
    key: "interview_prep",
    title: "Interview Prep",
    href: "/interview-prep",
    description: "Convert interviews into offers with behavioral and technical prep.",
    badge: "After readiness",
    icon: Mic,
  },
  {
    key: "opportunities",
    title: "Opportunities",
    href: "/opportunities",
    description: "Fellowships, hackathons, and extra programs that support your pipeline while applying.",
    badge: "After readiness",
    icon: Search,
  },
];

const LEETCODE_TRACK_MODULE: PostReadinessModule = {
  key: "leetcode",
  title: "LeetCode",
  href: "/leetcode",
  description: "Extra track for stronger interview signal once your fundamentals and projects are already solid.",
  badge: "Extra track",
  icon: Code2,
};

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.trim().slice(0, 10);
  const parts = normalized.split("-").map(Number);
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateLabel(value: string | null | undefined): string {
  const parsed = parseDateOnly(value);
  if (!parsed) return "TBD";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMonthYear(value: string | null | undefined): string {
  const parsed = parseDateOnly(value);
  if (!parsed) return "TBD";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatPeakWindowLabel(peakStartDateValue: string | null | undefined): string {
  const peakStart = parseDateOnly(peakStartDateValue);
  if (!peakStart) return "TBD";
  const year = peakStart.getUTCFullYear();
  return `Aug ${year} - Mar ${year + 1}`;
}

function formatTargetHiringWindow(
  timelinePlan: TimelinePlan | null,
  fallbackPeakDate: string | null | undefined,
): string {
  if (!timelinePlan) return formatPeakWindowLabel(fallbackPeakDate);
  if (timelinePlan.recommended_season === "peak") {
    return formatPeakWindowLabel(
      timelinePlan.peak_reference_is_current_cycle
        ? timelinePlan.peak_cycle_open
        : timelinePlan.next_peak_open,
    );
  }
  return formatMonthYear(timelinePlan.recommended_start_date);
}

function dayDeltaLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (value === 0) return "today";
  if (value > 0) return `${value}d`;
  return `${Math.abs(value)}d late`;
}

export default function JourneyTimeline({
  journey,
  timelinePlan,
  graduationDate,
  summersLeft,
  nextPeakDate,
  onRebaseline,
  rebasing,
}: JourneyTimelineProps) {
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
        <h3 className="text-lg font-semibold text-slate-900">Roadmap</h3>
        <p className="mt-2 text-sm text-slate-600">Roadmap data is not available yet.</p>
      </section>
    );
  }

  const trackMeta = TRACK_META[journey.track_key] ?? TRACK_META.foundation_start;
  const targetHiringWindow = formatTargetHiringWindow(
    timelinePlan,
    nextPeakDate ?? journey.readiness_target_date,
  );
  const graduatingLabel = formatMonthYear(graduationDate);
  const summersLabel =
    summersLeft === null
      ? "Set graduation date"
      : `${summersLeft} ${summersLeft === 1 ? "summer" : "summers"} left`;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-[#241f58] p-5 text-white">
        <div className="max-w-3xl">
          <p className="text-[13px] font-medium text-white/62">Your personalized plan</p>
          <h3 className="mt-1 text-[22px] font-bold tracking-[-0.02em]">{trackMeta.title}</h3>
          <p className="mt-2 text-[13px] leading-6 text-white/72">{trackMeta.summary}</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Ready by</p>
            <p className="mt-1 text-[20px] font-bold">{formatMonthYear(journey.readiness_target_date)}</p>
            <p className="mt-1 text-[13px] text-white/62">Based on this track&apos;s pace</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Target hiring window</p>
            <p className="mt-1 text-[20px] font-bold">{targetHiringWindow}</p>
            <p className="mt-1 text-[13px] text-white/62">You&apos;ll be ready inside or before this window</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Graduating</p>
            <p className="mt-1 text-[20px] font-bold">{graduatingLabel}</p>
            <p className="mt-1 text-[13px] text-white/62">{summersLabel}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">My Journey</h3>
            <p className="mt-1 text-[13px] text-slate-500">Your path from here to internship-ready</p>
          </div>
          <div className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-[13px] font-semibold text-indigo-700">
            Internship ready by {formatMonthYear(journey.readiness_target_date)} · {readinessDayLabel}
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

        <div className="mt-5 space-y-4">
          {journey.modules.map((module, index) => {
            const isCompleted = module.status === "completed";
            const isCurrent = module.status === "current";
            const isLast = index === journey.modules.length - 1;
            const moduleHref = MODULE_ROUTE_BY_KEY[module.module_key] ?? "/dashboard";
            const details = MODULE_DETAILS[module.roadmap_key] ?? MODULE_DETAILS[module.module_key] ?? null;

            const nodeClass = isCompleted
              ? "border-emerald-300 bg-emerald-500 text-white"
              : isCurrent
                ? "border-indigo-300 bg-indigo-600 text-white"
                : "border-slate-300 bg-white text-slate-400";

            const lineClass = isCompleted ? "bg-emerald-200" : "bg-slate-200";
            const cardClass = isCurrent
              ? "border-indigo-200 bg-indigo-50/40"
              : isCompleted
                ? "border-slate-200 bg-white"
                : "border-slate-200 bg-white";
            const statusBadgeClass = isCompleted
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : isCurrent
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-amber-200 bg-amber-50 text-amber-700";
            const statusBadgeLabel = isCompleted ? "Done" : isCurrent ? "Active" : "Up next";
            const dayText = dayDeltaLabel(module.days_to_target);

            return (
              <Link
                key={module.module_key}
                href={moduleHref}
                className="group relative block pl-12"
                aria-label={`Open ${module.module_name}`}
              >
                {!isLast ? (
                  <span className={`absolute left-[17px] top-11 bottom-[-20px] w-0.5 ${lineClass}`} aria-hidden="true" />
                ) : null}
                <span className={`absolute left-0 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 ${nodeClass}`}>
                  {isCompleted ? <Check size={16} /> : <Circle size={10} fill="currentColor" />}
                </span>

                <div className={`rounded-2xl border p-4 transition-colors group-hover:border-slate-300 ${cardClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass}`}>{statusBadgeLabel}</span>
                        {isCurrent ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Focus now
                          </span>
                        ) : null}
                        {details?.emphasis ? (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                            {details.emphasis}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-[17px] font-bold leading-tight text-slate-900">{module.module_name}</p>
                      <p className="mt-2 text-[13px] leading-6 text-slate-600">{details?.description}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[14px] font-bold text-slate-800">{formatDateLabel(module.target_date)}</p>
                      {!isCompleted ? (
                        <p className={`mt-1 text-[13px] ${(module.days_to_target ?? 0) < 0 ? "text-rose-600" : "text-slate-500"}`}>{dayText}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-[13px]">
                    <p className="text-slate-500">
                      {isCompleted ? (
                        <>Completed {formatDateLabel(module.completed_at ?? module.target_date)}</>
                      ) : (
                        <>
                          {details?.duration ? `${details.duration} · ` : ""}
                          {module.score}% toward {module.unlock_threshold}% milestone
                        </>
                      )}
                    </p>
                    <p className={`font-semibold ${isCompleted ? "text-emerald-600" : isCurrent ? "text-indigo-600" : "text-slate-500"}`}>
                      {isCompleted ? `${module.score}%` : `${module.score}% / ${module.unlock_threshold}%`}
                    </p>
                  </div>

                  <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                    <div
                      className={`h-1.5 rounded-full ${isCompleted ? "bg-emerald-500" : isCurrent ? "bg-indigo-600" : "bg-slate-300"}`}
                      style={{ width: `${Math.max(0, Math.min(100, module.score))}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="relative mt-4 pl-12">
          <span className="absolute left-0 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-500 text-white">
            <Check size={16} />
          </span>
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-emerald-900">
                  Start applying · {journey.readiness_threshold}% readiness reached
                </p>
                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-emerald-800">
                  This is where you enter the race, not where it ends. At {journey.readiness_threshold}%, you can start competing for internships. Keep improving projects, resume, and application quality after this milestone.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-bold text-emerald-900">{formatMonthYear(journey.readiness_target_date)}</p>
                <p className="text-[13px] text-emerald-700">{readinessDayLabel}</p>
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
              <p className="mt-1 text-[14px] font-semibold text-slate-800">Support modules</p>
            </div>
            <p className="text-[12px] text-slate-500">No fixed deadlines. Use these while applying.</p>
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
                        <span className="text-[13px] font-semibold text-slate-900">{module.title}</span>
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                          {module.badge}
                        </span>
                      </span>
                      <span className="mt-1 block text-[13px] text-slate-600">{module.description}</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 text-slate-400" />
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
                Optional after the core modules are stable
              </p>
              <p className="mt-1 text-[14px] font-semibold text-slate-800">LeetCode track</p>
              <p className="mt-1 text-[13px] text-slate-600">Use this to level up interview range. Not required to begin competing.</p>
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
                  <span className="text-[13px] font-semibold text-slate-900">{LEETCODE_TRACK_MODULE.title}</span>
                  <span className="rounded-full border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    {LEETCODE_TRACK_MODULE.badge}
                  </span>
                </span>
                <span className="mt-1 block text-[13px] text-slate-600">{LEETCODE_TRACK_MODULE.description}</span>
                <span className="group/tooltip relative mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                  <span>When to use</span>
                  <span className="inline-flex h-4 w-4 items-center justify-center text-indigo-600">
                    <Info size={13} />
                  </span>
                  <span className="pointer-events-none absolute left-0 top-6 z-20 w-72 rounded-md border border-indigo-200 bg-white px-2.5 py-2 text-xs font-medium leading-relaxed text-slate-700 opacity-0 shadow-sm transition-opacity group-hover/tooltip:opacity-100">
                    Start only after your core modules are stable and you can commit to consistent interview practice.
                  </span>
                </span>
              </span>
              <ArrowRight size={16} className="mt-1 shrink-0 text-slate-400" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
