"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Circle, Plus } from "lucide-react";

export default function ActionItemsWidget() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Complete 'Timeline' module", status: "pending", priority: "high", category: "Strategy" },
    { id: 2, title: "Solve LeetCode #1 (Two Sum)", status: "pending", priority: "medium", category: "Coding" },
    { id: 3, title: "Draft Resume Summary", status: "completed", priority: "medium", category: "Resume" }
  ]);

  const toggleTask = (id: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, status: task.status === "completed" ? "pending" : "completed" }
          : task
      )
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Next Steps</h3>
        <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className="p-2 flex-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            onClick={() => toggleTask(task.id)}
          >
            <button
              className={`mt-0.5 shrink-0 transition-colors ${
                task.status === "completed" ? "text-emerald-500" : "text-slate-300 group-hover:text-indigo-500"
              }`}
            >
              {task.status === "completed" ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            <div className="flex-1">
              <p
                className={`text-sm font-medium transition-all ${
                  task.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"
                }`}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {task.category}
                </span>
                {task.priority === "high" && (
                  <span className="text-[10px] uppercase font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    High Priority
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        <button className="w-full mt-2 py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm font-medium hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2">
          <Plus size={16} />
          Add Custom Task
        </button>
      </div>
    </div>
  );
}
