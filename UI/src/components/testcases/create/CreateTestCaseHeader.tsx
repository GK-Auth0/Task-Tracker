import WorkspacePageHeader from "../../WorkspacePageHeader";

interface CreateTestCaseHeaderProps {
  metaValue: string;
  submitting: boolean;
  onSave: () => void;
  onSaveAndAddAnother: () => void;
  onStartFresh: () => void;
  isEditing: boolean;
}

export default function CreateTestCaseHeader({
  metaValue,
  submitting,
  onSave,
  onSaveAndAddAnother,
  onStartFresh,
  isEditing,
}: CreateTestCaseHeaderProps) {
  return (
    <WorkspacePageHeader
      eyebrow="Quality"
      title={isEditing ? "Update Test Case" : "Create Test Case"}
      description="Author multiple reusable test cases in one workflow, or load an existing case and update it without leaving the screen."
      metaLabel="Selected scope"
      metaValue={metaValue}
      showStaticBanner={false}
      actions={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onStartFresh}
            disabled={submitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Start Fresh
          </button>
          {!isEditing ? (
            <button
              type="button"
              onClick={onSaveAndAddAnother}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">playlist_add</span>
              <span>{submitting ? "Saving..." : "Save & Add Another"}</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            <span>
              {submitting ? "Saving..." : isEditing ? "Update Test Case" : "Save Test Case"}
            </span>
          </button>
        </div>
      }
    />
  );
}
