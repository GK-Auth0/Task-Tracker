import React from "react";
import { TaskItem } from "./types";

interface TasksListProps {
  tasks: TaskItem[];
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskClick: (taskId: string) => void;
  pinnedTaskIds?: Set<string>;
  onTaskPinToggle?: (taskId: string, shouldPin: boolean) => void;
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
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

const TasksList: React.FC<TasksListProps> = ({
  tasks,
  onTaskToggle,
  onTaskClick,
  pinnedTaskIds,
  onTaskPinToggle,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => {
        const dateInfo = task.due_date ? formatDate(task.due_date) : null;
        const isCompleted = task.status === "Done";
        const isPinned = Boolean(pinnedTaskIds?.has(task.id));

        return (
          <div
            key={task.id}
            className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white px-4 sm:px-6 py-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onTaskClick(task.id)}
          >
            <div className="flex size-6 items-center justify-center shrink-0">
              <input
                className="h-5 w-5 rounded border-slate-300 bg-transparent text-blue-600 focus:ring-blue-600 focus:ring-offset-0 focus:outline-none cursor-pointer"
                type="checkbox"
                checked={isCompleted}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onTaskToggle(task.id, e.target.checked)}
              />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
              <div className="flex flex-col min-w-0">
                <p
                  className={`text-gray-900 text-sm sm:text-base font-semibold leading-normal group-hover:text-blue-600 transition-colors truncate ${
                    isCompleted ? "line-through opacity-60" : ""
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1">
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
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-sm">
                      chat_bubble
                    </span>
                    <span>0 comments</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                {task.assignee ? (
                  <div className="size-8 rounded-full border-2 border-white bg-blue-600/20 flex items-center justify-center text-[10px] font-bold text-blue-600">
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
  );
};

export default TasksList;
