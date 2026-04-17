import { useEffect, useMemo, useState } from "react";
import { getFullName } from "../utils/user";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SPRINT_CREATE_CONTEXT } from "../data/testManagement";
import SprintStatStrip from "../components/sprint/SprintStatStrip";
import SprintCompactTabs from "../components/sprint/SprintCompactTabs";
import SprintCreateSidebar from "../components/sprint/SprintCreateSidebar";
import SprintInsightsCharts from "../components/sprint/SprintInsightsCharts";
import SprintSectionCard from "../components/sprint/SprintSectionCard";
import SprintTrendChart from "../components/sprint/SprintTrendChart";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import { projectsAPI, tasksAPI, usersAPI } from "../services/dashboard";
import { defectsAPI } from "../services/defects";
import { testCasesAPI } from "../services/testCases";
import { sprintsAPI } from "../services/sprints";
import type { Defect } from "../types/defect";
import type { TestCaseRecord } from "../types/testCase";
import type { Sprint, SprintInsights } from "../types/sprint";

type MainTab = "planning" | "sprints" | "boards" | "monitoring" | "create";
type BoardTab = "dev" | "qa";
type MonitoringTab = "health" | "risks";

type SprintDraft = {
  sprintNumber: string;
  goal: string;
  release: string;
  owner: string;
  projectIds: string[];
  capacity: string;
  startDate: string;
  endDate: string;
};

type SprintEditor = {
  name: string;
  goal: string;
  release: string;
  owner_id: string;
  capacity: string;
  start_date: string;
  end_date: string;
  status: Sprint["status"];
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
    description: "Overview and cadence",
  },
  {
    key: "sprints",
    label: "Sprints",
    icon: "inventory_2",
    description: "List and details",
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
    description: "New sprint",
  },
];

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
  owner: "",
  projectIds: [],
  capacity: "44",
  startDate: "2026-04-06",
  endDate: "2026-04-17",
};

const emptySprintEditor = (): SprintEditor => ({
  name: "",
  goal: "",
  release: "",
  owner_id: "",
  capacity: "",
  start_date: "",
  end_date: "",
  status: "Planning",
});

const SPRINT_NAME_PATTERN = /^Sprint[-\s]?(\d+)$/i;

const getSprintNumber = (name?: string | null) => {
  const match = String(name || "").match(SPRINT_NAME_PATTERN);
  return match ? Number.parseInt(match[1], 10) : null;
};

const riskTone = (status: string) => {
  if (status === "Healthy") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Watch") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
};

const statusTone = (status: Sprint["status"]) => {
  if (status === "Active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Completed") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const daysUntil = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const target = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  ).getTime();
  return Math.round((target - start) / 86400000);
};

export default function SprintBoards() {
  const CUSTOM_RELEASE_VALUE = "__custom_release__";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<MainTab>("planning");
  const [boardTab, setBoardTab] = useState<BoardTab>("dev");
  const [monitoringTab, setMonitoringTab] = useState<MonitoringTab>("health");
  const [draft, setDraft] = useState<SprintDraft>(defaultDraft);
  const [sprintEditor, setSprintEditor] = useState<SprintEditor>(emptySprintEditor);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [testCases, setTestCases] = useState<TestCaseRecord[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [projectPickerId, setProjectPickerId] = useState("");
  const [isCustomRelease, setIsCustomRelease] = useState(false);
  const [savingSprint, setSavingSprint] = useState(false);
  const [savingSprintEdits, setSavingSprintEdits] = useState(false);
  const [sprintInsights, setSprintInsights] = useState<SprintInsights | null>(null);
  const [createError, setCreateError] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [detailError, setDetailError] = useState("");
  const [detailMessage, setDetailMessage] = useState("");

  const createTabRequested = searchParams.get("tab") === "create";
  const requestedProjectId = searchParams.get("projectId") || "";
  const requestedSprintId = searchParams.get("sprintId") || "";

  useEffect(() => {
    if (createTabRequested) {
      setActiveTab("create");
    }
  }, [createTabRequested]);

  useEffect(() => {
    const loadBoardData = async () => {
      try {
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
                : requestedProjectId
                  ? [requestedProjectId]
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
      }
    };

    loadBoardData();
  }, [requestedProjectId]);

  const updateDraft = (field: keyof SprintDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const selectedSprintId = useMemo(() => {
    if (requestedSprintId && sprints.some((item) => item.id === requestedSprintId)) {
      return requestedSprintId;
    }
    if (requestedProjectId) {
      const scoped = sprints.filter((item) => item.project_id === requestedProjectId);
      const active = scoped.find((item) => item.status === "Active");
      return active?.id || scoped[0]?.id || "";
    }
    const active = sprints.find((item) => item.status === "Active");
    return active?.id || sprints[0]?.id || "";
  }, [requestedProjectId, requestedSprintId, sprints]);

  const activeSprintRecord = useMemo(
    () => sprints.find((item) => item.id === selectedSprintId) || null,
    [selectedSprintId, sprints],
  );

  const relatedSprintRecords = useMemo(() => {
    if (!activeSprintRecord) return [];
    const normalizedName = activeSprintRecord.name.trim().toLowerCase();
    return sprints.filter((item) => item.name.trim().toLowerCase() === normalizedName);
  }, [activeSprintRecord, sprints]);

  const sprintFamilies = useMemo(() => {
    const familyMap = new Map<
      string,
      { key: string; name: string; records: Sprint[]; primary: Sprint }
    >();

    sprints.forEach((item) => {
      const key = item.name.trim().toLowerCase();
      const existing = familyMap.get(key);
      if (existing) {
        existing.records.push(item);
        const currentPriority =
          existing.primary.status === "Active"
            ? 3
            : existing.primary.status === "Planning"
              ? 2
              : 1;
        const nextPriority = item.status === "Active" ? 3 : item.status === "Planning" ? 2 : 1;
        if (nextPriority > currentPriority) {
          existing.primary = item;
        }
        return;
      }

      familyMap.set(key, { key, name: item.name, records: [item], primary: item });
    });

    return Array.from(familyMap.values()).sort((first, second) =>
      second.primary.updated_at.localeCompare(first.primary.updated_at),
    );
  }, [sprints]);

  const relatedSprintIds = useMemo(
    () => relatedSprintRecords.map((item) => item.id),
    [relatedSprintRecords],
  );

  useEffect(() => {
    if (!selectedSprintId || activeTab === "create") return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("sprintId", selectedSprintId);
      return next;
    }, { replace: true });
  }, [activeTab, selectedSprintId, setSearchParams]);

  useEffect(() => {
    if (!selectedSprintId) {
      setSprintInsights(null);
      return;
    }

    const loadSprintInsights = async () => {
      try {
        const response = await sprintsAPI.getSprintInsights(selectedSprintId);
        if (response.success) {
          setSprintInsights(response.data.insights);
        }
      } catch (error) {
        console.error("Failed to fetch sprint insights:", error);
      }
    };

    loadSprintInsights();
  }, [selectedSprintId]);

  useEffect(() => {
    if (!activeSprintRecord) {
      setSprintEditor(emptySprintEditor());
      return;
    }

    setSprintEditor({
      name: activeSprintRecord.name || "",
      goal: activeSprintRecord.goal || "",
      release: activeSprintRecord.release || "",
      owner_id: activeSprintRecord.owner_id || "",
      capacity:
        activeSprintRecord.capacity === null || activeSprintRecord.capacity === undefined
          ? ""
          : String(activeSprintRecord.capacity),
      start_date: activeSprintRecord.start_date || "",
      end_date: activeSprintRecord.end_date || "",
      status: activeSprintRecord.status,
    });
  }, [activeSprintRecord]);

  const activeSprint = activeSprintRecord?.name || "Workspace Sprint";
  const activeRelease = useMemo(() => {
    const releases = Array.from(
      new Set(
        relatedSprintRecords
          .map((item) => item.release)
          .filter((value): value is string => Boolean(value?.trim())),
      ),
    );
    if (releases.length) return releases.join(", ");
    return activeSprintRecord?.project?.name || "Current Release";
  }, [activeSprintRecord, relatedSprintRecords]);

  const sprintTasks = useMemo(
    () =>
      activeSprintRecord
        ? tasks.filter((task) => task.sprint_id && relatedSprintIds.includes(task.sprint_id))
        : [],
    [activeSprintRecord, relatedSprintIds, tasks],
  );

  const sprintDefects = useMemo(
    () =>
      activeSprintRecord
        ? defects.filter(
            (item) =>
              (item.sprint_id && relatedSprintIds.includes(item.sprint_id)) ||
              (!item.sprint_id && item.sprint_name === activeSprintRecord.name),
          )
        : [],
    [activeSprintRecord, defects, relatedSprintIds],
  );

  const sprintTestCases = useMemo(
    () =>
      activeSprintRecord
        ? testCases.filter(
            (item) =>
              (item.sprint_id && relatedSprintIds.includes(item.sprint_id)) ||
              (!item.sprint_id && item.sprint_name === activeSprintRecord.name),
          )
        : [],
    [activeSprintRecord, relatedSprintIds, testCases],
  );

  const selectedProjects = useMemo(
    () => projects.filter((project) => draft.projectIds.includes(project.id)),
    [draft.projectIds, projects],
  );

  const availableProjectOptions = useMemo(
    () => projects.filter((project) => !draft.projectIds.includes(project.id)),
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
      return { ...current, sprintNumber: String(nextSprintNumber) };
    });
  }, [nextSprintNumber]);

  const selectedProjectTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          draft.projectIds.includes(task.project?.id || "") &&
          !task.sprint_id,
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

  const sprintProjects = useMemo(
    () =>
      relatedSprintRecords
        .map((item) => item.project)
        .filter((value): value is NonNullable<Sprint["project"]> => Boolean(value)),
    [relatedSprintRecords],
  );

  const sprintProjectNames = useMemo(
    () => sprintProjects.map((item) => item.name),
    [sprintProjects],
  );

  const overdueTaskCount = useMemo(
    () =>
      sprintTasks.filter((task) => {
        if (!task.due_date || task.status === "Done") return false;
        const diff = daysUntil(task.due_date);
        return diff !== null && diff < 0;
      }).length,
    [sprintTasks],
  );

  const dueSoonTaskCount = useMemo(
    () =>
      sprintTasks.filter((task) => {
        if (!task.due_date || task.status === "Done") return false;
        const diff = daysUntil(task.due_date);
        return diff !== null && diff >= 0 && diff <= 3;
      }).length,
    [sprintTasks],
  );

  const unassignedSprintTaskCount = useMemo(
    () => sprintTasks.filter((task) => !task.assignee?.id).length,
    [sprintTasks],
  );

  const sprintDateRange = useMemo(() => {
    const startDates = relatedSprintRecords
      .map((item) => item.start_date)
      .filter((value): value is string => Boolean(value));
    const endDates = relatedSprintRecords
      .map((item) => item.end_date)
      .filter((value): value is string => Boolean(value));
    return {
      start: startDates.sort()[0] || null,
      end: endDates.sort().reverse()[0] || null,
    };
  }, [relatedSprintRecords]);

  const sprintTaskGroups = useMemo(
    () => [
      { key: "To Do", items: sprintTasks.filter((item) => item.status === "To Do") },
      { key: "In Progress", items: sprintTasks.filter((item) => item.status === "In Progress") },
      { key: "Done", items: sprintTasks.filter((item) => item.status === "Done") },
    ],
    [sprintTasks],
  );

  const sprintTestGroups = useMemo(
    () => [
      { key: "Ready", items: sprintTestCases.filter((item) => item.status === "Ready") },
      { key: "Passed", items: sprintTestCases.filter((item) => item.status === "Passed") },
      { key: "Failed", items: sprintTestCases.filter((item) => item.status === "Failed") },
      { key: "Blocked", items: sprintTestCases.filter((item) => item.status === "Blocked") },
    ],
    [sprintTestCases],
  );

  const highestPriorityTasks = useMemo(
    () =>
      [...sprintTasks]
        .filter((task) => task.status !== "Done")
        .sort((first, second) => {
          const priorityWeight = (value: TaskItem["priority"]) =>
            value === "High" ? 3 : value === "Medium" ? 2 : 1;
          return priorityWeight(second.priority) - priorityWeight(first.priority);
        })
        .slice(0, 5),
    [sprintTasks],
  );

  const readinessChecks = useMemo(
    () => [
      {
        label: "Projects selected",
        complete: draft.projectIds.length > 0,
        detail: draft.projectIds.length
          ? `${draft.projectIds.length} project${draft.projectIds.length === 1 ? "" : "s"} added`
          : "Add one or more projects",
      },
      {
        label: "Sprint owner",
        complete: Boolean(draft.owner),
        detail: draft.owner
          ? getFullName(users.find((user) => user.id === draft.owner)) || "Owner selected"
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
        label: "Backlog linked",
        complete: selectedTaskIds.length > 0,
        detail:
          selectedTaskIds.length > 0
            ? `${selectedTaskIds.length} task${selectedTaskIds.length === 1 ? "" : "s"} selected`
            : "Link backlog items if needed",
      },
    ],
    [draft.endDate, draft.owner, draft.projectIds.length, draft.startDate, selectedTaskIds.length, users],
  );

  const addProjectToDraft = (projectId: string) => {
    if (!projectId) return;
    setDraft((current) => ({
      ...current,
      projectIds: current.projectIds.includes(projectId)
        ? current.projectIds
        : [...current.projectIds, projectId],
    }));
    setProjectPickerId("");
  };

  const removeProjectFromDraft = (projectId: string) => {
    setDraft((current) => ({
      ...current,
      projectIds: current.projectIds.filter((id) => id !== projectId),
    }));
    setSelectedTaskIds((current) =>
      current.filter((taskId) => {
        const task = tasks.find((item) => item.id === taskId);
        return task?.project?.id !== projectId;
      }),
    );
  };

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  };

  const handleCreateSprint = async () => {
    if (!draft.projectIds.length) {
      setCreateError("Add at least one project before creating a sprint.");
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

      const normalizedSprintName = sprintName.trim().toLowerCase();
      const operations = draft.projectIds.map(async (projectId) => {
        const existingSprint = sprints.find(
          (item) =>
            item.project_id === projectId &&
            item.name.trim().toLowerCase() === normalizedSprintName,
        );
        const taskIds = selectedTaskProjectMap.get(projectId) || [];

        if (existingSprint) {
          const updated = await sprintsAPI.updateSprint(existingSprint.id, {
            goal: draft.goal.trim() || undefined,
            release: draft.release.trim() || undefined,
            owner_id: draft.owner || undefined,
            capacity: draft.capacity ? Number(draft.capacity) : undefined,
            start_date: draft.startDate || undefined,
            end_date: draft.endDate || undefined,
            status: existingSprint.status || "Planning",
          });
          if (taskIds.length) {
            await sprintsAPI.addTasksToSprint(existingSprint.id, taskIds);
          }
          return { mode: "updated" as const, sprint: updated.data };
        }

        const created = await sprintsAPI.createSprint({
          name: sprintName,
          goal: draft.goal.trim() || undefined,
          release: draft.release.trim() || undefined,
          project_id: projectId,
          owner_id: draft.owner || undefined,
          capacity: draft.capacity ? Number(draft.capacity) : undefined,
          start_date: draft.startDate || undefined,
          end_date: draft.endDate || undefined,
          status: "Planning",
          task_ids: taskIds,
        });
        return { mode: "created" as const, sprint: created.data };
      });

      const results = await Promise.allSettled(operations);
      const successResults = results.filter(
        (result): result is PromiseFulfilledResult<{ mode: "created" | "updated"; sprint: Sprint }> =>
          result.status === "fulfilled",
      );
      const failedCount = results.length - successResults.length;
      if (!successResults.length) {
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

      const createdCount = successResults.filter((item) => item.value.mode === "created").length;
      const updatedCount = successResults.filter((item) => item.value.mode === "updated").length;
      const firstTouchedSprint = successResults[0].value.sprint;
      setSelectedTaskIds([]);
      setDraft((current) => ({
        ...current,
        sprintNumber: String(sprintNumber + 1),
      }));
      setCreateMessage(
        `${sprintName} synced across ${successResults.length} project${successResults.length === 1 ? "" : "s"}: ${createdCount} created, ${updatedCount} updated.${failedCount ? ` ${failedCount} failed.` : ""}`,
      );

      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("sprintId", firstTouchedSprint.id);
        return next;
      });
    } catch (error: any) {
      console.error("Failed to create sprint:", error);
      setCreateError(error?.response?.data?.message || (error as Error).message || "Failed to create sprint");
    } finally {
      setSavingSprint(false);
    }
  };

  const handleSaveSprintDetails = async () => {
    if (!selectedSprintId) return;
    if (!sprintEditor.name.trim()) {
      setDetailError("Sprint name is required.");
      return;
    }

    try {
      setSavingSprintEdits(true);
      setDetailError("");
      setDetailMessage("");
      const response = await sprintsAPI.updateSprint(selectedSprintId, {
        name: sprintEditor.name.trim(),
        goal: sprintEditor.goal.trim() || undefined,
        release: sprintEditor.release.trim() || undefined,
        owner_id: sprintEditor.owner_id || undefined,
        capacity: sprintEditor.capacity ? Number(sprintEditor.capacity) : undefined,
        start_date: sprintEditor.start_date || undefined,
        end_date: sprintEditor.end_date || undefined,
        status: sprintEditor.status,
      });
      setSprints((current) =>
        current.map((item) => (item.id === response.data.id ? response.data : item)),
      );
      setDetailMessage("Sprint updated successfully.");
    } catch (error: any) {
      console.error("Failed to update sprint:", error);
      setDetailError(error?.response?.data?.message || "Failed to update sprint");
    } finally {
      setSavingSprintEdits(false);
    }
  };

  const boardSummary = useMemo(
    () => [
      {
        label: "To Do",
        value: String(sprintTasks.filter((task) => task.status === "To Do").length),
        detail: "Not started yet",
        icon: "pending_actions",
      },
      {
        label: "In Progress",
        value: String(sprintTasks.filter((task) => task.status === "In Progress").length),
        detail: "Actively being delivered",
        icon: "progress_activity",
      },
      {
        label: "Done",
        value: String(sprintTasks.filter((task) => task.status === "Done").length),
        detail: "Finished work",
        icon: "done_all",
      },
      {
        label: "Defect linked",
        value: String(sprintTasks.filter((task) => task.defect_id).length),
        detail: "Tasks tied back to defects",
        icon: "link",
      },
    ],
    [sprintTasks],
  );

  const qaSummary = useMemo(
    () => [
      {
        label: "Ready",
        value: String(sprintTestCases.filter((item) => item.status === "Ready").length),
        detail: "Cases prepared for execution",
        icon: "fact_check",
      },
      {
        label: "Passed",
        value: String(sprintTestCases.filter((item) => item.status === "Passed").length),
        detail: "Cases already validated",
        icon: "task_alt",
      },
      {
        label: "Failed",
        value: String(sprintTestCases.filter((item) => item.status === "Failed").length),
        detail: "Engineering follow-up needed",
        icon: "dangerous",
      },
      {
        label: "Blocked",
        value: String(sprintTestCases.filter((item) => item.status === "Blocked").length),
        detail: "Waiting on a dependency",
        icon: "block",
      },
    ],
    [sprintTestCases],
  );

  const checkpoints = useMemo(
    () => [
      {
        title: "Delivery flow",
        status:
          sprintTasks.filter((item) => item.status === "In Progress").length > 8
            ? "Watch"
            : "Healthy",
        note: `${sprintTasks.filter((item) => item.status === "In Progress").length} tasks are actively moving through delivery.`,
      },
      {
        title: "Quality signal",
        status:
          sprintTestCases.filter((item) => item.status === "Failed").length > 2
            ? "Blocked"
            : "Healthy",
        note: `${sprintTestCases.filter((item) => item.status === "Failed").length} test cases are failing right now.`,
      },
      {
        title: "Defect pressure",
        status:
          sprintDefects.filter((item) => item.status === "Open").length > 4
            ? "Watch"
            : "Healthy",
        note: `${sprintDefects.filter((item) => item.status === "Open").length} defects are open in the sprint.`,
      },
    ],
    [sprintDefects, sprintTasks, sprintTestCases],
  );

  const incidents = useMemo(
    () =>
      sprintDefects
        .filter((item) => item.status === "Open" || item.status === "Rejected")
        .slice(0, 6),
    [sprintDefects],
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Sprint Workspace"
          title="Sprint Planning and Delivery"
          description="Plan, deliver, and review one sprint family across projects with a tighter Jira-style workflow."
          metaLabel="Active sprint"
          metaValue={`${activeSprint} • ${activeRelease}`}
          metaPosition="right"
          showMeta={false}
          actions={
            activeTab !== "create" ? (
              <div className="flex w-full min-w-[280px] flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:w-auto sm:min-w-[360px] sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Sprint
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900">{activeSprint}</p>
                </div>
                <select
                  value={selectedSprintId}
                  onChange={(event) =>
                    setSearchParams((current) => {
                      const next = new URLSearchParams(current);
                      if (event.target.value) next.set("sprintId", event.target.value);
                      else next.delete("sprintId");
                      return next;
                    })
                  }
                  className="min-w-[220px] rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                >
                  {sprintFamilies.length === 0 ? <option value="">No sprints available</option> : null}
                  {sprintFamilies.map((family) => (
                    <option key={family.key} value={family.primary.id}>{family.name}</option>
                  ))}
                </select>
              </div>
            ) : null
          }
          showStaticBanner={false}
        />

        <div className="mb-5">
          <SprintCompactTabs items={mainTabs} value={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "planning" ? (
          <div className="space-y-3">
            <SprintSectionCard eyebrow="Planning" title="Sprint Snapshot" badge={activeSprint}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Projects</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{sprintProjects.length}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {sprintProjectNames.length ? sprintProjectNames.join(", ") : "No linked projects"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Timeline</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDate(sprintDateRange.start)} to {formatDate(sprintDateRange.end)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activeSprintRecord?.status || "Planning"} sprint family
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Owner Coverage</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {Array.from(
                      new Set(
                        relatedSprintRecords
                          .map((item) => item.owner ? getFullName(item.owner) : null)
                          .filter((value): value is string => Boolean(value)),
                      ),
                    ).join(", ") || "Unassigned"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Sprint owners across selected projects</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Goal</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {activeSprintRecord?.goal || "No sprint goal yet"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{activeRelease}</p>
                </div>
              </div>
            </SprintSectionCard>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_360px]">
              <SprintSectionCard eyebrow="Planning" title="Scope and Readiness" badge={`${sprintTasks.length} tasks`}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Unassigned</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{unassignedSprintTaskCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Due Soon</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{dueSoonTaskCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Overdue</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{overdueTaskCount}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Open Defects</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {sprintDefects.filter((item) => item.status !== "Resolved").length}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-900">Top delivery items</p>
                    <div className="mt-3 space-y-2.5">
                      {highestPriorityTasks.length ? (
                        highestPriorityTasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => navigate(`/task/${task.id}`)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                {task.priority}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {task.project?.name || "No project"} • {task.assignee ? getFullName(task.assignee) : "Unassigned"} • {task.status}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                          No active delivery items in this sprint.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SprintSectionCard>

              <SprintSectionCard eyebrow="Planning" title="Quality Readout" badge={`${sprintTestCases.length} cases`}>
                <div className="space-y-3">
                  {[
                    {
                      title: "Validation progress",
                      note: `${sprintTestCases.filter((item) => item.status === "Passed").length} passed, ${sprintTestCases.filter((item) => item.status === "Ready").length} ready to execute.`,
                      tone:
                        sprintTestCases.filter((item) => item.status === "Failed").length > 2
                          ? "Watch"
                          : "Healthy",
                    },
                    {
                      title: "Defect pressure",
                      note: `${sprintDefects.filter((item) => item.status === "Open" || item.status === "In Progress").length} defects still need engineering movement.`,
                      tone:
                        sprintDefects.filter((item) => item.priority === "Critical" || item.priority === "High").length > 3
                          ? "Blocked"
                          : "Healthy",
                    },
                    {
                      title: "Delivery load",
                      note: `${sprintTasks.filter((item) => item.status === "In Progress").length} tasks are in progress and ${unassignedSprintTaskCount} are unassigned.`,
                      tone: unassignedSprintTaskCount > 0 || overdueTaskCount > 0 ? "Watch" : "Healthy",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${riskTone(item.tone)}`}>
                          {item.tone}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-600">{item.note}</p>
                    </div>
                  ))}
                </div>
              </SprintSectionCard>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.15fr)_420px]">
              <SprintSectionCard eyebrow="Planning" title="Sprint Trend" badge="Real activity">
                <SprintTrendChart points={sprintInsights?.trend || []} />
              </SprintSectionCard>

              <SprintSectionCard eyebrow="Planning" title="Lagging Owners" badge="Follow-up">
                <div className="space-y-3">
                  {sprintInsights?.lagging_people?.length ? (
                    sprintInsights.lagging_people.map((person) => (
                      <div key={person.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{getFullName(person)}</p>
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            {person.overdue_tasks} overdue
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {person.project_names.join(", ")} • {person.in_progress_tasks} in progress • {person.high_priority_open} high priority open
                        </p>
                        <div className="mt-2 space-y-2">
                          {person.sample_tasks.map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => navigate(`/task/${task.id}`)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                            >
                              <p className="text-xs font-semibold text-slate-900">{task.title}</p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {task.status} • {task.due_date ? `Due ${formatDate(task.due_date)}` : "No due date"}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      No lagging owners detected for this sprint right now.
                    </div>
                  )}
                </div>
              </SprintSectionCard>
            </div>

            <SprintSectionCard eyebrow="Planning" title="Project Delivery Breakdown" badge={`${sprintInsights?.summary.projects || relatedSprintRecords.length} projects`}>
              <div className="mb-3">
                <SprintInsightsCharts
                  insights={sprintInsights}
                  onOpenProject={(projectId) => navigate(`/projects/${projectId}`)}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(sprintInsights?.project_breakdown || []).map((item) => (
                  <button
                    key={item.sprint_id}
                    type="button"
                    onClick={() => item.project?.id && navigate(`/projects/${item.project.id}`)}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.project?.name || "No project"}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.owner ? getFullName(item.owner) : "No owner"} • {item.release || "No release"} • {item.capacity ?? 0} pts
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">To Do</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.task_status.todo}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Doing</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.task_status.in_progress}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-2 py-2">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Done</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.task_status.done}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      {item.overdue_tasks} overdue • {item.open_defects} open defects • {item.failed_test_cases} failed cases
                    </p>
                  </button>
                ))}
              </div>
            </SprintSectionCard>
          </div>
        ) : null}

        {activeTab === "sprints" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <SprintSectionCard eyebrow="Sprints" title="Sprint List" badge={`${sprintFamilies.length} sprint groups`}>
              <div className="space-y-3">
                {sprintFamilies.length ? (
                  sprintFamilies.map((family) => {
                    const isSelected = relatedSprintRecords.some((item) => item.id === family.primary.id);
                    return (
                      <button
                        key={family.key}
                        type="button"
                        onClick={() =>
                          setSearchParams((current) => {
                            const next = new URLSearchParams(current);
                            next.set("sprintId", family.primary.id);
                            return next;
                          })
                        }
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{family.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {family.records.length} project{family.records.length === 1 ? "" : "s"} •{" "}
                              {Array.from(
                                new Set(
                                  family.records
                                    .map((item) => item.release)
                                    .filter((value): value is string => Boolean(value)),
                                ),
                              ).join(", ") || "No release"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(family.primary.status)}`}
                          >
                            {family.primary.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {family.primary.goal || "No sprint goal defined yet."}
                        </p>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No sprints available yet.
                  </div>
                )}
              </div>
            </SprintSectionCard>

            <SprintSectionCard eyebrow="Sprints" title="Sprint Details" badge={activeSprintRecord?.name || "Select a sprint"}>
              {activeSprintRecord ? (
                <div className="space-y-5">
                  {detailMessage ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {detailMessage}
                    </div>
                  ) : null}
                  {detailError ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {detailError}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Sprint name</span>
                      <input
                        value={sprintEditor.name}
                        onChange={(event) =>
                          setSprintEditor((current) => ({ ...current, name: event.target.value }))
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Status</span>
                      <select
                        value={sprintEditor.status}
                        onChange={(event) =>
                          setSprintEditor((current) => ({
                            ...current,
                            status: event.target.value as Sprint["status"],
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Project</span>
                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        {activeSprintRecord.project?.name || "No project"}
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Owner</span>
                      <select
                        value={sprintEditor.owner_id}
                        onChange={(event) =>
                          setSprintEditor((current) => ({ ...current, owner_id: event.target.value }))
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select owner</option>
                        {users.map((option) => (
                          <option key={option.id} value={option.id}>
                            {getFullName(option)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Release</span>
                      <input
                        value={sprintEditor.release}
                        onChange={(event) =>
                          setSprintEditor((current) => ({ ...current, release: event.target.value }))
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Capacity</span>
                      <input
                        type="number"
                        min="1"
                        value={sprintEditor.capacity}
                        onChange={(event) =>
                          setSprintEditor((current) => ({ ...current, capacity: event.target.value }))
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Start date</span>
                      <input
                        type="date"
                        value={sprintEditor.start_date}
                        onChange={(event) =>
                          setSprintEditor((current) => ({ ...current, start_date: event.target.value }))
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">End date</span>
                      <input
                        type="date"
                        value={sprintEditor.end_date}
                        onChange={(event) =>
                          setSprintEditor((current) => ({ ...current, end_date: event.target.value }))
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">Sprint goal</span>
                    <textarea
                      rows={4}
                      value={sprintEditor.goal}
                      onChange={(event) =>
                        setSprintEditor((current) => ({ ...current, goal: event.target.value }))
                      }
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Family Tasks</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {sprintTasks.length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Projects</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {relatedSprintRecords.length}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Timeline</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatDate(sprintDateRange.start)} to {formatDate(sprintDateRange.end)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-900">Project coverage in this sprint</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {relatedSprintRecords.map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {item.project?.name || "No project"}
                            </p>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.tasks_count} tasks • {item.release || "No release"} • {item.owner ? getFullName(item.owner) : "No owner"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSprintDetails}
                    disabled={savingSprintEdits}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingSprintEdits ? "Saving..." : "Update Sprint"}
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                  Select a sprint from the list to see details and update it.
                </div>
              )}
            </SprintSectionCard>
          </div>
        ) : null}

        {activeTab === "boards" ? (
          <div className="space-y-4">
            <SprintCompactTabs items={boardTabs.map((item) => ({ ...item }))} value={boardTab} onChange={setBoardTab} />

            <SprintStatStrip items={boardTab === "dev" ? boardSummary : qaSummary} />

            {boardTab === "dev" ? (
              <SprintSectionCard eyebrow="Boards" title="Development Board" badge={activeSprint}>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {sprintTaskGroups.map((group) => (
                    <div key={group.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{group.key}</h3>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {group.items.length}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2.5">
                        {group.items.length ? (
                          group.items.map((item) => (
                            <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                  {item.priority}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {item.project?.name || "No project"} • {item.assignee ? getFullName(item.assignee) : "Unassigned"} • {item.due_date ? `Due ${formatDate(item.due_date)}` : "No due date"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                            No tasks in {group.key.toLowerCase()}.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SprintSectionCard>
            ) : (
              <SprintSectionCard eyebrow="Boards" title="QA Board" badge={activeRelease}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  {sprintTestGroups.map((group) => (
                    <div key={group.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{group.key}</h3>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {group.items.length}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2.5">
                        {group.items.length ? (
                          group.items.map((item) => (
                            <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                              <p className="text-xs font-semibold text-slate-900">{item.reference_code}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-600">{item.title}</p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {item.project?.name || "No project"} • {item.owner ? getFullName(item.owner) : "No owner"} • {item.automation}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                            No cases in {group.key.toLowerCase()}.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </SprintSectionCard>
            )}
          </div>
        ) : null}

        {activeTab === "monitoring" ? (
          <div className="space-y-4">
            <SprintCompactTabs
              items={monitoringTabs.map((item) => ({ ...item }))}
              value={monitoringTab}
              onChange={setMonitoringTab}
            />

            {monitoringTab === "health" ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <SprintSectionCard eyebrow="Monitoring" title="Sprint Health" badge={activeSprint}>
                  <div className="space-y-3">
                    {checkpoints.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
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
                </SprintSectionCard>

                <SprintSectionCard eyebrow="Monitoring" title="Attention Areas" badge="Now">
                  <div className="space-y-3">
                    {[
                      {
                        title: "Overdue work",
                        detail: `${sprintInsights?.summary.overdue_tasks ?? overdueTaskCount} task${(sprintInsights?.summary.overdue_tasks ?? overdueTaskCount) === 1 ? "" : "s"} have crossed their due date.`,
                      },
                      {
                        title: "Failed validation",
                        detail: `${sprintTestCases.filter((item) => item.status === "Failed").length} test case${sprintTestCases.filter((item) => item.status === "Failed").length === 1 ? "" : "s"} are failing.`,
                      },
                      {
                        title: "Critical defects",
                        detail: `${sprintDefects.filter((item) => item.priority === "Critical" || item.severity === "Critical").length} critical defect${sprintDefects.filter((item) => item.priority === "Critical" || item.severity === "Critical").length === 1 ? "" : "s"} need attention.`,
                      },
                      {
                        title: "Unassigned work",
                        detail: `${sprintInsights?.summary.unassigned_tasks ?? unassignedSprintTaskCount} task${(sprintInsights?.summary.unassigned_tasks ?? unassignedSprintTaskCount) === 1 ? "" : "s"} do not have an owner yet.`,
                      },
                    ].map((item) => (
                      <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </SprintSectionCard>
              </div>
            ) : (
              <SprintSectionCard eyebrow="Monitoring" title="Open Risks" badge="Incidents">
                <div className="space-y-3">
                  {incidents.length ? (
                    incidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {incident.reference_code}
                          </p>
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                            {incident.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {incident.title}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-500">
                          {incident.assignee ? getFullName(incident.assignee) : incident.creator ? getFullName(incident.creator) : "Unassigned"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      No current incidents.
                    </div>
                  )}
                </div>
              </SprintSectionCard>
            )}
          </div>
        ) : null}

        {activeTab === "create" ? (
          <div className="space-y-4">
            <SprintSectionCard eyebrow="Create" title="Create Sprint" badge="Focused setup">
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

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Sprint</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        Sprint-{draft.sprintNumber || nextSprintNumber}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Projects</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{selectedProjects.length}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Backlog Selected</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{selectedTaskIds.length}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Mode</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Create new or update existing Sprint-{draft.sprintNumber || nextSprintNumber}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="min-w-[240px] flex-1">
                        <span className="text-xs font-medium text-slate-700">Add project</span>
                        <select
                          value={projectPickerId}
                          onChange={(e) => setProjectPickerId(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Select project</option>
                          {availableProjectOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => addProjectToDraft(projectPickerId)}
                        disabled={!projectPickerId}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Add project
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedProjects.length ? (
                        selectedProjects.map((project) => (
                          <span
                            key={project.id}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                          >
                            {project.name}
                            <button
                              type="button"
                              onClick={() => removeProjectFromDraft(project.id)}
                              className="material-symbols-outlined text-sm leading-none"
                              aria-label={`Remove ${project.name}`}
                            >
                              close
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No projects added yet.</span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                    <p className="mt-2 text-[11px] text-slate-500">Next suggested number: Sprint {nextSprintNumber}</p>
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
                          {getFullName(option)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">Release</span>
                    <select
                      value={isCustomRelease ? CUSTOM_RELEASE_VALUE : draft.release}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (nextValue === CUSTOM_RELEASE_VALUE) {
                          setIsCustomRelease(true);
                          updateDraft("release", "");
                          return;
                        }
                        setIsCustomRelease(false);
                        updateDraft("release", nextValue);
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {SPRINT_CREATE_CONTEXT.releaseOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value={CUSTOM_RELEASE_VALUE}>Custom release...</option>
                    </select>
                    {isCustomRelease ? (
                      <input
                        type="text"
                        value={draft.release}
                        onChange={(e) => updateDraft("release", e.target.value)}
                        placeholder="Enter release name"
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">Capacity</span>
                    <input
                      type="number"
                      min="1"
                      value={draft.capacity}
                      onChange={(e) => updateDraft("capacity", e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
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
                  </div>

                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">Sprint goal</span>
                    <textarea
                      value={draft.goal}
                      onChange={(e) => updateDraft("goal", e.target.value)}
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>

                <SprintCreateSidebar
                  sprintLabel={`Sprint-${draft.sprintNumber || nextSprintNumber}`}
                  goal={draft.goal}
                  release={draft.release}
                  ownerName={getFullName(users.find((user) => user.id === draft.owner))}
                  projectNames={selectedProjects.map((project) => project.name)}
                  capacity={draft.capacity}
                  readinessChecks={readinessChecks}
                  saving={savingSprint}
                  onSubmit={handleCreateSprint}
                />
              </div>
            </SprintSectionCard>

            <SprintSectionCard
              eyebrow="Create"
              title="Backlog Selection"
              badge={`${selectedProjects.length} project${selectedProjects.length === 1 ? "" : "s"}`}
            >
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Scope Summary
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {selectedProjects.length} project{selectedProjects.length === 1 ? "" : "s"} selected
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Tasks</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{selectedScopeSummary.tasks}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Unassigned</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{selectedScopeSummary.unassigned}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">High Priority</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{selectedScopeSummary.highPriority}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">In Progress</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{selectedScopeSummary.inProgress}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Select backlog items
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {selectedTaskIds.length} selected
                    </span>
                  </div>
                  <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
                    {selectedProjects.length ? (
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
                              <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {projectTasks.length} backlog item{projectTasks.length === 1 ? "" : "s"} available
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
                                      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {task.status} • {task.priority} • {task.assignee ? getFullName(task.assignee) : "Unassigned"}
                                      </p>
                                    </div>
                                  </label>
                                ))
                              ) : (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-xs text-slate-500">
                                  No backlog items available for this project.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                        Add projects to pull backlog items into this sprint.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SprintSectionCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}
