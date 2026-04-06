import { useEffect, useMemo, useState } from "react";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseNav from "../components/testcases/TestCaseNav";
import { testPlansAPI, testRunsAPI } from "../services/testManagement";
import type { TestPlanRecord, TestRunRecord, TestRunStatus } from "../types/testManagement";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function TestRuns() {
  const [plans, setPlans] = useState<TestPlanRecord[]>([]);
  const [runs, setRuns] = useState<TestRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [planId, setPlanId] = useState("");
  const [environment, setEnvironment] = useState("");
  const [status, setStatus] = useState<TestRunStatus>("Planned");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [plansResponse, runsResponse] = await Promise.all([
        testPlansAPI.getPlans(),
        testRunsAPI.getRuns(),
      ]);
      if (plansResponse.success) setPlans(plansResponse.data);
      if (runsResponse.success) setRuns(runsResponse.data);
    } catch (loadError) {
      console.error("Failed to load test runs:", loadError);
      setError("Failed to load test runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const summary = useMemo(
    () => ({
      inProgress: runs.filter((run) => run.status === "In Progress").length,
      completed: runs.filter((run) => run.status === "Completed").length,
      avgPassRate: runs.length
        ? Math.round(runs.reduce((total, run) => total + run.pass_rate, 0) / runs.length)
        : 0,
    }),
    [runs],
  );

  const handleCreate = async () => {
    if (!name.trim() || !planId || !environment.trim()) {
      setError("Run name, test plan, and environment are required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await testRunsAPI.createRun({
        name: name.trim(),
        plan_id: planId,
        environment: environment.trim(),
        status,
        notes: notes.trim() || undefined,
      });
      setName("");
      setPlanId("");
      setEnvironment("");
      setStatus("Planned");
      setNotes("");
      setShowCreate(false);
      await loadData();
    } catch (createError: any) {
      console.error("Failed to create test run:", createError);
      setError(createError?.response?.data?.message || "Failed to create test run");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title="Test Runs"
          description="Track execution cycles from live plans and real case outcomes instead of static run cards."
          metaLabel="Run count"
          metaValue={`${runs.length}`}
          showStaticBanner={false}
          actions={
            <button
              type="button"
              onClick={() => setShowCreate((current) => !current)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <span className="material-symbols-outlined text-lg">
                {showCreate ? "close" : "play_circle"}
              </span>
              <span>{showCreate ? "Close" : "Start Run"}</span>
            </button>
          }
        />

        <div className="space-y-5">
          <TestCaseNav />

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {showCreate ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="block xl:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Run name
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="Sprint 18 UAT Run"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Test plan
                  </span>
                  <select
                    value={planId}
                    onChange={(event) => setPlanId(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">Select plan</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.project?.name || "No project"})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Environment
                  </span>
                  <input
                    value={environment}
                    onChange={(event) => setEnvironment(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="QA / Staging / UAT"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as TestRunStatus)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {["Planned", "In Progress", "Completed", "Blocked"].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block xl:col-span-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Notes
                  </span>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="Optional execution notes"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save Run"}
                </button>
              </div>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                In progress
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.inProgress}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Completed
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.completed}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Average pass rate
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.avgPassRate}%</p>
            </div>
          </section>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              Loading test runs...
            </div>
          ) : !runs.length ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">No test runs yet.</p>
              <p className="mt-2 text-xs text-slate-500">
                Start a run from an existing test plan to track live execution progress.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {runs.map((run) => (
                <article
                  key={run.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {run.reference_code}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">{run.name}</h2>
                    </div>
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {run.status}
                    </span>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${run.pass_rate}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Plan
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {run.plan?.name || "No plan"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Environment
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{run.environment}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[
                      ["Passed", run.passed],
                      ["Failed", run.failed],
                      ["Blocked", run.blocked],
                      ["Pending", run.pending],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-200 px-2 py-2 text-center"
                      >
                        <p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-slate-500">
                    Updated {formatDate(run.updated_at)} • {run.total_cases} cases in scope
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
