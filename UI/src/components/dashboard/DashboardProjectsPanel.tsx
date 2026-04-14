import React from "react";
import { DashboardInsightsProjectHealth } from "../../services/dashboard";
import { getRichTextPreview } from "../../utils/richText";

export interface DashboardProjectDetail {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
}

interface DashboardProjectsPanelProps {
  projects: DashboardProjectDetail[];
  projectHealthById: Map<string, DashboardInsightsProjectHealth>;
  onOpenProject: (projectId: string) => void;
  onOpenProjects: () => void;
}

const statusTone = (status: string) => {
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "on_hold") return "bg-amber-100 text-amber-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  if (status === "active") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
};

const priorityTone = (priority: string) => {
  if (priority === "high") return "text-rose-700";
  if (priority === "medium") return "text-amber-700";
  return "text-sky-700";
};

const prettyLabel = (value: string) =>
  value.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const DashboardProjectsPanel: React.FC<DashboardProjectsPanelProps> = ({
  projects,
  projectHealthById,
  onOpenProject,
  onOpenProjects,
}) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Project Details</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Progress and workload by project
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenProjects}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View all projects
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No projects available yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {projects.map((project) => {
            const health = projectHealthById.get(project.id);
            const descriptionPreview = getRichTextPreview(project.description || "", 120);
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onOpenProject(project.id)}
                className="text-left rounded-xl border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {project.name}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusTone(project.status)}`}
                  >
                    {prettyLabel(project.status)}
                  </span>
                </div>
                {descriptionPreview && (
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                    {descriptionPreview}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={`font-semibold ${priorityTone(project.priority)}`}>
                    {prettyLabel(project.priority)} Priority
                  </span>
                  <span className="text-slate-500">
                    {health ? `${health.completion_rate}% done` : "No tasks yet"}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${health?.completion_rate || 0}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>{health?.open_tasks || 0} open tasks</span>
                  <span>{health?.total_tasks || 0} total tasks</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default DashboardProjectsPanel;
