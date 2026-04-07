import React, { memo } from "react";
import { TaskGroupOption, TaskSortOption } from "./types";

type ViewMode = "table" | "grid";

interface TasksFiltersBarProps {
  filter: string;
  priorityFilter: string;
  statusFilter: string;
  searchTerm: string;
  showCompleted: boolean;
  compactMode: boolean;
  sortBy: TaskSortOption;
  groupBy: TaskGroupOption;
  viewMode?: ViewMode;
  onFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onShowCompletedChange: (value: boolean) => void;
  onCompactModeChange: (value: boolean) => void;
  onSortByChange: (value: TaskSortOption) => void;
  onGroupByChange: (value: TaskGroupOption) => void;
  onViewModeChange?: (value: ViewMode) => void;
  onClearAll: () => void;
}

const TasksFiltersBar: React.FC<TasksFiltersBarProps> = ({
  filter,
  priorityFilter,
  statusFilter,
  searchTerm,
  showCompleted,
  compactMode,
  sortBy,
  groupBy,
  viewMode = "table",
  onFilterChange,
  onPriorityFilterChange,
  onStatusFilterChange,
  onSearchChange,
  onShowCompletedChange,
  onCompactModeChange,
  onSortByChange,
  onGroupByChange,
  onViewModeChange,
  onClearAll,
}) => {
  const activeFiltersCount =
    Number(Boolean(filter)) +
    Number(Boolean(priorityFilter)) +
    Number(Boolean(statusFilter)) +
    Number(Boolean(searchTerm.trim())) +
    Number(!showCompleted) +
    Number(compactMode) +
    Number(groupBy !== "none");

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      {/* Single row with all controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="h-8 w-full rounded-lg bg-white border border-slate-200 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Dropdowns */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
        >
          <option value="">All Status</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as TaskSortOption)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
        >
          <option value="recent">Recently Added</option>
          <option value="due_asc">Due Soonest</option>
          <option value="due_desc">Due Latest</option>
          <option value="priority_desc">Priority High-Low</option>
          <option value="priority_asc">Priority Low-High</option>
          <option value="title_asc">Title A-Z</option>
        </select>

        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as TaskGroupOption)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
        >
          <option value="none">No Grouping</option>
          <option value="status">Group by Status</option>
          <option value="priority">Group by Priority</option>
          <option value="due">Group by Due Date</option>
        </select>

        {/* Toggle buttons */}
        <button
          type="button"
          className={`h-8 rounded-lg border px-2 text-xs font-medium ${
            !showCompleted
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => onShowCompletedChange(!showCompleted)}
          title={showCompleted ? "Hide completed tasks" : "Show completed tasks"}
        >
          {showCompleted ? "Hide Done" : "Show Done"}
        </button>

        <button
          type="button"
          className={`h-8 rounded-lg border px-2 text-xs font-medium ${
            compactMode
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => onCompactModeChange(!compactMode)}
          title={compactMode ? "Disable compact mode" : "Enable compact mode"}
        >
          {compactMode ? "Compact" : "Normal"}
        </button>

        {/* View Mode Toggle - Desktop Only */}
        {onViewModeChange && (
          <div className="hidden lg:flex items-center border border-slate-200 rounded-lg bg-white">
            <button
              onClick={() => onViewModeChange("table")}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-l-lg transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              title="Table view"
            >
              <span className="material-symbols-outlined text-sm">table_rows</span>
            </button>
            <button
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-r-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              title="Grid view"
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
            </button>
          </div>
        )}

        {/* Reset button */}
        <button
          className="h-8 px-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
          onClick={onClearAll}
          title="Reset all filters"
        >
          Reset{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
        </button>
      </div>
    </div>
  );
};

export type { ViewMode };
export default memo(TasksFiltersBar);
