export default function RegisterPage() {
  return (
    <div className="rounded-2xl bg-white/90 p-8 shadow-soft border border-white/60">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-slate-500">Start building your internship plan.</p>

      <form className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600">Email</label>
          <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="you@school.edu" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Password</label>
          <input type="password" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Create a secure password" />
        </div>
        <button className="w-full rounded-xl bg-night text-white py-3 text-sm font-semibold">Create account</button>
      </form>
    </div>
  );
}
