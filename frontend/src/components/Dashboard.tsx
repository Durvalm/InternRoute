import ReadinessWidget from "@/components/ReadinessWidget";
import CountdownWidget from "@/components/CountdownWidget";
import ActionItemsWidget from "@/components/ActionItemsWidget";
import QuickResourcesWidget from "@/components/QuickResourcesWidget";

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good afternoon, Alex! 👋</h1>
          <p className="text-slate-500">You're making great progress toward your internship goal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ReadinessWidget />
          <ActionItemsWidget />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <CountdownWidget />
          <QuickResourcesWidget />
        </div>
      </div>
    </div>
  );
}
