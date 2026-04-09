import React from "react";
import { TaskItem } from "./types";
import { TASK_STATUSES, getTaskStatusTone } from "../../utils/taskStatus";

interface TasksBoardTabProps {
  tasks: TaskItem[];
  onTaskClick: (taskId: string) => void;
}

const TasksBoardTab: React.FC<TasksBoardTabProps> = ({ tasks, onTaskClick }) => {
  const columns = TASK_STATUSES.map((status) => ({
    key: status,
    title: status,
    items: tasks.filter((task) => task.status === status),
    tone: getTaskStatusTone(status).card,
  }));

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {columns.map((column) => (
        <div key={column.key} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800">{column.title}</h3>
            <span className={`rounded-md px-2 py-1 text-xs font-bold ${column.tone}`}>
              {column.items.length}
            </span>
          </div>
          <div className="space-y-2">
            {column.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                No tasks
              </div>
            ) : (
              column.items.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onTaskClick(task.id)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100"
                >
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {task.priority}{" "}
                    {task.due_date
                      ? `• ${
                          Number.isNaN(new Date(task.due_date).getTime())
                            ? "No due date"
                            : new Date(task.due_date).toLocaleDateString()
                        }`
                      : ""}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ))}
    </section>
  );
};

export default TasksBoardTab;
