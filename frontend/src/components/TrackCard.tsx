export default function TrackCard() {
  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-soft border border-white/60">
      <p className="text-sm text-slate-500">Current Track</p>
      <h2 className="mt-2 text-xl font-semibold">Beginner Track</h2>
      <p className="mt-2 text-xs text-slate-500">
        Focus: core CS + portfolio foundations.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-600">Data structures</span>
        <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-600">Projects</span>
        <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-600">Resume basics</span>
      </div>
    </div>
  );
}
