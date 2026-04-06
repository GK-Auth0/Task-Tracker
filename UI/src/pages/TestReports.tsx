import { useEffect, useState } from "react";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseNav from "../components/testcases/TestCaseNav";
import { testInsightsAPI } from "../services/testManagement";
import type { TestReportsSummary } from "../types/testManagement";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function TestReports() {
  const [reportData, setReportData] = useState<TestReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await testInsightsAPI.getReports();
        if (response.success) setReportData(response.data);
      } catch (loadError) {
        console.error("Failed to load test reports:", loadError);
        setError("Failed to load test reports");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const summary = reportData?.summary || {
    total_cases: 0,
    automated_cases: 0,
    linked_cases: 0,
    plan_count: 0,
    run_count: 0,
    pass_rate: 0,
    open_defects: 0,
    resolved_defects: 0,
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title="Test Reports"
          description="Review live QA metrics from real plans, runs, cases, and defects instead of static report placeholders."
          metaLabel="Execution pass rate"
          metaValue={`${summary.pass_rate}%`}
          showStaticBanner={false}
        />

        <div className="space-y-5">
          <TestCaseNav />

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total cases", summary.total_cases, "fact_check", "Across all QA coverage"],
              ["Plans", summary.plan_count, "assignment", "Live plans in workspace"],
              ["Runs", summary.run_count, "playlist_play", "Tracked execution cycles"],
              ["Open defects", summary.open_defects, "bug_report", `${summary.resolved_defects} resolved`],
            ].map(([label, value, icon, detail]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                      {value}
                    </p>
                  </div>
                  <span className="material-symbols-outlined rounded-md bg-slate-100 p-2 text-slate-600">
                    {icon}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{detail}</p>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">Latest run health</h2>
                {loading ? (
                  <span className="text-xs text-slate-500">Loading...</span>
                ) : null}
              </div>
              <div className="mt-4 space-y-4">
                {reportData?.latest_run_health?.length ? (
                  reportData.latest_run_health.map((run) => (
                    <div
                      key={run.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{run.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {run.environment} • Updated {formatDate(run.updated_at)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {run.pass_rate}% pass
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${run.pass_rate}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No run data yet. Create a plan and start a run to populate this report.
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Coverage snapshot</h2>
                <div className="mt-4 space-y-3">
                  {[
                    ["Automated cases", summary.automated_cases],
                    ["Linked cases", summary.linked_cases],
                    ["Pass rate", `${summary.pass_rate}%`],
                    ["Resolved defects", summary.resolved_defects],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
