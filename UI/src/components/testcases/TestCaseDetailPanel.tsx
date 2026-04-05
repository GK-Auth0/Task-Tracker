import SprintTabs from "../sprint/SprintTabs";
import { priorityClasses, statusClasses } from "../../data/testManagement";
import type { TestCaseRecord } from "../../types/testCase";

type DetailTab = "overview" | "steps" | "links" | "history";

interface TestCaseDetailPanelProps {
  selectedCase: TestCaseRecord | null;
  detailTab: DetailTab;
  onDetailTabChange: (value: DetailTab) => void;
  formatRelativeDate: (value: string) => string;
}

export default function TestCaseDetailPanel({
  selectedCase,
  detailTab,
  onDetailTabChange,
  formatRelativeDate,
}: TestCaseDetailPanelProps) {
  if (!selectedCase) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">
          Select a test case to review details
        </p>
        <p className="mt-2 text-xs text-slate-500">
          The selected case will open here with steps, linked items, and execution history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {selectedCase.reference_code}
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{selectedCase.title}</h2>
          </div>
          <span
            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${priorityClasses[selectedCase.priority]}`}
          >
            {selectedCase.priority} Priority
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            { label: "Owner", value: selectedCase.owner?.full_name || "Unknown" },
            { label: "Suite", value: selectedCase.suite },
            { label: "Status", value: selectedCase.status },
            { label: "Updated", value: formatRelativeDate(selectedCase.updated_at) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <SprintTabs
            items={[
              { key: "overview", label: "Overview" },
              { key: "steps", label: "Steps" },
              { key: "links", label: "Links" },
              { key: "history", label: "History" },
            ]}
            value={detailTab}
            onChange={(value) => onDetailTabChange(value as DetailTab)}
            compact
          />
        </div>
      </div>

      {detailTab === "overview" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Preconditions</h3>
              <div className="mt-3 space-y-2">
                {selectedCase.preconditions.length ? (
                  selectedCase.preconditions.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    No preconditions added yet.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {[
                ["Sprint", selectedCase.sprint_name || "No sprint"],
                ["Module", selectedCase.module],
                ["Linked task", selectedCase.linked_task?.title || "No linked task"],
                ["Tags", selectedCase.tags.length ? selectedCase.tags.join(", ") : "No tags"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-sm text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {detailTab === "steps" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Steps</h3>
            <p className="text-[11px] text-slate-500">Actions and expected results</p>
          </div>
          <div className="mt-4 space-y-3">
            {selectedCase.steps.length ? (
              selectedCase.steps.map((step) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                      {step.id}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{step.action}</p>
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Expected:</span>{" "}
                    {step.expected}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                No steps added yet.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {detailTab === "links" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Linked work items</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {selectedCase.linked_task ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Task • {selectedCase.linked_task.id}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedCase.linked_task.title}
                </p>
              </div>
            ) : null}

            {selectedCase.linked_items.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {item.type} • {item.id}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">{item.title}</p>
              </div>
            ))}

            {!selectedCase.linked_task && !selectedCase.linked_items.length ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 md:col-span-2">
                No linked work items yet.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {detailTab === "history" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Recent execution history</h3>
          <div className="mt-4 space-y-3">
            {selectedCase.execution_history.length ? (
              selectedCase.execution_history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.cycle}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.tester} • {item.executedAt}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.note}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                No execution history yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
