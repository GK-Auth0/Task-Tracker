import { NavLink } from "react-router-dom";
import { SPRINT_QA_BOARD, qaSectionLinks } from "../data/testManagement";

export default function SprintQaBoard() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Sprint Quality
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Sprint QA Board
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              A shared sprint board for both development and QA, showing handoff,
              execution status, and defect impact in one place.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
              Active Sprint
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {SPRINT_QA_BOARD.sprint} • {SPRINT_QA_BOARD.window}
            </p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {SPRINT_QA_BOARD.summary.map((item) => (
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                  Development Track
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Delivery and QA Handoff
                </h2>
              </div>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {SPRINT_QA_BOARD.project}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {SPRINT_QA_BOARD.developmentLanes.map((lane) => (
                <div
                  key={lane.title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                  <div className="mt-4 space-y-3">
                    {lane.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {item.id}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{item.title}</p>
                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <p>Owner: {item.owner}</p>
                          <p>Project: {item.project}</p>
                          <p>QA: {item.qaStatus}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                  QA Track
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Execution and Validation
                </h2>
              </div>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {SPRINT_QA_BOARD.release}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {SPRINT_QA_BOARD.qaLanes.map((lane) => (
                <div
                  key={lane.title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                  <div className="mt-4 space-y-3">
                    {lane.items.map((item) => (
                      <div
                        key={`${lane.title}-${item.id}-${item.result}`}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {item.id}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{item.title}</p>
                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <p>Linked task: {item.linkedTask}</p>
                          <p>Tester: {item.tester}</p>
                          <p>Result: {item.result}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
