"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReadinessWidget from "@/components/ReadinessWidget";
import CountdownWidget from "@/components/CountdownWidget";
import QuickResourcesWidget from "@/components/QuickResourcesWidget";
import SkillPlacementOnboardingModal from "@/components/SkillPlacementOnboardingModal";
import FocusNowCard from "@/components/dashboard/FocusNowCard";
import JourneyTimeline from "@/components/dashboard/JourneyTimeline";
import { apiRequest } from "@/lib/api";
import type { DashboardSummary, RebaselineResponse } from "@/components/dashboard/types";

type DashboardTab = "today" | "journey";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSkillPlacementModal, setShowSkillPlacementModal] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("today");
  const [isRebaselining, setIsRebaselining] = useState(false);

  const leetcodeReadiness = useMemo(
    () => summary?.module_progress.find((module) => module.module_key === "leetcode")?.score ?? 0,
    [summary],
  );

  const loadDashboardSummary = useCallback(async () => {
    try {
      const data = await apiRequest<DashboardSummary>("/dashboard/summary");
      setSummary(data);
      setError(null);
    } catch {
      setError("Failed to load dashboard data.");
    }
  }, []);

  useEffect(() => {
    void loadDashboardSummary();
  }, [loadDashboardSummary]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const shouldOpenPlacementModal = url.searchParams.get("welcome_assessment") === "1";
    if (!shouldOpenPlacementModal) return;

    setShowSkillPlacementModal(true);
    url.searchParams.delete("welcome_assessment");
    const nextSearch = url.searchParams.toString();
    const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  const rebaselineTimeline = useCallback(async () => {
    setIsRebaselining(true);
    try {
      const response = await apiRequest<RebaselineResponse>("/dashboard/journey/rebaseline", { method: "POST" });
      setSummary((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          progress: response.progress,
          category_readiness: response.category_readiness,
          module_progress: response.module_progress,
          next_action: response.next_action,
          journey: response.journey,
        };
      });
      setError(null);
    } catch {
      setError("Failed to rebaseline timeline.");
    } finally {
      setIsRebaselining(false);
    }
  }, []);

  const readyThreshold = summary?.journey?.readiness_threshold ?? summary?.recruiting?.ready_threshold ?? 62;

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Good afternoon{summary?.user_name ? `, ${summary.user_name}` : ""}!
          </h1>
          <p className="text-slate-500">You're making progress toward your internship goal.</p>
        </div>

        <div className="border-b border-slate-200">
          <nav className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === "today"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("journey")}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === "journey"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              My Journey
            </button>
          </nav>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {activeTab === "today" ? (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <ReadinessWidget
                progress={summary?.progress ?? 0}
                readinessThreshold={readyThreshold}
                categories={{
                  ...(summary?.category_readiness ?? { coding: 0, projects: 0, resume: 0 }),
                  leetcode: leetcodeReadiness,
                }}
              />

              <FocusNowCard
                moduleProgress={summary?.module_progress ?? []}
                journeyModules={summary?.journey?.modules ?? []}
                nextAction={summary?.next_action ?? null}
              />
            </div>

            <div className="space-y-6 lg:col-span-1">
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
        ) : (
          <JourneyTimeline
            journey={summary?.journey ?? null}
            onRebaseline={rebaselineTimeline}
            rebasing={isRebaselining}
          />
        )}
      </div>

      <SkillPlacementOnboardingModal
        open={showSkillPlacementModal}
        onClose={() => {
          setShowSkillPlacementModal(false);
          void loadDashboardSummary();
        }}
        userName={summary?.user_name}
      />
    </>
  );
}
