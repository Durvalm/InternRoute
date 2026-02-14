"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Briefcase,
  Zap,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";

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

const dateFromIso = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const createUTCDate = (year: number, monthIndex: number, day: number) =>
  new Date(Date.UTC(year, monthIndex, day));

const toISODate = (value: Date) => value.toISOString().slice(0, 10);

const daysUntil = (target: Date, now: Date) =>
  Math.max(0, Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

const DEBUG_SCENARIO_ENABLED = process.env.NEXT_PUBLIC_RECRUITING_SCENARIO_DEBUG === "true";

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

type Season = RecruitingSummary["season"];

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

const buildDebugRecruitingSummary = ({
  season,
  readinessScore,
  summersLeft,
  today,
  graduationDate
}: {
  season: Season;
  readinessScore: number;
  summersLeft: number;
  today: Date;
  graduationDate: string | null | undefined;
}): RecruitingSummary => {
  const currentYear = today.getUTCFullYear();
  const recruitingEndYear = today.getUTCMonth() > 6 ? currentYear + 1 : currentYear;
  const recruitingEndDate = createUTCDate(recruitingEndYear, 2, 31);
  const nextPeakYear = today.getUTCMonth() > 6 ? currentYear + 1 : currentYear;
  const nextPeakDate = createUTCDate(nextPeakYear, 7, 1);
  const parsedGradDate = dateFromIso(graduationDate);
  const fallbackGradDate = createUTCDate(currentYear + Math.max(0, summersLeft), 4, 1);
  const gradDate = parsedGradDate ?? fallbackGradDate;
  const isReady = readinessScore >= 70;

  const makeScenario = (scenario: RecruitingScenario): RecruitingSummary => ({
    season,
    readiness_status: isReady ? "ready" : "not_ready",
    summers_left: summersLeft,
    next_peak_date: toISODate(nextPeakDate),
    recruiting_window_end: season === "off" ? null : toISODate(recruitingEndDate),
    season_explainer: "Peak: Aug-Dec, Lower: Jan-Mar, Off: Apr-Jul.",
    scenario
  });

  if (summersLeft <= 0) {
    const diff = Math.floor((gradDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return makeScenario({
      id: "K",
      name: "Post-Graduation Mode",
      header: "Transition: New Grad Mode",
      subtext: "Internship windows are closed. Shift your strategy to full-time entry-level roles.",
      color_theme: "slate",
      countdown_label: diff < 0 ? "Since Graduation" : "Until Graduation",
      countdown_target: toISODate(gradDate),
      countdown_days: Math.abs(diff),
      countdown_direction: diff < 0 ? "since" : "until",
      show_one_summer_badge: false
    });
  }

  if (season === "peak") {
    if (isReady && summersLeft === 1) {
      return makeScenario({
        id: "E",
        name: "Ready + Peak + 1 Left",
        header: "Last Recruiting Season",
        subtext: "This is your last summer cycle. Apply daily and prioritize quality and volume.",
        color_theme: "amber",
        countdown_label: "Season Ends",
        countdown_target: toISODate(recruitingEndDate),
        countdown_days: daysUntil(recruitingEndDate, today),
        countdown_direction: "until",
        show_one_summer_badge: true
      });
    }
    if (!isReady && summersLeft === 1) {
      return makeScenario({
        id: "F",
        name: "Not Ready + Peak + 1 Left",
        header: "Emergency: Immediate Pivot",
        subtext: "Last chance for summer. Raise readiness quickly and start applying now.",
        color_theme: "amber",
        countdown_label: "Season Ends",
        countdown_target: toISODate(recruitingEndDate),
        countdown_days: daysUntil(recruitingEndDate, today),
        countdown_direction: "until",
        show_one_summer_badge: true
      });
    }
    if (isReady) {
      return makeScenario({
        id: "A",
        name: "Ready + Peak",
        header: "Peak Season: Apply Now",
        subtext: "Top companies are posting now. Push applications while volume is highest.",
        color_theme: "emerald",
        countdown_label: "Season Ends",
        countdown_target: toISODate(recruitingEndDate),
        countdown_days: daysUntil(recruitingEndDate, today),
        countdown_direction: "until",
        show_one_summer_badge: false
      });
    }
    return makeScenario({
      id: "B",
      name: "Not Ready + Peak",
      header: "Peak Season: Catch Up",
      subtext: "Window is open. Hit 70% readiness quickly while applying strategically.",
      color_theme: "amber",
      countdown_label: "Season Ends",
      countdown_target: toISODate(recruitingEndDate),
      countdown_days: daysUntil(recruitingEndDate, today),
      countdown_direction: "until",
      show_one_summer_badge: false
    });
  }

  if (season === "lower") {
    if (isReady && summersLeft === 1) {
      return makeScenario({
        id: "H",
        name: "Ready + Lower + 1 Left",
        header: "Last Opportunity: Hunt Local",
        subtext: "Target startups, local firms, and off-season internships before graduation.",
        color_theme: "amber",
        countdown_label: "Season Ends",
        countdown_target: toISODate(recruitingEndDate),
        countdown_days: daysUntil(recruitingEndDate, today),
        countdown_direction: "until",
        show_one_summer_badge: true
      });
    }
    if (!isReady && summersLeft === 1) {
      return makeScenario({
        id: "G",
        name: "Not Ready + Lower + 1 Left",
        header: "Last Call: Sprint Mode",
        subtext: "Lower season is ending. Focus on readiness and smaller-company opportunities.",
        color_theme: "amber",
        countdown_label: "Season Ends",
        countdown_target: toISODate(recruitingEndDate),
        countdown_days: daysUntil(recruitingEndDate, today),
        countdown_direction: "until",
        show_one_summer_badge: true
      });
    }
    if (isReady) {
      return makeScenario({
        id: "D",
        name: "Ready + Lower",
        header: "Target Mid-Size & Startups",
        subtext: "Peak is mostly closed, but many startups and local firms are still hiring.",
        color_theme: "emerald",
        countdown_label: "Season Ends",
        countdown_target: toISODate(recruitingEndDate),
        countdown_days: daysUntil(recruitingEndDate, today),
        countdown_direction: "until",
        show_one_summer_badge: false
      });
    }
    return makeScenario({
      id: "C",
      name: "Not Ready + Lower",
      header: "Prep for Next Cycle",
      subtext: "Major windows are closing. Build skills now to dominate the next peak season.",
      color_theme: "indigo",
      countdown_label: "Next Peak Season",
      countdown_target: toISODate(nextPeakDate),
      countdown_days: daysUntil(nextPeakDate, today),
      countdown_direction: "until",
      show_one_summer_badge: false
    });
  }

  if (summersLeft === 1) {
    return makeScenario({
      id: "J",
      name: "Off-Season + 1 Left",
      header: "Your Final Training Camp",
      subtext: "This is the last prep window of your degree. Max readiness by August 1.",
      color_theme: "amber",
      countdown_label: "Last Prep Window",
      countdown_target: toISODate(nextPeakDate),
      countdown_days: daysUntil(nextPeakDate, today),
      countdown_direction: "until",
      show_one_summer_badge: true
    });
  }

  return makeScenario({
    id: "I",
    name: "Off-Season",
    header: "The Calm Before the Storm",
    subtext: "Recruiting is mostly closed. Use this time to finish your roadmap before August.",
    color_theme: "slate",
    countdown_label: "Peak Season Starts",
    countdown_target: toISODate(nextPeakDate),
    countdown_days: daysUntil(nextPeakDate, today),
    countdown_direction: "until",
    show_one_summer_badge: false
  });
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

  const liveData: RecruitingSummary = recruiting ?? {
    season: seasonStatus === "window" ? "peak" : "off",
    readiness_status: (readiness ?? 0) >= 70 ? "ready" : "not_ready",
    summers_left: null,
    next_peak_date: recruitingDate ?? "",
    recruiting_window_end: recruitingWindowEnd ?? null,
    season_explainer: "Peak: Aug-Dec, Lower: Jan-Mar, Off: Apr-Jul.",
    scenario: fallbackScenario
  };

  const [debugOpen, setDebugOpen] = useState(false);
  const [simSeason, setSimSeason] = useState<Season>("lower");
  const [simSummersLeft, setSimSummersLeft] = useState(2);
  const [simReadiness, setSimReadiness] = useState(45);

  useEffect(() => {
    if (debugOpen) return;
    setSimSeason(liveData.season);
    setSimReadiness(Math.max(0, Math.min(100, readiness ?? 0)));
    if (typeof liveData.summers_left === "number") {
      setSimSummersLeft(Math.max(0, Math.min(2, liveData.summers_left)));
    }
  }, [debugOpen, liveData.season, liveData.summers_left, readiness]);

  const data = useMemo<RecruitingSummary>(() => {
    if (!(DEBUG_SCENARIO_ENABLED && debugOpen)) {
      return liveData;
    }
    const now = new Date();
    const todayUtc = createUTCDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return buildDebugRecruitingSummary({
      season: simSeason,
      readinessScore: simReadiness,
      summersLeft: simSummersLeft,
      today: todayUtc,
      graduationDate
    });
  }, [debugOpen, graduationDate, liveData, simReadiness, simSeason, simSummersLeft]);

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
    <div className="overflow-hidden rounded-xl shadow-lg h-full">
      <div className={`relative bg-gradient-to-br ${theme} text-white p-6`}>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white rounded-full opacity-10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-black rounded-full opacity-20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col">
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
            {DEBUG_SCENARIO_ENABLED ? (
              <button
                type="button"
                onClick={() => setDebugOpen((prev) => !prev)}
                className={`rounded-full p-2 transition ${
                  debugOpen ? "bg-black/25 text-white" : "text-white/60 hover:text-white hover:bg-black/20"
                }`}
                aria-label="Toggle scenario debugger"
              >
                <RefreshCw size={16} />
              </button>
            ) : null}
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

          <div className="pt-4">
            <p className="text-[11px] text-white/60 leading-relaxed">
              {data.season_explainer}
            </p>
          </div>
        </div>
      </div>

      {DEBUG_SCENARIO_ENABLED && debugOpen ? (
        <div className="bg-slate-950 text-slate-100 border-t border-slate-800 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-[0.16em] uppercase text-slate-400">Scenario Debugger</p>
            <button
              type="button"
              onClick={() => setDebugOpen(false)}
              className="text-slate-400 hover:text-white transition"
              aria-label="Collapse scenario debugger"
            >
              <ChevronUp size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Season</label>
              <select
                value={simSeason}
                onChange={(event) => setSimSeason(event.target.value as Season)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm"
              >
                <option value="peak">Peak (Aug-Dec)</option>
                <option value="lower">Lower (Jan-Mar)</option>
                <option value="off">Off (Apr-Jul)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Summers Left</label>
              <select
                value={simSummersLeft}
                onChange={(event) => setSimSummersLeft(Number(event.target.value))}
                className="w-full rounded-md border border-slate-700 bg-slate-900 text-slate-100 px-3 py-2 text-sm"
              >
                <option value={2}>2+ (Standard)</option>
                <option value={1}>1 (Last Chance)</option>
                <option value={0}>0 (Post-Grad)</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="flex items-center justify-between text-sm text-slate-300 mb-2">
              <span>Readiness</span>
              <span className={simReadiness >= 70 ? "text-emerald-400" : "text-amber-300"}>
                {simReadiness}% ({simReadiness >= 70 ? "Ready" : "Not Ready"})
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={simReadiness}
              onChange={(event) => setSimReadiness(Number(event.target.value))}
              className="w-full accent-indigo-400"
            />
          </div>

          <p className="mt-4 text-xs text-slate-400 text-center">
            Active Scenario: {scenario.id} ({scenario.name})
          </p>
        </div>
      ) : DEBUG_SCENARIO_ENABLED ? (
        <button
          type="button"
          onClick={() => setDebugOpen(true)}
          className="w-full bg-slate-950 border-t border-slate-800 px-4 py-2.5 text-sm text-slate-300 hover:text-white transition flex items-center justify-between"
        >
          <span className="uppercase tracking-[0.14em] text-xs">Scenario Debugger</span>
          <ChevronDown size={16} />
        </button>
      ) : null}
    </div>
  );
}
