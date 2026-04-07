import React, { memo } from "react";
import { ProjectStatus } from "../../enums";

type ProjectStatusFilter = "all" | ProjectStatus;
type ViewMode = "table" | "grid";

interface ProjectsFiltersProps {
  searchTerm: string;
  statusFilter: ProjectStatusFilter;
  showPinnedOnly: boolean;
  viewMode?: ViewMode;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: ProjectStatusFilter) => void;
  onTogglePinnedOnly: () => void;
  onViewModeChange?: (value: ViewMode) => void;
}

const STATUS_FILTERS: ProjectStatusFilter[] = [
  "all",
  ProjectStatus.PLANNING,
  ProjectStatus.ACTIVE,
  ProjectStatus.ON_HOLD,
  ProjectStatus.COMPLETED,
  ProjectStatus.CANCELLED,
];

const formatStatusLabel = (status: ProjectStatusFilter) => {
  if (status === "all") {
    return "All Status";
  }

  return status
    .replace("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const ProjectsFilters: React.FC<ProjectsFiltersProps> = ({
  searchTerm,
  statusFilter,
  showPinnedOnly,
  viewMode = "grid",
  onSearchChange,
  onStatusChange,
  onTogglePinnedOnly,
  onViewModeChange,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center flex-1 min-w-0">
        <div className="relative w-full lg:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm"
            placeholder="Search projects by name or description..."
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-4 py-2 border rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              {formatStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`h-10 rounded-lg border px-3 text-sm font-semibold whitespace-nowrap ${
            showPinnedOnly
              ? "border-amber-400 bg-amber-50 text-amber-800"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          onClick={onTogglePinnedOnly}
        >
          {showPinnedOnly ? "Showing Pinned Projects" : "Show Pinned Projects Only"}
        </button>

        {/* View Mode Toggle - Desktop Only */}
        {onViewModeChange && (
          <div className="hidden lg:flex items-center border border-slate-200 rounded-lg bg-white">
            <button
              onClick={() => onViewModeChange("table")}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-l-lg transition-colors ${
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
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-r-lg transition-colors ${
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
      </div>
    </div>
  );
};

export type { ViewMode };
export default memo(ProjectsFilters);
