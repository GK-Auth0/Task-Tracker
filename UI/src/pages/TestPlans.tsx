import { NavLink } from "react-router-dom";
import { TEST_PLANS, qaSectionLinks } from "../data/testManagement";

export default function TestPlans() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Quality
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Test Plans
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Plan release-level testing with linked suites, owners, and execution
              cycles similar to Jira-aligned QA platforms.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
            <span className="material-symbols-outlined text-lg">add</span>
            <span>New Plan</span>
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_340px] gap-6">
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="grid grid-cols-[110px_minmax(220px,1.3fr)_120px_100px_90px_90px_100px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>ID</span>
              <span>Plan</span>
              <span>Release</span>
              <span>Owner</span>
              <span>Suites</span>
              <span>Runs</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-slate-100">
              {TEST_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="grid grid-cols-[110px_minmax(220px,1.3fr)_120px_100px_90px_90px_100px] gap-4 px-4 py-4"
                >
                  <div className="text-sm font-semibold text-slate-900">{plan.id}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Updated {plan.updatedAt}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">{plan.release}</div>
                  <div className="text-sm text-slate-600">{plan.owner}</div>
                  <div className="text-sm text-slate-600">{plan.suites}</div>
                  <div className="text-sm text-slate-600">{plan.runs}</div>
                  <div>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {plan.cycle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">What this page adds</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Plans group suites and cases for a release or milestone.</p>
                <p>They sit above execution runs and help QA teams organize scope.</p>
                <p>Common tools like Jira plugins, Zephyr, and Xray expose this layer.</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Plan summary</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">
                    Active
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">1</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">
                    In Review
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">1</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
