import React, { memo } from "react";
import { TaskGroupOption, TaskSortOption } from "./types";

interface TasksFiltersBarProps {
  filter: string;
  priorityFilter: string;
  statusFilter: string;
  searchTerm: string;
  showCompleted: boolean;
  compactMode: boolean;
  sortBy: TaskSortOption;
  groupBy: TaskGroupOption;
  onFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onShowCompletedChange: (value: boolean) => void;
  onCompactModeChange: (value: boolean) => void;
  onSortByChange: (value: TaskSortOption) => void;
  onGroupByChange: (value: TaskGroupOption) => void;
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
  onFilterChange,
  onPriorityFilterChange,
  onStatusFilterChange,
  onSearchChange,
  onShowCompletedChange,
  onCompactModeChange,
  onSortByChange,
  onGroupByChange,
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
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Task Controls
        </span>
        <button
          className="text-blue-700 text-xs font-bold hover:underline"
          onClick={onClearAll}
        >
          Reset View
          {activeFiltersCount > 0 && (
            <span className="ml-1 text-[10px] text-slate-500">
              ({activeFiltersCount})
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search task title..."
            className="h-10 w-full rounded-xl bg-white border border-slate-200 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 lg:col-span-2"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 lg:col-span-2"
        >
          <option value="">All Status</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as TaskSortOption)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 lg:col-span-2"
        >
          <option value="recent">Sort: Recently Added</option>
          <option value="due_asc">Sort: Due Soonest</option>
          <option value="due_desc">Sort: Due Latest</option>
          <option value="priority_desc">Sort: Priority High-Low</option>
          <option value="priority_asc">Sort: Priority Low-High</option>
          <option value="title_asc">Sort: Title A-Z</option>
        </select>

        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value as TaskGroupOption)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 lg:col-span-2"
        >
          <option value="none">Group: None</option>
          <option value="status">Group: Status</option>
          <option value="priority">Group: Priority</option>
          <option value="due">Group: Due Bucket</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              filter === "In Progress"
                ? "bg-blue-600/10 text-blue-700"
                : "bg-slate-100 text-slate-500"
            }`}
            onClick={() =>
              onFilterChange(filter === "In Progress" ? "" : "In Progress")
            }
          >
            In Progress
          </button>
          <button
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              filter === "High Priority"
                ? "bg-rose-600/10 text-rose-700"
                : "bg-slate-100 text-slate-500"
            }`}
            onClick={() =>
              onFilterChange(filter === "High Priority" ? "" : "High Priority")
            }
          >
            High Priority
          </button>
          <button
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              filter === "Due Soon"
                ? "bg-amber-600/10 text-amber-700"
                : "bg-slate-100 text-slate-500"
            }`}
            onClick={() => onFilterChange(filter === "Due Soon" ? "" : "Due Soon")}
          >
            Due Soon
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`h-9 rounded-lg border px-3 text-xs font-semibold ${
              showCompleted
                ? "border-slate-300 bg-white text-slate-700"
                : "border-amber-300 bg-amber-50 text-amber-800"
            }`}
            onClick={() => onShowCompletedChange(!showCompleted)}
          >
            {showCompleted ? "Hide Completed: Off" : "Hide Completed: On"}
          </button>
          <button
            type="button"
            className={`h-9 rounded-lg border px-3 text-xs font-semibold ${
              compactMode
                ? "border-blue-300 bg-blue-50 text-blue-800"
                : "border-slate-300 bg-white text-slate-700"
            }`}
            onClick={() => onCompactModeChange(!compactMode)}
          >
            {compactMode ? "Compact Mode: On" : "Compact Mode: Off"}
          </button>
          <button
            type="button"
            className={`h-9 rounded-lg border px-3 text-xs font-semibold ${
              filter
                ? "border-slate-300 bg-white text-slate-700"
                : "border-blue-300 bg-blue-50 text-blue-800"
            }`}
            onClick={() => onFilterChange(filter ? "" : "My Focus")}
          >
            {filter ? "Focus Mode: Off" : "Focus Mode: On"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(TasksFiltersBar);
