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
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex-1 flex flex-col min-h-[420px] sm:min-h-[520px]">
      <div className="overflow-x-auto">
        <div className="min-w-[520px] sm:min-w-[680px]">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 divide-x divide-y divide-slate-200"
            style={{ gridAutoRows: "minmax(72px, 1fr)" }}
          >
            {days.map((day, index) => {
              const dayTasks = onGetTasksForDate(day.date);
              const isCurrentDay = onIsToday(day.date);

              return (
                <div
                  key={index}
                  className={`p-2 ${
                    day.isCurrentMonth
                      ? isCurrentDay
                        ? "bg-blue-50 ring-1 ring-inset ring-blue-600"
                        : "bg-white"
                      : "bg-slate-50"
                  }`}
                >
                  <div
                    className={`text-right text-xs sm:text-sm font-bold ${
                      day.isCurrentMonth
                        ? isCurrentDay
                          ? "text-blue-600"
                          : "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {isCurrentDay ? (
                      <span className="bg-blue-600 text-white size-6 inline-flex items-center justify-center rounded-full -mr-1">
                        {day.date.getDate()}
                      </span>
                    ) : (
                      day.date.getDate()
                    )}
                  </div>

                  {!loading && dayTasks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dayTasks.slice(0, 2).map((task) => {
                        const taskColor = onGetTaskColor(task);
                        return (
                          <div
                            key={task.id}
                            className={`${TASK_COLOR_CLASSES[taskColor as keyof typeof TASK_COLOR_CLASSES] || TASK_COLOR_CLASSES.blue} text-[11px] px-2 py-1 rounded border-l-2 font-medium truncate cursor-pointer hover:opacity-80`}
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
                        <div className="text-[10px] text-slate-500 font-medium">
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
