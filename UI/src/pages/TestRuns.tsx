import { NavLink } from "react-router-dom";
import { TEST_RUNS, qaSectionLinks } from "../data/testManagement";

export default function TestRuns() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Quality
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Test Runs
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Track actual execution cycles, environment status, and pass or fail
              outcomes for each plan.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
            <span className="material-symbols-outlined text-lg">play_circle</span>
            <span>Start Run</span>
          </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {TEST_RUNS.map((run) => {
            const total = run.passed + run.failed + run.blocked + run.pending;
            const complete = total ? Math.round(((run.passed + run.failed + run.blocked) / total) * 100) : 0;

            return (
              <div
                key={run.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {run.id}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                      {run.name}
                    </h2>
                  </div>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {run.status}
                  </span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${complete}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">
                      Environment
                    </p>
                    <p className="mt-1 font-medium text-slate-800">{run.environment}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">
                      Owner
                    </p>
                    <p className="mt-1 font-medium text-slate-800">{run.owner}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg border border-slate-200 px-2 py-2">
                    <p className="text-xs text-slate-400">Passed</p>
                    <p className="text-lg font-bold text-slate-900">{run.passed}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-2 py-2">
                    <p className="text-xs text-slate-400">Failed</p>
                    <p className="text-lg font-bold text-slate-900">{run.failed}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-2 py-2">
                    <p className="text-xs text-slate-400">Blocked</p>
                    <p className="text-lg font-bold text-slate-900">{run.blocked}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-2 py-2">
                    <p className="text-xs text-slate-400">Pending</p>
                    <p className="text-lg font-bold text-slate-900">{run.pending}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
