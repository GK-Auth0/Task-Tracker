import React from "react";
import { TASK_COLOR_CLASSES } from "./calendarColors";
import { CalendarDayCell, CalendarTask } from "./types";

interface CalendarMonthGridProps {
  days: CalendarDayCell[];
  loading: boolean;
  calendarType: "personal" | "team";
  onGetTasksForDate: (date: Date) => CalendarTask[];
  onGetTaskColor: (task: CalendarTask) => string;
  onIsToday: (date: Date) => boolean;
}

const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  days,
  loading,
  calendarType,
  onGetTasksForDate,
  onGetTaskColor,
  onIsToday,
}) => {
  const mobileDays = days.filter((day) => day.isCurrentMonth);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[380px] sm:min-h-[460px]">
      <div className="sm:hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Month Overview
          </p>
          <p className="mt-1 text-sm text-slate-600">
            All due dates stay visible on mobile without horizontal scrolling.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 p-3">
          {mobileDays.map((day) => {
            const dayTasks = onGetTasksForDate(day.date);
            const isCurrentDay = onIsToday(day.date);

            return (
              <section
                key={day.date.toISOString()}
                className={`rounded-xl border p-3 ${
                  isCurrentDay
                    ? "border-blue-200 bg-blue-50/70"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                      {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {day.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {isCurrentDay && (
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      Today
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  {loading ? (
                    <p className="text-sm text-slate-500">Loading tasks...</p>
                  ) : dayTasks.length === 0 ? (
                    <p className="text-sm text-slate-400">No scheduled tasks.</p>
                  ) : (
                    <div className="space-y-2">
                      {dayTasks.map((task) => {
                        const taskColor = onGetTaskColor(task);
                        return (
                          <div
                            key={task.id}
                            className={`${TASK_COLOR_CLASSES[taskColor as keyof typeof TASK_COLOR_CLASSES] || TASK_COLOR_CLASSES.blue} rounded-lg border-l-2 px-3 py-2 text-xs font-medium`}
                            title={
                              calendarType === "team" && task.assignee
                                ? `${task.assignee.full_name}: ${task.title}`
                                : task.title
                            }
                          >
                            <p className="truncate">
                              {calendarType === "team" && task.assignee
                                ? `${task.assignee.full_name.split(" ")[0]}: ${task.title}`
                                : task.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="w-full">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="px-1 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500 lg:text-xs"
              >
                <span className="md:hidden">{day.slice(0, 1)}</span>
                <span className="hidden md:inline">{day}</span>
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 border-b border-slate-200 divide-x divide-y divide-slate-200"
            style={{ gridAutoRows: "minmax(84px, auto)" }}
          >
            {days.map((day, index) => {
              const dayTasks = onGetTasksForDate(day.date);
              const isCurrentDay = onIsToday(day.date);

              return (
                <div
                  key={index}
                  className={`min-w-0 p-1 lg:p-1.5 ${
                    day.isCurrentMonth
                      ? isCurrentDay
                        ? "bg-blue-50 ring-1 ring-inset ring-blue-600"
                        : "bg-white"
                      : "bg-slate-50"
                  }`}
                >
                  <div
                    className={`text-right text-[11px] font-bold sm:text-xs lg:text-sm ${
                      day.isCurrentMonth
                        ? isCurrentDay
                          ? "text-blue-600"
                          : "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {isCurrentDay ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[11px] text-white sm:size-6 sm:text-xs lg:text-sm -mr-1">
                        {day.date.getDate()}
                      </span>
                    ) : (
                      day.date.getDate()
                    )}
                  </div>

                  {!loading && dayTasks.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {dayTasks.slice(0, 2).map((task) => {
                        const taskColor = onGetTaskColor(task);
                        return (
                          <div
                            key={task.id}
                            className={`${TASK_COLOR_CLASSES[taskColor as keyof typeof TASK_COLOR_CLASSES] || TASK_COLOR_CLASSES.blue} cursor-pointer truncate rounded border-l-2 px-1.5 py-0.5 text-[10px] font-medium hover:opacity-80 lg:px-2`}
                            title={
                              calendarType === "team" && task.assignee
                                ? `${task.assignee.full_name}: ${task.title}`
                                : task.title
                            }
                          >
                            {calendarType === "team" && task.assignee
                              ? `${task.assignee.full_name.split(" ")[0]}: ${task.title}`
                              : task.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-[10px] font-medium text-slate-500">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarMonthGrid;
