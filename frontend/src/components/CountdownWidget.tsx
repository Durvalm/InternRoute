"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Calendar, AlertCircle, Briefcase, Zap } from "lucide-react";

const formatMonthYear = (value: string | null | undefined) => {
  if (!value) return "May 2027";
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return "May 2027";
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
};

type CountdownWidgetProps = {
  daysLeftOverride?: number;
  recruitingDate?: string;
  graduationDate?: string | null;
  readiness?: number;
};

export default function CountdownWidget({
  daysLeftOverride,
  recruitingDate,
  graduationDate,
  readiness
}: CountdownWidgetProps) {
  const [daysLeft, setDaysLeft] = useState(daysLeftOverride ?? 0);
  const [status, setStatus] = useState<"prep" | "window" | "late">("prep");

  const userReadiness = readiness ?? 0;

  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const windowStartThisYear = new Date(currentYear, 7, 1);
    const windowEndThisYear = new Date(currentYear + 1, 2, 31);

    const windowStart =
      today >= windowStartThisYear
        ? windowStartThisYear
        : today <= windowEndThisYear
          ? new Date(currentYear - 1, 7, 1)
          : windowStartThisYear;
    const windowEnd =
      windowStart.getFullYear() === currentYear
        ? new Date(currentYear + 1, 2, 31)
        : windowEndThisYear;

    if (today >= windowStart && today <= windowEnd) {
      setStatus("window");
      const diffTime = Math.abs(windowEnd.getTime() - today.getTime());
      setDaysLeft(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else {
      setStatus("prep");
      const targetDate = windowStartThisYear;
      const diffTime = Math.abs(targetDate.getTime() - today.getTime());
      const computed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysLeft(typeof daysLeftOverride === "number" ? daysLeftOverride : computed);
    }
  }, [daysLeftOverride]);

  const recruitingLabel = useMemo(() => {
    if (recruitingDate) {
      const [year, month, day] = recruitingDate.split("-").map(Number);
      if (year && month && day) {
        const date = new Date(Date.UTC(year, month - 1, day));
        return `Recruiting Window opens on ${date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          timeZone: "UTC"
        })}`;
      }
    }
    return "Recruiting Window opens on August 1st";
  }, [recruitingDate]);

  const content = (() => {
    if (status === "window") {
      if (userReadiness > 70) {
        return {
          title: "Recruiting is LIVE! 🚨",
          subtitle: "You are ready. Apply now!",
          color: "bg-emerald-600",
          icon: Zap
        };
      }
      return {
        title: "Recruiting is LIVE! ⚠️",
        subtitle: "Prioritize 'Easy Apply' & finish your Resume ASAP.",
        color: "bg-amber-600",
        icon: AlertCircle
      };
    }

    return {
      title: "Next Window Opens in:",
      subtitle: recruitingLabel,
      color: "bg-slate-900",
      icon: Clock
    };
  })();

  return (
    <div
      className={`${status === "window" ? content.color : "bg-slate-900"} text-white rounded-xl shadow-lg p-6 relative overflow-hidden h-full flex flex-col justify-between`}
    >
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white rounded-full opacity-5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500 rounded-full opacity-10 blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 text-white/70 mb-4 font-medium text-sm uppercase tracking-wider">
          <content.icon size={16} />
          <span>Status: {status === "window" ? "Active Season" : "Prep Season"}</span>
        </div>

        <h3 className="text-xl font-semibold mb-2">{content.title}</h3>

        {status !== "window" && (
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-bold tracking-tight text-white">{daysLeft}</span>
            <span className="text-xl text-slate-400 mb-1.5">Days</span>
          </div>
        )}

        <p className="text-white/60 text-sm mb-6 flex items-center gap-2">
          <Calendar size={14} />
          {content.subtitle}
        </p>

        <div className="h-px bg-white/10 w-full mb-6"></div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Graduation Date</p>
            <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg border border-white/10">
              <span className="font-medium text-white">{formatMonthYear(graduationDate)}</span>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded">Junior</span>
            </div>
          </div>

          {status === "prep" && (
            <div className="bg-indigo-500/20 border border-indigo-500/30 p-3 rounded-lg flex gap-3 items-start">
              <Briefcase size={16} className="text-indigo-300 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-100 leading-relaxed">
                Use this time to build projects and grind LeetCode. Don&apos;t wait until August!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
