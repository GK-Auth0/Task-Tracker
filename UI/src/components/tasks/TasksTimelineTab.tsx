import React, { useMemo } from "react";
import { TaskItem } from "./types";

interface TasksTimelineTabProps {
  tasks: TaskItem[];
  onTaskClick: (taskId: string) => void;
}

const TasksTimelineTab: React.FC<TasksTimelineTabProps> = ({ tasks, onTaskClick }) => {
  const timelineTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const first = a.due_date
        ? new Date(a.due_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      const second = b.due_date
        ? new Date(b.due_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      return first - second;
    });
  }, [tasks]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-bold text-slate-800">Due Date Timeline</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {timelineTasks.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">No tasks to show.</div>
        ) : (
          timelineTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onTaskClick(task.id)}
              className="w-full px-4 py-3 text-left hover:bg-slate-50"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                <p className="text-xs font-medium text-slate-600">
                  {task.due_date
                    ? Number.isNaN(new Date(task.due_date).getTime())
                      ? "No due date"
                      : new Date(task.due_date).toLocaleDateString()
                    : "No due date"}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {task.status} • {task.priority}
              </p>
            </button>
          ))
        )}
      </div>
    </section>
  );
};

export default TasksTimelineTab;
