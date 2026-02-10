import ProgressBar from "@/components/ProgressBar";

export default function Topbar() {
  return (
    <header className="px-8 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">Your internship prep cockpit</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gold/20 text-gold px-3 py-1 text-xs font-semibold">
            7 day streak
          </span>
        </div>
      </div>
      <div className="mt-6">
        <ProgressBar value={42} />
      </div>
    </header>
  );
}
