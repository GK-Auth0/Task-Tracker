import React from "react";

interface TasksEmptyStateProps {
  onCreateTask: () => void;
}

const TasksEmptyState: React.FC<TasksEmptyStateProps> = ({ onCreateTask }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
      <p className="text-base font-semibold text-slate-700">No tasks found</p>
      <p className="mt-1 text-sm text-slate-500">
        Try changing filters/search or create a new task.
      </p>
      <button
        onClick={onCreateTask}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
      >
        <span className="material-symbols-outlined text-base">add</span>
        Create Task
      </button>
    </div>
  );
};

export default TasksEmptyState;
