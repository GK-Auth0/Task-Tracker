import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  SPRINT_CREATE_CONTEXT,
  SPRINT_PLANNING_BOARD,
} from "../data/testManagement";
import SprintStatStrip from "../components/sprint/SprintStatStrip";
import SprintTabs from "../components/sprint/SprintTabs";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import { projectsAPI, tasksAPI, usersAPI } from "../services/dashboard";
import { defectsAPI } from "../services/defects";
import { testCasesAPI } from "../services/testCases";
import { sprintsAPI } from "../services/sprints";
import type { Defect } from "../types/defect";
import type { TestCaseRecord } from "../types/testCase";
import type { Sprint } from "../types/sprint";

type MainTab = "planning" | "boards" | "monitoring" | "create";
type PlanningTab = "goals" | "scope" | "ceremonies";
type BoardTab = "dev" | "qa";
type MonitoringTab = "health" | "risks";

type SprintDraft = {
  name: string;
  goal: string;
  release: string;
  squad: string;
  owner: string;
  projectId: string;
  capacity: string;
  startDate: string;
  endDate: string;
};

type TaskItem = Awaited<ReturnType<typeof tasksAPI.getTasks>>["data"][number];
type ProjectOption = Awaited<ReturnType<typeof projectsAPI.getProjects>>["data"][number];
type UserOption = Awaited<ReturnType<typeof usersAPI.getUsers>>["data"][number];

const mainTabs: Array<{
  key: MainTab;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    key: "planning",
    label: "Planning",
    icon: "strategy",
    description: "Goals, scope, and cadence",
  },
  {
    key: "boards",
    label: "Boards",
    icon: "view_kanban",
    description: "Dev and QA flow",
  },
  {
    key: "monitoring",
    label: "Monitoring",
    icon: "monitoring",
    description: "Health and blockers",
  },
  {
    key: "create",
    label: "Create",
    icon: "post_add",
    description: "Draft next sprint",
  },
];

const planningTabs = [
  { key: "goals", label: "Goals" },
  { key: "scope", label: "Scope" },
  { key: "ceremonies", label: "Ceremonies" },
] as const;

const boardTabs = [
  { key: "dev", label: "Dev Board" },
  { key: "qa", label: "QA Board" },
] as const;

const monitoringTabs = [
  { key: "health", label: "Health" },
  { key: "risks", label: "Risks" },
] as const;

const defaultDraft: SprintDraft = {
  name: "Sprint 25",
  goal: "Finish release validation and close remaining blocker defects",
  release: SPRINT_CREATE_CONTEXT.releaseOptions[0],
  squad: SPRINT_CREATE_CONTEXT.squadOptions[4],
  owner: "",
  projectId: "",
  capacity: "44",
  startDate: "2026-04-06",
  endDate: "2026-04-17",
};

const riskTone = (status: string) => {
  if (status === "Healthy") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Watch") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
};

function SectionCard({
  eyebrow,
  title,
  badge,
  children,
}: {
  eyebrow: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {badge ? (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const uniqueSprintNames = (defects: Defect[], testCases: TestCaseRecord[]) => {
  const names = [
    ...defects.map((item) => item.sprint_name).filter(Boolean),
    ...testCases.map((item) => item.sprint_name).filter(Boolean),
  ] as string[];
  return Array.from(new Set(names));
};

export default function SprintBoards() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<MainTab>("planning");
  const [planningTab, setPlanningTab] = useState<PlanningTab>("goals");
  const [boardTab, setBoardTab] = useState<BoardTab>("dev");
  const [monitoringTab, setMonitoringTab] = useState<MonitoringTab>("health");
  const [draft, setDraft] = useState<SprintDraft>(defaultDraft);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [savingSprint, setSavingSprint] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const createTabRequested = searchParams.get("tab") === "create";
  const requestedProjectId = searchParams.get("projectId") || "";

  useEffect(() => {
    if (createTabRequested) {
      setActiveTab("create");
    }
  }, [createTabRequested]);

  useEffect(() => {
    const loadBoardData = async () => {
      try {
        setLoading(true);
        const [
          tasksResponse,
          defectsResponse,
          testCasesResponse,
          sprintsResponse,
          projectsResponse,
          usersResponse,
        ] = await Promise.all([
          tasksAPI.getTasks({ limit: 200 }),
          defectsAPI.getDefects(),
          testCasesAPI.getTestCases(),
          sprintsAPI.getSprints(),
          projectsAPI.getProjects(),
          usersAPI.getUsers({ limit: 200 }),
        ]);

        if (tasksResponse.success) setTasks(tasksResponse.data);
        if (defectsResponse.success) setDefects(defectsResponse.data);
        if (testCasesResponse.success) setTestCases(testCasesResponse.data);
        if (sprintsResponse.success) setSprints(sprintsResponse.data);
        if (projectsResponse.success) {
          setProjects(projectsResponse.data);
          setDraft((current) => ({
            ...current,
            projectId: current.projectId || projectsResponse.data[0]?.id || "",
          }));
        }
        if (usersResponse.success) {
          setUsers(usersResponse.data);
          setDraft((current) => ({
            ...current,
            owner: current.owner || usersResponse.data[0]?.id || "",
          }));
        }
      } catch (error) {
        console.error("Failed to fetch sprint board data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBoardData();
  }, []);

  useEffect(() => {
    if (!requestedProjectId) return;
    setDraft((current) => ({
      ...current,
      projectId: requestedProjectId,
    }));
  }, [requestedProjectId]);

  const updateDraft = (field: keyof SprintDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const activeSprintRecord = sprints[0] || null;
  const sprintNames = uniqueSprintNames(defects, testCases);
  const activeSprint = activeSprintRecord?.name || sprintNames[0] || "Workspace Sprint";
  const activeRelease =
    activeSprintRecord?.release ||
    defects.find((item) => item.environment)?.environment ||
    testCases.find((item) => item.project?.name)?.project?.name ||
    "Current Release";

  const selectedProjectTasks = useMemo(
    () =>
      tasks.filter(
        (task) => !draft.projectId || task.project?.id === draft.projectId,
      ),
    [draft.projectId, tasks],
  );

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  };

  const handleCreateSprint = async () => {
    if (!draft.name.trim() || !draft.projectId) {
      setCreateError("Sprint name and project are required");
      return;
    }

    try {
      setSavingSprint(true);
      setCreateError("");
      setCreateMessage("");
      const response = await sprintsAPI.createSprint({
        name: draft.name.trim(),
        goal: draft.goal.trim() || undefined,
        release: draft.release || undefined,
        squad: draft.squad || undefined,
        project_id: draft.projectId,
        owner_id: draft.owner || undefined,
        capacity: draft.capacity ? Number(draft.capacity) : undefined,
        start_date: draft.startDate || undefined,
        end_date: draft.endDate || undefined,
        status: "Active",
        task_ids: selectedTaskIds,
      });
      if (response.success) {
        setCreateMessage(`Sprint ${response.data.name} created successfully.`);
        const sprintResponse = await sprintsAPI.getSprints();
        if (sprintResponse.success) {
          setSprints(sprintResponse.data);
        }
        const tasksResponse = await tasksAPI.getTasks({ limit: 200 });
        if (tasksResponse.success) {
          setTasks(tasksResponse.data);
        }
        setSelectedTaskIds([]);
      }
    } catch (error: any) {
      console.error("Failed to create sprint:", error);
      setCreateError(error?.response?.data?.message || "Failed to create sprint");
    } finally {
      setSavingSprint(false);
    }
  };

  const overviewStats = useMemo(
    () => [
      {
        label: "Open tasks",
        value: String(tasks.filter((task) => task.status !== "Done").length),
        detail: "Tasks still moving through the sprint",
        icon: "task",
      },
      {
        label: "QA ready",
        value: String(tasks.filter((task) => task.status === "Done").length),
        detail: "Completed tasks ready for validation",
        icon: "assignment_turned_in",
      },
      {
        label: "Failed cases",
        value: String(testCases.filter((item) => item.status === "Failed").length),
        detail: "Test cases currently failing in this workspace",
        icon: "rule",
      },
      {
        label: "Open defects",
        value: String(defects.filter((item) => item.status === "Open").length),
        detail: "Defects waiting for review or fixing",
        icon: "bug_report",
      },
    ],
    [defects, tasks, testCases],
  );

  const devBoardSummary = useMemo(
    () => [
      {
        label: "To do",
        value: String(tasks.filter((task) => task.status === "To Do").length),
        detail: "Not started yet",
        icon: "pending_actions",
      },
      {
        label: "In progress",
        value: String(tasks.filter((task) => task.status === "In Progress").length),
        detail: "Actively being delivered",
        icon: "progress_activity",
      },
      {
        label: "Done",
        value: String(tasks.filter((task) => task.status === "Done").length),
        detail: "Finished and ready to validate",
        icon: "done_all",
      },
      {
        label: "Defect linked",
        value: String(tasks.filter((task) => task.defect_id).length),
        detail: "Tasks tied back to a defect",
        icon: "link",
      },
    ],
    [tasks],
  );

  const qaBoardSummary = useMemo(
    () => [
      {
        label: "Queued for QA",
        value: String(tasks.filter((task) => task.status === "Done").length),
        detail: "Completed dev work waiting in the QA queue",
        icon: "move_to_inbox",
      },
      {
        label: "Ready cases",
        value: String(testCases.filter((item) => item.status === "Ready").length),
        detail: "Cases prepared for execution",
        icon: "fact_check",
      },
      {
        label: "Passed",
        value: String(testCases.filter((item) => item.status === "Passed").length),
        detail: "Cases already validated",
        icon: "task_alt",
      },
      {
        label: "Failed",
        value: String(testCases.filter((item) => item.status === "Failed").length),
        detail: "Cases that need engineering follow-up",
        icon: "dangerous",
      },
    ],
    [tasks, testCases],
  );

  const monitoringStats = useMemo(
    () => [
      {
        label: "Blockers",
        value: String(
          defects.filter((item) => item.status === "Open" && item.severity === "Critical").length,
        ),
        detail: "Critical defects blocking sprint confidence",
        icon: "report_problem",
      },
      {
        label: "At risk",
        value: String(
          tasks.filter((item) => item.priority === "High" && item.status !== "Done").length,
        ),
        detail: "High-priority work still unfinished",
        icon: "priority_high",
      },
      {
        label: "Rejected defects",
        value: String(defects.filter((item) => item.status === "Rejected").length),
        detail: "Items rejected during triage",
        icon: "gpp_bad",
      },
      {
        label: "Automation candidates",
        value: String(testCases.filter((item) => item.automation === "Candidate").length),
        detail: "Manual cases that could be automated next",
        icon: "smart_toy",
      },
    ],
    [defects, tasks, testCases],
  );

  const devLanes = useMemo(
    () => [
      {
        title: "Backlog",
        items: tasks.filter((task) => task.status === "To Do").slice(0, 6),
      },
      {
        title: "In Progress",
        items: tasks.filter((task) => task.status === "In Progress").slice(0, 6),
      },
      {
        title: "Ready for QA",
        items: tasks.filter((task) => task.status === "Done").slice(0, 6),
      },
      {
        title: "Linked to Defects",
        items: tasks.filter((task) => task.defect_id).slice(0, 6),
      },
    ],
    [tasks],
  );

  const handoffLanes = useMemo(
    () => [
      {
        title: "Ready for validation",
        items: tasks.filter((task) => task.status === "Done").slice(0, 5),
      },
      {
        title: "Defect-driven fixes",
        items: tasks.filter((task) => task.defect_id).slice(0, 5),
      },
      {
        title: "Still in delivery",
        items: tasks.filter((task) => task.status === "In Progress").slice(0, 5),
      },
    ],
    [tasks],
  );

  const qaLanes = useMemo(
    () => [
      {
        title: "Ready",
        items: testCases.filter((item) => item.status === "Ready").slice(0, 6),
      },
      {
        title: "Passed",
        items: testCases.filter((item) => item.status === "Passed").slice(0, 6),
      },
      {
        title: "Failed",
        items: testCases.filter((item) => item.status === "Failed").slice(0, 6),
      },
      {
        title: "Blocked",
        items: testCases.filter((item) => item.status === "Blocked").slice(0, 6),
      },
    ],
    [testCases],
  );

  const checkpoints = useMemo(
    () => [
      {
        title: "Delivery flow",
        status:
          tasks.filter((item) => item.status === "In Progress").length > 8
            ? "Watch"
            : "Healthy",
        note: `${tasks.filter((item) => item.status === "In Progress").length} tasks are actively moving through delivery.`,
      },
      {
        title: "Quality signal",
        status:
          testCases.filter((item) => item.status === "Failed").length > 2 ? "Blocked" : "Healthy",
        note: `${testCases.filter((item) => item.status === "Failed").length} test cases are failing right now.`,
      },
      {
        title: "Defect pressure",
        status:
          defects.filter((item) => item.status === "Open").length > 4 ? "Watch" : "Healthy",
        note: `${defects.filter((item) => item.status === "Open").length} defects are open in the sprint workspace.`,
      },
    ],
    [defects, tasks, testCases],
  );

  const incidents = useMemo(
    () =>
      defects
        .filter((item) => item.status === "Open" || item.status === "Rejected")
        .slice(0, 6)
        .map((item) => ({
          id: item.reference_code,
          severity: item.severity,
          title: item.title,
          owner: item.assignee?.full_name || item.creator?.full_name || "Unassigned",
          eta: item.status === "Rejected" ? "Needs clarification" : "Needs triage",
        })),
    [defects],
  );

  const teamPulse = useMemo(
    () => [
      {
        name: "Engineering",
        summary: `${tasks.filter((task) => task.status === "In Progress").length} tasks are in active delivery and ${tasks.filter((task) => task.status === "Done").length} are ready for QA.`,
        tone: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        name: "QA",
        summary: `${testCases.filter((item) => item.status === "Ready").length} cases are ready, ${testCases.filter((item) => item.status === "Failed").length} have failures to review.`,
        tone: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        name: "Defect Triage",
        summary: `${defects.filter((item) => item.status === "Open").length} open defects and ${defects.filter((item) => item.status === "Approved").length} approved fixes are in the loop.`,
        tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    ],
    [defects, tasks, testCases],
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Sprint Workspace"
          title="Sprint Planning and Delivery"
          description="One sprint workspace for planning, delivery, QA flow, and risk tracking using live task, test case, and defect data."
          metaLabel="Active sprint"
          metaValue={`${activeSprint} • ${activeRelease}`}
          showStaticBanner={false}
        />

        <div className="mb-5">
          <SprintStatStrip items={overviewStats} />
        </div>

        <div className="mb-5">
          <SprintTabs items={mainTabs} value={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "planning" && (
          <div className="space-y-4">
            <SprintTabs
              items={planningTabs.map((item) => ({ ...item }))}
              value={planningTab}
              onChange={setPlanningTab}
              compact
            />

            {planningTab === "goals" && (
              <SectionCard eyebrow="Planning" title="Sprint goals" badge={activeSprint}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {SPRINT_PLANNING_BOARD.focusAreas.map((area) => (
                    <div
                      key={area.title}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <span className="material-symbols-outlined rounded-lg bg-white p-1.5 text-[18px] text-blue-600">
                        {area.icon}
                      </span>
                      <h3 className="mt-3 text-sm font-semibold text-slate-900">
                        {area.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-5 text-slate-600">
                        {area.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {planningTab === "scope" && (
              <SectionCard eyebrow="Planning" title="Scope breakdown" badge="Reference">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {SPRINT_PLANNING_BOARD.swimlanes.map((lane) => (
                    <div
                      key={lane.title}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lane.tone}`}
                        >
                          {lane.items.length}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2.5">
                        {lane.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-900">
                                  {item.id}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                  {item.title}
                                </p>
                              </div>
                              <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-semibold text-slate-600">
                                {item.points}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {planningTab === "ceremonies" && (
              <SectionCard eyebrow="Planning" title="Sprint ceremonies" badge="Schedule">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {SPRINT_PLANNING_BOARD.ceremonies.map((ceremony) => (
                    <div
                      key={ceremony.name}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">{ceremony.name}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {ceremony.when}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        {ceremony.agenda}
                      </p>
                      <p className="mt-3 text-[11px] text-slate-500">
                        Owner: {ceremony.owner}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {activeTab === "boards" && (
          <div className="space-y-4">
            <SprintTabs
              items={boardTabs.map((item) => ({ ...item }))}
              value={boardTab}
              onChange={setBoardTab}
              compact
            />

            {boardTab === "dev" && (
              <div className="space-y-4">
                <SprintStatStrip items={devBoardSummary} />
                <SectionCard eyebrow="Boards" title="Development board" badge={activeSprint}>
                  {loading ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      Loading sprint delivery board...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                      {devLanes.map((lane) => (
                        <div
                          key={lane.title}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                          <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                          <div className="mt-3 space-y-2.5">
                            {lane.items.length ? (
                              lane.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                                >
                                  <p className="text-xs font-semibold text-slate-900">{item.id}</p>
                                  <p className="mt-1 text-xs leading-5 text-slate-600">
                                    {item.title}
                                  </p>
                                  <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                                    <p>Owner: {item.assignee?.full_name || "Unassigned"}</p>
                                    <p>Project: {item.project?.name || "No project"}</p>
                                    <p>Priority: {item.priority}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                                No items here
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {boardTab === "qa" && (
              <div className="space-y-4">
                <SprintStatStrip items={qaBoardSummary} />
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <SectionCard eyebrow="Boards" title="Handoff queue" badge={activeSprint}>
                    {loading ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        Loading handoff queue...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {handoffLanes.map((lane) => (
                          <div
                            key={lane.title}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                          >
                            <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                            <div className="mt-3 space-y-2.5">
                              {lane.items.length ? (
                                lane.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                                  >
                                    <p className="text-xs font-semibold text-slate-900">
                                      {item.id}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">
                                      {item.title}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                                  No items here
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard eyebrow="Boards" title="QA execution" badge={activeRelease}>
                    {loading ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        Loading QA execution...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {qaLanes.map((lane) => (
                          <div
                            key={lane.title}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                          >
                            <h3 className="text-sm font-semibold text-slate-900">{lane.title}</h3>
                            <div className="mt-3 space-y-2.5">
                              {lane.items.length ? (
                                lane.items.map((item) => (
                                  <div
                                    key={`${lane.title}-${item.id}`}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                                  >
                                    <p className="text-xs font-semibold text-slate-900">
                                      {item.reference_code}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-600">
                                      {item.title}
                                    </p>
                                    <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                                      <p>Task: {item.linked_task?.title || "No linked task"}</p>
                                      <p>Owner: {item.owner?.full_name || "Unknown"}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                                  No items here
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "monitoring" && (
          <div className="space-y-4">
            <SprintTabs
              items={monitoringTabs.map((item) => ({ ...item }))}
              value={monitoringTab}
              onChange={setMonitoringTab}
              compact
            />

            {monitoringTab === "health" && (
              <div className="space-y-4">
                <SprintStatStrip items={monitoringStats} />
                <SectionCard eyebrow="Monitoring" title="Sprint health checks" badge={activeSprint}>
                  <div className="space-y-3">
                    {checkpoints.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${riskTone(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">{item.note}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {monitoringTab === "risks" && (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <SectionCard eyebrow="Monitoring" title="Open incidents" badge="Blockers">
                  <div className="space-y-3">
                    {incidents.length ? (
                      incidents.map((incident) => (
                        <div
                          key={incident.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {incident.id}
                            </p>
                            <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                              {incident.severity}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-600">
                            {incident.title}
                          </p>
                          <p className="mt-2 text-[11px] text-slate-500">
                            {incident.owner} • {incident.eta}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                        No current incidents.
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard eyebrow="Monitoring" title="Team pulse" badge="Teams">
                  <div className="space-y-3">
                    {teamPulse.map((team) => (
                      <div
                        key={team.name}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{team.name}</p>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${team.tone}`}
                          >
                            Active
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {team.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <SectionCard eyebrow="Create" title="Templates" badge="Start here">
              <div className="space-y-3">
                {SPRINT_CREATE_CONTEXT.templates.map((template) => (
                  <div
                    key={template.name}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">
                      {template.focus}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Capacity: {template.capacity}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Create" title="Sprint form" badge="Draft next sprint">
              {createMessage ? (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {createMessage}
                </div>
              ) : null}
              {createError ? (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {createError}
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Sprint name</span>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => updateDraft("name", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Release</span>
                  <select
                    value={draft.release}
                    onChange={(e) => updateDraft("release", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {SPRINT_CREATE_CONTEXT.releaseOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Project</span>
                  <select
                    value={draft.projectId}
                    onChange={(e) => {
                      updateDraft("projectId", e.target.value);
                      setSelectedTaskIds([]);
                    }}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select project</option>
                    {projects.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Owner</span>
                  <select
                    value={draft.owner}
                    onChange={(e) => updateDraft("owner", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select owner</option>
                    {users.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.full_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Squad</span>
                  <select
                    value={draft.squad}
                    onChange={(e) => updateDraft("squad", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {SPRINT_CREATE_CONTEXT.squadOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Start date</span>
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => updateDraft("startDate", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">End date</span>
                  <input
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => updateDraft("endDate", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block md:max-w-[220px]">
                  <span className="text-xs font-medium text-slate-700">Capacity</span>
                  <input
                    type="number"
                    min="1"
                    value={draft.capacity}
                    onChange={(e) => updateDraft("capacity", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-medium text-slate-700">Sprint goal</span>
                  <textarea
                    value={draft.goal}
                    onChange={(e) => updateDraft("goal", e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Link Existing Tasks
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {selectedTaskIds.length} selected
                    </span>
                  </div>
                  <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                    {selectedProjectTasks.length ? (
                      selectedProjectTasks.map((task) => (
                        <label
                          key={task.id}
                          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(task.id)}
                            onChange={() => handleToggleTaskSelection(task.id)}
                            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {task.status} • {task.priority}
                            </p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                        Select a project to choose existing tasks for this sprint.
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Preview
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">{draft.name}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-600">{draft.goal}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {users.find((user) => user.id === draft.owner)?.full_name || "Owner"} •{" "}
                    {projects.find((project) => project.id === draft.projectId)?.name || "Project"} •{" "}
                    {draft.squad} • {draft.capacity} pts
                  </p>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleCreateSprint}
                    disabled={savingSprint}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-lg">post_add</span>
                    {savingSprint ? "Creating Sprint..." : "Create Sprint"}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
