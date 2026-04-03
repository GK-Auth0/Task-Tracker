import React from "react";
import { Link } from "react-router-dom";
import { Project } from "../../../types/project";
import { ProjectStatus } from "../../../enums";

interface ProjectHeaderProps {
  project: Project;
  isOwnerOrAdmin: boolean;
  onStatusChange: (status: ProjectStatus) => void;
  onCreateTask: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  isOwnerOrAdmin,
  onStatusChange,
  onCreateTask,
}) => {
  const members = project.members || [];
  const visibleMembers = members.slice(0, 5);
  const totalMembers = project.member_count ?? members.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/projects" className="hover:text-blue-600 transition-colors">
              Projects
            </Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="truncate">{project.name}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {project.name}
            </h1>
            <select
              value={project.status}
              onChange={(event) => onStatusChange(event.target.value as ProjectStatus)}
              disabled={!isOwnerOrAdmin}
              className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold uppercase tracking-wide text-slate-700 disabled:opacity-60"
              aria-label="Project status"
            >
              <option value={ProjectStatus.PLANNING}>Planning</option>
              <option value={ProjectStatus.ACTIVE}>Active</option>
              <option value={ProjectStatus.ON_HOLD}>On Hold</option>
              <option value={ProjectStatus.COMPLETED}>Completed</option>
              <option value={ProjectStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>

          <p className="mt-3 max-w-3xl text-sm text-slate-600 leading-relaxed">
            {project.description || "No description is available for this project yet."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-2">
              {visibleMembers.map((member) => (
                <div
                  key={member.id}
                  className="size-8 rounded-full border-2 border-white bg-blue-600 text-white text-xs font-bold flex items-center justify-center"
                  title={(member.user as any)?.name || (member.user as any)?.full_name || "Member"}
                >
                  {(
                    (member.user as any)?.name ||
                    (member.user as any)?.full_name ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              ))}
              {totalMembers > visibleMembers.length && (
                <div className="size-8 rounded-full border-2 border-white bg-slate-400 text-white text-xs font-bold flex items-center justify-center">
                  +{totalMembers - visibleMembers.length}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-slate-600">
              {totalMembers} member{totalMembers === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-w-[180px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Completion
            </p>
            <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Progress</span>
              <span>{project.progress || 0}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateTask}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Task
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProjectHeader;
