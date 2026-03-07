import React from "react";
import { AiDayPlan } from "../../services/aiAssistant";
import { TaskItem } from "./types";

interface TasksAiTabProps {
  canCreateTask: boolean;
  planning: boolean;
  planError: string;
  dayPlan: AiDayPlan | null;
  visibleTasks: TaskItem[];
  onBuildDailyPlan: () => void;
}

const TasksAiTab: React.FC<TasksAiTabProps> = ({
  canCreateTask,
  planning,
  planError,
  dayPlan,
  visibleTasks,
  onBuildDailyPlan,
}) => {
  return (
    <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            AI Day Planner
          </p>
          <p className="text-xs text-blue-900/80 mt-1">
            Generate a focused execution plan from your current task list.
          </p>
        </div>
        <button
          type="button"
          onClick={onBuildDailyPlan}
          disabled={!canCreateTask || planning || visibleTasks.length === 0}
          className="h-9 px-4 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
        >
          {planning ? "Planning..." : "Generate Plan"}
        </button>
      </div>

      {planError && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          {planError}
        </p>
      )}

      {dayPlan && (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today Plan ({dayPlan.planned_hours}h)
            </p>
            <ul className="mt-2 space-y-1">
              {dayPlan.today_plan.slice(0, 6).map((task) => (
                <li key={task.title} className="text-sm text-slate-700">
                  • {task.title}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Tip</p>
            <p className="mt-2 text-sm text-slate-700">{dayPlan.tip}</p>
            <p className="mt-2 text-xs text-slate-500">Backlog tasks: {dayPlan.backlog.length}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default TasksAiTab;
