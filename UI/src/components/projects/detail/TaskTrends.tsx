import React, { useMemo } from "react";
import { Task } from "../../../types/task";

interface TaskTrendsProps {
  tasks: Task[];
}

const TaskTrends: React.FC<TaskTrendsProps> = ({ tasks }) => {
  const trendData = useMemo(() => {
    const today = new Date();
    const weeks = Array.from({ length: 6 }).map((_, i) => {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (5 - i) * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const completed = tasks.filter((task) => {
        if (task.status !== "Done") return false;
        const ts = new Date(task.updatedAt || task.createdAt);
        return ts >= weekStart && ts <= weekEnd;
      }).length;

      const created = tasks.filter((task) => {
        const ts = new Date(task.createdAt);
        return ts >= weekStart && ts <= weekEnd;
      }).length;

      return {
        label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        completed,
        created,
      };
    });

    const maxValue = Math.max(...weeks.map((week) => Math.max(week.completed, week.created, 1)));
    const totalActivity = weeks.reduce((sum, week) => sum + week.completed + week.created, 0);
    return { weeks, maxValue, totalActivity };
  }, [tasks]);

  // Don't render if there's no meaningful activity
  if (trendData.totalActivity === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Task Trends</h3>
        <p className="text-xs text-slate-500">Last 6 weeks</p>
      </div>

      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {trendData.weeks.map((week) => {
          const createdHeight = Math.max(6, (week.created / trendData.maxValue) * 60);
          const completedHeight = Math.max(6, (week.completed / trendData.maxValue) * 60);

          return (
            <div key={week.label} className="flex flex-col items-center gap-1.5">
              <div className="h-16 w-full rounded bg-slate-50 border border-slate-100 px-1 py-1.5 flex items-end justify-center gap-0.5">
                <div
                  className="w-2 rounded-t bg-blue-400"
                  style={{ height: `${createdHeight}%` }}
                  title={`Created: ${week.created}`}
                />
                <div
                  className="w-2 rounded-t bg-emerald-500"
                  style={{ height: `${completedHeight}%` }}
                  title={`Completed: ${week.completed}`}
                />
              </div>
              <span className="text-[9px] font-medium text-slate-500">{week.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-blue-400" /> Created
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Completed
        </span>
      </div>
    </section>
  );
};

export default TaskTrends;
