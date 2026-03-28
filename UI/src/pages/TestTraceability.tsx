import { NavLink } from "react-router-dom";
import { TRACEABILITY_ROWS, qaSectionLinks } from "../data/testManagement";

export default function TestTraceability() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
            Quality
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Traceability
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Map requirements and stories to test cases and latest execution
            results so coverage gaps are visible at a glance.
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_320px] gap-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[110px_minmax(220px,1.5fr)_120px_160px_110px_150px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>ID</span>
              <span>Requirement</span>
              <span>Story</span>
              <span>Linked cases</span>
              <span>Coverage</span>
              <span>Latest run</span>
            </div>
            <div className="divide-y divide-slate-100">
              {TRACEABILITY_ROWS.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[110px_minmax(220px,1.5fr)_120px_160px_110px_150px] gap-4 px-4 py-4"
                >
                  <div className="text-sm font-semibold text-slate-900">{row.id}</div>
                  <div className="text-sm text-slate-700">{row.requirement}</div>
                  <div className="text-sm text-slate-600">{row.linkedStory}</div>
                  <div className="flex flex-wrap gap-2">
                    {row.linkedCases.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {row.coverage}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">{row.latestRun}</div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Why this page matters</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Teams use traceability to prove that requirements are actually tested.</p>
                <p>It also helps spot stories with only draft coverage or failed validation.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
