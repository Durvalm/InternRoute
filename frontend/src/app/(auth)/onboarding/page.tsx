export default function OnboardingPage() {
  return (
    <div className="rounded-2xl bg-white/90 p-8 shadow-soft border border-white/60">
      <h1 className="text-2xl font-semibold">Let’s personalize your plan</h1>
      <p className="mt-2 text-sm text-slate-500">
        Tell us your current level and goals so we can build your dashboard.
      </p>

      <form className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Experience level</label>
          <select className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Graduation date</label>
          <input type="month" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        </div>
        <button className="w-full rounded-xl bg-night text-white py-3 text-sm font-semibold">Finish onboarding</button>
      </form>
    </div>
  );
}
