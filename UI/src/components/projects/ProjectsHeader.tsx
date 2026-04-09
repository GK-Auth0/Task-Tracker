import React, { memo } from "react";

interface ProjectsHeaderProps {
  onCreate: () => void;
  canCreate?: boolean;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({
  onCreate,
  canCreate = true,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div>
        <h2 className="text-gray-900 text-3xl font-black tracking-tight">
          Projects
        </h2>
        <p className="text-gray-600 mt-1">
          Manage and track your ongoing team initiatives.
        </p>
      </div>
      {canCreate && (
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>New Project</span>
        </button>
      )}
    </div>
  );
};

export default memo(ProjectsHeader);
