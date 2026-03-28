import { SPRINT_DEV_BOARD } from "../data/testManagement";

export default function SprintDevBoard() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
              Sprint Delivery
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Sprint Dev Board
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              A dedicated development sprint board to track build progress, code
              review, and readiness for QA handoff without mixing it into the test case section.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
              Sprint Goal
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {SPRINT_DEV_BOARD.goal}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {SPRINT_DEV_BOARD.summary.map((item) => (
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

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Development Workflow
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {SPRINT_DEV_BOARD.sprint} • {SPRINT_DEV_BOARD.release}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {SPRINT_DEV_BOARD.lanes.map((lane) => (
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
                      <p className="text-sm font-semibold text-slate-900">{item.id}</p>
                      <p className="mt-1 text-sm text-slate-700">{item.title}</p>
                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        <p>Owner: {item.owner}</p>
                        <p>Estimate: {item.estimate}</p>
                        <p>QA link: {item.qa}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
