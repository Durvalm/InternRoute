"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
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

type ActionItemsWidgetProps = {
  moduleProgress: ModuleProgress[];
  nextAction: string | null;
};

export default function ActionItemsWidget({ moduleProgress, nextAction }: ActionItemsWidgetProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentModule = useMemo(() => {
    const unlocked = moduleProgress.filter((module) => module.is_unlocked);
    if (!unlocked.length) return null;
    const withTasks = unlocked.find((module) => module.has_tasks);
    return withTasks ?? unlocked[0];
  }, [moduleProgress]);

  useEffect(() => {
    if (!currentModule) {
      setTasks([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    apiRequest<TasksResponse>(`/dashboard/tasks?module_key=${encodeURIComponent(currentModule.module_key)}`)
      .then((data) => {
        if (active) setTasks(data.tasks ?? []);
      })
      .catch(() => {
        if (active) {
          setTasks([]);
          setError("Failed to load tasks.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentModule]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">Next Steps</h3>
        <p className="mt-1 text-sm text-slate-500">{nextAction ?? "No tasks available yet"}</p>
      </div>

      <div className="p-4 border-b border-slate-100">
        <div className="flex flex-wrap gap-2">
          {moduleProgress.map((module) => (
            <span
              key={module.module_key}
              className={`text-[11px] px-2 py-1 rounded-full border ${
                module.is_unlocked
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              {module.module_name}: {module.score}% {module.is_unlocked ? "" : "(Locked)"}
            </span>
          ))}
        </div>
      </div>

      <div className="p-2 flex-1">
        {currentModule ? (
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {currentModule.module_name}
          </p>
        ) : null}

        {loading ? <p className="px-3 py-2 text-sm text-slate-500">Loading tasks...</p> : null}
        {error ? <p className="px-3 py-2 text-sm text-red-500">{error}</p> : null}

        {!loading && !error && currentModule && tasks.length === 0 ? (
          <div className="px-3 py-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-sm font-medium text-slate-700">No tasks yet for this module.</p>
            <p className="text-xs text-slate-500 mt-1">Tasks will appear as we add them.</p>
          </div>
        ) : null}

        {!loading && !error && !currentModule ? (
          <div className="px-3 py-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-sm font-medium text-slate-700">No tasks available yet.</p>
            <p className="text-xs text-slate-500 mt-1">Tasks will appear as modules are configured.</p>
          </div>
        ) : null}

        {!loading && !error
          ? tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-transparent">
                <span
                  className={`mt-0.5 shrink-0 ${
                    task.is_completed ? "text-emerald-500" : "text-slate-300"
                  }`}
                >
                  {task.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </span>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      task.is_completed ? "text-slate-400 line-through" : "text-slate-700"
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {task.weight} pts
                    </span>
                    {task.is_bonus ? (
                      <span className="text-[10px] uppercase font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        Bonus
                      </span>
                    ) : null}
                  </div>
                  {task.description ? <p className="text-xs text-slate-500 mt-1">{task.description}</p> : null}
                </div>
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
