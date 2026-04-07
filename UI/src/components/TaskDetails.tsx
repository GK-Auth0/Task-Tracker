import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import TaskDetailHeader from "./task-detail/TaskDetailHeader";
import TaskDetailSidebar from "./task-detail/TaskDetailSidebar";
import {
  tasksAPI,
  PullRequest,
  Commit,
  ActivityLog,
  usersAPI,
} from "../services/dashboard";
import { aiAssistantAPI, AiTaskSuggestion } from "../services/aiAssistant";
import { testCasesAPI, testCaseModulesAPI, type TestCaseModuleOption } from "../services/testCases";
import type { TestCaseRecord, TestCaseStatus } from "../types/testCase";
import { appendTaskAiDraft, buildTaskTemplate } from "../utils/descriptionTemplates";
import { isDoneTaskStatus, type TaskStatusValue } from "../utils/taskStatus";

interface TaskDetails {
  id: string;
  title: string;
  description?: string;
  status: TaskStatusValue;
  priority: "Low" | "Medium" | "High";
  issue_type?: "Story" | "Task" | "Bug";
  due_date?: string;
  attachments?: Array<{
    id: string;
    original_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    created_at: string;
    uploader?: {
      id: string;
      full_name: string;
      email: string;
    };
  }>;
  subtasks?: Array<{
    id: string;
    title: string;
    is_completed: boolean;
    position?: number;
    assignee_id?: string;
    linked_task_id?: string;
    assignee?: {
      id: string;
      full_name: string;
      email: string;
    };
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
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssigneeId, setNewSubtaskAssigneeId] = useState("");
  const [subtaskSaving, setSubtaskSaving] = useState(false);
  const [subtaskError, setSubtaskError] = useState("");
  const [workspaceUsers, setWorkspaceUsers] = useState<
    Array<{ id: string; full_name: string; email: string }>
  >([]);
  const [linkedTestCases, setLinkedTestCases] = useState<TestCaseRecord[]>([]);
  const [testCasesLoading, setTestCasesLoading] = useState(false);
  const [testCaseRunLoadingId, setTestCaseRunLoadingId] = useState("");
  const [showQuickTestCaseForm, setShowQuickTestCaseForm] = useState(false);
  const [quickTestCaseTitle, setQuickTestCaseTitle] = useState("");
  const [quickTestCaseSuite, setQuickTestCaseSuite] = useState("");
  const [quickTestCaseModule, setQuickTestCaseModule] = useState("");
  const [quickTestCasePriority, setQuickTestCasePriority] =
    useState<"Critical" | "High" | "Medium" | "Low">("Medium");
  const [quickTestCaseAutomation, setQuickTestCaseAutomation] =
    useState<"Manual" | "Automated" | "Candidate">("Manual");
  const [quickStepAction, setQuickStepAction] = useState("");
  const [quickStepExpected, setQuickStepExpected] = useState("");
  const [quickTestCaseSubmitting, setQuickTestCaseSubmitting] = useState(false);
  const [quickTestCaseError, setQuickTestCaseError] = useState("");
  const [projectModuleOptions, setProjectModuleOptions] = useState<TestCaseModuleOption[]>([]);

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
      fetchWorkspaceUsers();
      fetchLinkedTestCases(id);
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
      setQuickTestCaseTitle(`Verify ${task.title}`);
    }
  }, [task?.id]);

  useEffect(() => {
    if (!task?.project?.id) {
      setProjectModuleOptions([]);
      return;
    }

    const loadProjectModules = async () => {
      try {
        const response = await testCaseModulesAPI.getModules({ project_id: task.project.id });
        if (response.success) {
          setProjectModuleOptions(response.data);
          setQuickTestCaseModule((current) => current || response.data[0]?.name || "");
        }
      } catch (error) {
        console.error("Failed to fetch project modules:", error);
      }
    };

    loadProjectModules();
  }, [task?.project?.id]);

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

  const fetchWorkspaceUsers = async () => {
    try {
      const response = await usersAPI.getUsers({ limit: 100 });
      if (response.success) {
        setWorkspaceUsers(
          response.data.map((user) => ({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to fetch workspace users:", error);
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

  const fetchLinkedTestCases = async (taskId: string) => {
    try {
      setTestCasesLoading(true);
      const response = await testCasesAPI.getTestCases({ linked_task_id: taskId });
      if (response.success) {
        setLinkedTestCases(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch linked test cases:", error);
    } finally {
      setTestCasesLoading(false);
    }
  };

  const handleRunTestCase = async (
    testCaseId: string,
    status: Extract<TestCaseStatus, "Passed" | "Failed" | "Blocked">,
  ) => {
    try {
      setTestCaseRunLoadingId(`${testCaseId}:${status}`);
      const response = await testCasesAPI.addExecution(testCaseId, {
        status,
        cycle: task?.sprint?.name || "Task Detail Run",
        note: `Executed from task ${task?.title || ""}`.trim(),
      });
      if (response.success) {
        setLinkedTestCases((current) =>
          current.map((item) => (item.id === response.data.id ? response.data : item)),
        );
      }
    } catch (error) {
      console.error("Failed to run test case:", error);
    } finally {
      setTestCaseRunLoadingId("");
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
    newStatus: TaskStatusValue,
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
        assignee_id: newSubtaskAssigneeId || undefined,
      });

      if (response.success) {
        setTask({
          ...task,
          subtasks: [...(task.subtasks || []), response.data],
        });
        setNewSubtaskTitle("");
        setNewSubtaskAssigneeId("");
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

  const handleSubtaskAssigneeChange = async (
    subtaskId: string,
    assigneeId: string,
  ) => {
    if (!task) return;

    try {
      setSubtaskSaving(true);
      setSubtaskError("");
      const response = await tasksAPI.updateSubtask(task.id, subtaskId, {
        assignee_id: assigneeId || undefined,
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
          "Failed to update subtask assignee.",
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

  const handleAttachmentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!task || !file) return;

    try {
      setAttachmentUploading(true);
      setAttachmentError("");
      const response = await tasksAPI.uploadAttachment(task.id, file);
      if (response.success) {
        setTask({
          ...task,
          attachments: [response.data, ...(task.attachments || [])],
        });
      }
    } catch (error: any) {
      setAttachmentError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to upload attachment.",
      );
    } finally {
      setAttachmentUploading(false);
      event.target.value = "";
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

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50">
        <div className="mx-auto flex min-h-full max-w-[1440px] items-center justify-center p-4 sm:p-6 lg:p-8">
          Loading...
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50">
        <div className="mx-auto flex min-h-full max-w-[1440px] flex-col items-center justify-center gap-3 p-4 text-center sm:p-6 lg:p-8">
          <p>{taskError || "Task not found"}</p>
          <button
            type="button"
            onClick={() => navigate("/tasks")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  const priorityColors = getPriorityColor(task.priority);
  const issueTypeLabel = task.issue_type || "Task";
  const issueKey = `TASK-${task.id.slice(-3)}`;
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
    isDoneTaskStatus(task.status)
      ? "Delivered"
      : daysToDue === null
        ? "No Deadline"
        : daysToDue < 0
          ? `Overdue ${Math.abs(daysToDue)}d`
          : daysToDue === 0
            ? "Due Today"
            : `${daysToDue}d Remaining`;
  const activityPulse = activityLogs.length > 0 ? "Active" : "Quiet";
  const assigneeLabel = task.assignee?.full_name || "Unassigned";
  const assigneeInitials = task.assignee?.full_name
    ? task.assignee.full_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  const dueDateLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No deadline";
  const createdDateLabel = Number.isNaN(createdAtDate.getTime())
    ? "Unknown"
    : createdAtDate.toLocaleDateString();
  const issueHealthTone =
    isDoneTaskStatus(task.status)
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : daysToDue !== null && daysToDue < 0
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-blue-200 bg-blue-50 text-blue-700";
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/tasks");
  };

  const navigateToCreateTestCase = () => {
    navigate(`/test-cases/create?sourceTaskId=${task.id}`);
  };

  const handleCreateQuickTestCase = async () => {
    if (!task) return;
    if (
      !quickTestCaseTitle.trim() ||
      !quickTestCaseSuite.trim() ||
      !quickTestCaseModule.trim() ||
      !quickStepAction.trim() ||
      !quickStepExpected.trim()
    ) {
      setQuickTestCaseError("Title, suite, module, step action, and expected result are required.");
      return;
    }

    try {
      setQuickTestCaseSubmitting(true);
      setQuickTestCaseError("");
      const response = await testCasesAPI.createTestCase({
        title: quickTestCaseTitle.trim(),
        project_id: task.project.id,
        linked_task_id: task.id,
        sprint_id: task.sprint?.id,
        suite: quickTestCaseSuite.trim(),
        module: quickTestCaseModule.trim(),
        priority: quickTestCasePriority,
        status: "Draft",
        automation: quickTestCaseAutomation,
        tags: [],
        preconditions: [],
        steps: [
          {
            id: 1,
            action: quickStepAction.trim(),
            expected: quickStepExpected.trim(),
          },
        ],
        linked_items: [],
        execution_history: [],
      });

      if (response.success) {
        setLinkedTestCases((current) => [response.data, ...current]);
        setShowQuickTestCaseForm(false);
        setQuickTestCaseTitle("");
        setQuickTestCaseSuite("");
        setQuickStepAction("");
        setQuickStepExpected("");
        setQuickTestCasePriority("Medium");
        setQuickTestCaseAutomation("Manual");
      }
    } catch (error: any) {
      setQuickTestCaseError(
        error?.response?.data?.message || "Failed to create test case from this task.",
      );
    } finally {
      setQuickTestCaseSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <div className="h-full overflow-y-auto bg-slate-50">
        <div className="mx-auto min-h-full max-w-[1480px] p-4 sm:p-6 lg:p-8">
          <TaskDetailHeader
            issueKey={issueKey}
            issueTypeLabel={issueTypeLabel}
            title={task.title}
            projectName={task.project.name}
            taskStatus={task.status}
            taskPriority={task.priority}
            priorityColors={priorityColors}
            slaLabel={slaLabel}
            issueHealthTone={issueHealthTone}
            createdDateLabel={createdDateLabel}
            creatorName={task.creator.full_name}
            daysSinceCreated={daysSinceCreated}
            pullRequestsCount={pullRequests.length}
            commitsCount={commits.length}
            activityPulse={activityPulse}
            activityLogsCount={activityLogs.length}
            assigneeLabel={assigneeLabel}
            sprintName={task.sprint?.name}
            dueDateLabel={dueDateLabel}
            statusSaving={statusSaving}
            onOpenProject={() => navigate(`/projects/${task.project.id}`)}
            onBack={handleBack}
            onStatusChange={handleStatusUpdate}
            onEdit={handleStartEditing}
            onAddTestCase={navigateToCreateTestCase}
            onMarkDone={() => handleStatusUpdate("Done")}
          />

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5 p-4 sm:p-5 lg:border-r lg:border-slate-200">
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

              <div className="rounded-xl border border-slate-200 bg-white px-4">
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
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold whitespace-nowrap ${
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
                  <div className="group relative space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-slate-900">
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

                  <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Subtasks</h3>
                        <p className="text-sm text-slate-500">
                          {completedSubtasks}/{task.subtasks?.length || 0} completed
                        </p>
                      </div>
                      <div className="flex w-full gap-2 sm:w-auto">
                        <div className="flex flex-1 flex-col gap-2 sm:min-w-[380px] sm:flex-row">
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
                          <select
                            value={newSubtaskAssigneeId}
                            onChange={(e) => setNewSubtaskAssigneeId(e.target.value)}
                            className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            aria-label="New subtask assignee"
                          >
                            <option value="">Assign user</option>
                            {workspaceUsers.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
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
                            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center"
                          >
                            <div className="flex items-center gap-3 sm:flex-1">
                              <input
                                type="checkbox"
                                checked={subtask.is_completed}
                                onChange={(e) =>
                                  handleToggleSubtask(subtask.id, e.target.checked)
                                }
                                className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  subtask.linked_task_id &&
                                  navigate(`/task/${subtask.linked_task_id}`)
                                }
                                className={`flex-1 text-left text-sm ${
                                  subtask.is_completed
                                    ? "text-slate-400 line-through"
                                    : "text-slate-800 hover:text-blue-700"
                                }`}
                              >
                                {subtask.title}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 sm:w-auto">
                              <select
                                value={subtask.assignee_id || ""}
                                onChange={(e) =>
                                  handleSubtaskAssigneeChange(subtask.id, e.target.value)
                                }
                                className="h-9 min-w-[150px] rounded-lg border border-slate-300 px-3 text-xs text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                aria-label="Subtask assignee"
                              >
                                <option value="">Unassigned</option>
                                {workspaceUsers.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.full_name}
                                  </option>
                                ))}
                              </select>
                              {subtask.linked_task_id ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/task/${subtask.linked_task_id}`)}
                                  className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                  aria-label="Open subtask"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    open_in_new
                                  </span>
                                </button>
                              ) : null}
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                        Break this ticket into smaller Jira-style subtasks here.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                          Quality Shortcut
                        </p>
                        <h3 className="mt-2 text-base font-semibold text-blue-950">
                          Add a test case from this task
                        </h3>
                        <p className="mt-1 text-sm text-blue-900/80">
                          Open the test case flow with this task already linked, plus project and sprint context prefilled.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={navigateToCreateTestCase}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <span className="material-symbols-outlined text-lg">add_task</span>
                        <span>Add Test Case</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Linked Test Cases</h3>
                        <p className="text-sm text-slate-500">
                          Run and review test coverage for this task directly here.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate("/test-cases")}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                        >
                          Open Test Cases
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQuickTestCaseForm((current) => !current)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          {showQuickTestCaseForm ? "Close Quick Create" : "Add Test Case Here"}
                        </button>
                        <button
                          type="button"
                          onClick={navigateToCreateTestCase}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                        >
                          Full Create Page
                        </button>
                      </div>
                    </div>

                    {showQuickTestCaseForm ? (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="block md:col-span-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Test case title
                            </span>
                            <input
                              value={quickTestCaseTitle}
                              onChange={(event) => setQuickTestCaseTitle(event.target.value)}
                              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                              placeholder={`Verify ${task.title}`}
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Suite
                            </span>
                            <input
                              value={quickTestCaseSuite}
                              onChange={(event) => setQuickTestCaseSuite(event.target.value)}
                              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                              placeholder="Smoke Regression"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Module
                            </span>
                            <select
                              value={quickTestCaseModule}
                              onChange={(event) => setQuickTestCaseModule(event.target.value)}
                              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                            >
                              <option value="">Select module</option>
                              {projectModuleOptions.map((option) => (
                                <option key={option.id} value={option.name}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Priority
                            </span>
                            <select
                              value={quickTestCasePriority}
                              onChange={(event) =>
                                setQuickTestCasePriority(
                                  event.target.value as "Critical" | "High" | "Medium" | "Low",
                                )
                              }
                              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                            >
                              {["Critical", "High", "Medium", "Low"].map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Automation
                            </span>
                            <select
                              value={quickTestCaseAutomation}
                              onChange={(event) =>
                                setQuickTestCaseAutomation(
                                  event.target.value as "Manual" | "Automated" | "Candidate",
                                )
                              }
                              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                            >
                              {["Manual", "Automated", "Candidate"].map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Step action
                            </span>
                            <textarea
                              value={quickStepAction}
                              onChange={(event) => setQuickStepAction(event.target.value)}
                              className="mt-2 min-h-[96px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                              placeholder="Describe what the tester should do"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Expected result
                            </span>
                            <textarea
                              value={quickStepExpected}
                              onChange={(event) => setQuickStepExpected(event.target.value)}
                              className="mt-2 min-h-[96px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                              placeholder="Describe the expected outcome"
                            />
                          </label>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          Module comes from the project setup. Suite stays mandatory when creating the test case.
                        </p>
                        {quickTestCaseError ? (
                          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            {quickTestCaseError}
                          </div>
                        ) : null}
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={handleCreateQuickTestCase}
                            disabled={quickTestCaseSubmitting}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {quickTestCaseSubmitting ? "Creating..." : "Create Test Case"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {testCasesLoading ? (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                        Loading linked test cases...
                      </div>
                    ) : linkedTestCases.length ? (
                      <div className="space-y-3">
                        {linkedTestCases.map((testCase) => (
                          <div
                            key={testCase.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/test-cases/case/${testCase.id}`)}
                                  className="text-left"
                                >
                                  <p className="text-sm font-semibold text-slate-900 hover:text-blue-700">
                                    {testCase.reference_code} • {testCase.title}
                                  </p>
                                </button>
                                <p className="mt-1 text-xs text-slate-500">
                                  {testCase.project?.name || "No project"} • {testCase.module} • {testCase.suite}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Status: {testCase.status} • Automation: {testCase.automation} • Last updated{" "}
                                  {new Date(testCase.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(["Passed", "Failed", "Blocked"] as const).map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleRunTestCase(testCase.id, status)}
                                    disabled={Boolean(testCaseRunLoadingId)}
                                    className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                                      status === "Passed"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : status === "Failed"
                                          ? "bg-rose-600 hover:bg-rose-700"
                                          : "bg-amber-600 hover:bg-amber-700"
                                    } disabled:opacity-50`}
                                  >
                                    {testCaseRunLoadingId === `${testCase.id}:${status}`
                                      ? "Running..."
                                      : `Run ${status}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {testCase.execution_history.length ? (
                              <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Latest Execution
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {testCase.execution_history[0].status}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {testCase.execution_history[0].cycle} • {testCase.execution_history[0].tester} •{" "}
                                  {new Date(testCase.execution_history[0].executedAt).toLocaleString()}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                        No test cases are linked to this task yet. Add one from here and it will show up in this panel.
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-base font-semibold text-blue-900">
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

                  <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="text-base font-semibold text-slate-900">
                      Activity
                    </h3>
                    <div className="space-y-4">
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
                <div className="space-y-8 rounded-xl border border-slate-200 bg-white p-4">
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
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="text-base font-semibold text-slate-900">
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
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <h3 className="text-base font-semibold text-slate-900">
                      Attachments
                    </h3>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm cursor-pointer">
                        <span className="material-symbols-outlined text-lg">
                          upload
                        </span>
                        {attachmentUploading ? "Uploading..." : "Upload File"}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleAttachmentUpload}
                          disabled={attachmentUploading}
                        />
                      </label>
                    </div>
                  </div>
                  {attachmentError ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {attachmentError}
                    </div>
                  ) : null}

                  {task.attachments && task.attachments.length > 0 ? (
                    <div className="space-y-3">
                      {task.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-blue-200 hover:bg-blue-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="material-symbols-outlined text-slate-500">
                              attach_file
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {attachment.original_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {(attachment.file_size / 1024).toFixed(1)} KB
                                {attachment.uploader
                                  ? ` • ${attachment.uploader.full_name}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-400">
                            open_in_new
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
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
                        {attachmentUploading ? "Uploading..." : "Upload First File"}
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleAttachmentUpload}
                          disabled={attachmentUploading}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            <TaskDetailSidebar
              assigneeInitials={assigneeInitials}
              assigneeLabel={assigneeLabel}
              projectName={task.project.name}
              sprintName={task.sprint?.name}
              dueDateLabel={dueDateLabel}
              issueTypeLabel={issueTypeLabel}
              taskPriority={task.priority}
              priorityColors={priorityColors}
              createdAtLabel={Number.isNaN(createdAtDate.getTime()) ? "Unknown" : createdAtDate.toLocaleString()}
              updatedAtLabel={Number.isNaN(updatedAtDate.getTime()) ? "Unknown" : updatedAtDate.toLocaleString()}
              slaLabel={slaLabel}
              pullRequestsCount={pullRequests.length}
              commitsCount={commits.length}
              activityLogsCount={activityLogs.length}
              completedSubtasks={completedSubtasks}
              totalSubtasks={task.subtasks?.length || 0}
              deleteSaving={deleteSaving}
              onOpenProject={() => navigate(`/projects/${task.project.id}`)}
              onAddTestCase={navigateToCreateTestCase}
              onEdit={handleStartEditing}
              onDelete={handleDeleteTask}
            />

            <div className="border-t border-slate-200 bg-white p-4 md:hidden">
              <button
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => handleStatusUpdate("Done")}
                disabled={task.status === "Done"}
              >
                {task.status === "Done" ? "Completed" : "Mark as Complete"}
              </button>
            </div>
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
    </div>
  );
}
