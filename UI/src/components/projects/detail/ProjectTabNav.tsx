import React from "react";

type ProjectTab = "tasks" | "roadmap" | "files" | "activity";

interface ProjectTabNavProps {
  activeTab: ProjectTab;
  canViewConfidential: boolean;
  taskCount: number;
  fileCount: number;
  isProjectOwner?: boolean;
  showConfidentialPanel?: boolean;
  showManagementPanel?: boolean;
  onTabChange: (tab: ProjectTab) => void;
  onToggleConfidentialPanel?: () => void;
  onToggleManagementPanel?: () => void;
  onOpenManagementPanel?: () => void;
}

const ProjectTabNav: React.FC<ProjectTabNavProps> = ({
  activeTab,
  canViewConfidential,
  taskCount,
  fileCount,
  isProjectOwner = false,
  showConfidentialPanel = false,
  showManagementPanel = false,
  onTabChange,
  onToggleConfidentialPanel,
  onToggleManagementPanel,
  onOpenManagementPanel,
}) => {
  const getTabClass = (tab: ProjectTab) => {
    const isActive = activeTab === tab;
    return `inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-slate-700 hover:bg-slate-100"
    }`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
          <button
            type="button"
            className={getTabClass("tasks")}
            onClick={() => onTabChange("tasks")}
          >
            <span className="material-symbols-outlined text-lg">task</span>
            Tasks
            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">
              {taskCount}
            </span>
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
            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">
              {fileCount}
            </span>
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

        {onToggleConfidentialPanel && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onToggleConfidentialPanel}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
                showConfidentialPanel
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="material-symbols-outlined text-lg">lock</span>
              {showConfidentialPanel ? "Hide Confidential Access" : "Confidential Access"}
            </button>

            {isProjectOwner && onToggleManagementPanel && (
              <>
                <button
                  type="button"
                  onClick={onOpenManagementPanel || onToggleManagementPanel}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Add Member
                </button>
                <button
                  type="button"
                  onClick={onToggleManagementPanel}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
                    showManagementPanel
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">edit_square</span>
                  {showManagementPanel ? "Hide Update Options" : "Manage Project"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTabNav;
