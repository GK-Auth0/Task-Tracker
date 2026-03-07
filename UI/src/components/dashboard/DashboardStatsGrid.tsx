import React from "react";
import { DashboardOverview } from "../../services/dashboard";

interface DashboardStatsGridProps {
  overview: DashboardOverview | null;
}

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ overview }) => {
  const items = [
    {
      title: "Total Tasks",
      value: overview?.summary.total_tasks || 0,
      tone: "border-slate-200 bg-white text-slate-900",
      icon: "checklist",
    },
    {
      title: "Open Tasks",
      value: overview?.metrics.open_tasks || 0,
      tone: "border-blue-200 bg-blue-50 text-blue-800",
      icon: "pending_actions",
    },
    {
      title: "Due Today",
      value: overview?.metrics.due_today || 0,
      tone: "border-amber-200 bg-amber-50 text-amber-800",
      icon: "today",
    },
    {
      title: "High Priority",
      value: overview?.metrics.high_priority_upcoming || 0,
      tone: "border-rose-200 bg-rose-50 text-rose-800",
      icon: "priority_high",
    },
    {
      title: "Completion",
      value: `${overview?.summary.completion_rate || 0}%`,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      icon: "task_alt",
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <div key={item.title} className={`rounded-xl border p-4 ${item.tone}`}>
          <p className="text-xs uppercase tracking-wide font-bold opacity-80">
            {item.title}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-3xl font-black">{item.value}</p>
            <span className="material-symbols-outlined opacity-70">{item.icon}</span>
          </div>
        </div>
      ))}
    </section>
  );
};

export default DashboardStatsGrid;
