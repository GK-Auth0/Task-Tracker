interface SprintCreateSidebarProps {
  sprintLabel: string;
  goal: string;
  release: string;
  ownerName: string;
  projectNames: string[];
  capacity: string;
  readinessChecks: Array<{
    label: string;
    complete: boolean;
    detail: string;
  }>;
  saving: boolean;
  onSubmit: () => void;
}

export default function SprintCreateSidebar({
  sprintLabel,
  goal,
  release,
  ownerName,
  projectNames,
  capacity,
  readinessChecks,
  saving,
  onSubmit,
}: SprintCreateSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Preview
        </p>
        <h3 className="mt-2 text-sm font-semibold text-slate-900">{sprintLabel}</h3>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          {goal || "Add a sprint goal to frame the work."}
        </p>
        <p className="mt-2 text-[11px] text-slate-500">
          {projectNames.length ? projectNames.join(", ") : "Projects"} • {release || "Release"} •{" "}
          {ownerName || "Owner"} • {capacity || "0"} pts
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Create checks
          </p>
          <span className="text-[11px] text-slate-500">
            {readinessChecks.filter((item) => item.complete).length}/{readinessChecks.length} ready
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {readinessChecks.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-base ${
                    item.complete ? "text-emerald-600" : "text-amber-500"
                  }`}
                >
                  {item.complete ? "check_circle" : "pending"}
                </span>
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition-colors shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-lg">post_add</span>
        {saving ? "Syncing Sprint..." : "Create or Update Sprint"}
      </button>
    </div>
  );
}
