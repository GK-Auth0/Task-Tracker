import type { SprintInsights } from "../../types/sprint";

interface SprintInsightsChartsProps {
  insights: SprintInsights | null;
  onOpenProject?: (projectId: string) => void;
}

const totalStatusTasks = (insights: SprintInsights | null) =>
  (insights?.summary.tasks_todo || 0) +
  (insights?.summary.tasks_in_progress || 0) +
  (insights?.summary.tasks_done || 0);

const widthPercent = (value: number, total: number) =>
  total > 0 ? `${Math.max(8, Math.round((value / total) * 100))}%` : "0%";

export default function SprintInsightsCharts({
  insights,
  onOpenProject,
}: SprintInsightsChartsProps) {
  const totalTasks = totalStatusTasks(insights);
  const maxProjectTasks = Math.max(
    1,
    ...(insights?.project_breakdown.map((item) =>
      item.task_status.todo + item.task_status.in_progress + item.task_status.done,
    ) || [0]),
  );
  const maxRiskValue = Math.max(
    1,
    ...(insights?.project_breakdown.map((item) =>
      item.overdue_tasks + item.open_defects + item.failed_test_cases,
    ) || [0]),
  );

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-900">Task status mix</p>
        <p className="mt-1 text-xs text-slate-500">How sprint work is distributed right now.</p>
        <div className="mt-3 space-y-2.5">
          {[
            { label: "To Do", value: insights?.summary.tasks_todo || 0, color: "bg-slate-400" },
            {
              label: "In Progress",
              value: insights?.summary.tasks_in_progress || 0,
              color: "bg-blue-500",
            },
            { label: "Done", value: insights?.summary.tasks_done || 0, color: "bg-emerald-500" },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-600">
                <span>{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
              <div className="h-3 rounded-full bg-white">
                <div
                  className={`h-3 rounded-full ${item.color}`}
                  style={{ width: widthPercent(item.value, totalTasks) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-900">Project progress</p>
        <p className="mt-1 text-xs text-slate-500">Which sprint projects are moving and which are stuck.</p>
        <div className="mt-3 space-y-2.5">
          {insights?.project_breakdown?.length ? (
            insights.project_breakdown.map((item) => {
              const projectTotal =
                item.task_status.todo + item.task_status.in_progress + item.task_status.done;
              return (
                <button
                  key={item.sprint_id}
                  type="button"
                  onClick={() => item.project?.id && onOpenProject?.(item.project.id)}
                  className="w-full text-left"
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-700">{item.project?.name || "No project"}</span>
                    <span className="text-slate-500">{projectTotal} tasks</span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="bg-slate-400"
                      style={{ width: `${(item.task_status.todo / maxProjectTasks) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(item.task_status.in_progress / maxProjectTasks) * 100}%` }}
                    />
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${(item.task_status.done / maxProjectTasks) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-xs text-slate-500">
              No project progress data yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-900">Risk pressure</p>
        <p className="mt-1 text-xs text-slate-500">Overdue work, open defects, and failed cases by project.</p>
        <div className="mt-3 space-y-2.5">
          {insights?.project_breakdown?.length ? (
            insights.project_breakdown.map((item) => {
              const riskValue = item.overdue_tasks + item.open_defects + item.failed_test_cases;
              return (
                <button
                  key={item.sprint_id}
                  type="button"
                  onClick={() => item.project?.id && onOpenProject?.(item.project.id)}
                  className="w-full text-left"
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-700">{item.project?.name || "No project"}</span>
                    <span className="font-semibold text-slate-900">{riskValue}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white">
                    <div
                      className={`h-3 rounded-full ${
                        riskValue >= 5
                          ? "bg-rose-500"
                          : riskValue >= 2
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.max(8, (riskValue / maxRiskValue) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {item.overdue_tasks} overdue • {item.open_defects} defects • {item.failed_test_cases} failed
                  </p>
                </button>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-xs text-slate-500">
              No risk data yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
