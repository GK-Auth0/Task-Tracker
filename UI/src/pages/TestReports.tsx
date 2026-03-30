import { NavLink } from "react-router-dom";
import { TEST_REPORTS, TEST_RUNS, qaSectionLinks } from "../data/testManagement";

export default function TestReports() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
            Quality
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Test Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Review pass rate, coverage, and linked defects in the same reporting
            layer that test management tools usually provide alongside plans and runs.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-2 mb-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {TEST_REPORTS.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {item.value}
                  </p>
                </div>
                <span className="material-symbols-outlined rounded-lg bg-blue-50 p-2 text-blue-600">
                  {item.icon}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_360px] gap-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Latest run health</h2>
            <div className="mt-4 space-y-4">
              {TEST_RUNS.map((run) => {
                const total = run.passed + run.failed + run.blocked + run.pending;
                const passRate = total ? Math.round((run.passed / total) * 100) : 0;
                return (
                  <div
                    key={run.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{run.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {run.environment} • Updated {run.updatedAt}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {passRate}% pass
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${passRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Usually expected pages
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Test cases for reusable scenarios</p>
                <p>Test plans for release scope</p>
                <p>Test runs for execution cycles</p>
                <p>Reports for pass rate, defects, and traceability</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
