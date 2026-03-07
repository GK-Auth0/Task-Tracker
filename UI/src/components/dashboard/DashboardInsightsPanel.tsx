import React from "react";
import {
  DashboardInsights,
  DashboardInsightsProjectHealth,
} from "../../services/dashboard";

interface DashboardInsightsPanelProps {
  insights: DashboardInsights | null;
  onOpenProjects: () => void;
}

const percent = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100);

const ProgressRow = ({
  label,
  value,
  total,
  barClass,
}: {
  label: string;
  value: number;
  total: number;
  barClass: string;
}) => {
  const width = percent(value, total);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const DashboardInsightsPanel: React.FC<DashboardInsightsPanelProps> = ({
  insights,
  onOpenProjects,
}) => {
  const taskTotal =
    (insights?.task_status_breakdown.todo || 0) +
    (insights?.task_status_breakdown.in_progress || 0) +
    (insights?.task_status_breakdown.done || 0);

  const priorityTotal =
    (insights?.task_priority_breakdown.high || 0) +
    (insights?.task_priority_breakdown.medium || 0) +
    (insights?.task_priority_breakdown.low || 0);

  const sampleProjectHealth: DashboardInsightsProjectHealth[] = [
    {
      id: "sample-1",
      name: "Website Redesign",
      status: "active",
      total_tasks: 14,
      completed_tasks: 6,
      open_tasks: 8,
      completion_rate: 44,
    },
    {
      id: "sample-2",
      name: "Mobile Release",
      status: "planning",
      total_tasks: 6,
      completed_tasks: 1,
      open_tasks: 5,
      completion_rate: 20,
    },
  ];

  const projectHealth =
    insights?.project_health && insights.project_health.length > 0
      ? insights.project_health
      : sampleProjectHealth;

  const isSample = !insights?.project_health?.length;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900">Task Status Mix</h3>
        <p className="text-xs text-slate-500 mt-1">Current execution distribution</p>
        <div className="mt-4 space-y-3">
          <ProgressRow
            label="To Do"
            value={insights?.task_status_breakdown.todo || 0}
            total={taskTotal}
            barClass="bg-slate-500"
          />
          <ProgressRow
            label="In Progress"
            value={insights?.task_status_breakdown.in_progress || 0}
            total={taskTotal}
            barClass="bg-blue-500"
          />
          <ProgressRow
            label="Done"
            value={insights?.task_status_breakdown.done || 0}
            total={taskTotal}
            barClass="bg-emerald-500"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-900">Priority Load</h3>
        <p className="text-xs text-slate-500 mt-1">Where attention is required most</p>
        <div className="mt-4 space-y-3">
          <ProgressRow
            label="High"
            value={insights?.task_priority_breakdown.high || 0}
            total={priorityTotal}
            barClass="bg-rose-500"
          />
          <ProgressRow
            label="Medium"
            value={insights?.task_priority_breakdown.medium || 0}
            total={priorityTotal}
            barClass="bg-amber-500"
          />
          <ProgressRow
            label="Low"
            value={insights?.task_priority_breakdown.low || 0}
            total={priorityTotal}
            barClass="bg-sky-500"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Project Health</h3>
            <p className="text-xs text-slate-500 mt-1">Top projects by open tasks</p>
          </div>
          <button
            type="button"
            onClick={onOpenProjects}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Open projects
          </button>
        </div>
        {isSample && (
          <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            No project data yet. Showing sample data.
          </p>
        )}
        <div className="mt-3 space-y-2">
          {projectHealth.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {project.name}
                </p>
                <span className="text-xs text-slate-500 capitalize">
                  {String(project.status).replace("_", " ")}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                <span>{project.open_tasks} open tasks</span>
                <span>{project.completion_rate}% complete</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardInsightsPanel;
