type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  badge?: string;
  accent?: string;
};

export default function StatCard({ title, value, subtitle, badge, accent }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white/80 p-5 shadow-soft border border-white/60">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        {badge ? (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
