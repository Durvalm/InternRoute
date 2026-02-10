const tasks = [
  { title: "Solve 2 medium LeetCode problems", tag: "Coding" },
  { title: "Add metrics to resume bullet #3", tag: "Resume" },
  { title: "Ship portfolio project to GitHub", tag: "Projects" },
  { title: "Apply to 3 new positions", tag: "Applications" },
  { title: "Practice STAR method for behavioral", tag: "Interviews" }
];

export default function TaskList() {
  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-soft border border-white/60">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Next Tasks</h2>
        <span className="text-xs text-slate-500">4 remaining</span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.title} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full border border-slate-300" />
              <p className="text-sm text-slate-700">{task.title}</p>
            </div>
            <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-600">
              {task.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
