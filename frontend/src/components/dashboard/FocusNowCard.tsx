"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CircleDot } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { JourneyModule, ModuleProgress } from "@/components/dashboard/types";

type TaskItem = {
  id: number;
  title: string;
  description: string | null;
  weight: number;
  is_bonus: boolean;
  is_completed: boolean;
};

type TasksResponse = {
  module_key: string;
  tasks: TaskItem[];
};

type FocusNowCardProps = {
  moduleProgress: ModuleProgress[];
  journeyModules: JourneyModule[];
  nextAction: string | null;
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

function formatDateLabel(value: string | null): string {
  if (!value) return "No deadline";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No deadline";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function deadlineLabel(daysToTarget: number | null): string {
  if (daysToTarget === null) return "No deadline";
  if (daysToTarget === 0) return "Due today";
  if (daysToTarget > 0) return `${daysToTarget} days left`;
  return `${Math.abs(daysToTarget)} days overdue`;
}

export default function FocusNowCard({ moduleProgress, journeyModules, nextAction }: FocusNowCardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentModule = useMemo(() => {
    const journeyCurrent = journeyModules.find((module) => module.status === "current");
    if (journeyCurrent) {
      return moduleProgress.find((item) => item.module_key === journeyCurrent.module_key) ?? null;
    }
    return moduleProgress.find((item) => item.has_tasks && item.score < item.unlock_threshold) ?? null;
  }, [journeyModules, moduleProgress]);

  const currentJourneyModule = useMemo(() => {
    if (!currentModule) return null;
    return journeyModules.find((module) => module.module_key === currentModule.module_key) ?? null;
  }, [currentModule, journeyModules]);

  const ctaHref = MODULE_ROUTE_BY_KEY[currentModule?.module_key ?? ""] ?? "/dashboard";
  const clampedScore = Math.max(0, Math.min(100, currentModule?.score ?? 0));
  const displayGoal = Math.max(0, Math.min(100, currentModule?.unlock_threshold ?? 80));

  useEffect(() => {
    if (!currentModule || !currentModule.has_tasks) {
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    apiRequest<TasksResponse>(`/dashboard/tasks?module_key=${encodeURIComponent(currentModule.module_key)}`)
      .then((payload) => {
        if (!active) return;
        setTasks(payload.tasks ?? []);
      })
      .catch(() => {
        if (!active) return;
        setTasks([]);
        setError("Could not load module tasks.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentModule]);

  const completedTasksCount = useMemo(() => tasks.filter((task) => task.is_completed).length, [tasks]);
  const paceLabel = useMemo(() => {
    const days = currentJourneyModule?.days_to_target;
    if (days === null || days === undefined) return "in progress";
    if (days < 0) return "behind";
    return "on track";
  }, [currentJourneyModule?.days_to_target]);
  const progressLine = useMemo(() => {
    if (tasks.length > 0) {
      return `${completedTasksCount} of ${tasks.length} tasks complete • ${paceLabel}`;
    }
    return `${clampedScore}% complete • ${paceLabel}`;
  }, [clampedScore, completedTasksCount, paceLabel, tasks.length]);

  if (!currentModule) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900">Focus Now</h3>
        <p className="mt-2 text-sm text-slate-600">All tracked modules are complete. Keep applying and iterating.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="bg-indigo-700 px-5 py-3.5 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
              <CircleDot size={14} />
              Focus Right Now
            </p>
            <h3 className="mt-1.5 text-xl font-semibold leading-tight">{currentModule.module_name}</h3>
            <p className="mt-1 text-sm text-indigo-100">{progressLine}</p>
          </div>
          <div className="w-full rounded-lg border border-indigo-400/60 bg-white/10 px-4 py-2 text-left sm:w-auto sm:shrink-0 sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">Deadline</p>
            <p className="mt-1 text-xl font-semibold leading-none">
              {formatDateLabel(currentJourneyModule?.target_date ?? null)}
            </p>
            <p
              className={`mt-1 text-xs font-medium ${
                (currentJourneyModule?.days_to_target ?? 0) < 0 ? "text-rose-200" : "text-indigo-100"
              }`}
            >
              {deadlineLabel(currentJourneyModule?.days_to_target ?? null)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <div className="mb-2 flex items-end justify-between">
            <p className="text-base font-medium text-slate-600">
              Progress toward {displayGoal}% milestone
            </p>
            <p className="text-lg font-semibold text-indigo-700">
              {clampedScore}% <span className="font-medium text-slate-300">/ {displayGoal}%</span>
            </p>
          </div>
          <div className="relative h-4 rounded-full bg-indigo-100/80">
            <div className="h-4 rounded-full bg-indigo-700 transition-all duration-500" style={{ width: `${clampedScore}%` }} />
            <div
              className="pointer-events-none absolute -top-1 bottom-0 w-0.5 -translate-x-1/2 rounded bg-slate-500"
              style={{ left: `${displayGoal}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-800">Next actions</p>
            <p className="text-base text-slate-400">
              {tasks.length > 0 ? `${completedTasksCount}/${tasks.length} done` : "0/0 done"}
            </p>
          </div>
          {loading ? <p className="text-sm text-slate-500">Loading tasks...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!loading && !error && tasks.length === 0 ? (
            nextAction ? (
              <ol className="space-y-3">
                <li className="flex items-center gap-3 rounded-lg border border-indigo-100 px-3 py-2.5 text-sm text-slate-700">
                  <span className="h-4 w-4 shrink-0 rounded-md border-2 border-indigo-300" />
                  <span className="leading-tight">{nextAction}</span>
                </li>
              </ol>
            ) : (
              <p className="text-sm text-slate-500">No pending tasks for this module right now.</p>
            )
          ) : null}
          {!loading && !error && tasks.length > 0 ? (
            <ol className="space-y-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                    task.is_completed
                      ? "border-emerald-200 bg-emerald-50/40 text-slate-500"
                      : "border-indigo-100 text-slate-700"
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 ${
                      task.is_completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-indigo-300"
                    }`}
                    aria-hidden="true"
                  >
                    {task.is_completed ? <Check size={10} /> : null}
                  </span>
                  <span className={`leading-tight ${task.is_completed ? "line-through" : ""}`}>{task.title}</span>
                  {task.is_completed ? (
                    <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Completed
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        <Link
          href={ctaHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800"
        >
          Open {currentModule.module_name} module
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
