export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Track Progress</span>
        <span className="font-semibold text-slate-700">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-aqua"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
