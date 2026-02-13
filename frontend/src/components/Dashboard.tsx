"use client";

import { useEffect, useState } from "react";
import ReadinessWidget from "@/components/ReadinessWidget";
import CountdownWidget from "@/components/CountdownWidget";
import ActionItemsWidget from "@/components/ActionItemsWidget";
import QuickResourcesWidget from "@/components/QuickResourcesWidget";
import { apiRequest } from "@/lib/api";

type DashboardSummary = {
  progress: number;
  category_readiness: {
    coding: number;
    projects: number;
    resume: number;
  };
  days_until_recruiting: number;
  recruiting_date: string;
  graduation_date: string | null;
  est_ready_by: string;
  streak_days: number;
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
          <h1 className="text-2xl font-bold text-slate-900">Good afternoon, Alex! 👋</h1>
          <p className="text-slate-500">You're making great progress toward your internship goal.</p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ReadinessWidget
            progress={summary?.progress ?? 42}
            categories={summary?.category_readiness}
          />
          <ActionItemsWidget />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <CountdownWidget
            daysLeftOverride={summary?.days_until_recruiting}
            recruitingDate={summary?.recruiting_date}
            graduationDate={summary?.graduation_date}
            readiness={summary?.progress}
          />
          <QuickResourcesWidget />
        </div>
      </div>
    </div>
  );
}
