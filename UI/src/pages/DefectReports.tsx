import { useMemo } from "react";
import { useQuery } from "react-query";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import TestCaseNav from "../components/testcases/TestCaseNav";
import { defectSectionLinks } from "../data/testManagement";
import { defectsAPI } from "../services/defects";
import type { Defect } from "../types/defect";

const statusOrder: Defect["status"][] = [
  "Open",
  "Approved",
  "In Progress",
  "Resolved",
  "Rejected",
];

const priorityOrder: Defect["priority"][] = ["Critical", "High", "Medium", "Low"];

const statusTone: Record<Defect["status"], string> = {
  Open: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
  "In Progress": "border-blue-200 bg-blue-50 text-blue-700",
  Resolved: "border-slate-200 bg-slate-100 text-slate-700",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function DefectReports() {
  const { data, isLoading, error } = useQuery(["defect-reports"], () =>
    defectsAPI.getDefects({ page: 1, limit: 100 }),
  );

  const defects = data?.data || [];

  const summary = useMemo(() => {
    const total = defects.length;
    const open = defects.filter((defect) => defect.status === "Open").length;
    const inProgress = defects.filter((defect) => defect.status === "In Progress").length;
    const resolved = defects.filter((defect) => defect.status === "Resolved").length;
    const approved = defects.filter((defect) => defect.status === "Approved").length;
    const critical = defects.filter((defect) => defect.priority === "Critical").length;
    return { total, open, inProgress, resolved, approved, critical };
  }, [defects]);

  const statusBreakdown = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        count: defects.filter((defect) => defect.status === status).length,
      })),
    [defects],
  );

  const priorityBreakdown = useMemo(
    () =>
      priorityOrder.map((priority) => ({
        priority,
        count: defects.filter((defect) => defect.priority === priority).length,
      })),
    [defects],
  );

  const projectBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    defects.forEach((defect) => {
      const key = defect.project?.name || "Unknown project";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [defects]);

  const attentionItems = useMemo(
    () =>
      [...defects]
        .filter((defect) => defect.status === "Open" || defect.status === "In Progress")
        .sort((a, b) => {
          const priorityWeight = (value: Defect["priority"]) =>
            value === "Critical" ? 4 : value === "High" ? 3 : value === "Medium" ? 2 : 1;
          return priorityWeight(b.priority) - priorityWeight(a.priority);
        })
        .slice(0, 5),
    [defects],
  );

  const ownershipGaps = useMemo(
    () => defects.filter((defect) => !defect.assignee).slice(0, 5),
    [defects],
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto min-h-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Quality"
          title="Defect Reports"
          description="Use a defect-focused readout for open risk, priority pressure, project hotspots, and unresolved ownership instead of jumping to the generic QA reports page."
          metaLabel="Open defects"
          metaValue={`${summary.open}`}
          showStaticBanner={false}
        />

        <div className="space-y-5">
          <TestCaseNav links={defectSectionLinks} />

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Failed to load defect reports.
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Total Defects", summary.total, "bug_report", "All recorded issues"],
              ["Open", summary.open, "priority_high", "Need triage or review"],
              ["In Progress", summary.inProgress, "manufacturing", "Currently being fixed"],
              ["Resolved", summary.resolved, "task_alt", "Ready for validation or closed"],
              ["Critical Priority", summary.critical, "warning", "Highest delivery risk"],
            ].map(([label, value, icon, detail]) => (
              <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
                  </div>
                  <span className="material-symbols-outlined rounded-md bg-slate-100 p-2 text-slate-600">
                    {icon}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{detail}</p>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">Priority attention board</h2>
                {isLoading ? <span className="text-xs text-slate-500">Loading...</span> : null}
              </div>
              <div className="mt-4 space-y-3">
                {attentionItems.length ? (
                  attentionItems.map((defect) => (
                    <div key={defect.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {defect.reference_code} · {defect.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {defect.project?.name || "Unknown project"} · {defect.assignee?.full_name || "Unassigned"} · {formatDate(defect.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[defect.status]}`}>
                            {defect.status}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                            {defect.priority} priority
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>Task: {defect.created_task?.title || defect.linked_task?.title || "No task linked"}</span>
                        <span>Sprint: {defect.sprint_name || "No sprint"}</span>
                        <span>Environment: {defect.environment || "Not specified"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No active defect pressure right now.
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Status mix</h2>
                <div className="mt-4 space-y-3">
                  {statusBreakdown.map((item) => (
                    <div key={item.status} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-700">{item.status}</span>
                        <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Priority mix</h2>
                <div className="mt-4 space-y-3">
                  {priorityBreakdown.map((item) => (
                    <div key={item.priority} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-700">{item.priority}</span>
                        <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Project hotspots</h2>
              <div className="mt-4 space-y-3">
                {projectBreakdown.length ? (
                  projectBreakdown.map((project) => (
                    <div key={project.name} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-700">{project.name}</span>
                        <span className="text-sm font-semibold text-slate-900">{project.count} defects</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No project defect data yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Ownership gaps</h2>
              <div className="mt-4 space-y-3">
                {ownershipGaps.length ? (
                  ownershipGaps.map((defect) => (
                    <div key={defect.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {defect.reference_code} · {defect.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {defect.project?.name || "Unknown project"} · {defect.status} · {defect.priority}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Every listed defect currently has an assignee.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
