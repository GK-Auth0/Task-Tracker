import React from "react";
import { DashboardSummary } from "./types";

interface TasksHeaderProps {
  summary: DashboardSummary | null;
  onCreate: () => void;
}

const TasksHeader: React.FC<TasksHeaderProps> = ({ summary, onCreate }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h2 className="text-gray-900 text-2xl sm:text-3xl font-black tracking-tight">
          My Tasks
        </h2>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          You have {summary?.total_tasks || 0} tasks, {summary?.overdue_tasks || 0}{" "}
          overdue.
        </p>
      </div>
      <button
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
        onClick={onCreate}
      >
        <span className="material-symbols-outlined text-lg">add</span>
        <span>Create Task</span>
      </button>
    </div>
  );
};

export default TasksHeader;
