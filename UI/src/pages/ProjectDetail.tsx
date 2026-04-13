import React, { useEffect, useMemo, useState } from "react";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import { useNavigate, useParams } from "react-router-dom";
import CreateTaskModal from "../components/CreateTaskModal";
import ProjectConfidentialAccessPanel from "../components/projects/ProjectConfidentialAccessPanel";
import ProjectActivityTab from "../components/projects/detail/ProjectActivityTab";
import ProjectFilesTab from "../components/projects/detail/ProjectFilesTab";
import ProjectHeader from "../components/projects/detail/ProjectHeader";
import ProjectManagementPanel from "../components/projects/detail/ProjectManagementPanel";
import ProjectRoadmapTab, {
  type RoadmapViewMode,
} from "../components/projects/detail/ProjectRoadmapTab";
import ProjectTabNav from "../components/projects/detail/ProjectTabNav";
import ProjectTasksTab from "../components/projects/detail/ProjectTasksTab";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../config/api";
import { projectsAPI, ActivityLog } from "../services/dashboard";
import { projectService } from "../services/projectService";
import { taskService } from "../services/taskService";
import { sprintsAPI } from "../services/sprints";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { Project, ProjectConfidentialAccessConfig } from "../types/project";
import { isWorkspaceAdmin } from "../types/roles";
import { Task } from "../types/task";
import { ProjectStatus, ProjectPriority } from "../enums";
import type { Sprint } from "../types/sprint";
import { TASK_STATUSES, isDoneTaskStatus } from "../utils/taskStatus";
import { TaskStatus } from "../enums";

type ProjectTab = "tasks" | "roadmap" | "files" | "activity";

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roadmapTasksRaw, setRoadmapTasksRaw] = useState<Task[]>([]);
  const [files, setFiles] = useState<
    Array<{
      id: string;
      original_name: string;
      file_size: number;
      created_at: string;
      file_url: string;
    }>
  >([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProjectTab>("tasks");
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [tabError, setTabError] = useState<string>("");

  const [requestReason, setRequestReason] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [reviewingRequestId, setReviewingRequestId] = useState("");
  const [confidentialConfig, setConfidentialConfig] =
    useState<ProjectConfidentialAccessConfig | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [configError, setConfigError] = useState("");
  const [configSearch, setConfigSearch] = useState("");
  const [configSearchLoading, setConfigSearchLoading] = useState(false);
  const [configUserOptions, setConfigUserOptions] = useState<
    Array<{
      id: string;
      full_name: string;
      email: string;
      role: string;
    }>
  >([]);

  const [uploading, setUploading] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState<
    Array<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      avatar_url?: string;
    }>
  >([]);
  const [managementMessage, setManagementMessage] = useState<string>("");
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const [showConfidentialPanel, setShowConfidentialPanel] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const debouncedManagementSearch = useDebouncedValue(memberSearchQuery, 300);
  const debouncedConfigSearch = useDebouncedValue(configSearch, 300);

  const [viewMode, setViewMode] = useState<RoadmapViewMode>("week");
  const [offset, setOffset] = useState(0);
  const [roadmapQuery, setRoadmapQuery] = useState("");
  const [roadmapStatusFilter, setRoadmapStatusFilter] = useState<
    "all" | (typeof TASK_STATUSES)[number]
  >("all");
  const [roadmapPriorityFilter, setRoadmapPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [roadmapHideCompleted, setRoadmapHideCompleted] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    fetchProjectData();
  }, [id]);

  useEffect(() => {
    if (project && !project.confidential_access?.can_view && activeTab !== "tasks") {
      setActiveTab("tasks");
    }
  }, [project, activeTab]);

  useEffect(() => {
    const keyword = debouncedManagementSearch.trim();
    if (!keyword) {
      setSearchedUsers([]);
      setSearchingUsers(false);
      return;
    }

    const controller = new AbortController();

    const searchUsers = async () => {
      try {
        setSearchingUsers(true);
        const response = await projectService.getProjectUsers(
          keyword,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setSearchedUsers(response.success ? response.data || [] : []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSearchedUsers([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingUsers(false);
        }
      }
    };

    searchUsers();

    return () => {
      controller.abort();
    };
  }, [debouncedManagementSearch]);

  useEffect(() => {
    const keyword = debouncedConfigSearch.trim();
    if (!keyword) {
      setConfigUserOptions([]);
      setConfigSearchLoading(false);
      return;
    }

    const controller = new AbortController();

    const searchConfigUsers = async () => {
      try {
        setConfigSearchLoading(true);
        const response = await projectService.getProjectUsers(
          keyword,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setConfigUserOptions(response.success ? response.data || [] : []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setConfigUserOptions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setConfigSearchLoading(false);
        }
      }
    };

    searchConfigUsers();

    return () => {
      controller.abort();
    };
  }, [debouncedConfigSearch]);

  useEffect(() => {
    if (!id || !project) return;

    if (activeTab === "tasks") {
      fetchTaskData(id);
      return;
    }

    if (activeTab === "roadmap" && project.confidential_access?.can_view) {
      fetchRoadmapData(id);
      return;
    }

    if (activeTab === "files" && project.confidential_access?.can_view) {
      fetchFilesData(id);
      return;
    }

    if (activeTab === "activity" && project.confidential_access?.can_view) {
      fetchActivityLogs();
    }
  }, [activeTab, id, project?.id, project?.confidential_access?.can_view]);

  const normalizeTask = (task: any): Task => {
    const rawStatus = String(task.status || "").trim().toLowerCase().replace(/\s+/g, "_");
    const statusMap: Record<string, Task["status"]> = {
      todo: TaskStatus.TODO,
      to_do: TaskStatus.TODO,
      "to-do": TaskStatus.TODO,
      in_progress: TaskStatus.IN_PROGRESS,
      inprogress: TaskStatus.IN_PROGRESS,
      progress: TaskStatus.IN_PROGRESS,
      ready_for_qa: TaskStatus.READY_FOR_QA,
      readyforqa: TaskStatus.READY_FOR_QA,
      in_qa: TaskStatus.IN_QA,
      inqa: TaskStatus.IN_QA,
      blocked: TaskStatus.BLOCKED,
      done: TaskStatus.DONE,
      completed: TaskStatus.DONE,
    };

    const rawPriority = String(task.priority || "medium").trim().toLowerCase();
    const priorityMap: Record<string, Task["priority"]> = {
      high: "high",
      medium: "medium",
      low: "low",
    };

    return {
      id: String(task.id),
      title: String(task.title || ""),
      description: task.description,
      status: statusMap[rawStatus] || TaskStatus.TODO,
      priority: priorityMap[rawPriority] || "medium",
      issueType: task.issueType || task.issue_type || "Task",
      startDate: task.startDate || task.start_date,
      dueDate: task.dueDate || task.due_date,
      sprintId: task.sprintId || task.sprint_id,
      sprint: task.sprint || undefined,
      projectId: task.projectId || task.project_id,
      assigneeId: task.assigneeId || task.assignee_id,
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
      createdAt: task.createdAt || task.created_at || new Date().toISOString(),
      updatedAt: task.updatedAt || task.updated_at || new Date().toISOString(),
    };
  };

  const fetchTaskData = async (projectId: string) => {
    try {
      setTasksLoading(true);
      setTabError("");
      const tasksResponse = await taskService.getTasks({ projectId, limit: 100 });
      const realTasks = tasksResponse.success ? tasksResponse.data || [] : [];
      setTasks(realTasks.map(normalizeTask));
    } catch {
      setTasks([]);
      setTabError("Failed to load project tasks.");
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchRoadmapData = async (projectId: string) => {
    try {
      setRoadmapLoading(true);
      setTabError("");
      const response = await projectService.getProjectRoadmap(projectId);
      const realRoadmapTasks = response.success ? response.data || [] : [];
      setRoadmapTasksRaw(realRoadmapTasks.map(normalizeTask));
    } catch {
      setRoadmapTasksRaw([]);
      setTabError("Failed to load roadmap data.");
    } finally {
      setRoadmapLoading(false);
    }
  };

  const fetchFilesData = async (projectId: string) => {
    try {
      setFilesLoading(true);
      setTabError("");
      const filesResponse = await projectService.getProjectFiles(projectId);
      setFiles(filesResponse.success ? filesResponse.data || [] : []);
    } catch {
      setFiles([]);
      setTabError("Failed to load project files.");
    } finally {
      setFilesLoading(false);
    }
  };

  const fetchConfidentialAccessConfig = async (projectId: string) => {
    try {
      setConfigError("");
      const response = await projectService.getConfidentialAccessConfig(projectId);
      if (response.success) {
        setConfidentialConfig(response.data);
      }
    } catch (error: any) {
      setConfidentialConfig({
        access_scope: "specific_users",
        allowed_user_ids: [],
        allowed_users: [],
      });
      setConfigError(
        error?.response?.data?.message || "Failed to load confidential access config.",
      );
    }
  };

  const fetchProjectData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const projectResponse = await projectService.getProject(id);
      if (!projectResponse.success || !projectResponse.data) {
        setProject(null);
        setTasks([]);
        setFiles([]);
        return;
      }

      const loadedProject = projectResponse.data;
      setProject(loadedProject);
      const sprintResponse = await sprintsAPI.getSprints({ project_id: id });
      if (sprintResponse.success) {
        setSprints(sprintResponse.data);
      }
      setConfidentialConfig(loadedProject.confidential_access?.config || null);

      await fetchTaskData(id);

      if (!loadedProject.confidential_access?.can_view) {
        setRoadmapTasksRaw([]);
        setFiles([]);
        setActivityLogs([]);
      }

      if (user) {
        const canReview = isWorkspaceAdmin(user.role) || (loadedProject as any).owner_id === user.id;
        if (canReview) {
          await fetchConfidentialAccessRequests();
        }
        if (isWorkspaceAdmin(user.role)) {
          await fetchConfidentialAccessConfig(id);
        }
      }
    } catch {
      setProject(null);
      setTasks([]);
      setRoadmapTasksRaw([]);
      setFiles([]);
      setActivityLogs([]);
      setConfidentialConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfidentialAccessRequests = async () => {
    if (!id) return;
    try {
      const response = await projectService.getConfidentialAccessRequests(id);
      setAccessRequests(response.success ? response.data || [] : []);
    } catch {
      setAccessRequests([]);
    }
  };

  const fetchActivityLogs = async () => {
    if (!id) return;
    try {
      setActivityLoading(true);
      setTabError("");
      const response = await projectsAPI.getActivityLogs(id);
      setActivityLogs(response.success ? response.data : []);
    } catch {
      setActivityLogs([]);
      setTabError("Failed to load activity logs.");
    } finally {
      setActivityLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: ProjectStatus) => {
    if (!project) return;
    try {
      await projectService.updateProject(project.id, {
        status: newStatus,
      });
      setProject((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
            }
          : prev,
      );

      if (activeTab === "activity") {
        fetchActivityLogs();
      }
    } catch {
      // no-op: status stays unchanged in UI
    }
  };

  const requestConfidentialAccess = async () => {
    if (!id) return;
    try {
      setRequestSubmitting(true);
      await projectService.requestConfidentialAccess(id, requestReason.trim() || undefined);
      await fetchProjectData();
    } finally {
      setRequestSubmitting(false);
    }
  };

  const reviewConfidentialRequest = async (
    requestId: string,
    action: "approve" | "reject",
  ) => {
    if (!id) return;
    try {
      setReviewingRequestId(requestId);
      await projectService.reviewConfidentialAccessRequest(id, requestId, action);
      await Promise.all([fetchConfidentialAccessRequests(), fetchProjectData()]);
    } finally {
      setReviewingRequestId("");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/projects/${project.id}/files/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setFiles((prev) => [result.data, ...prev]);
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleTabChange = (tab: ProjectTab) => {
    setTabError("");
    setActiveTab(tab);
  };

  const handleSearchUsers = (query: string) => {
    setMemberSearchQuery(query);
    if (!query.trim()) {
      setSearchedUsers([]);
      setSearchingUsers(false);
    }
  };

  const handleConfigSearch = (query: string) => {
    setConfigSearch(query);
    if (!query.trim()) {
      setConfigUserOptions([]);
      setConfigSearchLoading(false);
    }
  };

  const handleConfigScopeChange = (access_scope: "specific_users" | "organization") => {
    setConfigError("");
    setConfidentialConfig((prev) => ({
      access_scope,
      allowed_user_ids:
        access_scope === "organization" ? [] : prev?.allowed_user_ids || [],
      allowed_users:
        access_scope === "organization" ? [] : prev?.allowed_users || [],
      updated_at: prev?.updated_at || null,
    }));
  };

  const handleToggleAllowedUser = (selectedUser: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  }) => {
    setConfigError("");
    setConfidentialConfig((prev) => {
      const base = prev || {
        access_scope: "specific_users" as const,
        allowed_user_ids: [],
        allowed_users: [],
        updated_at: null,
      };
      const exists = base.allowed_user_ids.includes(selectedUser.id);
      return {
        ...base,
        access_scope: "specific_users",
        allowed_user_ids: exists
          ? base.allowed_user_ids.filter((userId) => userId !== selectedUser.id)
          : [...base.allowed_user_ids, selectedUser.id],
        allowed_users: exists
          ? base.allowed_users.filter((user) => user.id !== selectedUser.id)
          : [...base.allowed_users, selectedUser],
      };
    });
  };

  const handleRemoveAllowedUser = (userId: string) => {
    setConfigError("");
    setConfidentialConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        allowed_user_ids: prev.allowed_user_ids.filter((value) => value !== userId),
        allowed_users: prev.allowed_users.filter((user) => user.id !== userId),
      };
    });
  };

  const handleSaveConfidentialConfig = async () => {
    if (!project || !confidentialConfig) return;

    try {
      setConfigSaving(true);
      setConfigError("");
      const response = await projectService.updateConfidentialAccessConfig(project.id, {
        access_scope: confidentialConfig.access_scope,
        allowed_user_ids:
          confidentialConfig.access_scope === "organization"
            ? []
            : confidentialConfig.allowed_user_ids,
      });
      if (response.success) {
        setConfidentialConfig(response.data);
        await fetchProjectData();
      }
    } catch (error: any) {
      setConfigError(
        error?.response?.data?.message || "Failed to save confidential access config.",
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const handleAddMember = async (
    userId: string,
    role: "admin" | "member" | "viewer",
  ) => {
    if (!project) return;
    await projectService.addMember(project.id, userId, role);
    setManagementMessage("Member added successfully");
    await fetchProjectData();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project) return;
    await projectService.removeMember(project.id, userId);
    setManagementMessage("Member removed successfully");
    await fetchProjectData();
  };

  const handleUpdateMemberRole = async (
    userId: string,
    role: "owner" | "admin" | "member" | "viewer",
  ) => {
    if (!project) return;
    await projectService.updateMemberRole(project.id, userId, role);
    setManagementMessage("Member role updated");
    await fetchProjectData();
  };

  const handleProjectUpdate = async (payload: {
    name: string;
    description: string;
    priority: ProjectPriority;
    startDate?: string;
    endDate?: string;
  }) => {
    if (!project) return;
    await projectService.updateProject(project.id, payload);
    setManagementMessage("Project updated successfully");
    await fetchProjectData();
  };

  const getRoadmapRangeLabel = () => {
    const base = new Date();

    if (viewMode === "day") {
      const date = new Date(base);
      date.setDate(base.getDate() + offset);
      return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    }

    if (viewMode === "week") {
      const start = new Date(base);
      start.setDate(base.getDate() - base.getDay() + offset * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }

    const month = new Date(base);
    month.setMonth(base.getMonth() + offset);
    return month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const roadmapTasks = useMemo(() => {
    const base = new Date();
    const dayStart = new Date(base);
    dayStart.setHours(0, 0, 0, 0);

    return roadmapTasksRaw
      .filter((task) => {
        const targetDate = task.dueDate || task.startDate;
        if (!targetDate) return false;

        const taskDate = new Date(targetDate);

        if (viewMode === "day") {
          const selectedDay = new Date(dayStart);
          selectedDay.setDate(dayStart.getDate() + offset);
          return taskDate.toDateString() === selectedDay.toDateString();
        }

        if (viewMode === "week") {
          const weekStart = new Date(dayStart);
          weekStart.setDate(dayStart.getDate() - dayStart.getDay() + offset * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          return taskDate >= weekStart && taskDate <= weekEnd;
        }

        const selectedMonth = new Date(dayStart);
        selectedMonth.setMonth(dayStart.getMonth() + offset);
        return (
          taskDate.getMonth() === selectedMonth.getMonth() &&
          taskDate.getFullYear() === selectedMonth.getFullYear()
        );
      })
      .sort((a, b) => {
        const first = new Date(a.dueDate || a.startDate || a.createdAt).getTime();
        const second = new Date(b.dueDate || b.startDate || b.createdAt).getTime();
        return first - second;
      });
  }, [roadmapTasksRaw, viewMode, offset]);

  const filteredRoadmapTasks = useMemo(() => {
    return roadmapTasks.filter((task) => {
      const matchesQuery =
        !roadmapQuery ||
        task.title.toLowerCase().includes(roadmapQuery.toLowerCase()) ||
        (task.description || "")
          .toLowerCase()
          .includes(roadmapQuery.toLowerCase());
      const matchesStatus =
        roadmapStatusFilter === "all" || task.status === roadmapStatusFilter;
      const matchesPriority =
        roadmapPriorityFilter === "all" || task.priority === roadmapPriorityFilter;
      const matchesDone = !roadmapHideCompleted || !isDoneTaskStatus(task.status);
      return matchesQuery && matchesStatus && matchesPriority && matchesDone;
    });
  }, [
    roadmapTasks,
    roadmapQuery,
    roadmapStatusFilter,
    roadmapPriorityFilter,
    roadmapHideCompleted,
  ]);

  const roadmapStats = useMemo(() => {
    const now = new Date();
    const thisWeekEnd = new Date(now);
    thisWeekEnd.setDate(now.getDate() + 7);
    thisWeekEnd.setHours(23, 59, 59, 999);

    const done = filteredRoadmapTasks.filter((task) => isDoneTaskStatus(task.status)).length;
    const overdue = filteredRoadmapTasks.filter((task) => {
      if (!task.dueDate || isDoneTaskStatus(task.status)) return false;
      return new Date(task.dueDate) < now;
    }).length;
    const dueThisWeek = filteredRoadmapTasks.filter((task) => {
      if (!task.dueDate || isDoneTaskStatus(task.status)) return false;
      const due = new Date(task.dueDate);
      return due >= now && due <= thisWeekEnd;
    }).length;

    return {
      total: filteredRoadmapTasks.length,
      done,
      overdue,
      dueThisWeek,
    };
  }, [filteredRoadmapTasks]);

  const roadmapGroups = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(todayStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const groups: Array<{ key: string; title: string; tasks: Task[] }> = [
      { key: "overdue", title: "Overdue", tasks: [] },
      { key: "today", title: "Today", tasks: [] },
      { key: "week", title: "This Week", tasks: [] },
      { key: "later", title: "Later", tasks: [] },
      { key: "nodate", title: "No Date", tasks: [] },
    ];

    filteredRoadmapTasks.forEach((task) => {
      if (!task.dueDate && !task.startDate) {
        groups[4].tasks.push(task);
        return;
      }

      const date = new Date(task.dueDate || task.startDate || task.createdAt);
      if (!isDoneTaskStatus(task.status) && date < todayStart) {
        groups[0].tasks.push(task);
      } else if (date >= todayStart && date <= todayEnd) {
        groups[1].tasks.push(task);
      } else if (date > todayEnd && date <= weekEnd) {
        groups[2].tasks.push(task);
      } else {
        groups[3].tasks.push(task);
      }
    });

    return groups.filter((group) => group.tasks.length > 0);
  }, [filteredRoadmapTasks]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <p className="mt-2 text-sm font-medium text-slate-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
          <h2 className="mt-3 text-xl font-black text-slate-900">Project Not Found</h2>
          <p className="mt-2 text-sm text-slate-500">
            The project does not exist or your account does not have access.
          </p>
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="mt-5 h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const canViewConfidential = Boolean(project.confidential_access?.can_view);
  const requestStatus = project.confidential_access?.request_status || "none";
  const isProjectOwner =
    Boolean(user) &&
    (((project as any).owner_id && (project as any).owner_id === user?.id) ||
      ((project as any).ownerId && (project as any).ownerId === user?.id));
  const isOwnerOrAdmin =
    Boolean(user) && (isWorkspaceAdmin(user?.role) || isProjectOwner);

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-50/80">
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 pb-24 sm:px-6 sm:pb-24 lg:px-8 lg:py-6 lg:pb-10">
        <ProjectHeader
          project={project}
          isOwnerOrAdmin={isOwnerOrAdmin}
          onStatusChange={handleStatusUpdate}
          onCreateTask={() => setShowCreateTaskModal(true)}
          sprintLabel={sprints[0]?.name}
        />

        <ProjectTabNav
          activeTab={activeTab}
          canViewConfidential={canViewConfidential}
          taskCount={tasks.length}
          fileCount={files.length}
          isProjectOwner={isProjectOwner}
          showConfidentialPanel={showConfidentialPanel}
          showManagementPanel={showManagementPanel}
          onTabChange={handleTabChange}
          onToggleConfidentialPanel={() => setShowConfidentialPanel((value) => !value)}
          onToggleManagementPanel={() => setShowManagementPanel((value) => !value)}
          onOpenManagementPanel={() => setShowManagementPanel(true)}
        />

        {showConfidentialPanel && (
          <ProjectConfidentialAccessPanel
            canViewConfidential={canViewConfidential}
            hasAdminAccess={Boolean(user && isWorkspaceAdmin(user.role))}
            requestStatus={requestStatus}
            requestReason={requestReason}
            submitting={requestSubmitting}
            onRequestReasonChange={setRequestReason}
            onSubmitRequest={requestConfidentialAccess}
            showReviewList={isOwnerOrAdmin}
            reviewItems={accessRequests}
            reviewing={reviewingRequestId}
            onReview={reviewConfidentialRequest}
            canManageConfig={false}
            config={
              confidentialConfig || {
                access_scope: "specific_users",
                allowed_user_ids: [],
                allowed_users: [],
              }
            }
            configSaving={configSaving}
            configError={configError}
            configSearch={configSearch}
            configSearchLoading={configSearchLoading}
            configUserOptions={configUserOptions}
            onConfigSearchChange={handleConfigSearch}
            onConfigScopeChange={handleConfigScopeChange}
            onToggleAllowedUser={handleToggleAllowedUser}
            onRemoveAllowedUser={handleRemoveAllowedUser}
            onSaveConfig={handleSaveConfidentialConfig}
          />
        )}

        {managementMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            {managementMessage}
          </div>
        )}

        {showManagementPanel && isProjectOwner && (
          <ProjectManagementPanel
            project={project}
            isOwnerOrAdmin={isProjectOwner}
            loadingUsers={searchingUsers}
            searchedUsers={searchedUsers}
            onSearchUsers={handleSearchUsers}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onUpdateMemberRole={handleUpdateMemberRole}
            onUpdateProject={handleProjectUpdate}
          />
        )}

        {activeTab === "tasks" && (
          <ProjectTasksTab
            tasks={tasks}
            tasksLoading={tasksLoading}
            tabError={tabError}
            onOpenTask={(taskId) => navigate(`/task/${taskId}`)}
            selectedRowIds={selectedRowIds}
            onSelectedRowIdsChange={setSelectedRowIds}
          />
        )}

        {activeTab === "roadmap" && (
          <ProjectRoadmapTab
            viewMode={viewMode}
            offset={offset}
            rangeLabel={getRoadmapRangeLabel()}
            roadmapStats={roadmapStats}
            roadmapQuery={roadmapQuery}
            roadmapStatusFilter={roadmapStatusFilter}
            roadmapPriorityFilter={roadmapPriorityFilter}
            roadmapHideCompleted={roadmapHideCompleted}
            roadmapLoading={roadmapLoading}
            tabError={tabError}
            filteredRoadmapTasks={filteredRoadmapTasks}
            roadmapGroups={roadmapGroups}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              setOffset(0);
            }}
            onOffsetChange={setOffset}
            onResetOffset={() => setOffset(0)}
            onRoadmapQueryChange={setRoadmapQuery}
            onRoadmapStatusFilterChange={setRoadmapStatusFilter}
            onRoadmapPriorityFilterChange={setRoadmapPriorityFilter}
            onRoadmapHideCompletedChange={setRoadmapHideCompleted}
            onOpenTask={(taskId) => navigate(`/task/${taskId}`)}
          />
        )}

        {activeTab === "files" && (
          <ProjectFilesTab
            files={files}
            filesLoading={filesLoading}
            tabError={tabError}
            uploading={uploading}
            onFileUpload={handleFileUpload}
          />
        )}

        {activeTab === "activity" && (
          <ProjectActivityTab
            activityLoading={activityLoading}
            tabError={tabError}
            activityLogs={activityLogs}
          />
        )}
      </div>

      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onTaskCreated={fetchProjectData}
      />
    </div>
  );
};

export default ProjectDetail;
