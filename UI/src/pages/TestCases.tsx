import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseSummaryStrip from "../components/testcases/TestCaseSummaryStrip";
import TestCaseNav from "../components/testcases/TestCaseNav";
import TestCaseModuleGrid from "../components/testcases/TestCaseModuleGrid";
import { testCasesAPI } from "../services/testCases";
import type { TestCaseRecord } from "../types/testCase";
import { groupTestCasesByModule } from "../utils/testCases";

export default function TestCases() {
  const navigate = useNavigate();
  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestCases = async () => {
      try {
        setLoading(true);
        const response = await testCasesAPI.getTestCases();
        if (response.success) {
          setTestCases(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch test cases:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTestCases();
  }, []);

  const moduleGroups = useMemo(() => groupTestCasesByModule(testCases), [testCases]);
  const latestSprint =
    testCases.find((item) => item.sprint_name)?.sprint_name || "Workspace QA";
  const automatedCount = testCases.filter((item) => item.automation === "Automated").length;
  const readyCount = testCases.filter((item) => item.status === "Ready").length;
  const linkedTaskCount = testCases.filter((item) => item.linked_task).length;

  const summaryItems = [
    {
      label: "Modules",
      value: moduleGroups.length,
      note: "Browse the catalog by functional area first",
      icon: "category",
    },
    {
      label: "Total cases",
      value: testCases.length,
      note: "Across all saved modules",
      icon: "fact_check",
    },
    {
      label: "Ready to run",
      value: readyCount,
      note: "Prepared for the current cycle",
      icon: "verified",
    },
    {
      label: "Linked tasks",
      value: linkedTaskCount,
      note: `${automatedCount} already automated`,
      icon: "device_hub",
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title="Test Cases"
          description="Start module-wise, then open a module page to inspect its project context, task links, and test case list."
          metaLabel="Active cycle"
          metaValue={latestSprint}
          showStaticBanner={false}
          actions={
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/test-cases/create")}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-lg">add_task</span>
                <span>New Test Case</span>
              </button>
            </div>
          }
        />

        <div className="space-y-5">
          <TestCaseNav />
          <TestCaseSummaryStrip items={summaryItems} />
          <TestCaseModuleGrid
            items={moduleGroups}
            loading={loading}
            onOpenModule={(moduleSlug) => navigate(`/test-cases/modules/${moduleSlug}`)}
          />
        </div>
      </div>
    </div>
  );
}
