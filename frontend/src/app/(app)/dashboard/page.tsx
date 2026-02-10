import StatCard from "@/components/StatCard";
import TaskList from "@/components/TaskList";
import TrackCard from "@/components/TrackCard";
import MilestoneCard from "@/components/MilestoneCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Market Status"
          value="172 days"
          subtitle="until recruiting season (Aug 1)"
          badge="Open soon"
          accent="#f59e0b"
        />
        <StatCard
          title="Graduation"
          value="May 2027"
          subtitle="Ideal timeline for Summer 2027"
          badge="On track"
          accent="#0f172a"
        />
        <StatCard
          title="Est. Ready By"
          value="Aug 2026"
          subtitle="Based on current pace"
          badge="Healthy"
          accent="#0ea5e9"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <TaskList />
        <div className="space-y-6">
          <TrackCard />
          <MilestoneCard />
        </div>
      </section>
    </div>
  );
}
