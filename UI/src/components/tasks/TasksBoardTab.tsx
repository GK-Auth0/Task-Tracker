import React from "react";
import { TaskItem } from "./types";

interface TasksBoardTabProps {
  tasks: TaskItem[];
  onTaskClick: (taskId: string) => void;
}

const TasksBoardTab: React.FC<TasksBoardTabProps> = ({ tasks, onTaskClick }) => {
  const columns = {
    todo: tasks.filter((task) => task.status === "To Do"),
    inProgress: tasks.filter((task) => task.status === "In Progress"),
    done: tasks.filter((task) => task.status === "Done"),
  };

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {[
        { key: "todo", title: "To Do", items: columns.todo, tone: "bg-slate-100 text-slate-700" },
        {
          key: "inProgress",
          title: "In Progress",
          items: columns.inProgress,
          tone: "bg-blue-100 text-blue-700",
        },
        { key: "done", title: "Done", items: columns.done, tone: "bg-emerald-100 text-emerald-700" },
      ].map((column) => (
        <div key={column.key} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100"
                >
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {task.priority} {task.due_date ? `• ${new Date(task.due_date).toLocaleDateString()}` : ""}
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
