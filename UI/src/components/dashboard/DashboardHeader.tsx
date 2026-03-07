import React from "react";
import { DashboardOverview } from "../../services/dashboard";

interface DashboardHeaderProps {
  overview: DashboardOverview | null;
  onOpenTasks: () => void;
  onRefresh: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  overview,
  onOpenTasks,
  onRefresh,
}) => {
  const totalTasks = overview?.summary.total_tasks || 0;
  const overdueTasks = overview?.summary.overdue_tasks || 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-gray-900 text-2xl sm:text-3xl font-black tracking-tight">
            Dashboard
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            You have {totalTasks} tasks with {overdueTasks} overdue.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onOpenTasks}
            className="h-10 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            Open Task Board
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeader;
