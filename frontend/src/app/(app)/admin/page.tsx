"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Loader2, ShieldAlert, Target, UserCheck, Users } from "lucide-react";
import { ApiError, apiRequest } from "@/lib/api";

type AdminSummary = {
  total_users: number;
  onboarded_users: number;
  users_with_completed_modules: number;
  avg_readiness_score: number;
  avg_completed_modules: number;
  tracked_modules_count: number;
};

type CurrentModule = {
  module_key: string;
  module_name: string;
  score: number;
  unlock_threshold: number;
  is_unlocked: boolean;
};

type CompletedModule = {
  module_key: string;
  module_name: string;
  completed_at: string | null;
};

type AdminUser = {
  id: number;
  name: string | null;
  email: string;
  created_at: string | null;
  onboarding_completed: boolean;
  readiness_score: number;
  completed_modules_count: number;
  total_modules_count: number;
  last_module_completed_at: string | null;
  current_module: CurrentModule | null;
  completed_modules: CompletedModule[];
};

type AdminEngagementResponse = {
  summary: AdminSummary;
  users: AdminUser[];
};

const EMPTY_SUMMARY: AdminSummary = {
  total_users: 0,
  onboarded_users: 0,
  users_with_completed_modules: 0,
  avg_readiness_score: 0,
  avg_completed_modules: 0,
  tracked_modules_count: 0,
};

function formatDateTime(value: string | null): string {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleString();
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString();
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setIsForbidden(false);
    setError(null);

    try {
      const data = await apiRequest<AdminEngagementResponse>("/dashboard/admin/engagement");
      setSummary(data.summary ?? EMPTY_SUMMARY);
      setUsers(data.users ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setIsForbidden(true);
        setSummary(EMPTY_SUMMARY);
        setUsers([]);
        return;
      }

      const message = err instanceof Error ? err.message : "Could not load admin dashboard.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const statCards = useMemo(
    () => [
      {
        label: "Total users",
        value: summary.total_users,
        detail: `${summary.onboarded_users} completed onboarding`,
        icon: Users,
      },
      {
        label: "Users progressing",
        value: summary.users_with_completed_modules,
        detail: "Users with at least one completed module",
        icon: UserCheck,
      },
      {
        label: "Avg readiness",
        value: `${summary.avg_readiness_score}%`,
        detail: `${summary.avg_completed_modules} modules completed on average`,
        icon: BarChart3,
      },
      {
        label: "Tracked modules",
        value: summary.tracked_modules_count,
        detail: "Modules included in progression tracking",
        icon: Target,
      },
    ],
    [summary]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Admin Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Users and module progression</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              See when users signed up, how far they have progressed, which modules they finished, and where they are currently stuck.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
            Refresh
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Last login is not shown here because the current schema does not store it.
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-white p-2 text-indigo-600">
                  <card.icon size={18} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {isForbidden ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 text-amber-700" size={20} />
            <div>
              <h2 className="text-lg font-bold text-amber-900">Superuser access required</h2>
              <p className="mt-1 text-sm text-amber-800">
                This page is only available for admin accounts configured in `SUPERUSER_EMAILS`.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading user progression...
        </div>
      ) : null}

      {!isLoading && !isForbidden ? (
        <section className="space-y-4">
          {users.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600 shadow-sm">
              No users found yet.
            </div>
          ) : null}

          {users.map((user) => (
            <article key={user.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user.name?.trim() || "No name set"}</h2>
                  <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {user.completed_modules_count}/{user.total_modules_count} modules
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Readiness {user.readiness_score}%
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      user.onboarding_completed
                        ? "border-slate-200 bg-slate-100 text-slate-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {user.onboarding_completed ? "Onboarding complete" : "Onboarding incomplete"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed up</p>
                  <p className="mt-2 font-medium text-slate-900">{formatDateTime(user.created_at)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current module</p>
                  <p className="mt-2 font-medium text-slate-900">
                    {user.current_module ? user.current_module.module_name : "All tracked modules complete"}
                  </p>
                  {user.current_module ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Score {user.current_module.score}% / unlock at {user.current_module.unlock_threshold}%
                    </p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last completed module</p>
                  <p className="mt-2 font-medium text-slate-900">{formatDateTime(user.last_module_completed_at)}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed modules</p>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      {user.completed_modules_count} completed modules
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">{user.total_modules_count} tracked in platform</p>
                </div>

                {user.completed_modules.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No module completions yet.</p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.completed_modules.map((module) => (
                      <div
                        key={`${user.id}-${module.module_key}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-slate-900">{module.module_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(module.completed_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
