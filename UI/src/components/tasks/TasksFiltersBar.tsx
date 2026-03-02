import React from "react";

interface TasksFiltersBarProps {
  filter: string;
  priorityFilter: string;
  statusFilter: string;
  showPriorityDropdown: boolean;
  showStatusDropdown: boolean;
  searchTerm: string;
  onFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTogglePriorityDropdown: () => void;
  onToggleStatusDropdown: () => void;
  onSearchChange: (value: string) => void;
  onClearAll: () => void;
}

const TasksFiltersBar: React.FC<TasksFiltersBarProps> = ({
  filter,
  priorityFilter,
  statusFilter,
  showPriorityDropdown,
  showStatusDropdown,
  searchTerm,
  onFilterChange,
  onPriorityFilterChange,
  onStatusFilterChange,
  onTogglePriorityDropdown,
  onToggleStatusDropdown,
  onSearchChange,
  onClearAll,
}) => {
  const activeFiltersCount =
    Number(Boolean(filter)) +
    Number(Boolean(priorityFilter)) +
    Number(Boolean(statusFilter)) +
    Number(Boolean(searchTerm.trim()));

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Filter by:
        </span>
        <button
          className="text-blue-600 text-xs font-bold hover:underline"
          onClick={onClearAll}
        >
          Clear all filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 text-[10px] text-slate-500">
              ({activeFiltersCount})
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative">
            <button
              className="flex w-full sm:w-auto h-9 items-center justify-between sm:justify-start gap-x-2 rounded-lg bg-white border border-slate-200 px-4 hover:border-blue-600/50 transition-colors min-w-[140px]"
              onClick={onTogglePriorityDropdown}
            >
              <p className="text-slate-700 text-sm font-medium">
                {priorityFilter || "Priority"}
              </p>
              <span className="material-symbols-outlined text-slate-400 text-lg">
                expand_more
              </span>
            </button>
            {showPriorityDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px] w-full sm:w-auto">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg"
                  onClick={() => onPriorityFilterChange("")}
                >
                  All Priorities
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  onClick={() => onPriorityFilterChange("High")}
                >
                  High
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  onClick={() => onPriorityFilterChange("Medium")}
                >
                  Medium
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 last:rounded-b-lg"
                  onClick={() => onPriorityFilterChange("Low")}
                >
                  Low
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="flex w-full sm:w-auto h-9 items-center justify-between sm:justify-start gap-x-2 rounded-lg bg-white border border-slate-200 px-4 hover:border-blue-600/50 transition-colors min-w-[140px]"
              onClick={onToggleStatusDropdown}
            >
              <p className="text-slate-700 text-sm font-medium">
                {statusFilter || "Status"}
              </p>
              <span className="material-symbols-outlined text-slate-400 text-lg">
                expand_more
              </span>
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px] w-full sm:w-auto">
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg"
                  onClick={() => onStatusFilterChange("")}
                >
                  All Status
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  onClick={() => onStatusFilterChange("To Do")}
                >
                  To Do
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  onClick={() => onStatusFilterChange("In Progress")}
                >
                  In Progress
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 last:rounded-b-lg"
                  onClick={() => onStatusFilterChange("Done")}
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search task title..."
              className="h-9 w-full rounded-lg bg-white border border-slate-200 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              filter === "In Progress"
                ? "bg-blue-600/10 text-blue-600"
                : "bg-slate-100 text-slate-500"
            }`}
            onClick={() => onFilterChange("In Progress")}
          >
            In Progress
          </button>
          <button
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              filter === "High Priority"
                ? "bg-blue-600/10 text-blue-600"
                : "bg-slate-100 text-slate-500"
            }`}
            onClick={() => onFilterChange("High Priority")}
          >
            High Priority
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasksFiltersBar;
