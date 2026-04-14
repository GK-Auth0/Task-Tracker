interface ProjectDetailActionsProps {
  isProjectOwner: boolean;
  showConfidentialPanel: boolean;
  showManagementPanel: boolean;
  onToggleConfidentialPanel: () => void;
  onToggleManagementPanel: () => void;
}

export default function ProjectDetailActions({
  isProjectOwner,
  showConfidentialPanel,
  showManagementPanel,
  onToggleConfidentialPanel,
  onToggleManagementPanel,
}: ProjectDetailActionsProps) {
  if (isProjectOwner) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onToggleConfidentialPanel}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <span className="material-symbols-outlined text-lg">lock</span>
          {showConfidentialPanel ? "Hide Confidential Access" : "Confidential Access"}
        </button>
        <button
          type="button"
          onClick={onToggleManagementPanel}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <span className="material-symbols-outlined text-lg">edit_square</span>
          {showManagementPanel ? "Hide Update Options" : "Manage Project"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onToggleConfidentialPanel}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <span className="material-symbols-outlined text-lg">lock</span>
        {showConfidentialPanel ? "Hide Confidential Access" : "Confidential Access"}
      </button>
    </div>
  );
}
