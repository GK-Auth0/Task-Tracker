import React from "react";

const ProjectsEmptyState: React.FC = () => {
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center">
      <p className="text-sm font-semibold text-slate-700">
        No projects found for this filter.
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Try a different status, clear search, or create a new project.
      </p>
    </div>
  );
};

export default ProjectsEmptyState;
