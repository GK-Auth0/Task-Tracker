import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseDetailPanel from "../components/testcases/TestCaseDetailPanel";
import { testCasesAPI } from "../services/testCases";
import type { TestCaseRecord } from "../types/testCase";
import { encodeModuleSlug, formatTestCaseDate } from "../utils/testCases";

type DetailTab = "overview" | "steps" | "links" | "history";

export default function TestCaseDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [testCase, setTestCase] = useState<TestCaseRecord | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestCase = async () => {
      try {
        setLoading(true);
        const response = await testCasesAPI.getTestCases();
        if (response.success) {
          setTestCase(response.data.find((item) => item.id === id) || null);
        }
      } catch (error) {
        console.error("Failed to fetch test case:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTestCase();
  }, [id]);

  const handleTestCaseUpdated = (updatedCase: TestCaseRecord) => {
    setTestCase(updatedCase);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title={testCase?.title || "Test Case"}
          description="Review the complete case record, including execution steps, linked work, and recent run history."
          metaLabel="Reference"
          metaValue={testCase?.reference_code || "Loading"}
          showStaticBanner={false}
          actions={
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  testCase?.module
                    ? navigate(`/test-cases/modules/${encodeModuleSlug(testCase.module)}`)
                    : navigate("/test-cases")
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {testCase?.module ? "Back to module" : "Back to modules"}
              </button>
            </div>
          }
        />

        <div className="space-y-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              Loading test case...
            </div>
          ) : (
            <TestCaseDetailPanel
              selectedCase={testCase}
              detailTab={detailTab}
              onDetailTabChange={setDetailTab}
              formatRelativeDate={formatTestCaseDate}
              onTestCaseUpdated={handleTestCaseUpdated}
            />
          )}
        </div>
      </div>
    </div>
  );
}
