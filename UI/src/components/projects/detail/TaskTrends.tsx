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
    return { weeks, maxValue };
  }, [tasks]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900">Task Trends</h3>
        <p className="text-xs text-slate-500">Last 6 weeks</p>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {trendData.weeks.map((week) => {
          const createdHeight = Math.max(8, (week.created / trendData.maxValue) * 92);
          const completedHeight = Math.max(8, (week.completed / trendData.maxValue) * 92);

          return (
            <div key={week.label} className="flex flex-col items-center gap-2">
              <div className="h-28 w-full rounded-md bg-slate-50 border border-slate-100 px-1.5 py-2 flex items-end justify-center gap-1">
                <div
                  className="w-2.5 rounded-t bg-blue-300"
                  style={{ height: `${createdHeight}%` }}
                  title={`Created: ${week.created}`}
                />
                <div
                  className="w-2.5 rounded-t bg-emerald-500"
                  style={{ height: `${completedHeight}%` }}
                  title={`Completed: ${week.completed}`}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-500">{week.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-blue-300" /> Created
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500" /> Completed
        </span>
      </div>
    </section>
  );
};

export default TaskTrends;
