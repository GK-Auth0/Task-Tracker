import { useEffect, useMemo, useState } from "react";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseNav from "../components/testcases/TestCaseNav";
import { testCasesAPI } from "../services/testCases";
import { testPlansAPI } from "../services/testManagement";
import type { TestCaseFormProjectOption, TestCaseFormSprintOption } from "../services/testCases";
import type { TestPlanRecord, TestPlanStatus } from "../types/testManagement";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function TestPlans() {
  const [plans, setPlans] = useState<TestPlanRecord[]>([]);
  const [projects, setProjects] = useState<TestCaseFormProjectOption[]>([]);
  const [sprints, setSprints] = useState<TestCaseFormSprintOption[]>([]);
  const [suiteOptions, setSuiteOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sprintName, setSprintName] = useState("");
  const [releaseName, setReleaseName] = useState("");
  const [status, setStatus] = useState<TestPlanStatus>("Draft");
  const [selectedSuites, setSelectedSuites] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [plansResponse, optionsResponse] = await Promise.all([
        testPlansAPI.getPlans(),
        testCasesAPI.getFormOptions(),
      ]);

      if (plansResponse.success) setPlans(plansResponse.data);
      if (optionsResponse.success) {
        setProjects(optionsResponse.data.projects);
        setSprints(optionsResponse.data.sprints);
        setSuiteOptions(optionsResponse.data.suites);
      }
    } catch (loadError) {
      console.error("Failed to load test plans:", loadError);
      setError("Failed to load test plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSprints = useMemo(
    () => sprints.filter((item) => !projectId || item.project_id === projectId),
    [projectId, sprints],
  );

  const summary = useMemo(
    () => ({
      active: plans.filter((plan) => plan.status === "Active").length,
      completed: plans.filter((plan) => plan.status === "Completed").length,
      cases: plans.reduce((total, plan) => total + plan.case_count, 0),
    }),
    [plans],
  );

  const toggleSuite = (suiteName: string) => {
    setSelectedSuites((current) =>
      current.includes(suiteName)
        ? current.filter((item) => item !== suiteName)
        : [...current, suiteName],
    );
  };

  const resetForm = () => {
    setName("");
    setProjectId("");
    setSprintName("");
    setReleaseName("");
    setStatus("Draft");
    setSelectedSuites([]);
  };

  const handleCreate = async () => {
    if (!name.trim() || !projectId) {
      setError("Plan name and project are required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await testPlansAPI.createPlan({
        name: name.trim(),
        project_id: projectId,
        sprint_name: sprintName || undefined,
        release_name: releaseName.trim() || undefined,
        status,
        suite_names: selectedSuites,
      });
      resetForm();
      setShowCreate(false);
      await loadData();
    } catch (createError: any) {
      console.error("Failed to create test plan:", createError);
      setError(createError?.response?.data?.message || "Failed to create test plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title="Test Plans"
          description="Group coverage by release, sprint, and suite using live workspace data instead of static placeholder plans."
          metaLabel="Plan count"
          metaValue={`${plans.length}`}
          showStaticBanner={false}
          actions={
            <button
              type="button"
              onClick={() => setShowCreate((current) => !current)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              <span className="material-symbols-outlined text-lg">
                {showCreate ? "close" : "add"}
              </span>
              <span>{showCreate ? "Close" : "New Plan"}</span>
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
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Create test plan</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Build a release plan by choosing a project, optional sprint, and the suites to include.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="block xl:col-span-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Plan name
                    </span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="Release 2.4 Regression"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Project
                    </span>
                    <select
                      value={projectId}
                      onChange={(event) => setProjectId(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="">Select project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </span>
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value as TestPlanStatus)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                    >
                      {["Draft", "Active", "Completed"].map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Sprint
                    </span>
                    <select
                      value={sprintName}
                      onChange={(event) => setSprintName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="">No sprint</option>
                      {filteredSprints.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Release
                    </span>
                    <input
                      value={releaseName}
                      onChange={(event) => setReleaseName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="Web App 2.4"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Suites in scope
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suiteOptions.length ? (
                      suiteOptions.map((suiteName) => {
                        const active = selectedSuites.includes(suiteName);
                        return (
                          <button
                            key={suiteName}
                            type="button"
                            onClick={() => toggleSuite(suiteName)}
                            className={`rounded-md border px-3 py-2 text-sm font-medium ${
                              active
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {suiteName}
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        No suites found yet. Create test cases first, then plans can target specific suites.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowCreate(false);
                    }}
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
                    {submitting ? "Saving..." : "Save Plan"}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Active plans
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.active}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Completed plans
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.completed}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Planned cases
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.cases}</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[130px_minmax(220px,1.4fr)_170px_120px_90px_90px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span>ID</span>
              <span>Plan</span>
              <span>Project / Sprint</span>
              <span>Owner</span>
              <span>Cases</span>
              <span>Runs</span>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">Loading test plans...</div>
            ) : !plans.length ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-semibold text-slate-900">No test plans yet.</p>
                <p className="mt-2 text-xs text-slate-500">
                  Create your first plan to group suites and release coverage.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="grid grid-cols-[130px_minmax(220px,1.4fr)_170px_120px_90px_90px] gap-4 px-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{plan.reference_code}</p>
                      <span className="mt-2 inline-flex rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                        {plan.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {plan.release_name || "No release"} • Updated {formatDate(plan.updated_at)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(plan.suite_names.length ? plan.suite_names : ["All suites"]).map((item) => (
                          <span
                            key={item}
                            className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>{plan.project?.name || "No project"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {plan.sprint_name || "No sprint"}
                      </p>
                    </div>
                    <div className="text-sm text-slate-600">
                      {plan.owner?.full_name || "Unknown"}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">{plan.case_count}</div>
                    <div className="text-sm font-semibold text-slate-900">{plan.run_count}</div>
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
