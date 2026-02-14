"use client";

import { useEffect, useState } from "react";
import ReadinessWidget from "@/components/ReadinessWidget";
import CountdownWidget from "@/components/CountdownWidget";
import ActionItemsWidget from "@/components/ActionItemsWidget";
import QuickResourcesWidget from "@/components/QuickResourcesWidget";
import { apiRequest } from "@/lib/api";

type ModuleProgress = {
  module_key: string;
  module_name: string;
  score: number;
  is_unlocked: boolean;
  unlock_threshold: number;
  has_tasks: boolean;
  has_bonus_tasks: boolean;
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

type DashboardSummary = {
  user_name: string | null;
  progress: number;
  category_readiness: {
    coding: number;
    projects: number;
    resume: number;
  };
  module_progress: ModuleProgress[];
  next_action: string | null;
  season_status: "prep" | "window";
  days_until_recruiting: number;
  recruiting_date: string;
  days_until_window_close: number | null;
  recruiting_window_end: string | null;
  graduation_date: string | null;
  recruiting: RecruitingSummary;
};

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<DashboardSummary>("/dashboard/summary")
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setError("Failed to load dashboard data.");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good afternoon{summary?.user_name ? `, ${summary.user_name}` : ""}! 👋
          </h1>
          <p className="text-slate-500">You're making great progress toward your internship goal.</p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ReadinessWidget
            progress={summary?.progress ?? 0}
            categories={summary?.category_readiness}
          />
          <ActionItemsWidget
            moduleProgress={summary?.module_progress ?? []}
            nextAction={summary?.next_action ?? null}
          />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <CountdownWidget
            seasonStatus={summary?.season_status}
            daysUntilRecruiting={summary?.days_until_recruiting}
            recruitingDate={summary?.recruiting_date}
            daysUntilWindowClose={summary?.days_until_window_close}
            recruitingWindowEnd={summary?.recruiting_window_end}
            graduationDate={summary?.graduation_date}
            readiness={summary?.progress}
            recruiting={summary?.recruiting}
          />
          <QuickResourcesWidget />
        </div>
      </div>
    </div>
  );
}
