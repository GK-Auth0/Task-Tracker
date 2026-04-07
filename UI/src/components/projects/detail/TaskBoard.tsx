import React, { useMemo, useState } from "react";
import { Task } from "../../../types/task";
import { TASK_STATUSES, getTaskStatusTone, isDoneTaskStatus } from "../../../utils/taskStatus";

interface TaskBoardProps {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
}

const TASK_COLUMNS: Array<{ key: Task["status"]; label: string; icon: string; tone: string }> =
  TASK_STATUSES.map((status) => ({
    key: status,
    label: status,
    icon: getTaskStatusTone(status).icon || "radio_button_unchecked",
    tone: getTaskStatusTone(status).card,
  }));

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onOpenTask }) => {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<"all" | "high" | "medium" | "low">("all");

  const { visibleTasks, overdueCount, dueSoonCount, doneCount } = useMemo(() => {
    const now = new Date();
    const inThreeDays = new Date(now);
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const filtered = tasks.filter((task) => {
      const matchesQuery = !query || task.title.toLowerCase().includes(query.toLowerCase());
      const matchesPriority = priority === "all" || task.priority === priority;
      return matchesQuery && matchesPriority;
    });

    const overdue = filtered.filter((task) => {
      if (!task.dueDate || isDoneTaskStatus(task.status)) return false;
      return new Date(task.dueDate) < now;
    }).length;

    const dueSoon = filtered.filter((task) => {
      if (!task.dueDate || isDoneTaskStatus(task.status)) return false;
      const due = new Date(task.dueDate);
      return due >= now && due <= inThreeDays;
    }).length;

    const done = filtered.filter((task) => isDoneTaskStatus(task.status)).length;

    return {
      visibleTasks: filtered,
      overdueCount: overdue,
      dueSoonCount: dueSoon,
      doneCount: done,
    };
  }, [tasks, query, priority]);

  const grouped = useMemo(() => {
    const initialGroups = TASK_COLUMNS.reduce((acc, column) => {
      acc[column.key] = [];
      return acc;
    }, {} as Record<Task["status"], Task[]>);

    return TASK_COLUMNS.reduce<Record<Task["status"], Task[]>>((acc, column) => {
      acc[column.key] = visibleTasks.filter((task) => task.status === column.key);
      return acc;
    }, initialGroups);
  }, [visibleTasks]);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Visible Tasks</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{visibleTasks.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Completed</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{doneCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Due Soon</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{dueSoonCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Overdue</p>
          <p className="mt-2 text-2xl font-black text-rose-600">{overdueCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks by title"
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as "all" | "high" | "medium" | "low")}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700"
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {TASK_COLUMNS.map((column) => (
          <div key={column.key} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex size-8 items-center justify-center rounded-lg ${column.tone}`}>
                  <span className="material-symbols-outlined text-lg">{column.icon}</span>
                </span>
                <h3 className="text-sm font-bold text-slate-800">{column.label}</h3>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                {grouped[column.key].length}
              </span>
            </div>

            <div className="space-y-2">
              {grouped[column.key].length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-xs font-medium text-slate-500">
                  No tasks in this column
                </div>
              ) : (
                grouped[column.key].map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onOpenTask(task.id)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100 transition-colors"
                  >
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{task.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="rounded bg-slate-200 px-2 py-0.5 font-semibold uppercase">
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TaskBoard;
