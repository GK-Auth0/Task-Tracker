import { useEffect, useState } from "react";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseNav from "../components/testcases/TestCaseNav";
import { testInsightsAPI } from "../services/testManagement";
import type { TraceabilityRow } from "../types/testManagement";

export default function TestTraceability() {
  const [rows, setRows] = useState<TraceabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTraceability = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await testInsightsAPI.getTraceability();
        if (response.success) setRows(response.data);
      } catch (loadError) {
        console.error("Failed to load traceability:", loadError);
        setError("Failed to load traceability matrix");
      } finally {
        setLoading(false);
      }
    };

    loadTraceability();
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title="Traceability"
          description="See how linked stories and requirements map to real test cases and their latest execution state."
          metaLabel="Traceable items"
          metaValue={`${rows.length}`}
          showStaticBanner={false}
        />

        <div className="space-y-5">
          <TestCaseNav />

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[130px_minmax(260px,1.5fr)_200px_220px_120px_150px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span>ID</span>
              <span>Requirement / work item</span>
              <span>Linked story</span>
              <span>Linked cases</span>
              <span>Coverage</span>
              <span>Latest run</span>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Loading traceability matrix...
              </div>
            ) : !rows.length ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  No traceability links yet.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Link stories or requirements to test cases to populate this matrix.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <div
                    key={`${row.id}-${row.requirement}`}
                    className="grid grid-cols-[130px_minmax(260px,1.5fr)_200px_220px_120px_150px] gap-4 px-4 py-4"
                  >
                    <div className="text-sm font-semibold text-slate-900">{row.id}</div>
                    <div className="text-sm text-slate-700">{row.requirement}</div>
                    <div className="text-sm text-slate-600">{row.linkedStory}</div>
                    <div className="flex flex-wrap gap-2">
                      {row.linkedCases.map((item) => (
                        <span
                          key={item}
                          className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div>
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {row.coverage}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">{row.latestRun}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
