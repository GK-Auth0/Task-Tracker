import React, { memo, useState } from "react";
import { ProjectStatus } from "../../enums";

export type ViewMode = "table" | "grid";
type ProjectStatusFilter = "all" | ProjectStatus;

interface SavedViewOption {
  id: string;
  name: string;
}

interface ProjectsFiltersBarProps {
  searchTerm: string;
  statusFilter: ProjectStatusFilter;
  showPinnedOnly: boolean;
  viewMode?: ViewMode;
  savedViews?: SavedViewOption[];
  selectedViewId?: string;
  newViewName?: string;
  savingView?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProjectStatusFilter) => void;
  onTogglePinnedOnly: () => void;
  onViewModeChange?: (value: ViewMode) => void;
  onSelectedViewIdChange?: (id: string) => void;
  onViewNameChange?: (name: string) => void;
  onApplyView?: () => void;
  onSaveView?: () => void;
  onDeleteView?: () => void;
}

const ProjectsFiltersBar: React.FC<ProjectsFiltersBarProps> = ({
  searchTerm,
  statusFilter,
  showPinnedOnly,
  viewMode = "grid",
  savedViews = [],
  selectedViewId = "",
  newViewName = "",
  savingView = false,
  onSearchChange,
  onStatusChange,
  onTogglePinnedOnly,
  onViewModeChange,
  onSelectedViewIdChange,
  onViewNameChange,
  onApplyView,
  onSaveView,
  onDeleteView,
}) => {
  const [showSavedViews, setShowSavedViews] = useState(false);

  const activeFiltersCount =
    Number(Boolean(searchTerm.trim())) +
    Number(statusFilter !== "all") +
    Number(showPinnedOnly);

  const handleClearAll = () => {
    onSearchChange("");
    onStatusChange("all");
    if (showPinnedOnly) {
      onTogglePinnedOnly();
    }
  };

  return (
    <div className="mb-4 space-y-2">
      {/* Main filters bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
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
              placeholder="Search projects by name or description..."
              className="h-8 w-full rounded-lg bg-white border border-slate-200 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as ProjectStatusFilter)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
          >
            <option value="all">All Status</option>
            <option value={ProjectStatus.PLANNING}>Planning</option>
            <option value={ProjectStatus.ACTIVE}>Active</option>
            <option value={ProjectStatus.ON_HOLD}>On Hold</option>
            <option value={ProjectStatus.COMPLETED}>Completed</option>
            <option value={ProjectStatus.CANCELLED}>Cancelled</option>
          </select>

          {/* Show Pinned Only Toggle */}
          <button
            type="button"
            className={`h-8 rounded-lg border px-2 text-xs font-medium ${
              showPinnedOnly
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
            onClick={onTogglePinnedOnly}
            title={showPinnedOnly ? "Show all projects" : "Show pinned projects only"}
          >
            Show Pinned Projects Only
          </button>

          {/* Saved Views Toggle */}
          {savedViews.length > 0 && (
            <button
              type="button"
              className={`h-8 rounded-lg border px-2 text-xs font-medium ${
                showSavedViews
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setShowSavedViews(!showSavedViews)}
              title="Manage saved views"
            >
              Views ({savedViews.length})
            </button>
          )}

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
            onClick={handleClearAll}
            title="Reset all filters"
          >
            Reset{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          </button>
        </div>
      </div>

      {/* Saved Views Panel - Only show when toggled */}
      {showSavedViews && savedViews.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Saved Views:</span>
            
            <select
              value={selectedViewId}
              onChange={(e) => onSelectedViewIdChange?.(e.target.value)}
              className="h-8 min-w-[140px] rounded-lg border border-slate-200 bg-white px-2 text-xs"
            >
              <option value="">Select view</option>
              {savedViews.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>
            
            <button
              type="button"
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              onClick={onApplyView}
              disabled={!selectedViewId}
            >
              Apply
            </button>
            
            <button
              type="button"
              className="h-8 rounded-lg border border-rose-200 bg-white px-2 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              onClick={onDeleteView}
              disabled={!selectedViewId}
            >
              Delete
            </button>
            
            <div className="flex items-center gap-1">
              <input
                value={newViewName}
                onChange={(e) => onViewNameChange?.(e.target.value)}
                placeholder="New view name"
                className="h-8 min-w-[120px] rounded-lg border border-slate-200 bg-white px-2 text-xs"
              />
              <button
                type="button"
                className="h-8 rounded-lg bg-blue-600 px-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={onSaveView}
                disabled={savingView || !newViewName.trim()}
              >
                {savingView ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ProjectsFiltersBar);