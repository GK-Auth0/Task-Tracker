import React, { useMemo } from "react";
import { CalendarTask } from "./types";

interface CalendarSidebarProps {
  tasks: CalendarTask[];
  loading: boolean;
  calendarType: "personal" | "team";
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  tasks,
  loading,
  calendarType,
}) => {
  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.due_date && new Date(task.due_date) > new Date())
        .sort(
          (a, b) =>
            new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
        )
        .slice(0, 3),
    [tasks],
  );

  return (
    <aside className="w-full xl:w-80 border-l-0 xl:border-l border-t xl:border-t-0 border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Tasks</h3>
        <div className="relative">
          <input
            className="w-full bg-white border-slate-200 rounded-lg text-sm pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-blue-600/20 shadow-sm"
            placeholder="I need to..."
            type="text"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Upcoming Deadlines
          </h3>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase">
            {calendarType}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading upcoming deadlines...</p>
        ) : upcomingTasks.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming deadlines.</p>
        ) : (
          <div className="space-y-4">
            {upcomingTasks.map((task) => {
              const dueDate = new Date(task.due_date!);
              const daysUntilDue = Math.ceil(
                (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
              );

              return (
                <div key={task.id} className="group cursor-pointer">
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white transition-all">
                    <div className="size-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-600">
                        {dueDate
                          .toLocaleDateString("en-US", { month: "short" })
                          .toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        {dueDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          schedule
                        </span>
                        Due in {daysUntilDue} day
                        {daysUntilDue !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {task.project.name}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

export default CalendarSidebar;
