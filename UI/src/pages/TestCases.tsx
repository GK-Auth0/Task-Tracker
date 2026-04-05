import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import SprintTabs from "../components/sprint/SprintTabs";
import TestCaseSummaryStrip from "../components/testcases/TestCaseSummaryStrip";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import {
  automationClasses,
  priorityClasses,
  qaSectionLinks,
  statusClasses,
} from "../data/testManagement";
import { testCasesAPI } from "../services/testCases";
import type { TestAutomation, TestCaseRecord, TestCaseStatus } from "../types/testCase";

type DetailTab = "overview" | "steps" | "links" | "history";

const formatRelativeDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently updated";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

export default function TestCases() {
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TestCaseStatus>("All");
  const [automationFilter, setAutomationFilter] = useState<"All" | TestAutomation>("All");
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestCases = async () => {
      try {
        setLoading(true);
        const response = await testCasesAPI.getTestCases();
        if (response.success) {
          setTestCases(response.data);
          setSelectedCaseId((current) => current || response.data[0]?.id || "");
        }
      } catch (error) {
        console.error("Failed to fetch test cases:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTestCases();
  }, []);

  const filteredCases = useMemo(() => {
    return testCases.filter((testCase) => {
      const matchesQuery =
        !query.trim() ||
        `${testCase.reference_code} ${testCase.title} ${testCase.module} ${testCase.suite}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      const matchesStatus =
        statusFilter === "All" || testCase.status === statusFilter;
      const matchesAutomation =
        automationFilter === "All" || testCase.automation === automationFilter;
      return matchesQuery && matchesStatus && matchesAutomation;
    });
  }, [automationFilter, query, statusFilter, testCases]);

  useEffect(() => {
    if (!filteredCases.length) {
      setSelectedCaseId("");
      return;
    }

    if (!filteredCases.some((item) => item.id === selectedCaseId)) {
      setSelectedCaseId(filteredCases[0].id);
    }
  }, [filteredCases, selectedCaseId]);

  const selectedCase =
    filteredCases.find((testCase) => testCase.id === selectedCaseId) ||
    filteredCases[0] ||
    null;

  const readyCount = testCases.filter((item) => item.status === "Ready").length;
  const failedCount = testCases.filter((item) => item.status === "Failed").length;
  const automatedCount = testCases.filter(
    (item) => item.automation === "Automated",
  ).length;
  const latestSprint =
    testCases.find((item) => item.sprint_name)?.sprint_name || "Workspace QA";
  const summaryItems = [
    {
      label: "Total cases",
      value: testCases.length,
      note: "Across all saved suites",
      icon: "fact_check",
    },
    {
      label: "Ready to run",
      value: readyCount,
      note: "Prepared for the current cycle",
      icon: "verified",
    },
    {
      label: "Failed recently",
      value: failedCount,
      note: "Needs follow-up from QA or engineering",
      icon: "warning",
    },
    {
      label: "Automated coverage",
      value: testCases.length ? `${Math.round((automatedCount / testCases.length) * 100)}%` : "0%",
      note: "Cases already covered by automation",
      icon: "smart_toy",
    },
  ];

  const suiteFolders = useMemo(() => {
    const counts = new Map<string, number>();
    testCases.forEach((item) => {
      counts.set(item.suite, (counts.get(item.suite) || 0) + 1);
    });

    return [
      { name: "All test cases", count: testCases.length, icon: "library_books" },
      ...Array.from(counts.entries()).map(([name, count]) => ({
        name,
        count,
        icon: "folder_open",
      })),
    ];
  }, [testCases]);

  const executionStats = useMemo(() => {
    const allHistory = testCases.flatMap((item) => item.execution_history || []);
    return {
      passed: allHistory.filter((item) => item.status === "Passed").length,
      failed: allHistory.filter((item) => item.status === "Failed").length,
      blocked: allHistory.filter((item) => item.status === "Blocked").length,
      pending: Math.max(testCases.length - allHistory.length, 0),
    };
  }, [testCases]);

  const completionPercent = testCases.length
    ? Math.round(((executionStats.passed + executionStats.failed + executionStats.blocked) / testCases.length) * 100)
    : 0;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title="Test Cases"
          description="Manage reusable cases with the live workspace catalog, searchable details, linked work items, and execution history."
          metaLabel="Active cycle"
          metaValue={latestSprint}
          showStaticBanner={false}
          actions={
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/test-cases/create")}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-lg">add_task</span>
                <span>New Test Case</span>
              </button>
              <button className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <span className="material-symbols-outlined text-lg">upload</span>
                <span>Import</span>
              </button>
            </div>
          }
        />

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-2">
          <div className="flex flex-wrap gap-2">
            {qaSectionLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">
                  {link.icon}
                </span>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <TestCaseSummaryStrip items={summaryItems} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[220px_minmax(0,1.2fr)_minmax(320px,0.95fr)]">
          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Folders</h2>
                <span className="material-symbols-outlined text-slate-400">
                  folder_open
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {suiteFolders.map((folder, index) => (
                  <button
                    key={folder.name}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                      index === 0
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-3 text-xs font-medium sm:text-sm">
                      <span className="material-symbols-outlined text-[18px]">
                        {folder.icon}
                      </span>
                      {folder.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        index === 0
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {folder.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">Execution cycle</h2>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {latestSprint}
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">{completionPercent}% complete</p>
                <div className="mt-4 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {executionStats.passed} passed, {executionStats.failed} failed, {executionStats.pending} pending, {executionStats.blocked} blocked
                </p>
              </div>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by ID, title, module, or suite"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "All" | TestCaseStatus)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    {["All", "Draft", "Ready", "Blocked", "Passed", "Failed"].map((option) => (
                      <option key={option} value={option}>
                        Status: {option}
                      </option>
                    ))}
                  </select>
                  <select
                    value={automationFilter}
                    onChange={(event) =>
                      setAutomationFilter(event.target.value as "All" | TestAutomation)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
                  >
                    {["All", "Manual", "Automated", "Candidate"].map((option) => (
                      <option key={option} value={option}>
                        Automation: {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid grid-cols-[100px_minmax(220px,1.35fr)_140px_110px_120px_110px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>ID</span>
                <span>Test case</span>
                <span>Suite</span>
                <span>Owner</span>
                <span>Status</span>
                <span>Type</span>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading test cases...
                  </div>
                ) : null}

                {!loading &&
                  filteredCases.map((testCase) => (
                    <button
                      key={testCase.id}
                      onClick={() => setSelectedCaseId(testCase.id)}
                      className={`grid w-full grid-cols-[100px_minmax(220px,1.35fr)_140px_110px_120px_110px] gap-4 px-4 py-4 text-left transition ${
                        selectedCase?.id === testCase.id
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{testCase.reference_code}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{testCase.module}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {testCase.title}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {testCase.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">{testCase.suite}</div>
                      <div className="text-sm text-slate-600">{testCase.owner?.full_name || "Unknown"}</div>
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[testCase.status]}`}
                        >
                          {testCase.status}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${automationClasses[testCase.automation]}`}
                        >
                          {testCase.automation}
                        </span>
                      </div>
                    </button>
                  ))}

                {!loading && !filteredCases.length && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold text-slate-900">
                      No test cases match the current filters.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Try another status or search phrase to broaden the result.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {selectedCase ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        {selectedCase.reference_code}
                      </p>
                      <h2 className="mt-2 text-lg font-bold text-slate-900">
                        {selectedCase.title}
                      </h2>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${priorityClasses[selectedCase.priority]}`}
                    >
                      {selectedCase.priority} Priority
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {item.value}
                        </p>
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
                      onChange={(value) => setDetailTab(value as DetailTab)}
                      compact
                    />
                  </div>
                </div>

                {detailTab === "overview" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Preconditions
                    </h3>
                    <div className="mt-3 space-y-2">
                      {selectedCase.preconditions.length ? (
                        selectedCase.preconditions.map((item) => (
                          <div
                            key={item}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600"
                          >
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
                          No preconditions added yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {detailTab === "steps" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
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
                              <div className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                                {step.id}
                              </div>
                              <p className="text-sm font-semibold text-slate-900">
                                {step.action}
                              </p>
                            </div>
                            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs leading-5 text-slate-600">
                              <span className="font-semibold text-slate-800">Expected:</span>{" "}
                              {step.expected}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
                          No steps added yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {detailTab === "links" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-slate-900">Linked work items</h3>
                    <div className="mt-4 space-y-3">
                      {selectedCase.linked_task ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Task • {selectedCase.linked_task.id}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-800">
                            {selectedCase.linked_task.title}
                          </p>
                        </div>
                      ) : null}
                      {selectedCase.linked_items.length ? (
                        selectedCase.linked_items.map((item) => (
                          <div
                            key={`${item.type}-${item.id}`}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {item.type} • {item.id}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-800">
                              {item.title}
                            </p>
                          </div>
                        ))
                      ) : !selectedCase.linked_task ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
                          No linked work items yet.
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {detailTab === "history" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-slate-900">Recent execution history</h3>
                    <div className="mt-4 space-y-3">
                      {selectedCase.execution_history.length ? (
                        selectedCase.execution_history.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.cycle}
                                </p>
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
                            <p className="mt-3 text-xs leading-5 text-slate-600">{item.note}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
                          No execution history yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  Select a test case to review details
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  The detail panel shows steps, linked items, and execution
                  history for the selected case.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
