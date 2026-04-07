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
  sprintNumber: string;
  goal: string;
  release: string;
  squad: string;
  owner: string;
  projectIds: string[];
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
  sprintNumber: "",
  goal: "Finish release validation and close remaining blocker defects",
  release: SPRINT_CREATE_CONTEXT.releaseOptions[0],
  squad: SPRINT_CREATE_CONTEXT.squadOptions[4],
  owner: "",
  projectIds: [],
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

const SPRINT_NAME_PATTERN = /^Sprint[-\s]?(\d+)$/i;

const getSprintNumber = (name?: string | null) => {
  const match = String(name || "").match(SPRINT_NAME_PATTERN);
  return match ? Number.parseInt(match[1], 10) : null;
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
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
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
            projectIds:
              current.projectIds.length > 0
                ? current.projectIds
                : projectsResponse.data[0]?.id
                  ? [projectsResponse.data[0].id]
                  : [],
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
      projectIds: [requestedProjectId],
    }));
  }, [requestedProjectId]);

  const updateDraft = (field: keyof SprintDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const toggleProjectSelection = (projectId: string) => {
    setDraft((current) => {
      const alreadySelected = current.projectIds.includes(projectId);
      const nextProjectIds = alreadySelected
        ? current.projectIds.filter((id) => id !== projectId)
        : [...current.projectIds, projectId];

      return {
        ...current,
        projectIds: nextProjectIds,
      };
    });

    setSelectedTaskIds((current) =>
      current.filter((taskId) => {
        const task = tasks.find((item) => item.id === taskId);
        const taskProjectId = task?.project?.id;
        if (!taskProjectId) return false;
        return taskProjectId !== projectId || !draft.projectIds.includes(projectId);
      }),
    );
  };

  const activeSprintRecord = sprints[0] || null;
  const sprintNames = uniqueSprintNames(defects, testCases);
  const activeSprint = activeSprintRecord?.name || sprintNames[0] || "Workspace Sprint";
  const activeRelease =
    activeSprintRecord?.release ||
    defects.find((item) => item.environment)?.environment ||
    testCases.find((item) => item.project?.name)?.project?.name ||
    "Current Release";

  const selectedProjects = useMemo(
    () => projects.filter((project) => draft.projectIds.includes(project.id)),
    [draft.projectIds, projects],
  );

  const nextSprintNumber = useMemo(() => {
    const scopedProjectIds = draft.projectIds.length
      ? draft.projectIds
      : requestedProjectId
        ? [requestedProjectId]
        : projects.map((project) => project.id);

    const sprintNumbers = sprints
      .filter((sprint) => !scopedProjectIds.length || scopedProjectIds.includes(sprint.project_id))
      .map((sprint) => getSprintNumber(sprint.name))
      .filter((value): value is number => Number.isFinite(value ?? NaN));

    return sprintNumbers.length ? Math.max(...sprintNumbers) + 1 : 1;
  }, [draft.projectIds, projects, requestedProjectId, sprints]);

  const sprintNumberOptions = useMemo(() => {
    const upperBound = Math.max(nextSprintNumber + 5, 12);
    return Array.from({ length: upperBound }, (_, index) => index + 1);
  }, [nextSprintNumber]);

  useEffect(() => {
    setDraft((current) => {
      const currentNumber = Number(current.sprintNumber);
      if (currentNumber > 0) return current;
      return {
        ...current,
        sprintNumber: String(nextSprintNumber),
      };
    });
  }, [nextSprintNumber]);

  const selectedProjectTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !draft.projectIds.length ||
          (task.project?.id ? draft.projectIds.includes(task.project.id) : false),
      ),
    [draft.projectIds, tasks],
  );

  const selectedTaskProjectMap = useMemo(() => {
    const map = new Map<string, string[]>();
    selectedTaskIds.forEach((taskId) => {
      const task = tasks.find((item) => item.id === taskId);
      const projectId = task?.project?.id;
      if (!projectId) return;
      map.set(projectId, [...(map.get(projectId) || []), taskId]);
    });
    return map;
  }, [selectedTaskIds, tasks]);

  const selectedScopeSummary = useMemo(() => {
    const scopedTasks = selectedProjectTasks.filter((task) => selectedTaskIds.includes(task.id));
    return {
      tasks: scopedTasks.length,
      unassigned: scopedTasks.filter((task) => !task.assignee?.id).length,
      highPriority: scopedTasks.filter((task) => task.priority === "High").length,
      inProgress: scopedTasks.filter((task) => task.status === "In Progress").length,
    };
  }, [selectedProjectTasks, selectedTaskIds]);

  const readinessChecks = useMemo(
    () => [
      {
        label: "Projects linked",
        complete: draft.projectIds.length > 0,
        detail:
          draft.projectIds.length > 0
            ? `${draft.projectIds.length} project${draft.projectIds.length > 1 ? "s" : ""} selected`
            : "Pick at least one project",
      },
      {
        label: "Sprint owner",
        complete: Boolean(draft.owner),
        detail: draft.owner
          ? users.find((user) => user.id === draft.owner)?.full_name || "Owner selected"
          : "Assign an owner",
      },
      {
        label: "Timeline set",
        complete: Boolean(draft.startDate && draft.endDate),
        detail:
          draft.startDate && draft.endDate
            ? `${draft.startDate} to ${draft.endDate}`
            : "Add start and end dates",
      },
      {
        label: "Scope committed",
        complete: selectedTaskIds.length > 0,
        detail:
          selectedTaskIds.length > 0
            ? `${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? "s" : ""} linked`
            : "Link backlog items for this sprint",
      },
    ],
    [draft.endDate, draft.owner, draft.projectIds.length, draft.startDate, selectedTaskIds.length, users],
  );

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  };

  const handleCreateInlineProject = async () => {
    if (!newProjectName.trim()) {
      setCreateError("Project name is required before creating a sprint project.");
      return;
    }

    try {
      setCreatingProject(true);
      setCreateError("");

      const response = await projectsAPI.createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      });

      if (response.success) {
        setProjects((current) => [...current, response.data]);
        setDraft((current) => ({
          ...current,
          projectIds: current.projectIds.includes(response.data.id)
            ? current.projectIds
            : [...current.projectIds, response.data.id],
        }));
        setNewProjectName("");
        setNewProjectDescription("");
        setShowCreateProjectForm(false);
        setCreateMessage(`Project ${response.data.name} created and added to this sprint draft.`);
      }
    } catch (error: any) {
      console.error("Failed to create project:", error);
      setCreateError(error?.response?.data?.message || "Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateSprint = async () => {
    if (!draft.projectIds.length) {
      setCreateError("Select at least one project before creating a sprint.");
      return;
    }

    if (!draft.owner) {
      setCreateError("Sprint owner is required.");
      return;
    }

    const sprintNumber = Number(draft.sprintNumber || nextSprintNumber);
    if (!Number.isFinite(sprintNumber) || sprintNumber < 1) {
      setCreateError("Select a valid sprint number.");
      return;
    }

    try {
      setSavingSprint(true);
      setCreateError("");
      setCreateMessage("");
      const sprintName = `Sprint-${sprintNumber}`;
      const results = await Promise.allSettled(
        draft.projectIds.map((projectId) =>
          sprintsAPI.createSprint({
            name: sprintName,
            goal: draft.goal.trim() || undefined,
            release: draft.release || undefined,
            squad: draft.squad || undefined,
            project_id: projectId,
            owner_id: draft.owner || undefined,
            capacity: draft.capacity ? Number(draft.capacity) : undefined,
            start_date: draft.startDate || undefined,
            end_date: draft.endDate || undefined,
            status: "Active",
            task_ids: selectedTaskProjectMap.get(projectId) || [],
          }),
        ),
      );

      const successCount = results.filter((result) => result.status === "fulfilled").length;
      const failureCount = results.length - successCount;

      if (!successCount) {
        throw new Error("Failed to create sprint");
      }

      const sprintResponse = await sprintsAPI.getSprints();
      if (sprintResponse.success) {
        setSprints(sprintResponse.data);
      }
      const tasksResponse = await tasksAPI.getTasks({ limit: 200 });
      if (tasksResponse.success) {
        setTasks(tasksResponse.data);
      }
      setSelectedTaskIds([]);
      setDraft((current) => ({
        ...current,
        sprintNumber: String(sprintNumber + 1),
      }));

      setCreateMessage(
        successCount === 1
          ? `${sprintName} created successfully for ${selectedProjects[0]?.name || "the selected project"}.`
          : `${sprintName} created for ${successCount} projects.${failureCount ? ` ${failureCount} project request${failureCount > 1 ? "s" : ""} failed.` : ""}`,
      );

      if (failureCount) {
        setCreateError("Some selected projects could not be added. Review access and retry.");
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
                  <span className="text-xs font-medium text-slate-700">Sprint number</span>
                  <div className="mt-2 flex overflow-hidden rounded-lg border border-slate-300 bg-white">
                    <span className="inline-flex items-center border-r border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
                      Sprint
                    </span>
                    <select
                      value={draft.sprintNumber}
                      onChange={(e) => updateDraft("sprintNumber", e.target.value)}
                      className="w-full border-0 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-100"
                    >
                      {sprintNumberOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Next suggested number: Sprint {nextSprintNumber}
                  </p>
                </label>

                <div className="block">
                  <span className="text-xs font-medium text-slate-700">Sprint preview</span>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Sprint-{draft.sprintNumber || nextSprintNumber}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      The sprint label stays fixed and only the number changes, like Jira.
                    </p>
                  </div>
                </div>

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

                <div className="block md:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-700">Projects</span>
                    <button
                      type="button"
                      onClick={() => setShowCreateProjectForm((current) => !current)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {showCreateProjectForm ? "Close project creator" : "Create project inline"}
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {projects.map((option) => {
                      const selected = draft.projectIds.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleProjectSelection(option.id)}
                          className={`rounded-lg border px-3 py-3 text-left transition ${
                            selected
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {option.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Add this project to the sprint scope
                              </p>
                            </div>
                            <span
                              className={`material-symbols-outlined text-lg ${
                                selected ? "text-blue-600" : "text-slate-300"
                              }`}
                            >
                              {selected ? "check_circle" : "radio_button_unchecked"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {!projects.length ? (
                    <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      No projects found yet. Create one here to continue with sprint planning.
                    </div>
                  ) : null}

                  {showCreateProjectForm || !projects.length ? (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Create project</p>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Project name"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                          type="text"
                          value={newProjectDescription}
                          onChange={(e) => setNewProjectDescription(e.target.value)}
                          placeholder="Short description"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onClick={handleCreateInlineProject}
                          disabled={creatingProject}
                          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {creatingProject ? "Creating..." : "Create"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

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
                      Jira Planning Checks
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {readinessChecks.filter((item) => item.complete).length}/
                      {readinessChecks.length} ready
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {readinessChecks.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined text-base ${
                              item.complete ? "text-emerald-600" : "text-amber-500"
                            }`}
                          >
                            {item.complete ? "check_circle" : "pending"}
                          </span>
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Scope Summary
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {selectedProjects.length} project{selectedProjects.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        Tasks
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {selectedScopeSummary.tasks}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        Unassigned
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {selectedScopeSummary.unassigned}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        High Priority
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {selectedScopeSummary.highPriority}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                        In Progress
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {selectedScopeSummary.inProgress}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Link Existing Tasks
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {selectedTaskIds.length} selected
                    </span>
                  </div>
                  <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
                    {selectedProjectTasks.length ? (
                      selectedProjects.map((project) => {
                        const projectTasks = selectedProjectTasks.filter(
                          (task) => task.project?.id === project.id,
                        );

                        return (
                          <div
                            key={project.id}
                            className="rounded-lg border border-slate-200 bg-white"
                          >
                            <div className="border-b border-slate-100 px-3 py-2.5">
                              <p className="text-sm font-semibold text-slate-900">
                                {project.name}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {projectTasks.length} backlog item
                                {projectTasks.length === 1 ? "" : "s"} available
                              </p>
                            </div>
                            <div className="space-y-2 p-3">
                              {projectTasks.length ? (
                                projectTasks.map((task) => (
                                  <label
                                    key={task.id}
                                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedTaskIds.includes(task.id)}
                                      onChange={() => handleToggleTaskSelection(task.id)}
                                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-900">
                                        {task.title}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {task.status} • {task.priority} •{" "}
                                        {task.assignee?.full_name || "Unassigned"}
                                      </p>
                                    </div>
                                  </label>
                                ))
                              ) : (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-xs text-slate-500">
                                  No tasks available for this project yet.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                        Select one or more projects to choose existing tasks for this sprint.
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Preview
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">
                    Sprint-{draft.sprintNumber || nextSprintNumber}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-600">{draft.goal}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {users.find((user) => user.id === draft.owner)?.full_name || "Owner"} •{" "}
                    {selectedProjects.length
                      ? selectedProjects.map((project) => project.name).join(", ")
                      : "Project"} •{" "}
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
