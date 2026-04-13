import type { Task } from "../../../types/task";
import { TASK_STATUSES } from "../../../utils/taskStatus";

export type RoadmapViewMode = "day" | "week" | "month";

interface RoadmapStats {
  total: number;
  done: number;
  overdue: number;
  dueThisWeek: number;
}

interface RoadmapGroup {
  key: string;
  title: string;
  tasks: Task[];
}

interface ProjectRoadmapTabProps {
  viewMode: RoadmapViewMode;
  offset: number;
  rangeLabel: string;
  roadmapStats: RoadmapStats;
  roadmapQuery: string;
  roadmapStatusFilter: "all" | (typeof TASK_STATUSES)[number];
  roadmapPriorityFilter: "all" | "high" | "medium" | "low";
  roadmapHideCompleted: boolean;
  roadmapLoading: boolean;
  tabError: string;
  filteredRoadmapTasks: Task[];
  roadmapGroups: RoadmapGroup[];
  onViewModeChange: (mode: RoadmapViewMode) => void;
  onOffsetChange: (nextOffset: number) => void;
  onResetOffset: () => void;
  onRoadmapQueryChange: (value: string) => void;
  onRoadmapStatusFilterChange: (
    value: "all" | (typeof TASK_STATUSES)[number],
  ) => void;
  onRoadmapPriorityFilterChange: (value: "all" | "high" | "medium" | "low") => void;
  onRoadmapHideCompletedChange: (value: boolean) => void;
  onOpenTask: (taskId: string) => void;
}

export default function ProjectRoadmapTab({
  viewMode,
  offset,
  rangeLabel,
  roadmapStats,
  roadmapQuery,
  roadmapStatusFilter,
  roadmapPriorityFilter,
  roadmapHideCompleted,
  roadmapLoading,
  tabError,
  filteredRoadmapTasks,
  roadmapGroups,
  onViewModeChange,
  onOffsetChange,
  onResetOffset,
  onRoadmapQueryChange,
  onRoadmapStatusFilterChange,
  onRoadmapPriorityFilterChange,
  onRoadmapHideCompletedChange,
  onOpenTask,
}: ProjectRoadmapTabProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Roadmap Window
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">{rangeLabel}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(["day", "week", "month"] as RoadmapViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={`h-8 rounded-md px-3 text-xs font-semibold uppercase ${
                  viewMode === mode ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            onClick={() => onOffsetChange(offset - 1)}
            aria-label="Previous range"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            onClick={onResetOffset}
          >
            Today
          </button>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            onClick={() => onOffsetChange(offset + 1)}
            aria-label="Next range"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Items</p>
          <p className="mt-1 text-xl font-black text-slate-900">{roadmapStats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Completed</p>
          <p className="mt-1 text-xl font-black text-emerald-600">{roadmapStats.done}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Due This Week</p>
          <p className="mt-1 text-xl font-black text-blue-600">
            {roadmapStats.dueThisWeek}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Overdue</p>
          <p className="mt-1 text-xl font-black text-rose-600">{roadmapStats.overdue}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={roadmapQuery}
            onChange={(event) => onRoadmapQueryChange(event.target.value)}
            placeholder="Search roadmap tasks"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          />
          <select
            value={roadmapStatusFilter}
            onChange={(event) =>
              onRoadmapStatusFilterChange(
                event.target.value as "all" | (typeof TASK_STATUSES)[number],
              )
            }
            aria-label="Filter roadmap tasks by status"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">All status</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={roadmapPriorityFilter}
            onChange={(event) =>
              onRoadmapPriorityFilterChange(
                event.target.value as "all" | "high" | "medium" | "low",
              )
            }
            aria-label="Filter roadmap tasks by priority"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">All priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={roadmapHideCompleted}
              onChange={(event) => onRoadmapHideCompletedChange(event.target.checked)}
            />
            Hide completed
          </label>
        </div>
      </div>

      {roadmapLoading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Loading roadmap...
        </div>
      ) : tabError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {tabError}
        </div>
      ) : filteredRoadmapTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No scheduled tasks in this range.
        </div>
      ) : (
        <div className="space-y-4">
          {roadmapGroups.map((group) => (
            <div key={group.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {group.title}
                </h4>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {group.tasks.length}
                </span>
              </div>
              {group.tasks.map((task) => {
                const dateLabel = new Date(
                  task.dueDate || task.startDate || task.createdAt,
                ).toLocaleDateString();

                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onOpenTask(task.id)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {task.status} • {task.priority.toUpperCase()}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                        <span className="material-symbols-outlined text-sm">
                          calendar_today
                        </span>
                        {dateLabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
