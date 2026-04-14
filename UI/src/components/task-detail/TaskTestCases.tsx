import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  testCasesAPI,
  type TestCaseExecutionAttachment,
  type TestCaseModuleOption,
} from "../../services/testCases";
import type { TestCaseRecord, TestCaseStatus } from "../../types/testCase";

interface TaskTestCasesProps {
  task: {
    id: string;
    title: string;
    project: { id: string; name: string };
    sprint?: { id: string; name: string } | null;
  };
  linkedTestCases: TestCaseRecord[];
  testCasesLoading: boolean;
  testCaseRunLoadingId: string;
  projectModuleOptions: TestCaseModuleOption[];
  onTestCaseRun: (
    testCaseId: string,
    status: Extract<TestCaseStatus, "Passed" | "Failed" | "Blocked">,
    options?: {
      note?: string;
      actualBehavior?: string;
      attachments?: TestCaseExecutionAttachment[];
    },
  ) => Promise<void> | void;
  onTestCaseCreated: (testCase: TestCaseRecord) => void;
}

export default function TaskTestCases({
  task,
  linkedTestCases,
  testCasesLoading,
  testCaseRunLoadingId,
  projectModuleOptions,
  onTestCaseRun,
  onTestCaseCreated,
}: TaskTestCasesProps) {
  const navigate = useNavigate();
  const [showQuickTestCaseForm, setShowQuickTestCaseForm] = useState(false);
  const [quickTestCaseTitle, setQuickTestCaseTitle] = useState(`Verify ${task.title}`);
  const [quickTestCaseSuite, setQuickTestCaseSuite] = useState("");
  const [quickTestCaseModule, setQuickTestCaseModule] = useState(projectModuleOptions[0]?.name || "");
  const [quickTestCasePriority, setQuickTestCasePriority] = useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [quickTestCaseAutomation, setQuickTestCaseAutomation] = useState<"Manual" | "Automated" | "Candidate">("Manual");
  const [quickStepAction, setQuickStepAction] = useState("");
  const [quickStepExpected, setQuickStepExpected] = useState("");
  const [quickTestCaseSubmitting, setQuickTestCaseSubmitting] = useState(false);
  const [quickTestCaseError, setQuickTestCaseError] = useState("");
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<"Passed" | "Failed" | "Blocked">("Passed");
  const [executionNote, setExecutionNote] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [executionAttachments, setExecutionAttachments] = useState<TestCaseExecutionAttachment[]>([]);
  const [executionError, setExecutionError] = useState("");
  const [uploadingExecutionAttachment, setUploadingExecutionAttachment] = useState(false);
  const linkedCount = linkedTestCases.length;

  const navigateToCreateTestCase = () => {
    navigate(`/test-cases/create?sourceTaskId=${task.id}`);
  };

  const handleCreateQuickTestCase = async () => {
    if (
      !quickTestCaseTitle.trim() ||
      !quickTestCaseSuite.trim() ||
      !quickTestCaseModule.trim() ||
      !quickStepAction.trim() ||
      !quickStepExpected.trim()
    ) {
      setQuickTestCaseError("Title, suite, module, step action, and expected result are required.");
      return;
    }

    try {
      setQuickTestCaseSubmitting(true);
      setQuickTestCaseError("");
      const response = await testCasesAPI.createTestCase({
        title: quickTestCaseTitle.trim(),
        project_id: task.project.id,
        linked_task_id: task.id,
        sprint_id: task.sprint?.id,
        suite: quickTestCaseSuite.trim(),
        module: quickTestCaseModule.trim(),
        priority: quickTestCasePriority,
        status: "Draft",
        automation: quickTestCaseAutomation,
        tags: [],
        preconditions: [],
        steps: [
          {
            id: 1,
            action: quickStepAction.trim(),
            expected: quickStepExpected.trim(),
          },
        ],
        linked_items: [],
        execution_history: [],
      });

      if (response.success) {
        onTestCaseCreated(response.data);
        setShowQuickTestCaseForm(false);
        setQuickTestCaseTitle("");
        setQuickTestCaseSuite("");
        setQuickStepAction("");
        setQuickStepExpected("");
        setQuickTestCasePriority("Medium");
        setQuickTestCaseAutomation("Manual");
      }
    } catch (error: any) {
      setQuickTestCaseError(
        error?.response?.data?.message || "Failed to create test case from this task."
      );
    } finally {
      setQuickTestCaseSubmitting(false);
    }
  };

  const openExecutionForm = (
    testCaseId: string,
    status: Extract<TestCaseStatus, "Passed" | "Failed" | "Blocked">,
  ) => {
    setActiveExecutionId(testCaseId);
    setExecutionStatus(status);
    setExecutionNote("");
    setActualBehavior("");
    setExecutionAttachments([]);
    setExecutionError("");
  };

  const handleExecutionAttachmentUpload = async (testCaseId: string, file: File | null) => {
    if (!file) return;

    try {
      setUploadingExecutionAttachment(true);
      setExecutionError("");
      const response = await testCasesAPI.uploadExecutionAttachment(testCaseId, file);
      if (response.success) {
        setExecutionAttachments((current) => [...current, response.data]);
      }
    } catch (error: any) {
      setExecutionError(
        error?.response?.data?.message || "Failed to upload screenshot.",
      );
    } finally {
      setUploadingExecutionAttachment(false);
    }
  };

  const handleExecutionSave = async (testCaseId: string) => {
    if (executionStatus === "Failed" && !actualBehavior.trim()) {
      setExecutionError("Actual behavior is required when the execution status is Failed.");
      return;
    }

    try {
      setExecutionError("");
      await onTestCaseRun(testCaseId, executionStatus, {
        note: executionNote,
        actualBehavior: executionStatus === "Failed" ? actualBehavior : undefined,
        attachments: executionAttachments,
      });
      setActiveExecutionId(null);
      setExecutionStatus("Passed");
      setExecutionNote("");
      setActualBehavior("");
      setExecutionAttachments([]);
    } catch (error: any) {
      setExecutionError(error?.message || "Failed to save execution.");
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Quality
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Linked Coverage</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {linkedCount} {linkedCount === 1 ? "case" : "cases"}
            </span>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Review coverage, run outcomes, and create new linked checks for this task in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowQuickTestCaseForm(current => !current)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              showQuickTestCaseForm
                ? "border border-blue-200 bg-blue-50 text-blue-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {showQuickTestCaseForm ? "Close Quick Add" : "Quick Add"}
          </button>
          <button
            type="button"
            onClick={navigateToCreateTestCase}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            Full Create Page
          </button>
          <button
            type="button"
            onClick={() => navigate("/test-cases")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            Open Library
          </button>
        </div>
      </div>

      {showQuickTestCaseForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Test case title
              </span>
              <input
                value={quickTestCaseTitle}
                onChange={event => setQuickTestCaseTitle(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                placeholder={`Verify ${task.title}`}
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Suite
              </span>
              <input
                value={quickTestCaseSuite}
                onChange={event => setQuickTestCaseSuite(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                placeholder="Smoke Regression"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Module
              </span>
              <select
                value={quickTestCaseModule}
                onChange={event => setQuickTestCaseModule(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">Select module</option>
                {projectModuleOptions.map(option => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Priority
              </span>
              <select
                value={quickTestCasePriority}
                onChange={event =>
                  setQuickTestCasePriority(
                    event.target.value as "Critical" | "High" | "Medium" | "Low"
                  )
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                {["Critical", "High", "Medium", "Low"].map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Automation
              </span>
              <select
                value={quickTestCaseAutomation}
                onChange={event =>
                  setQuickTestCaseAutomation(
                    event.target.value as "Manual" | "Automated" | "Candidate"
                  )
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                {["Manual", "Automated", "Candidate"].map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Step action
              </span>
              <textarea
                value={quickStepAction}
                onChange={event => setQuickStepAction(event.target.value)}
                className="mt-2 min-h-[96px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                placeholder="Describe what the tester should do"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Expected result
              </span>
              <textarea
                value={quickStepExpected}
                onChange={event => setQuickStepExpected(event.target.value)}
                className="mt-2 min-h-[96px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                placeholder="Describe the expected outcome"
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Module comes from the project setup. Suite stays mandatory when creating the test case.
          </p>
          {quickTestCaseError && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {quickTestCaseError}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleCreateQuickTestCase}
              disabled={quickTestCaseSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {quickTestCaseSubmitting ? "Creating..." : "Create Test Case"}
            </button>
          </div>
        </div>
      )}

      {testCasesLoading ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          Loading linked coverage...
        </div>
      ) : linkedTestCases.length ? (
        <div className="space-y-3">
          {linkedTestCases.map(testCase => (
            <div
              key={testCase.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/test-cases/case/${testCase.id}`)}
                    className="text-left"
                  >
                    <p className="text-sm font-semibold text-slate-900 hover:text-blue-700">
                      {testCase.reference_code} • {testCase.title}
                    </p>
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-600">
                      {testCase.project?.name || "No project"}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-600">
                      {testCase.module}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-600">
                      {testCase.suite}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-600">
                      {testCase.status}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 font-medium text-slate-600">
                      {testCase.automation}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Last updated {new Date(testCase.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["Passed", "Failed", "Blocked"] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => openExecutionForm(testCase.id, status)}
                      disabled={Boolean(testCaseRunLoadingId)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                        status === "Passed"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : status === "Failed"
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-amber-600 hover:bg-amber-700"
                      } disabled:opacity-50`}
                    >
                      {testCaseRunLoadingId === `${testCase.id}:${status}` ? "Running..." : status}
                    </button>
                  ))}
                </div>
              </div>
              {activeExecutionId === testCase.id ? (
                <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Execution Status
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
                        {["Passed", "Failed", "Blocked"].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Note
                      </span>
                      <input
                        value={executionNote}
                        onChange={(event) => setExecutionNote(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                        placeholder="Optional execution note"
                      />
                    </label>

                    {executionStatus === "Failed" ? (
                      <label className="block md:col-span-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Actual Behavior
                        </span>
                        <textarea
                          value={actualBehavior}
                          onChange={(event) => setActualBehavior(event.target.value)}
                          className="mt-2 min-h-[96px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                          placeholder="Describe what actually happened"
                        />
                      </label>
                    ) : null}

                    <div className="md:col-span-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Screenshots
                      </span>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
                          <span className="material-symbols-outlined text-base">upload</span>
                          {uploadingExecutionAttachment ? "Uploading..." : "Add screenshot"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingExecutionAttachment}
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              void handleExecutionAttachmentUpload(testCase.id, file);
                              event.target.value = "";
                            }}
                          />
                        </label>
                        <p className="text-xs text-slate-500">
                          Add evidence for failed or blocked runs.
                        </p>
                      </div>
                      {executionAttachments.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {executionAttachments.map((attachment) => (
                            <a
                              key={attachment.url}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              <span className="material-symbols-outlined text-sm">image</span>
                              {attachment.name}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {executionError ? (
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {executionError}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveExecutionId(null);
                        setExecutionError("");
                        setActualBehavior("");
                        setExecutionNote("");
                        setExecutionAttachments([]);
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleExecutionSave(testCase.id)}
                      disabled={testCaseRunLoadingId === `${testCase.id}:${executionStatus}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testCaseRunLoadingId === `${testCase.id}:${executionStatus}`
                        ? "Saving..."
                        : "Save Execution"}
                    </button>
                  </div>
                </div>
              ) : null}
              {testCase.execution_history.length ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Latest Execution
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {testCase.execution_history[0].status}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {testCase.execution_history[0].cycle} • {testCase.execution_history[0].tester} •{" "}
                    {new Date(testCase.execution_history[0].executedAt).toLocaleString()}
                  </p>
                  {testCase.execution_history[0].actual_behavior ? (
                    <p className="mt-2 text-xs text-slate-600">
                      Actual: {testCase.execution_history[0].actual_behavior}
                    </p>
                  ) : null}
                  {testCase.execution_history[0].attachments?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {testCase.execution_history[0].attachments.map((attachment) => (
                        <a
                          key={attachment.url}
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700"
                        >
                          <span className="material-symbols-outlined text-sm">image</span>
                          {attachment.name}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          No linked coverage yet. Create one here and it will appear in this section.
        </div>
      )}
    </div>
  );
}
