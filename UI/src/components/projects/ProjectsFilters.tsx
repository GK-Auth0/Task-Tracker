import React from "react";
import { Project } from "../../types/project";

type ProjectStatusFilter = "all" | Project["status"];

interface ProjectsFiltersProps {
  searchTerm: string;
  statusFilter: ProjectStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: ProjectStatusFilter) => void;
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
  onSearchChange,
  onStatusChange,
}) => {
  return (
    <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
      <div className="relative w-full md:max-w-md">
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

      <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
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
  );
};

export default ProjectsFilters;
