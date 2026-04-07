import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  tasksAPI,
  PullRequest,
  Commit,
  ActivityLog,
} from "../services/dashboard";
import { aiAssistantAPI, AiTaskSuggestion } from "../services/aiAssistant";
import { appendTaskAiDraft, buildTaskTemplate } from "../utils/descriptionTemplates";

interface TaskDetails {
  id: string;
  title: string;
  description?: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  issue_type?: "Story" | "Task" | "Bug";
  due_date?: string;
  subtasks?: Array<{
    id: string;
    title: string;
    is_completed: boolean;
    position?: number;
  }>;
  project: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    full_name: string;
    email: string;
  };
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
  sprint?: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

type TaskTab = "overview" | "prs" | "activity" | "attachments";

const isTaskTab = (value: string | null): value is TaskTab =>
  value === "overview" ||
  value === "prs" ||
  value === "activity" ||
  value === "attachments";

const ACTIVITY_METADATA_KEYS = new Set(["timestamp", "action_time"]);

const ACTIVITY_FIELD_LABELS: Record<string, string> = {
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  due_date: "due date",
  assignee: "assignee",
  assignee_id: "assignee",
};

function asValidDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getActivityTimestamp(log: ActivityLog): string {
  const fallbackCandidates = [
    log.created_at,
    typeof log.changes?.timestamp === "string" ? log.changes.timestamp : null,
    log.changes?.action_time instanceof Date
      ? log.changes.action_time.toISOString()
      : typeof log.changes?.action_time === "string"
        ? log.changes.action_time
        : null,
  ];

  const validDate = fallbackCandidates
    .map((value) => asValidDate(value))
    .find((value): value is Date => value !== null);

  return validDate ? validDate.toLocaleString() : "Time unavailable";
}

function getVisibleChangeKeys(log: ActivityLog): string[] {
  return Object.keys(log.changes || {}).filter(
    (key) => !ACTIVITY_METADATA_KEYS.has(key),
  );
}

function formatChangeLabel(key: string): string {
  return ACTIVITY_FIELD_LABELS[key] || key.replace(/_/g, " ");
}

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState<TaskTab>("overview");
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [prLoading, setPrLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [prioritySaving, setPrioritySaving] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editAiLoading, setEditAiLoading] = useState(false);
  const [editAiError, setEditAiError] = useState("");
  const [showLinkPRModal, setShowLinkPRModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiTaskSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtaskSaving, setSubtaskSaving] = useState(false);
  const [subtaskError, setSubtaskError] = useState("");

  const [prForm, setPrForm] = useState({
    title: "",
    repository: "",
    branch: "",
    number: "",
    author: "",
    github_url: "",
    status: "open" as "open" | "merged" | "closed",
  });

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (isTaskTab(urlTab)) {
      setActiveTab(urlTab);
    }
  }, []);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", activeTab);
      return next;
    }, { replace: true });
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

  useEffect(() => {
    if (task) {
      fetchAiSuggestion(task.title, task.description || "");
      setEditTitle(task.title || "");
      setEditDescription(task.description || "");
      setEditError("");
      setEditAiError("");
      setEditMode(false);
    }
  }, [task?.id]);

  useEffect(() => {
    if (id && activeTab === "prs") {
      fetchPRData();
    } else if (id && activeTab === "activity") {
      fetchActivityLogs();
    }
  }, [id, activeTab]);

  const fetchTask = async () => {
    try {
      setTaskError("");
      const response = await tasksAPI.getTask(id!);
      if (response.success) {
        setTask(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch task:", error);
      setTaskError("Failed to load this task. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSuggestion = async (title: string, description: string) => {
    try {
      setAiLoading(true);
      setAiError("");
      const suggestion = await aiAssistantAPI.suggestTask(title, description);
      setAiSuggestion(suggestion);
    } catch (error) {
      setAiError("AI assistant unavailable right now.");
      setAiSuggestion(null);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchPRData = async () => {
    if (!id) return;
    try {
      setPrLoading(true);
      const [prResponse, commitResponse] = await Promise.all([
        tasksAPI.getPullRequests(id),
        tasksAPI.getCommits(id),
      ]);

      if (prResponse.success) {
        setPullRequests(prResponse.data);
      }
      if (commitResponse.success) {
        setCommits(commitResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch PR data:", error);
    } finally {
      setPrLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    if (!id) return;
    try {
      setActivityLoading(true);
      const response = await tasksAPI.getActivityLogs(id);
      if (response.success) {
        setActivityLogs(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleStatusUpdate = async (
    newStatus: "To Do" | "In Progress" | "Done",
  ) => {
    if (!task) return;
    try {
      setStatusSaving(true);
      const response = await tasksAPI.updateTask(task.id, {
        status: newStatus,
      });
      if (response.success) {
        setTask({ ...task, status: newStatus });
        // Refresh activity logs if on activity tab
        if (activeTab === "activity") {
          fetchActivityLogs();
        }
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    } finally {
      setStatusSaving(false);
    }
  };

  const handlePriorityUpdate = async (newPriority: "Low" | "Medium" | "High") => {
    if (!task) return;
    try {
      setPrioritySaving(true);
      const response = await tasksAPI.updateTask(task.id, {
        priority: newPriority,
      });
      if (response.success) {
        setTask({ ...task, priority: newPriority });
        if (activeTab === "activity") {
          fetchActivityLogs();
        }
      }
    } catch (error) {
      console.error("Failed to update task priority:", error);
    } finally {
      setPrioritySaving(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    try {
      // For now, just clear the comment - you can add comment API later
      setComment("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  const handleCreateSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;

    try {
      setSubtaskSaving(true);
      setSubtaskError("");
      const response = await tasksAPI.createSubtask(task.id, {
        title: newSubtaskTitle.trim(),
      });

      if (response.success) {
        setTask({
          ...task,
          subtasks: [...(task.subtasks || []), response.data],
        });
        setNewSubtaskTitle("");
      }
    } catch (error: any) {
      setSubtaskError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to create subtask.",
      );
    } finally {
      setSubtaskSaving(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    if (!task) return;

    try {
      setSubtaskSaving(true);
      setSubtaskError("");
      const response = await tasksAPI.updateSubtask(task.id, subtaskId, {
        is_completed: isCompleted,
      });

      if (response.success) {
        setTask({
          ...task,
          subtasks: (task.subtasks || []).map((subtask) =>
            subtask.id === subtaskId ? response.data : subtask,
          ),
        });
      }
    } catch (error: any) {
      setSubtaskError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to update subtask.",
      );
    } finally {
      setSubtaskSaving(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return;

    try {
      setSubtaskSaving(true);
      setSubtaskError("");
      const response = await tasksAPI.deleteSubtask(task.id, subtaskId);

      if (response.success) {
        setTask({
          ...task,
          subtasks: (task.subtasks || []).filter((subtask) => subtask.id !== subtaskId),
        });
      }
    } catch (error: any) {
      setSubtaskError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to delete subtask.",
      );
    } finally {
      setSubtaskSaving(false);
    }
  };

  const handleSaveTaskEdits = async () => {
    if (!task) return;
    const trimmedTitle = editTitle.trim();
    const trimmedDescription = editDescription.trim();

    if (trimmedTitle.length < 2) {
      setEditError("Title must be at least 2 characters.");
      return;
    }
    if (trimmedDescription.length > 1000) {
      setEditError("Description must not exceed 1000 characters.");
      return;
    }

    try {
      setEditSaving(true);
      setEditError("");
      const response = await tasksAPI.updateTask(task.id, {
        title: trimmedTitle,
        description: trimmedDescription,
      });
      if (response.success) {
        setTask(response.data as any);
        setEditMode(false);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to save task changes.";
      setEditError(String(message));
    } finally {
      setEditSaving(false);
    }
  };

  const handleGenerateEditIdeas = async () => {
    const titleSeed = editTitle.trim() || task?.title?.trim() || "";
    if (!titleSeed) {
      setEditAiError("Add a task title first to generate AI ideas.");
      return;
    }

    try {
      setEditAiLoading(true);
      setEditAiError("");
      const suggestion = await aiAssistantAPI.suggestTask(
        titleSeed,
        editDescription.trim(),
      );
      setEditDescription((prev) => appendTaskAiDraft(prev, titleSeed, suggestion).slice(0, 1000));
    } catch (error) {
      setEditAiError("AI ideas unavailable right now.");
    } finally {
      setEditAiLoading(false);
    }
  };

  const handleStartEditing = () => {
    setActiveTab("overview");
    setEditMode(true);
    setEditError("");
    setDeleteError("");
    setEditTitle(task?.title || "");
    setEditDescription(task?.description || "");
  };

  const handleDeleteTask = async () => {
    if (!task || deleteSaving) return;

    const confirmed = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setDeleteSaving(true);
      setDeleteError("");
      const response = await tasksAPI.deleteTask(task.id);
      if (response.success) {
        navigate(`/projects/${task.project.id}`);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to delete task.";
      setDeleteError(String(message));
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleLinkPR = async () => {
    if (!id || !prForm.title || !prForm.repository || !prForm.number) return;

    try {
      // This would be an API call to link the PR
      setShowLinkPRModal(false);
      setPrForm({
        title: "",
        repository: "",
        branch: "",
        number: "",
        author: "",
        github_url: "",
        status: "open",
      });
      // Refresh PR data
      fetchPRData();
    } catch (error) {
      console.error("Failed to link PR:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return { bg: "bg-red-500", text: "text-red-600" };
      case "Medium":
        return { bg: "bg-amber-500", text: "text-amber-600" };
      case "Low":
        return { bg: "bg-emerald-500", text: "text-emerald-600" };
      default:
        return { bg: "bg-slate-500", text: "text-slate-600" };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-600";
      case "In Progress":
        return "bg-blue-100 text-blue-600";
      case "To Do":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p>{taskError || "Task not found"}</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  const priorityColors = getPriorityColor(task.priority);
  const issueTypeLabel = task.issue_type || "Task";
  const completedSubtasks = (task.subtasks || []).filter(
    (subtask) => subtask.is_completed,
  ).length;
  const taskTabs: Array<{ id: TaskTab; label: string; icon: string; count?: number }> = [
    { id: "overview", label: "Overview", icon: "description" },
    { id: "prs", label: "PRs & Code", icon: "code", count: pullRequests.length || undefined },
    { id: "activity", label: "Activity", icon: "history", count: activityLogs.length || undefined },
    { id: "attachments", label: "Attachments", icon: "attach_file" },
  ];
  const createdAtDate = new Date(task.created_at);
  const updatedAtDate = new Date(task.updated_at);
  const dueDateObj = task.due_date ? new Date(task.due_date) : null;
  const hasValidDueDate = !!dueDateObj && !Number.isNaN(dueDateObj.getTime());
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const daysSinceCreated = Number.isNaN(createdAtDate.getTime())
    ? 0
    : Math.max(0, Math.floor((now.getTime() - createdAtDate.getTime()) / dayMs));
  const daysToDue = hasValidDueDate
    ? Math.ceil((dueDateObj!.getTime() - now.getTime()) / dayMs)
    : null;
  const slaLabel =
    task.status === "Done"
      ? "Delivered"
      : daysToDue === null
        ? "No Deadline"
        : daysToDue < 0
          ? `Overdue ${Math.abs(daysToDue)}d`
          : daysToDue === 0
            ? "Due Today"
            : `${daysToDue}d Remaining`;
  const activityPulse = activityLogs.length > 0 ? "Active" : "Quiet";
  const navigateToCreateTestCase = () => {
    navigate(`/test-cases/create?sourceTaskId=${task.id}`);
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-white via-slate-50 to-blue-50/40">
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/projects")}
                  className="text-slate-500 font-medium hover:text-blue-600"
                >
                  Projects
                </button>
                <span className="text-slate-500 font-medium">/</span>
                <button
                  type="button"
                  onClick={() => navigate(`/projects/${task.project.id}`)}
                  className="text-slate-500 font-medium hover:text-blue-600"
                >
                  {task.project.name}
                </button>
                <span className="text-slate-500 font-medium">/</span>
                <span className="text-slate-900 font-medium">
                  TASK-{task.id.slice(-3)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
              <button
                type="button"
                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-500 transition-colors ml-2"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                    return;
                  }
                  navigate("/dashboard");
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-5 sm:p-6 space-y-6 lg:border-r lg:border-slate-200">
              {taskError && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {taskError}
                </div>
              )}
              {deleteError && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {deleteError}
                </div>
              )}

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight text-slate-900">
                    {task.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusUpdate(
                          e.target.value as "To Do" | "In Progress" | "Done",
                        )
                      }
                      disabled={statusSaving}
                      aria-label="Task status"
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                    <button
                      className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-11 px-6 bg-blue-600 text-white text-sm font-bold leading-normal tracking-wide hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleStatusUpdate("Done")}
                      disabled={task.status === "Done" || statusSaving}
                    >
                      <span className="material-symbols-outlined mr-2 text-lg">
                        check_circle
                      </span>
                      <span className="truncate">
                        {task.status === "Done"
                          ? "Completed"
                          : statusSaving
                            ? "Updating..."
                          : "Mark as Complete"}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">
                    {issueTypeLabel}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${getStatusColor(task.status)}`}
                  >
                    {task.status}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${priorityColors.text} bg-slate-100`}>
                    <span className={`h-2 w-2 rounded-full ${priorityColors.bg}`}></span>
                    {task.priority}
                  </span>
                  <p className="text-slate-500 text-sm">
                    Created by {task.creator.full_name} •{" "}
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    SLA
                  </p>
                  <p className="mt-1 text-sm font-bold text-blue-900">{slaLabel}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Age
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{daysSinceCreated}d</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Engineering
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {pullRequests.length} PRs • {commits.length} commits
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Activity
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {activityPulse} • {activityLogs.length} logs
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4">
                <div className="pb-3 pt-4 sm:hidden">
                  <select
                    aria-label="Task detail tabs"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as TaskTab)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {taskTabs.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden gap-3 overflow-x-auto scrollbar-hide sm:flex">
                  {taskTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-bold text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-transparent text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.count ? (
                        <span className="rounded-full bg-blue-600/10 px-1.5 py-0.5 text-[10px] text-blue-600">
                          {tab.count}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <>
                  <div className="space-y-3 group relative rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">
                        Description
                      </h3>
                      <button
                        type="button"
                        className="text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        onClick={() => {
                          if (editMode) {
                            setEditMode(false);
                            setEditError("");
                            setEditAiError("");
                            setEditTitle(task.title || "");
                            setEditDescription(task.description || "");
                            return;
                          }
                          handleStartEditing();
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>{" "}
                        {editMode ? "Close Editor" : "Edit"}
                      </button>
                    </div>
                    {!editMode ? (
                      <div className="prose max-w-none text-slate-600 leading-relaxed">
                        <p>{task.description || "No description provided."}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editError && (
                          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
                            {editError}
                          </p>
                        )}
                        {editAiError && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            {editAiError}
                          </p>
                        )}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Title
                          </label>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="Task title"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Description
                          </label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            placeholder="Task description"
                          />
                          <p className="mt-1 text-[11px] text-slate-500">
                            {editDescription.length}/1000
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              onClick={() => setEditDescription(buildTaskTemplate(editTitle).slice(0, 1000))}
                              disabled={editSaving}
                            >
                              Apply Jira Template
                            </button>
                            <button
                              type="button"
                              className="h-9 rounded-lg border border-blue-300 bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                              onClick={handleGenerateEditIdeas}
                              disabled={editAiLoading || editSaving}
                            >
                              {editAiLoading ? "Generating..." : "AI Generate Ideas"}
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                              setEditMode(false);
                              setEditError("");
                              setEditAiError("");
                              setEditTitle(task.title || "");
                              setEditDescription(task.description || "");
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            onClick={handleSaveTaskEdits}
                            disabled={editSaving}
                          >
                            {editSaving ? "Saving..." : "Save Changes"}
                          </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Subtasks</h3>
                        <p className="text-sm text-slate-500">
                          {completedSubtasks}/{task.subtasks?.length || 0} completed
                        </p>
                      </div>
                      <div className="flex w-full gap-2 sm:w-auto">
                        <input
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateSubtask();
                            }
                          }}
                          placeholder="Add a subtask"
                          className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCreateSubtask}
                          disabled={subtaskSaving || !newSubtaskTitle.trim()}
                          className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {subtaskError ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {subtaskError}
                      </div>
                    ) : null}

                    {task.subtasks && task.subtasks.length > 0 ? (
                      <div className="space-y-2">
                        {task.subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                          >
                            <input
                              type="checkbox"
                              checked={subtask.is_completed}
                              onChange={(e) =>
                                handleToggleSubtask(subtask.id, e.target.checked)
                              }
                              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <p
                              className={`flex-1 text-sm ${
                                subtask.is_completed
                                  ? "text-slate-400 line-through"
                                  : "text-slate-800"
                              }`}
                            >
                              {subtask.title}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(subtask.id)}
                              className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Delete subtask"
                            >
                              <span className="material-symbols-outlined text-base">
                                delete
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                        Break this ticket into smaller Jira-style subtasks here.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                          Quality Shortcut
                        </p>
                        <h3 className="mt-2 text-lg font-bold text-blue-950">
                          Add a test case from this task
                        </h3>
                        <p className="mt-1 text-sm text-blue-900/80">
                          Open the test case flow with this task already linked, plus project and sprint context prefilled.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={navigateToCreateTestCase}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                      >
                        <span className="material-symbols-outlined text-lg">add_task</span>
                        <span>Add Test Case</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">
                          auto_awesome
                        </span>
                        AI Task Assistant
                      </h3>
                      <button
                        className="h-8 px-3 rounded-md bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
                        onClick={() =>
                          fetchAiSuggestion(task.title, task.description || "")
                        }
                        disabled={aiLoading}
                      >
                        {aiLoading ? "Analyzing..." : "Refresh"}
                      </button>
                    </div>

                    {aiError && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        {aiError}
                      </p>
                    )}

                    {aiSuggestion && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          <div className="rounded-lg border border-blue-200 bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Suggested Priority
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {aiSuggestion.priority}
                          </p>
                          <button
                            className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900"
                            onClick={() =>
                              handlePriorityUpdate(aiSuggestion.priority)
                            }
                            disabled={prioritySaving}
                          >
                            {prioritySaving ? "Applying..." : "Apply priority"}
                          </button>
                        </div>
                          <div className="rounded-lg border border-blue-200 bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Suggested Due Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {new Date(aiSuggestion.due_date).toLocaleDateString()}
                          </p>
                          <p className="mt-2 text-xs text-slate-600">
                            Est. {aiSuggestion.estimated_hours}h effort
                          </p>
                        </div>
                          <div className="rounded-lg border border-blue-200 bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Why
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {aiSuggestion.reason}
                          </p>
                        </div>
                          <div className="rounded-lg border border-blue-200 bg-white p-3 lg:col-span-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Suggested Checklist
                          </p>
                          <ul className="mt-2 space-y-1">
                            {aiSuggestion.checklist.map((item) => (
                              <li key={item} className="text-sm text-slate-700">
                                • {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 pt-4 rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-bold text-slate-900">
                      Activity
                    </h3>
                    <div className="space-y-6">
                      {/* Comment Input */}
                      <div className="flex gap-4 pt-4">
                        <div className="bg-blue-600/20 text-blue-600 rounded-full size-10 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          U
                        </div>
                        <div className="flex-1">
                          <div className="border border-slate-200 rounded-lg focus-within:border-blue-600 transition-colors">
                            <textarea
                              className="w-full border-none bg-transparent focus:ring-0 text-sm p-3 min-h-[80px] resize-none"
                              placeholder="Add a comment..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                            <div className="flex items-center justify-between p-2 bg-slate-50 border-t border-slate-200">
                              <div className="flex gap-1">
                                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500">
                                  <span className="material-symbols-outlined text-xl">
                                    attach_file
                                  </span>
                                </button>
                                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500">
                                  <span className="material-symbols-outlined text-xl">
                                    mood
                                  </span>
                                </button>
                              </div>
                              <button
                                className="bg-blue-600 text-white px-4 py-1.5 rounded font-bold text-sm hover:bg-blue-700 transition-colors"
                                onClick={handleCommentSubmit}
                                disabled={!comment.trim()}
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "prs" && (
                <div className="space-y-10 rounded-2xl border border-slate-200 bg-white p-5">
                  {prLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-slate-500 mt-2">Loading PR data...</p>
                    </div>
                  ) : (
                    <>
                      {/* Linked Pull Requests */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-slate-900">
                            Linked Pull Requests
                          </h3>
                          <button
                            onClick={() => {
                              setShowLinkPRModal(true);
                            }}
                            className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline"
                          >
                            <span className="material-symbols-outlined text-lg">
                              add
                            </span>
                            Link Pull Request
                          </button>
                        </div>
                        {pullRequests.length > 0 ? (
                          <div className="space-y-3">
                            {pullRequests.map((pr) => {
                              const getStatusIcon = (status: string) => {
                                switch (status) {
                                  case "open":
                                    return {
                                      icon: "data_check",
                                      color: "text-green-500",
                                    };
                                  case "merged":
                                    return {
                                      icon: "merge",
                                      color: "text-purple-500",
                                    };
                                  case "closed":
                                    return {
                                      icon: "close",
                                      color: "text-red-500",
                                    };
                                  default:
                                    return {
                                      icon: "code",
                                      color: "text-slate-500",
                                    };
                                }
                              };

                              const getStatusBadge = (status: string) => {
                                switch (status) {
                                  case "open":
                                    return "bg-green-100 text-green-600";
                                  case "merged":
                                    return "bg-purple-100 text-purple-600";
                                  case "closed":
                                    return "bg-red-100 text-red-600";
                                  default:
                                    return "bg-slate-100 text-slate-600";
                                }
                              };

                              const statusIcon = getStatusIcon(pr.status);
                              const statusBadge = getStatusBadge(pr.status);

                              return (
                                <div
                                  key={pr.id}
                                  className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-600/40 transition-colors shadow-sm"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span
                                          className={`material-symbols-outlined ${statusIcon.color} text-lg`}
                                        >
                                          {statusIcon.icon}
                                        </span>
                                        <h4 className="font-bold text-slate-900 truncate">
                                          {pr.title}
                                        </h4>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="font-medium text-slate-600">
                                          {pr.repository} / {pr.branch}
                                        </span>
                                        <span>
                                          #{pr.number} • {pr.status}{" "}
                                          {new Date(
                                            pr.created_at,
                                          ).toLocaleDateString()}{" "}
                                          by {pr.author}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                      <span
                                        className={`px-2 py-0.5 ${statusBadge} text-[10px] font-bold rounded-full uppercase tracking-wider`}
                                      >
                                        {pr.status}
                                      </span>
                                      <a
                                        className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:underline"
                                        href={pr.github_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        View in GitHub{" "}
                                        <span className="material-symbols-outlined text-sm">
                                          open_in_new
                                        </span>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-slate-500 text-center py-8">
                            No pull requests linked to this task.
                          </div>
                        )}
                      </div>

                      {/* Related Commits */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">
                          Related Commits
                        </h3>
                        {commits.length > 0 ? (
                          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-slate-100/50 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                                <tr>
                                  <th className="px-4 py-3">Commit</th>
                                  <th className="px-4 py-3">Message</th>
                                  <th className="px-4 py-3">Author</th>
                                  <th className="px-4 py-3 text-right">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {commits.map((commit) => (
                                  <tr
                                    key={commit.id}
                                    className="hover:bg-white transition-colors group"
                                  >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <code className="text-xs font-mono text-blue-600 bg-blue-600/5 px-1.5 py-0.5 rounded">
                                        {commit.hash.substring(0, 7)}
                                      </code>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                      {commit.message}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap flex items-center gap-2">
                                      <div
                                        className="size-5 rounded-full bg-slate-300 bg-cover"
                                        style={{
                                          backgroundImage: `url('${commit.author.avatar}')`,
                                        }}
                                      ></div>
                                      <span>{commit.author.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500">
                                      {new Date(
                                        commit.created_at,
                                      ).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-center py-8">
                            No commits found for this task.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-6 pt-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    Activity Log
                  </h3>
                  {activityLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-slate-500 mt-2">Loading activity...</p>
                    </div>
                  ) : activityLogs.length > 0 ? (
                    <div className="space-y-4">
                      {activityLogs.map((log) => {
                        const actorName = log.user?.full_name || "System";

                        const getActionIcon = (action: string) => {
                          switch (action) {
                            case "created":
                              return {
                                icon: "add_circle",
                                color: "text-green-600",
                              };
                            case "status_changed":
                              return {
                                icon: "swap_horiz",
                                color: "text-blue-600",
                              };
                            case "assigned":
                              return {
                                icon: "person_add",
                                color: "text-purple-600",
                              };
                            case "unassigned":
                              return {
                                icon: "person_remove",
                                color: "text-orange-600",
                              };
                            case "updated":
                              return { icon: "edit", color: "text-amber-600" };
                            case "deleted":
                              return { icon: "delete", color: "text-red-600" };
                            default:
                              return {
                                icon: "history",
                                color: "text-slate-600",
                              };
                          }
                        };

                        const getActionText = (log: ActivityLog) => {
                          switch (log.action) {
                            case "created":
                              return "created this task";
                            case "status_changed":
                              return `changed status from "${log.changes?.status?.from}" to "${log.changes?.status?.to}"`;
                            case "assigned":
                              return "assigned this task";
                            case "unassigned":
                              return "unassigned this task";
                            case "updated": {
                              const visibleChanges = getVisibleChangeKeys(log);
                              if (visibleChanges.length === 0) {
                                return "updated this task";
                              }
                              return `updated ${visibleChanges
                                .map(formatChangeLabel)
                                .join(", ")}`;
                            }
                            case "deleted":
                              return "deleted this task";
                            default:
                              return log.action;
                          }
                        };

                        const actionIcon = getActionIcon(log.action);

                        return (
                          <div
                            key={log.id}
                            className="flex gap-3 p-4 bg-white border border-slate-200 rounded-lg"
                          >
                            <div className="flex-shrink-0">
                              <div className="bg-blue-600/20 text-blue-600 rounded-full size-8 flex items-center justify-center text-xs font-bold">
                                {actorName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`material-symbols-outlined ${actionIcon.color} text-lg`}
                                >
                                  {actionIcon.icon}
                                </span>
                                <span className="font-semibold text-slate-900">
                                  {actorName}
                                </span>
                                <span className="text-slate-600">
                                  {getActionText(log)}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {getActivityTimestamp(log)}
                              </div>
                              {log.changes &&
                                getVisibleChangeKeys(log).length > 0 && (
                                  <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                    <details>
                                      <summary className="cursor-pointer font-medium">
                                        View changes
                                      </summary>
                                      <pre className="mt-1 text-[10px] overflow-x-auto">
                                        {JSON.stringify(
                                          Object.fromEntries(
                                            Object.entries(log.changes).filter(
                                              ([key]) =>
                                                !ACTIVITY_METADATA_KEYS.has(key),
                                            ),
                                          ),
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </details>
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center py-8">
                      No activity found for this task.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "attachments" && (
                <div className="space-y-6 pt-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      Attachments
                    </h3>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm cursor-pointer">
                        <span className="material-symbols-outlined text-lg">
                          upload
                        </span>
                        Upload File
                        <input
                          type="file"
                          className="hidden"
                          onChange={() => {}}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
                      attach_file
                    </span>
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">
                      No Attachments Yet
                    </h3>
                    <p className="text-slate-500 mb-4">
                      Upload files related to this task.
                    </p>
                    <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">
                        upload
                      </span>
                      Upload First File
                      <input
                        type="file"
                        className="hidden"
                        onChange={() => {}}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 bg-slate-50/60">
              <div className="space-y-4 lg:sticky lg:top-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Task Context
                  </p>
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                      Assignee
                    </label>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 group">
                      <div className="bg-blue-600/20 text-blue-600 rounded-full size-8 flex items-center justify-center text-xs font-bold">
                        {task.assignee?.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </div>
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                        {task.assignee?.full_name || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  {task.sprint?.name ? (
                    <div className="space-y-2">
                      <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                        Sprint
                      </label>
                      <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 text-slate-900">
                        <span className="material-symbols-outlined text-blue-600">
                          view_kanban
                        </span>
                        <span className="text-sm font-semibold">
                          {task.sprint.name}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {task.due_date && (
                    <div className="space-y-2">
                      <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                        Due Date
                      </label>
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-slate-900">
                        <span className="material-symbols-outlined text-blue-600">
                          calendar_today
                        </span>
                        <span className="text-sm font-semibold">
                          {new Date(task.due_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                      Issue Type
                    </label>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                      <span className="material-symbols-outlined text-blue-600">
                        confirmation_number
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {issueTypeLabel}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                      Priority
                    </label>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                      <div
                        className={`w-3 h-3 rounded-full ${priorityColors.bg}`}
                      ></div>
                      <span
                        className={`text-sm font-semibold ${priorityColors.text}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lifecycle
                  </p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {Number.isNaN(createdAtDate.getTime())
                        ? "Unknown"
                        : createdAtDate.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Last Updated
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {Number.isNaN(updatedAtDate.getTime())
                        ? "Unknown"
                        : updatedAtDate.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Delivery Signal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{slaLabel}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Integration Snapshot
                  </p>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span>Linked PRs</span>
                      <span className="font-semibold text-slate-900">{pullRequests.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span>Related Commits</span>
                      <span className="font-semibold text-slate-900">{commits.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span>Activity Entries</span>
                      <span className="font-semibold text-slate-900">{activityLogs.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span>Subtasks</span>
                      <span className="font-semibold text-slate-900">
                        {completedSubtasks}/{task.subtasks?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Actions
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={navigateToCreateTestCase}
                      className="w-full text-slate-700 transition-colors text-xs font-medium flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="material-symbols-outlined text-sm">
                        add_task
                      </span>
                      Add Test Case
                    </button>
                    <button
                      type="button"
                      onClick={handleStartEditing}
                      className="w-full text-slate-700 transition-colors text-xs font-medium flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="material-symbols-outlined text-sm">
                        edit_square
                      </span>
                      Update Task
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTask}
                      disabled={deleteSaving}
                      className="w-full text-slate-500 hover:text-red-500 transition-colors text-xs font-medium flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-sm">
                        delete
                      </span>
                      {deleteSaving ? "Deleting..." : "Delete Task"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:hidden p-4 border-t border-slate-200 bg-white">
            <button
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleStatusUpdate("Done")}
              disabled={task.status === "Done"}
            >
              {task.status === "Done" ? "Completed" : "Mark as Complete"}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Link PR Modal */}
      {showLinkPRModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                Link Pull Request
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={prForm.title}
                  onChange={(e) =>
                    setPrForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="PR title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Repository
                  </label>
                  <input
                    type="text"
                    value={prForm.repository}
                    onChange={(e) =>
                      setPrForm((prev) => ({
                        ...prev,
                        repository: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="repo-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={prForm.branch}
                    onChange={(e) =>
                      setPrForm((prev) => ({ ...prev, branch: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="feature-branch"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    PR Number
                  </label>
                  <input
                    type="number"
                    value={prForm.number}
                    onChange={(e) =>
                      setPrForm((prev) => ({ ...prev, number: e.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={prForm.status}
                    onChange={(e) =>
                      setPrForm((prev) => ({
                        ...prev,
                        status: e.target.value as "open" | "merged" | "closed",
                      }))
                    }
                    aria-label="Pull request status"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="open">Open</option>
                    <option value="merged">Merged</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={prForm.author}
                  onChange={(e) =>
                    setPrForm((prev) => ({ ...prev, author: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={prForm.github_url}
                  onChange={(e) =>
                    setPrForm((prev) => ({
                      ...prev,
                      github_url: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowLinkPRModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkPR}
                disabled={!prForm.title || !prForm.repository || !prForm.number}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Link PR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
