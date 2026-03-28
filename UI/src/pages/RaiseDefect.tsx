import { NavLink } from "react-router-dom";
import { DEFECT_RAISE_CONTEXT, qaSectionLinks } from "../data/testManagement";
import StaticDataBanner from "../components/StaticDataBanner";

export default function RaiseDefect() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Quality
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Raise Defect
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Capture a defect with its linked project, task, sprint, test case,
              and execution run so engineering can triage it quickly.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <StaticDataBanner />
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
              <span className="material-symbols-outlined text-lg">send</span>
              <span>Create Defect</span>
            </button>
          </div>
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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_360px] gap-6">
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Defect details</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Summary
                  </span>
                  <input
                    defaultValue="Expired reset link still accepted after timeout"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Assignee
                  </span>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none">
                    {DEFECT_RAISE_CONTEXT.assigneeOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Severity
                  </span>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none">
                    {DEFECT_RAISE_CONTEXT.severityOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Priority
                  </span>
                  <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none">
                    {DEFECT_RAISE_CONTEXT.priorityOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block mt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Description
                </span>
                <textarea
                  rows={5}
                  defaultValue="When the reset token has expired, the API still accepts the password update request instead of rejecting it."
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
              </label>

              <label className="block mt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Reproduction steps
                </span>
                <div className="mt-2 space-y-2">
                  {DEFECT_RAISE_CONTEXT.reproductionSteps.map((step, index) => (
                    <div
                      key={step}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                    >
                      <span className="font-semibold text-slate-900">{index + 1}.</span>{" "}
                      {step}
                    </div>
                  ))}
                </div>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Linked delivery context</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Project", value: DEFECT_RAISE_CONTEXT.project },
                  { label: "Task", value: DEFECT_RAISE_CONTEXT.task },
                  { label: "Sprint", value: DEFECT_RAISE_CONTEXT.sprint },
                  { label: "Release", value: DEFECT_RAISE_CONTEXT.release },
                  { label: "Test Run", value: DEFECT_RAISE_CONTEXT.selectedRun },
                  { label: "Test Case", value: DEFECT_RAISE_CONTEXT.selectedCase },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Environment snapshot</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Environment:</span>{" "}
                  {DEFECT_RAISE_CONTEXT.environment}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Run:</span>{" "}
                  {DEFECT_RAISE_CONTEXT.selectedRun}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Case:</span>{" "}
                  {DEFECT_RAISE_CONTEXT.selectedCase}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Suggested attachments</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Console logs</p>
                <p>Screenshots or screen recording</p>
                <p>API request and response payload</p>
                <p>Build version and browser details</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
