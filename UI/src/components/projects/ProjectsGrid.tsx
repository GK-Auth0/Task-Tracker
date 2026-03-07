import React from "react";
import ProjectCard from "../ProjectCard";
import { Project } from "../../types/project";

interface ProjectsGridProps {
  projects: Project[];
  onCreate: () => void;
  pinnedProjectIds?: Set<string>;
  onProjectPinToggle?: (projectId: string, shouldPin: boolean) => void;
  canCreate?: boolean;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  onCreate,
  pinnedProjectIds,
  onProjectPinToggle,
  canCreate = true,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isPinned={Boolean(pinnedProjectIds?.has(project.id))}
          onTogglePin={onProjectPinToggle}
        />
      ))}

      {canCreate && (
        <button
          onClick={onCreate}
          className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600 group"
        >
          <span className="material-symbols-outlined text-4xl">add_circle</span>
          <span className="text-sm font-bold">Create New Project</span>
        </button>
      )}
    </div>
  );
};

export default ProjectsGrid;
