import React from "react";
import { TaskGroupOption, TaskItem } from "./types";

interface TasksListProps {
  tasks: TaskItem[];
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskClick: (taskId: string) => void;
  pinnedTaskIds?: Set<string>;
  onTaskPinToggle?: (taskId: string, shouldPin: boolean) => void;
  canToggleStatus?: boolean;
  compactMode?: boolean;
  groupBy?: TaskGroupOption;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-600";
    case "Medium":
      return "bg-orange-100 text-orange-600";
    case "Low":
      return "bg-blue-100 text-blue-600";
    default:
      return "bg-slate-100 text-slate-500";
  }
};

const getPriorityAccent = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-amber-500";
    case "Low":
      return "bg-blue-500";
    default:
      return "bg-slate-300";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return { text: "No due date", isOverdue: false, isToday: false };
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (taskDate < today) {
    return {
      text: `Overdue - ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      isOverdue: true,
    };
  }

  if (taskDate.getTime() === today.getTime()) {
    return { text: "Today", isToday: true };
  }

  return {
    text: `Due ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    isOverdue: false,
  };
};

const dueBucket = (task: TaskItem) => {
  if (!task.due_date) return "No Due Date";
  const date = new Date(task.due_date);
  if (Number.isNaN(date.getTime())) return "No Due Date";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((taskDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due Today";
  if (diffDays <= 3) return "Next 3 Days";
  return "Later";
};

const TasksList: React.FC<TasksListProps> = ({
  tasks,
  onTaskToggle,
  onTaskClick,
  pinnedTaskIds,
  onTaskPinToggle,
  canToggleStatus = true,
  compactMode = false,
  groupBy = "none",
}) => {
  const groupedEntries: Array<{ label: string; items: TaskItem[] }> = (() => {
    if (groupBy === "none") return [{ label: "", items: tasks }];

    const groups = new Map<string, TaskItem[]>();
    for (const task of tasks) {
      let key = "Other";
      if (groupBy === "status") key = task.status;
      if (groupBy === "priority") key = task.priority;
      if (groupBy === "due") key = dueBucket(task);
      const existing = groups.get(key) || [];
      existing.push(task);
      groups.set(key, existing);
    }

    const statusOrder = ["To Do", "In Progress", "Done"];
    const priorityOrder = ["High", "Medium", "Low"];
    const dueOrder = ["Overdue", "Due Today", "Next 3 Days", "Later", "No Due Date"];

    const entries = Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items,
    }));

    if (groupBy === "status") {
      return entries.sort(
        (a, b) => statusOrder.indexOf(a.label) - statusOrder.indexOf(b.label),
      );
    }
    if (groupBy === "priority") {
      return entries.sort(
        (a, b) =>
          priorityOrder.indexOf(a.label) - priorityOrder.indexOf(b.label),
      );
    }
    if (groupBy === "due") {
      return entries.sort((a, b) => dueOrder.indexOf(a.label) - dueOrder.indexOf(b.label));
    }
    return entries;
  })();

  return (
    <div className="space-y-5">
      {groupedEntries.map((group) => (
        <div key={group.label || "all"} className="space-y-3">
          {group.label && (
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {group.label}
              </h4>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {group.items.length}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {group.items.map((task) => {
              const dateInfo = task.due_date ? formatDate(task.due_date) : null;
              const isCompleted = task.status === "Done";
              const isPinned = Boolean(pinnedTaskIds?.has(task.id));

              return (
                <div
                  key={task.id}
                  className={`relative overflow-hidden group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white px-4 sm:px-5 ${
                    compactMode ? "py-3" : "py-4"
                  } rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-[1px] transition-all cursor-pointer`}
                  onClick={() => onTaskClick(task.id)}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-1.5 ${getPriorityAccent(task.priority)}`}
                  />
                  <div className="flex size-6 items-center justify-center shrink-0">
                    <input
                      className="h-5 w-5 rounded border-slate-300 bg-transparent text-blue-600 focus:ring-blue-600 focus:ring-offset-0 focus:outline-none cursor-pointer"
                      type="checkbox"
                      checked={isCompleted}
                      disabled={!canToggleStatus}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onTaskToggle(task.id, e.target.checked)}
                    />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <p
                        className={`text-slate-900 ${
                          compactMode ? "text-sm" : "text-base"
                        } font-semibold leading-normal group-hover:text-blue-700 transition-colors truncate ${
                          isCompleted ? "line-through opacity-60" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                              task.status === "Done"
                                ? "bg-emerald-500"
                                : task.status === "In Progress"
                                  ? "bg-blue-500"
                                  : "bg-slate-400"
                            }`}
                          />
                          {task.status}
                        </span>
                        {dateInfo && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span
                              className={`material-symbols-outlined text-sm ${
                                dateInfo.isOverdue
                                  ? "text-red-500"
                                  : dateInfo.isToday
                                    ? "text-blue-600"
                                    : ""
                              }`}
                            >
                              calendar_today
                            </span>
                            <span
                              className={
                                dateInfo.isOverdue
                                  ? "text-red-500 font-medium"
                                  : dateInfo.isToday
                                    ? "text-blue-600 font-medium"
                                    : ""
                              }
                            >
                              {dateInfo.text}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3">
                      {task.assignee ? (
                        <div className="size-8 rounded-full border-2 border-white bg-blue-600/20 flex items-center justify-center text-[10px] font-bold text-blue-700">
                          {task.assignee.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      ) : (
                        <div className="size-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          ??
                        </div>
                      )}
                      <div
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </div>
                      <button
                        className={`p-1 transition-colors ${
                          isPinned
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-slate-300 hover:text-slate-500"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTaskPinToggle) {
                            onTaskPinToggle(task.id, !isPinned);
                          }
                        }}
                      >
                        <span className="material-symbols-outlined">
                          {isPinned ? "keep" : "keep_off"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TasksList;
