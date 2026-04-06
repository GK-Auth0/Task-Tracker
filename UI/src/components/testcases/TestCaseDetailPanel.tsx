import { useEffect, useState } from "react";
import SprintTabs from "../sprint/SprintTabs";
import { priorityClasses, statusClasses } from "../../data/testManagement";
import {
  testCasesAPI,
  type TestCaseExecutionAttachment,
} from "../../services/testCases";
import type { TestCaseRecord } from "../../types/testCase";

type DetailTab = "overview" | "steps" | "links" | "history";

interface TestCaseDetailPanelProps {
  selectedCase: TestCaseRecord | null;
  detailTab: DetailTab;
  onDetailTabChange: (value: DetailTab) => void;
  formatRelativeDate: (value: string) => string;
  onTestCaseUpdated: (value: TestCaseRecord) => void;
}

export default function TestCaseDetailPanel({
  selectedCase,
  detailTab,
  onDetailTabChange,
  formatRelativeDate,
  onTestCaseUpdated,
}: TestCaseDetailPanelProps) {
  const [executionStatus, setExecutionStatus] = useState<"Passed" | "Failed" | "Blocked">(
    "Passed",
  );
  const [executionCycle, setExecutionCycle] = useState("");
  const [executionNote, setExecutionNote] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [attachments, setAttachments] = useState<TestCaseExecutionAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [savingExecution, setSavingExecution] = useState(false);
  const [executionError, setExecutionError] = useState("");

  useEffect(() => {
    setExecutionStatus("Passed");
    setExecutionCycle(selectedCase?.sprint_name || "");
    setExecutionNote("");
    setActualBehavior("");
    setAttachments([]);
    setExecutionError("");
  }, [selectedCase?.id, selectedCase?.sprint_name]);

  if (!selectedCase) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">
          Select a test case to review details
        </p>
        <p className="mt-2 text-xs text-slate-500">
          The selected case will open here with steps, linked items, and execution history.
        </p>
      </div>
    );
  }

  const handleAttachmentUpload = async (file: File | null) => {
    if (!file || !selectedCase) return;

    try {
      setUploadingAttachment(true);
      setExecutionError("");
      const response = await testCasesAPI.uploadExecutionAttachment(selectedCase.id, file);
      if (response.success) {
        setAttachments((current) => [...current, response.data]);
      }
    } catch (error: any) {
      console.error("Failed to upload execution attachment:", error);
      setExecutionError(
        error?.response?.data?.message || "Failed to upload execution attachment",
      );
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSaveExecution = async () => {
    if (!selectedCase) return;
    if (executionStatus === "Failed" && !actualBehavior.trim()) {
      setExecutionError("Actual behavior is required when marking a test case as Failed");
      return;
    }

    try {
      setSavingExecution(true);
      setExecutionError("");
      const response = await testCasesAPI.addExecution(selectedCase.id, {
        status: executionStatus,
        cycle: executionCycle.trim() || undefined,
        note: executionNote.trim() || undefined,
        actual_behavior: executionStatus === "Failed" ? actualBehavior.trim() : undefined,
        attachments: executionStatus === "Failed" ? attachments : [],
      });
      if (response.success) {
        onTestCaseUpdated(response.data);
        setExecutionStatus("Passed");
        setExecutionCycle(response.data.sprint_name || "");
        setExecutionNote("");
        setActualBehavior("");
        setAttachments([]);
      }
    } catch (error: any) {
      console.error("Failed to save test execution:", error);
      setExecutionError(error?.response?.data?.message || "Failed to save test execution");
    } finally {
      setSavingExecution(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {selectedCase.reference_code}
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{selectedCase.title}</h2>
          </div>
          <span
            className={`inline-flex rounded-md border px-3 py-1.5 text-xs font-semibold ${priorityClasses[selectedCase.priority]}`}
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
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Preconditions</h3>
              <div className="mt-3 space-y-2">
                {selectedCase.preconditions.length ? (
                  selectedCase.preconditions.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
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
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Steps</h3>
            <p className="text-[11px] text-slate-500">Actions and expected results</p>
          </div>
          <div className="mt-4 space-y-3">
            {selectedCase.steps.length ? (
              selectedCase.steps.map((step) => (
                <div
                  key={step.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
                      {step.id}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{step.action}</p>
                  </div>
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Expected:</span>{" "}
                    {step.expected}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                No steps added yet.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {detailTab === "links" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Linked work items</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {selectedCase.linked_task ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {item.type} • {item.id}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">{item.title}</p>
              </div>
            ))}

            {!selectedCase.linked_task && !selectedCase.linked_items.length ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 md:col-span-2">
                No linked work items yet.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {detailTab === "history" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Recent execution history</h3>
            <p className="text-[11px] text-slate-500">
              Manual runs can record actual behavior and evidence.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Execution status
                  </span>
                  <select
                    value={executionStatus}
                    onChange={(event) =>
                      setExecutionStatus(
                        event.target.value as "Passed" | "Failed" | "Blocked",
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                  >
                    {["Passed", "Failed", "Blocked"].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Cycle / run label
                  </span>
                  <input
                    value={executionCycle}
                    onChange={(event) => setExecutionCycle(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                    placeholder="Sprint 18 QA run"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Execution note
                </span>
                <textarea
                  rows={3}
                  value={executionNote}
                  onChange={(event) => setExecutionNote(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                  placeholder="Add a short summary of the run outcome"
                />
              </label>

              {executionStatus === "Failed" ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Actual behavior
                    </span>
                    <textarea
                      rows={5}
                      value={actualBehavior}
                      onChange={(event) => setActualBehavior(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                      placeholder="Describe what actually happened during the failed run"
                    />
                  </label>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Failure evidence</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Add images or files when the case fails.
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <span className="material-symbols-outlined text-base">upload</span>
                        <span>{uploadingAttachment ? "Uploading..." : "Add file"}</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            void handleAttachmentUpload(file);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <div className="mt-4 space-y-2">
                      {attachments.length ? (
                        attachments.map((attachment) => (
                          <div
                            key={attachment.url}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                            >
                              <span className="material-symbols-outlined text-base">
                                {attachment.type === "image" ? "image" : "attach_file"}
                              </span>
                              <span className="truncate">{attachment.name}</span>
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                          No evidence uploaded yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {executionError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {executionError}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveExecution}
                  disabled={savingExecution || uploadingAttachment}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingExecution ? "Saving..." : "Save execution"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {selectedCase.execution_history.length ? (
              selectedCase.execution_history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.cycle}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.tester} • {item.executedAt}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClasses[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.note}</p>
                  {item.actual_behavior ? (
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                      <span className="font-semibold">Actual behavior:</span>{" "}
                      {item.actual_behavior}
                    </div>
                  ) : null}
                  {item.attachments?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.attachments.map((attachment) => (
                        <a
                          key={attachment.url}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {attachment.type === "image" ? "image" : "attach_file"}
                          </span>
                          <span>{attachment.name}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                No execution history yet.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
