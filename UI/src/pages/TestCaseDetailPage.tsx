import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseNav from "../components/testcases/TestCaseNav";
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

  return (
    <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title={testCase?.title || "Test Case"}
          description="Dedicated test case page for deeper review of steps, links, execution history, and delivery context."
          metaLabel="Reference"
          metaValue={testCase?.reference_code || "Loading"}
          showStaticBanner={false}
          actions={
            <div className="flex flex-wrap gap-3">
              {testCase?.module ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/test-cases/modules/${encodeModuleSlug(testCase.module)}`)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back to module
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate("/test-cases")}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to modules
              </button>
            </div>
          }
        />

        <div className="space-y-5">
          <TestCaseNav />
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
