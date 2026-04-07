import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CreateTaskModal from "../components/CreateTaskModal";
import ProjectConfidentialAccessPanel from "../components/projects/ProjectConfidentialAccessPanel";
import ProjectHeader from "../components/projects/detail/ProjectHeader";
import ProjectManagementPanel from "../components/projects/detail/ProjectManagementPanel";
import ProjectTabNav from "../components/projects/detail/ProjectTabNav";
import TaskBoard from "../components/projects/detail/TaskBoard";
import TaskTrends from "../components/projects/detail/TaskTrends";
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

type ProjectTab = "tasks" | "roadmap" | "files" | "activity";

type ViewMode = "day" | "week" | "month";

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roadmapTasksRaw, setRoadmapTasksRaw] = useState<Task[]>([]);
  const [files, setFiles] = useState<any[]>([]);
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

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [offset, setOffset] = useState(0);
  const [roadmapQuery, setRoadmapQuery] = useState("");
  const [roadmapStatusFilter, setRoadmapStatusFilter] = useState<
    "all" | "To Do" | "In Progress" | "Done"
  >("all");
  const [roadmapPriorityFilter, setRoadmapPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [roadmapHideCompleted, setRoadmapHideCompleted] = useState(false);

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
      todo: "To Do",
      to_do: "To Do",
      "to-do": "To Do",
      in_progress: "In Progress",
      inprogress: "In Progress",
      progress: "In Progress",
      done: "Done",
      completed: "Done",
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
      status: statusMap[rawStatus] || "To Do",
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
      const matchesDone = !roadmapHideCompleted || task.status !== "Done";
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

    const done = filteredRoadmapTasks.filter((task) => task.status === "Done").length;
    const overdue = filteredRoadmapTasks.filter((task) => {
      if (!task.dueDate || task.status === "Done") return false;
      return new Date(task.dueDate) < now;
    }).length;
    const dueThisWeek = filteredRoadmapTasks.filter((task) => {
      if (!task.dueDate || task.status === "Done") return false;
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
      if (task.status !== "Done" && date < todayStart) {
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
          onTabChange={handleTabChange}
        />

        {isProjectOwner && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowConfidentialPanel((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">lock</span>
              {showConfidentialPanel ? "Hide Confidential Access" : "Confidential Access"}
            </button>
            <button
              type="button"
              onClick={() => setShowManagementPanel((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">edit_square</span>
              {showManagementPanel ? "Hide Update Options" : "Manage Project"}
            </button>
          </div>
        )}

        {!isProjectOwner && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowConfidentialPanel((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">lock</span>
              {showConfidentialPanel ? "Hide Confidential Access" : "Confidential Access"}
            </button>
          </div>
        )}

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
          <div className="space-y-4">
            <TaskTrends tasks={tasks} />
            {tasksLoading && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                Loading tasks...
              </div>
            )}
            {tabError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {tabError}
              </div>
            )}
            <TaskBoard tasks={tasks} onOpenTask={(taskId) => navigate(`/task/${taskId}`)} />
          </div>
        )}

        {activeTab === "roadmap" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Roadmap Window</p>
                <h3 className="mt-1 text-lg font-black text-slate-900">{getRoadmapRangeLabel()}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setViewMode(mode);
                        setOffset(0);
                      }}
                      className={`h-8 rounded-md px-3 text-xs font-semibold uppercase ${
                        viewMode === mode ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  onClick={() => setOffset((prev) => prev - 1)}
                  aria-label="Previous range"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={() => setOffset(0)}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  onClick={() => setOffset((prev) => prev + 1)}
                  aria-label="Next range"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Items</p>
                <p className="mt-1 text-xl font-black text-slate-900">{roadmapStats.total}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Completed</p>
                <p className="mt-1 text-xl font-black text-emerald-600">{roadmapStats.done}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Due This Week</p>
                <p className="mt-1 text-xl font-black text-blue-600">{roadmapStats.dueThisWeek}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Overdue</p>
                <p className="mt-1 text-xl font-black text-rose-600">{roadmapStats.overdue}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <input
                  value={roadmapQuery}
                  onChange={(event) => setRoadmapQuery(event.target.value)}
                  placeholder="Search roadmap tasks"
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                />
                <select
                  value={roadmapStatusFilter}
                  onChange={(event) =>
                    setRoadmapStatusFilter(
                      event.target.value as "all" | "To Do" | "In Progress" | "Done",
                    )
                  }
                  aria-label="Filter roadmap tasks by status"
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">All status</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <select
                  value={roadmapPriorityFilter}
                  onChange={(event) =>
                    setRoadmapPriorityFilter(
                      event.target.value as "all" | "high" | "medium" | "low",
                    )
                  }
                  aria-label="Filter roadmap tasks by priority"
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">All priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={roadmapHideCompleted}
                    onChange={(event) => setRoadmapHideCompleted(event.target.checked)}
                  />
                  Hide completed
                </label>
              </div>
            </div>

            {roadmapLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Loading roadmap...
              </div>
            ) : tabError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {tabError}
              </div>
            ) : filteredRoadmapTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No scheduled tasks in this range.
              </div>
            ) : (
              <div className="space-y-4">
                {roadmapGroups.map((group) => (
                  <div key={group.key} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                        {group.title}
                      </h4>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {group.tasks.length}
                      </span>
                    </div>
                    {group.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => navigate(`/task/${task.id}`)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{task.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {task.status} • {task.priority.toUpperCase()}
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {new Date(task.dueDate || task.startDate || task.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "files" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-black text-slate-900">Project Files</h3>
              <label className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer w-full sm:w-auto">
                <span className="material-symbols-outlined text-lg">upload</span>
                {uploading ? "Uploading..." : "Upload File"}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            {filesLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Loading files...
              </div>
            ) : tabError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {tabError}
              </div>
            ) : files.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No files uploaded yet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {files.map((file) => (
                  <div key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600">description</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{file.original_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "activity" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Project Activity</h3>

            {activityLoading ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                <p className="mt-2 text-sm text-slate-500">Loading activity...</p>
              </div>
            ) : tabError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {tabError}
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No activity found.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {activityLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-900">{log.user.full_name}</span>
                      <span className="text-slate-600">{log.action.replace(/_/g, " ")}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
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
