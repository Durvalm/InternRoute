export default function MilestoneCard() {
  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-soft border border-white/60">
      <p className="text-sm text-slate-500">Next Milestone</p>
      <h2 className="mt-2 text-lg font-semibold">Ship Project #1</h2>
      <p className="mt-2 text-xs text-slate-500">
        Build a simple web app and publish to GitHub + portfolio.
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Target week</span>
        <span className="font-semibold text-slate-700">Week 4</span>
      </div>
    </div>
  );
}
