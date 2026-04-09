import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseNav from "../components/testcases/TestCaseNav";
import TestCaseFiltersBar from "../components/testcases/TestCaseFiltersBar";
import TestCaseCardsGrid from "../components/testcases/TestCaseCardsGrid";
import { testCasesAPI } from "../services/testCases";
import type { TestAutomation, TestCaseRecord, TestCaseStatus } from "../types/testCase";
import { decodeModuleSlug } from "../utils/testCases";

export default function TestCaseModuleDetail() {
  const navigate = useNavigate();
  const { moduleSlug = "" } = useParams();
  const moduleName = decodeModuleSlug(moduleSlug);

  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TestCaseStatus>("All");
  const [automationFilter, setAutomationFilter] = useState<"All" | TestAutomation>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestCases = async () => {
      try {
        setLoading(true);
        const response = await testCasesAPI.getTestCases();
        if (response.success) {
          setTestCases(response.data.filter((item) => item.module === moduleName));
        }
      } catch (error) {
        console.error("Failed to fetch test cases:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTestCases();
  }, [moduleName]);

  const filteredCases = useMemo(() => {
    return testCases.filter((testCase) => {
      const matchesQuery =
        !query.trim() ||
        `${testCase.reference_code} ${testCase.title} ${testCase.suite} ${testCase.project?.name || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "All" || testCase.status === statusFilter;
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

  const selectedCase = filteredCases.find((item) => item.id === selectedCaseId) || null;
  const projects = Array.from(new Set(testCases.map((item) => item.project?.name).filter(Boolean)));
  const sprints = Array.from(new Set(testCases.map((item) => item.sprint_name).filter(Boolean)));
  const linkedTaskCount = testCases.filter((item) => item.linked_task).length;

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title={moduleName || "Module"}
          description="Review module-level scope, filter the working list, and open a full case page only when deeper detail is needed."
          metaLabel="Cases in module"
          metaValue={`${testCases.length}`}
          showStaticBanner={false}
          actions={
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/test-cases")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to modules
              </button>
            </div>
          }
        />

        <div className="space-y-5">
          <TestCaseNav />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Projects
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {projects.length ? projects.join(", ") : "No project linked"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Sprints
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {sprints.length ? sprints.join(", ") : "No sprint linked"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Linked tasks
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">{linkedTaskCount}</p>
            </div>
          </div>

          {selectedCase ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Focus item
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    {selectedCase.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCase.project?.name || "No project"} • {selectedCase.suite} •{" "}
                    {selectedCase.linked_task?.title || "No linked task"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/test-cases/case/${selectedCase.id}`)}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Open full case page
                </button>
              </div>
            </div>
          ) : null}

          <TestCaseFiltersBar
            query={query}
            statusFilter={statusFilter}
            automationFilter={automationFilter}
            onQueryChange={setQuery}
            onStatusChange={setStatusFilter}
            onAutomationChange={setAutomationFilter}
          />

          <TestCaseCardsGrid
            items={filteredCases}
            selectedCaseId={selectedCaseId}
            loading={loading}
            onSelect={setSelectedCaseId}
          />
        </div>
      </div>
    </div>
  );
}
