"use client";

import { AlertTriangle, Calendar, Zap } from "lucide-react";
import type { TimelinePlan } from "@/components/dashboard/types";

type RecruitingScenario = {
  id: string;
  name: string;
  header: string;
  subtext: string;
  color_theme: "indigo" | "emerald" | "amber" | "slate";
  countdown_label: string;
  countdown_target: string;
  countdown_days: number;
  countdown_direction: "until" | "since";
  show_one_summer_badge: boolean;
};

type RecruitingSummary = {
  season: "peak" | "lower" | "off";
  ready_threshold: number;
  readiness_status: "ready" | "not_ready";
  summers_left: number | null;
  next_peak_date: string;
  recruiting_window_end: string | null;
  season_explainer: string;
  scenario: RecruitingScenario;
};

type CountdownWidgetProps = {
  seasonStatus?: "prep" | "window";
  daysUntilRecruiting?: number;
  recruitingDate?: string;
  daysUntilWindowClose?: number | null;
  recruitingWindowEnd?: string | null;
  graduationDate?: string | null;
  readiness?: number;
  recruiting?: RecruitingSummary;
  timelinePlan?: TimelinePlan | null;
};

const THEME_CLASSES = {
  indigo: {
    shell: "border-indigo-950/30 bg-[#27205f]",
    seasonChip: "border-indigo-300/20 bg-indigo-300/10 text-indigo-100",
    panel: "border-indigo-300/20 bg-indigo-300/10",
    badge: "border-indigo-300/20 bg-indigo-300/10 text-indigo-100",
  },
  emerald: {
    shell: "border-emerald-950/35 bg-[#173b3a]",
    seasonChip: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    panel: "border-emerald-300/20 bg-emerald-300/10",
    badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  },
  amber: {
    shell: "border-amber-950/40 bg-[#4a3218]",
    seasonChip: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    panel: "border-amber-300/20 bg-amber-300/10",
    badge: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  },
  slate: {
    shell: "border-slate-900/35 bg-[#241f58]",
    seasonChip: "border-white/10 bg-white/6 text-white/78",
    panel: "border-white/10 bg-white/6",
    badge: "border-white/10 bg-white/6 text-white/78",
  },
} as const;

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.trim().slice(0, 10);
  const parts = normalized.split("-").map(Number);
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(Date.UTC(year, month - 1, day));
}

function parseMonthDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.trim().slice(0, 7);
  const parts = normalized.split("-").map(Number);
  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month] = parts;
  return new Date(Date.UTC(year, month - 1, 1));
}

function formatMonthYear(value: string | null | undefined): string {
  const parsed = parseMonthDate(value);
  if (!parsed) return "Not set";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatFullDate(value: string | null | undefined): string {
  const parsed = parseDateOnly(value);
  if (!parsed) return "N/A";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatPeakWindowLabel(peakStartDateValue: string | null | undefined): string {
  const peakStart = parseDateOnly(peakStartDateValue);
  if (!peakStart) return "TBD";
  const peakYear = peakStart.getUTCFullYear();
  return `Aug ${peakYear} - Mar ${peakYear + 1}`;
}

function formatTargetHiringWindow(
  timelinePlan: TimelinePlan | null | undefined,
  fallbackPeakDate: string | null | undefined,
): string {
  if (!timelinePlan) {
    return formatPeakWindowLabel(fallbackPeakDate);
  }
  if (timelinePlan.recommended_season === "peak") {
    return formatPeakWindowLabel(
      timelinePlan.peak_reference_is_current_cycle
        ? timelinePlan.peak_cycle_open
        : timelinePlan.next_peak_open,
    );
  }
  return formatMonthYear(timelinePlan.recommended_start_date) || formatPeakWindowLabel(fallbackPeakDate);
}

function targetWindowSupportingCopy(
  timelinePlan: TimelinePlan | null | undefined,
  fallbackPeakDate: string | null | undefined,
): string {
  if (!timelinePlan) {
    const fallbackWindow = formatPeakWindowLabel(fallbackPeakDate);
    return fallbackWindow === "TBD"
      ? "Your application timing will update after onboarding."
      : `Peak internship applications usually open in ${fallbackWindow.split(" - ")[0]}. Keep building until that window opens.`;
  }
  const readyMonth = formatMonthYear(timelinePlan.estimated_ready_date);
  if (timelinePlan.recommended_season !== "peak") {
    return `You'll be ready by ${readyMonth}. Start applying there and keep improving while you apply.`;
  }
  if (timelinePlan.recommendation_key === "apply_in_peak") {
    return `You'll be ready by ${readyMonth}, inside this window. Applications open in August and stay active into spring.`;
  }
  return `You'll be ready by ${readyMonth}, before this window. Keep building until August opens.`;
}

export default function CountdownWidget({
  seasonStatus,
  daysUntilRecruiting,
  recruitingDate,
  daysUntilWindowClose,
  recruitingWindowEnd,
  graduationDate,
  readiness,
  recruiting,
  timelinePlan,
}: CountdownWidgetProps) {
  const fallbackSeason = seasonStatus === "window" ? "peak" : "off";
  const fallbackDays =
    fallbackSeason === "peak"
      ? (typeof daysUntilWindowClose === "number" ? daysUntilWindowClose : 0)
      : (typeof daysUntilRecruiting === "number" ? daysUntilRecruiting : 0);
  const fallbackTarget = fallbackSeason === "peak" ? recruitingWindowEnd ?? recruitingDate ?? "" : recruitingDate ?? "";

  const data: RecruitingSummary = recruiting ?? {
    season: fallbackSeason,
    ready_threshold: 62,
    readiness_status: (readiness ?? 0) >= 62 ? "ready" : "not_ready",
    summers_left: null,
    next_peak_date: recruitingDate ?? "",
    recruiting_window_end: recruitingWindowEnd ?? null,
    season_explainer: "Peak: Aug-Dec. Lower: Jan-Mar. Off: Apr-Jul.",
    scenario: {
      id: "fallback",
      name: "Fallback",
      header: fallbackSeason === "peak" ? "Peak Season: Apply Now" : "The Calm Before the Storm",
      subtext:
        fallbackSeason === "peak"
          ? "This window is active now. Apply while roles are live and keep improving your profile."
          : "Recruiting is mostly closed. Use this time to finish your roadmap before peak season returns.",
      color_theme: fallbackSeason === "peak" ? "emerald" : "slate",
      countdown_label: fallbackSeason === "peak" ? "Season Ends" : "Peak Season Starts",
      countdown_target: fallbackTarget,
      countdown_days: Math.max(0, fallbackDays),
      countdown_direction: "until",
      show_one_summer_badge: false,
    },
  };

  const targetWindowLabel = formatTargetHiringWindow(timelinePlan, data.next_peak_date || recruitingDate);
  const theme = THEME_CLASSES[data.scenario.color_theme];
  const readinessLabel =
    data.readiness_status === "ready"
      ? `Ready (${data.ready_threshold}%+)`
      : `Not ready (< ${data.ready_threshold}%)`;
  const seasonLabel =
    data.season === "peak"
      ? "Peak season · Aug-Dec"
      : data.season === "lower"
        ? "Lower season · Jan-Mar"
        : "Off-season · Apr-Jul";
  const graduationLabel = formatMonthYear(graduationDate);
  const graduationNotSet = graduationLabel === "Not set";
  const summersLabel =
    data.summers_left === null
      ? "Set graduation date"
      : `${data.summers_left} ${data.summers_left === 1 ? "summer" : "summers"} left to leverage`;
  const countdownValue = `${data.scenario.countdown_days} ${data.scenario.countdown_days === 1 ? "day" : "days"}`;

  return (
    <section className={`overflow-hidden rounded-xl border text-white transition-colors ${theme.shell}`}>
      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${theme.seasonChip}`}>
            <Calendar size={12} />
            {seasonLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
              data.readiness_status === "ready"
                ? "bg-emerald-400/12 text-emerald-200"
                : "bg-rose-400/12 text-rose-200"
            }`}
          >
            {data.readiness_status === "ready" ? <Zap size={12} /> : <AlertTriangle size={12} />}
            {readinessLabel}
          </span>
          {data.scenario.show_one_summer_badge ? (
            <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold ${theme.badge}`}>
              1 summer left
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="text-[22px] font-bold leading-tight tracking-[-0.02em]">{data.scenario.header}</h3>
          <p className="mt-2 max-w-sm text-[13px] leading-6 text-white/72">{data.scenario.subtext}</p>
        </div>

        <div className={`rounded-xl border px-4 py-4 ${theme.panel}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Your target hiring window</p>
          <p className="mt-2 text-[20px] font-bold leading-none text-white">{targetWindowLabel}</p>
          <p className="mt-2 text-[13px] leading-6 text-white/72">
            {targetWindowSupportingCopy(timelinePlan, data.next_peak_date || recruitingDate)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg border px-3 py-3 ${theme.panel}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{data.scenario.countdown_label}</p>
            <p className="mt-1 text-[20px] font-bold leading-none">{countdownValue}</p>
            <p className="mt-1 text-xs text-white/65">
              {data.scenario.countdown_direction === "since" ? "From" : "To"} {formatFullDate(data.scenario.countdown_target)}
            </p>
          </div>
          <div className={`rounded-lg border px-3 py-3 ${theme.panel}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Internship timeline</p>
            <p className="mt-1 text-[17px] font-bold">{summersLabel}</p>
            <p className="mt-1 text-xs text-white/65">{graduationNotSet ? "Set your graduation date in Settings." : `Graduating ${graduationLabel}`}</p>
          </div>
        </div>

        <p className="text-xs leading-5 text-white/52">{data.season_explainer}</p>
      </div>
    </section>
  );
}
