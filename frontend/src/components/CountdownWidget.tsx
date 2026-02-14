"use client";

import { useMemo } from "react";
import { Calendar, Briefcase, Zap, AlertTriangle } from "lucide-react";

const formatMonthYear = (value: string | null | undefined) => {
  if (!value) return "May 2027";
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return "May 2027";
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
};

const formatFullDate = (value: string | null | undefined) => {
  if (!value) return "N/A";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "N/A";
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
};

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
};

export default function CountdownWidget({
  seasonStatus,
  daysUntilRecruiting,
  recruitingDate,
  daysUntilWindowClose,
  recruitingWindowEnd,
  graduationDate,
  readiness,
  recruiting
}: CountdownWidgetProps) {
  const fallbackScenario = useMemo<RecruitingScenario>(() => {
    const status = seasonStatus === "window" ? "peak" : "off";
    const days = status === "peak"
      ? (typeof daysUntilWindowClose === "number" ? daysUntilWindowClose : 0)
      : (typeof daysUntilRecruiting === "number" ? daysUntilRecruiting : 0);
    const target = status === "peak"
      ? (recruitingWindowEnd ?? recruitingDate ?? "")
      : (recruitingDate ?? "");
    return {
      id: "fallback",
      name: "Fallback",
      header: status === "peak" ? "Recruiting Window Active" : "Prep for Peak Season",
      subtext: status === "peak"
        ? "Use this active window to apply and improve your profile."
        : "Use this period to prepare before peak season opens.",
      color_theme: status === "peak" ? "emerald" : "slate",
      countdown_label: status === "peak" ? "Season Ends" : "Next Peak Season",
      countdown_target: target,
      countdown_days: Math.max(0, days),
      countdown_direction: "until",
      show_one_summer_badge: false
    };
  }, [seasonStatus, daysUntilWindowClose, daysUntilRecruiting, recruitingWindowEnd, recruitingDate]);

  const data: RecruitingSummary = recruiting ?? {
    season: seasonStatus === "window" ? "peak" : "off",
    readiness_status: (readiness ?? 0) >= 70 ? "ready" : "not_ready",
    summers_left: null,
    next_peak_date: recruitingDate ?? "",
    recruiting_window_end: recruitingWindowEnd ?? null,
    season_explainer: "Peak: Aug-Dec, Lower: Jan-Mar, Off: Apr-Jul.",
    scenario: fallbackScenario
  };

  const scenario = data.scenario;
  const seasonMeta = {
    peak: { label: "Peak Season (Aug-Dec)", icon: Zap },
    lower: { label: "Lower Season (Jan-Mar)", icon: Briefcase },
    off: { label: "Off Season (Apr-Jul)", icon: Calendar }
  }[data.season];

  const theme = {
    indigo: "from-indigo-600 to-indigo-800",
    emerald: "from-emerald-600 to-emerald-800",
    amber: "from-amber-500 to-amber-700",
    slate: "from-slate-800 to-slate-950"
  }[scenario.color_theme];

  const countdownTarget = formatFullDate(scenario.countdown_target);
  const nextPeakLabel = formatFullDate(data.next_peak_date);
  const countdownUnitLabel = scenario.countdown_days === 1 ? "day" : "days";
  const readinessLabel = data.readiness_status === "ready" ? "Ready (>= 70%)" : "Not Ready (< 70%)";
  const summersLabel = data.summers_left === null
    ? "Set graduation date"
    : `${data.summers_left} ${data.summers_left === 1 ? "summer" : "summers"} left`;

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-br ${theme} text-white p-6 h-full`}>
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white rounded-full opacity-10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-black rounded-full opacity-20 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
              <seasonMeta.icon size={12} />
              {seasonMeta.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
              {data.readiness_status === "ready" ? <Zap size={12} /> : <AlertTriangle size={12} />}
              {readinessLabel}
            </span>
          </div>
        </div>

        {scenario.show_one_summer_badge ? (
          <span className="mt-3 inline-flex w-fit items-center rounded-full bg-amber-100/20 border border-amber-100/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
            1 Summer Left
          </span>
        ) : null}

        <h3 className="mt-3 text-xl font-bold leading-tight">{scenario.header}</h3>
        <p className="mt-2 text-sm text-white/85 leading-relaxed">{scenario.subtext}</p>

        <div className="mt-5 rounded-lg bg-black/20 border border-white/15 p-4">
          <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
            {scenario.countdown_label}
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-bold tracking-tight">{scenario.countdown_days}</span>
            <span className="text-sm text-white/70 mb-1">{countdownUnitLabel}</span>
          </div>
          <p className="mt-1 text-xs text-white/75">
            {scenario.countdown_direction === "since" ? "from" : "to"} {countdownTarget}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/10 border border-white/15 p-3">
            <p className="text-[11px] uppercase tracking-wider text-white/65 font-semibold">Internship Timeline</p>
            <p className="mt-1 text-sm font-semibold">{summersLabel}</p>
          </div>
          <div className="rounded-lg bg-white/10 border border-white/15 p-3">
            <p className="text-[11px] uppercase tracking-wider text-white/65 font-semibold">Next Peak Opens</p>
            <p className="mt-1 text-sm font-semibold">{nextPeakLabel}</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-white/10 border border-white/15 p-3">
          <p className="text-[11px] uppercase tracking-wider text-white/65 font-semibold">Graduation Date</p>
          <p className="mt-1 text-sm font-semibold">{formatMonthYear(graduationDate)}</p>
        </div>

        <div className="mt-auto pt-4">
          <p className="text-[11px] text-white/60 leading-relaxed">
            {data.season_explainer}
          </p>
        </div>
      </div>
    </div>
  );
}
