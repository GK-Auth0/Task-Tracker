import React from "react";
import { Project } from "../../types/project";

type ProjectStatusFilter = "all" | Project["status"];

interface ProjectsFiltersProps {
  searchTerm: string;
  statusFilter: ProjectStatusFilter;
  showPinnedOnly: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: ProjectStatusFilter) => void;
  onTogglePinnedOnly: () => void;
}

const STATUS_FILTERS: ProjectStatusFilter[] = [
  "all",
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled",
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
  onSearchChange,
  onStatusChange,
  onTogglePinnedOnly,
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

      <div className="flex justify-end">
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
      </div>
    </div>
  );
};

export default ProjectsFilters;
