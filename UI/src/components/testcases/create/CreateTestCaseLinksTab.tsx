import type { TestCaseFormTaskOption } from "../../../services/testCases";

interface CreateTestCaseLinksTabProps {
  linkedTaskId: string;
  linkedStoryId: string;
  linkedStoryTitle: string;
  taskOptions: TestCaseFormTaskOption[];
  onLinkedTaskChange: (value: string) => void;
  onLinkedStoryIdChange: (value: string) => void;
  onLinkedStoryTitleChange: (value: string) => void;
}

export default function CreateTestCaseLinksTab({
  linkedTaskId,
  linkedStoryId,
  linkedStoryTitle,
  taskOptions,
  onLinkedTaskChange,
  onLinkedStoryIdChange,
  onLinkedStoryTitleChange,
}: CreateTestCaseLinksTabProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Linked delivery context</h2>
        <p className="mt-1 text-sm text-slate-500">
          Reuse live workspace records where possible and only type extra references when needed.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Linked task
            </span>
            <select
              value={linkedTaskId}
              onChange={(event) => onLinkedTaskChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400"
            >
              <option value="">No linked task</option>
              {taskOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                  {item.project ? ` • ${item.project.name}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Story ID
            </span>
            <input
              value={linkedStoryId}
              onChange={(event) => onLinkedStoryIdChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400"
              placeholder="AUTH-72"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Story title
            </span>
            <input
              value={linkedStoryTitle}
              onChange={(event) => onLinkedStoryTitleChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400"
              placeholder="Secure email authentication"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
