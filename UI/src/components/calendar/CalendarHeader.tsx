import React from "react";
import { CalendarTask } from "./types";

interface CalendarHeaderProps {
  calendarType: "personal" | "team";
  currentDate: Date;
  viewMode: "month" | "week" | "day";
  tasks: CalendarTask[];
  monthNames: string[];
  onCalendarTypeChange: (type: "personal" | "team") => void;
  onViewModeChange: (mode: "month" | "week" | "day") => void;
  onNavigateMonth: (direction: "prev" | "next") => void;
  onGoToToday: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  calendarType,
  currentDate,
  viewMode,
  tasks,
  monthNames,
  onCalendarTypeChange,
  onViewModeChange,
  onNavigateMonth,
  onGoToToday,
}) => {
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();
  const monthlyTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const date = new Date(task.due_date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  }).length;

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {calendarType === "personal" ? "My Calendar" : "Team Calendar"}
            </h2>
            <p className="text-sm text-slate-500">
              {calendarType === "personal"
                ? `Personal schedule for ${monthNames[selectedMonth]} ${selectedYear}`
                : `Team schedule for ${monthNames[selectedMonth]} ${selectedYear}`}
            </p>
          </div>
          <div className="hidden sm:block h-10 w-px bg-slate-200"></div>
          <div className="flex w-full flex-wrap items-center gap-2 rounded-lg bg-slate-100 p-1 sm:w-fit">
            <button
              onClick={() => onCalendarTypeChange("personal")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                calendarType === "personal"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => onCalendarTypeChange("team")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                calendarType === "team"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Team
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center justify-between gap-1 sm:justify-start sm:pr-3 sm:mr-3 sm:border-r border-slate-200">
            <button
              onClick={() => onNavigateMonth("prev")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={onGoToToday}
              className="px-3 py-1 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-900"
            >
              Today
            </button>
            <button
              onClick={() => onNavigateMonth("next")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                  viewMode === mode
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-500">
        {monthlyTasks} tasks due this month
      </div>
    </div>
  );
};

export default CalendarHeader;
