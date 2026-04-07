import React, { memo } from "react";
import { DashboardSummary } from "./types";

interface TasksHeaderProps {
  summary: DashboardSummary | null;
  visibleCount: number;
  onCreate: () => void;
  canCreate?: boolean;
}

const TasksHeader: React.FC<TasksHeaderProps> = ({
  summary,
  visibleCount,
  onCreate,
  canCreate = true,
}) => {
  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-slate-900 text-xl sm:text-2xl font-black tracking-tight">
            My Tasks
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            {visibleCount}/{summary?.total_tasks || 0}
          </span>
        </div>
        {canCreate && (
          <button
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
            onClick={onCreate}
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
            <span>Create Task</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(TasksHeader);
