import React from "react";

type ProjectTab = "tasks" | "roadmap" | "files" | "activity";

interface ProjectTabNavProps {
  activeTab: ProjectTab;
  canViewConfidential: boolean;
  taskCount: number;
  fileCount: number;
  onTabChange: (tab: ProjectTab) => void;
}

const tabBaseClass =
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors";

const ProjectTabNav: React.FC<ProjectTabNavProps> = ({
  activeTab,
  canViewConfidential,
  taskCount,
  fileCount,
  onTabChange,
}) => {
  const getTabClass = (tab: ProjectTab) => {
    const isActive = activeTab === tab;
    return `${tabBaseClass} ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-white text-slate-600 hover:bg-slate-100"
    }`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
        <button type="button" className={getTabClass("tasks")} onClick={() => onTabChange("tasks")}>
          <span className="material-symbols-outlined text-lg">task</span>
          Tasks
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">{taskCount}</span>
        </button>

        <button
          type="button"
          className={`${getTabClass("roadmap")} ${!canViewConfidential ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => canViewConfidential && onTabChange("roadmap")}
          disabled={!canViewConfidential}
        >
          <span className="material-symbols-outlined text-lg">map</span>
          Roadmap
        </button>

        <button
          type="button"
          className={`${getTabClass("files")} ${!canViewConfidential ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => canViewConfidential && onTabChange("files")}
          disabled={!canViewConfidential}
        >
          <span className="material-symbols-outlined text-lg">folder</span>
          Files
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">{fileCount}</span>
        </button>

        <button
          type="button"
          className={`${getTabClass("activity")} ${!canViewConfidential ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => canViewConfidential && onTabChange("activity")}
          disabled={!canViewConfidential}
        >
          <span className="material-symbols-outlined text-lg">history</span>
          Activity
        </button>
      </div>
    </div>
  );
};

export default ProjectTabNav;
