import WorkspacePageHeader from "../../WorkspacePageHeader";

interface CreateTestCaseHeaderProps {
  metaValue: string;
  submitting: boolean;
  onSave: () => void;
}

export default function CreateTestCaseHeader({
  metaValue,
  submitting,
  onSave,
}: CreateTestCaseHeaderProps) {
  return (
    <WorkspacePageHeader
      eyebrow="Quality"
      title="Create Test Case"
      description="Build reusable test coverage with cleaner structure, linked delivery context, and guided inputs instead of scattered manual entry."
      metaLabel="Selected scope"
      metaValue={metaValue}
      showStaticBanner={false}
      actions={
        <button
          type="button"
          onClick={onSave}
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-lg">save</span>
          <span>{submitting ? "Saving..." : "Save Test Case"}</span>
        </button>
      }
    />
  );
}
