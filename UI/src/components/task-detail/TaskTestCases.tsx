import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { testCasesAPI, type TestCaseModuleOption } from "../../services/testCases";
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
  onTestCaseRun: (testCaseId: string, status: Extract<TestCaseStatus, "Passed" | "Failed" | "Blocked">) => void;
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

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Linked Test Cases</h3>
          <p className="text-sm text-slate-500">
            Run and review test coverage for this task directly here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/test-cases")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            Open Test Cases
          </button>
          <button
            type="button"
            onClick={() => setShowQuickTestCaseForm(current => !current)}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {showQuickTestCaseForm ? "Close Quick Create" : "Add Test Case Here"}
          </button>
          <button
            type="button"
            onClick={navigateToCreateTestCase}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            Full Create Page
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
          Loading linked test cases...
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
                  <p className="mt-1 text-xs text-slate-500">
                    {testCase.project?.name || "No project"} • {testCase.module} • {testCase.suite}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Status: {testCase.status} • Automation: {testCase.automation} • Last updated{" "}
                    {new Date(testCase.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["Passed", "Failed", "Blocked"] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onTestCaseRun(testCase.id, status)}
                      disabled={Boolean(testCaseRunLoadingId)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                        status === "Passed"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : status === "Failed"
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-amber-600 hover:bg-amber-700"
                      } disabled:opacity-50`}
                    >
                      {testCaseRunLoadingId === `${testCase.id}:${status}`
                        ? "Running..."
                        : `Run ${status}`}
                    </button>
                  ))}
                </div>
              </div>
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
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          No test cases are linked to this task yet. Add one from here and it will show up in this panel.
        </div>
      )}
    </div>
  );
}