import { useEffect, useMemo, useState } from "react";
import RingLoader from "../components/RingLoader";
import StaticDataBanner from "../components/StaticDataBanner";
import {
  dashboardAPI,
  tasksAPI,
  type DashboardInsights,
  type DashboardOverview,
  type Task,
} from "../services/dashboard";
import { projectService } from "../services/projectService";

type AnalyticsProject = {
  id: string;
  name: string;
  status: string;
  priority: string;
};

type TrendPoint = {
  label: string;
  value: number;
};

const TREND_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TEST_CASE_TREND: TrendPoint[] = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 18 },
  { label: "Wed", value: 16 },
  { label: "Thu", value: 21 },
  { label: "Fri", value: 19 },
  { label: "Sat", value: 8 },
  { label: "Sun", value: 6 },
];
const DEFECT_TREND: TrendPoint[] = [
  { label: "Mon", value: 5 },
  { label: "Tue", value: 8 },
  { label: "Wed", value: 6 },
  { label: "Thu", value: 9 },
  { label: "Fri", value: 7 },
  { label: "Sat", value: 3 },
  { label: "Sun", value: 2 },
];
const QUALITY_ROWS = [
  { label: "Authentication", testCases: 18, defects: 7, passRate: 78 },
  { label: "Task Management", testCases: 27, defects: 5, passRate: 84 },
  { label: "Projects", testCases: 16, defects: 4, passRate: 81 },
  { label: "Planning", testCases: 11, defects: 2, passRate: 88 },
];

const parseProjects = (payload: unknown): AnalyticsProject[] => {
  if (Array.isArray((payload as { data?: unknown })?.data)) {
    return ((payload as { data: unknown[] }).data || []).map((project: any) => ({
      id: String(project?.id || ""),
      name: String(project?.name || "Untitled Project"),
      status: String(project?.status || "planning"),
      priority: String(project?.priority || "medium"),
    }));
  }

  const nested = (payload as { data?: { data?: unknown } })?.data?.data;
  if (Array.isArray(nested)) {
    return nested.map((project: any) => ({
      id: String(project?.id || ""),
      name: String(project?.name || "Untitled Project"),
      status: String(project?.status || "planning"),
      priority: String(project?.priority || "medium"),
    }));
  }

  return [];
};

const formatPercent = (value: number) => `${Math.max(0, Math.round(value))}%`;

const buildTrendFromTasks = (
  tasks: Task[],
  selector: (task: Task) => string | undefined,
): TrendPoint[] => {
  const counts = new Array(7).fill(0);

  tasks.forEach((task) => {
    const raw = selector(task);
    if (!raw) return;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return;
    const day = date.getDay();
    const index = day === 0 ? 6 : day - 1;
    counts[index] += 1;
  });

  return TREND_LABELS.map((label, index) => ({
    label,
    value: counts[index],
  }));
};

const riskTone = (risk: "High" | "Medium" | "Low") => {
  if (risk === "High") return "border-rose-200 bg-rose-50 text-rose-700";
  if (risk === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<AnalyticsProject[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        const [overviewRes, insightsRes, tasksRes, projectsRes] = await Promise.all([
          dashboardAPI.getOverview({ upcomingLimit: 12, activityLimit: 8 }),
          dashboardAPI.getInsights(),
          tasksAPI.getTasks({ page: 1, limit: 120 }),
          projectService.getProjects(),
        ]);

        setOverview(overviewRes.data);
        setInsights(insightsRes.data);
        setTasks(tasksRes.data || []);
        setProjects(parseProjects(projectsRes));
      } catch {
        setError("Unable to load analytics right now.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== "Done"),
    [tasks],
  );

  const completedTrend = useMemo(
    () =>
      buildTrendFromTasks(
        tasks.filter((task) => task.status === "Done"),
        (task) => task.updated_at,
      ),
    [tasks],
  );

  const createdTrend = useMemo(
    () => buildTrendFromTasks(tasks, (task) => task.created_at),
    [tasks],
  );

  const taskFlow = useMemo(
    () => [
      { label: "To Do", value: insights?.task_status_breakdown.todo || 0 },
      { label: "In Progress", value: insights?.task_status_breakdown.in_progress || 0 },
      { label: "Done", value: insights?.task_status_breakdown.done || 0 },
    ],
    [insights],
  );

  const duePressure = useMemo(
    () => [
      { label: "Overdue", value: insights?.due_date_breakdown.overdue || 0 },
      { label: "Today", value: insights?.due_date_breakdown.today || 0 },
      { label: "This Week", value: insights?.due_date_breakdown.this_week || 0 },
      { label: "Later", value: insights?.due_date_breakdown.later || 0 },
    ],
    [insights],
  );

  const workload = useMemo(() => {
    const map = new Map<
      string,
      { name: string; open: number; high: number; inProgress: number }
    >();

    activeTasks.forEach((task) => {
      const key = task.assignee?.id || "unassigned";
      const current = map.get(key) || {
        name: task.assignee?.full_name || "Unassigned",
        open: 0,
        high: 0,
        inProgress: 0,
      };

      current.open += 1;
      if (task.priority === "High") current.high += 1;
      if (task.status === "In Progress") current.inProgress += 1;
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => b.open - a.open).slice(0, 6);
  }, [activeTasks]);

  const projectProgress = useMemo(() => {
    const map = new Map<
      string,
      { name: string; total: number; done: number; high: number; inProgress: number }
    >();

    tasks.forEach((task) => {
      const key = task.project?.id || "unknown";
      const current = map.get(key) || {
        name: task.project?.name || "Unassigned Project",
        total: 0,
        done: 0,
        high: 0,
        inProgress: 0,
      };
      current.total += 1;
      if (task.status === "Done") current.done += 1;
      if (task.priority === "High") current.high += 1;
      if (task.status === "In Progress") current.inProgress += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        completion: item.total ? Math.round((item.done / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [tasks]);

  const riskProjects = useMemo(() => {
    return (insights?.project_health || [])
      .map((project) => ({
        ...project,
        risk:
          project.open_tasks >= 8
            ? ("High" as const)
            : project.open_tasks >= 4 || project.completion_rate < 50
              ? ("Medium" as const)
              : ("Low" as const),
      }))
      .sort((a, b) => b.open_tasks - a.open_tasks)
      .slice(0, 5);
  }, [insights]);

  const spotlight = useMemo(
    () => ({
      completion: formatPercent(overview?.summary.completion_rate || 0),
      openTasks: overview?.metrics.open_tasks || 0,
      dueThisWeek: overview?.metrics.due_this_week || 0,
      testCases: 72,
      openDefects: 18,
      automation: "46%",
    }),
    [overview],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RingLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 xl:grid-cols-[1.25fr_360px]">
            <div className="border-b border-slate-200 p-6 sm:p-8 xl:border-b-0 xl:border-r">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400 font-semibold">
                    Analytics Studio
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Understand delivery fast
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    A more visual analytics workspace for projects, tasks, test cases,
                    and defects. Some QA sections use polished dummy data for now and
                    can be made dynamic later without changing the design.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <StaticDataBanner />
                  <div className="flex flex-wrap gap-2">
                  {["7 Days", "30 Days", "Quarter", "All Time"].map((range, index) => (
                    <button
                      key={range}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                        index === 1
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <InsightTile
                  label="Completion"
                  value={spotlight.completion}
                  note="Workspace-wide task completion"
                />
                <InsightTile
                  label="Quality"
                  value={`${spotlight.testCases} / ${spotlight.openDefects}`}
                  note="Test cases versus open defects"
                />
                <InsightTile
                  label="Automation"
                  value={spotlight.automation}
                  note="Current automation coverage"
                />
              </div>
            </div>

            <div className="bg-slate-50/80 p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-semibold">
                Live Readout
              </p>
              <div className="mt-4 space-y-4">
                <SignalRow label="Open Tasks" value={String(spotlight.openTasks)} />
                <SignalRow label="Due This Week" value={String(spotlight.dueThisWeek)} />
                <SignalRow label="Projects Tracked" value={String(projects.length)} />
                <SignalRow label="Team Members Active" value={String(workload.length)} />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_360px] gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                  Momentum
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Work created vs work completed
                </h2>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ModernTrendCard
                title="Created"
                accent="bg-slate-900"
                points={createdTrend}
              />
              <ModernTrendCard
                title="Completed"
                accent="bg-blue-600"
                points={completedTrend}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
              Focus
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              What needs attention
            </h2>
            <div className="mt-5 space-y-3">
              <FocusCard
                title="Delivery pressure"
                body={`${duePressure[0].value + duePressure[1].value} items are overdue or due today.`}
              />
              <FocusCard
                title="Quality load"
                body="Dummy QA data shows 18 open defects against 72 tracked test cases."
              />
              <FocusCard
                title="Capacity balance"
                body={`${workload[0]?.name || "Top contributor"} currently carries the highest open-task load.`}
              />
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <MiniBarCard title="Task Flow" rows={taskFlow} />
          <MiniBarCard
            title="Due Pressure"
            rows={duePressure}
          />
          <MiniBarCard
            title="Test Case Status"
            rows={[
              { label: "Ready", value: 38 },
              { label: "Draft", value: 14 },
              { label: "Blocked", value: 4 },
              { label: "Automated", value: 23 },
            ]}
          />
          <MiniBarCard
            title="Defect Lifecycle"
            rows={[
              { label: "Open", value: 9 },
              { label: "In Progress", value: 6 },
              { label: "Review", value: 3 },
              { label: "Closed", value: 18 },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                  Project Readability
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Progress by project
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {projectProgress.map((project) => (
                <div
                  key={project.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {project.total} tasks • {project.inProgress} in progress • {project.high} high priority
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                      {project.completion}% complete
                    </span>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-slate-200">
                    <div
                      className="h-3 rounded-full bg-blue-600"
                      style={{ width: `${Math.max(8, project.completion)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                  Team Map
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Workload at a glance
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {workload.map((person) => {
                const max = Math.max(...workload.map((item) => item.open), 1);
                return (
                  <div key={person.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{person.name}</p>
                        <p className="text-xs text-slate-500">
                          {person.high} high priority • {person.inProgress} in progress
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {person.open}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200">
                      <div
                        className="h-3 rounded-full bg-slate-900"
                        style={{ width: `${Math.max(8, (person.open / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_360px] gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                  Quality Analytics
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Test execution and defect discovery
                </h2>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ModernTrendCard
                title="Test Execution"
                accent="bg-blue-600"
                points={TEST_CASE_TREND}
              />
              <ModernTrendCard
                title="Defects Raised"
                accent="bg-slate-900"
                points={DEFECT_TREND}
              />
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[minmax(180px,1.2fr)_110px_110px_110px] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>Module</span>
                <span>Test Cases</span>
                <span>Defects</span>
                <span>Pass Rate</span>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                {QUALITY_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[minmax(180px,1.2fr)_110px_110px_110px] gap-4 px-4 py-4"
                  >
                    <div className="text-sm font-semibold text-slate-900">{row.label}</div>
                    <div className="text-sm text-slate-600">{row.testCases}</div>
                    <div className="text-sm text-slate-600">{row.defects}</div>
                    <div className="text-sm text-slate-600">{row.passRate}%</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Risk Matrix
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Projects that need attention
              </h2>
              <div className="mt-4 space-y-3">
                {riskProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {project.open_tasks} open • {formatPercent(project.completion_rate)} complete
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${riskTone(project.risk)}`}
                      >
                        {project.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Data Mode
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                What is dynamic now
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Tasks and project analytics use current workspace data.</p>
                <p>Test case and defect analytics use realistic dummy values for now.</p>
                <p>Those QA blocks can be wired later without redesigning the page.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InsightTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-lg font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function FocusCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function MiniBarCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full bg-blue-600"
                style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModernTrendCard({
  title,
  accent,
  points,
}: {
  title: string;
  accent: string;
  points: TrendPoint[];
}) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className={`h-2.5 w-16 rounded-full ${accent}`} />
      </div>
      <div className="mt-5 flex h-48 items-end gap-3">
        {points.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="text-xs font-semibold text-slate-500">{point.value}</div>
            <div className="flex h-36 w-full items-end rounded-xl bg-white p-1.5">
              <div
                className={`w-full rounded-lg ${accent}`}
                style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-500">{point.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
