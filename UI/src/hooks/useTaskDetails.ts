import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
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
import { TaskStatusValue } from "../utils/taskStatus";

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

export function useTaskDetails() {
  const { id } = useParams<{ id: string }>();
  
  // Task state
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskError, setTaskError] = useState("");
  
  // Tab and UI state
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [prLoading, setPrLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Task operations state
  const [statusSaving, setStatusSaving] = useState(false);
  const [prioritySaving, setPrioritySaving] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  
  // AI state
  const [aiSuggestion, setAiSuggestion] = useState<AiTaskSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  
  // Users and test cases
  const [workspaceUsers, setWorkspaceUsers] = useState<
    Array<{ id: string; full_name: string; email: string }>
  >([]);
  const [linkedTestCases, setLinkedTestCases] = useState<TestCaseRecord[]>([]);
  const [testCasesLoading, setTestCasesLoading] = useState(false);
  const [testCaseRunLoadingId, setTestCaseRunLoadingId] = useState("");
  const [projectModuleOptions, setProjectModuleOptions] = useState<TestCaseModuleOption[]>([]);

  // Fetch task data
  const fetchTask = async () => {
    if (!id) return;
    try {
      setTaskError("");
      const response = await tasksAPI.getTask(id);
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

  // Fetch AI suggestion
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

  // Fetch workspace users
  const fetchWorkspaceUsers = async () => {
    try {
      const response = await usersAPI.getUsers({ limit: 100 });
      if (response.success) {
        setWorkspaceUsers(
          response.data.map((user) => ({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch workspace users:", error);
    }
  };

  // Fetch PR data
  const fetchPRData = useCallback(async () => {
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
  }, [id]);

  // Fetch linked test cases
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

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
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
  }, [id]);

  // Task operations
  const handleStatusUpdate = async (newStatus: TaskStatusValue) => {
    if (!task) return;
    try {
      setStatusSaving(true);
      const response = await tasksAPI.updateTask(task.id, { status: newStatus });
      if (response.success) {
        setTask({ ...task, status: newStatus });
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
      const response = await tasksAPI.updateTask(task.id, { priority: newPriority });
      if (response.success) {
        setTask({ ...task, priority: newPriority });
      }
    } catch (error) {
      console.error("Failed to update task priority:", error);
    } finally {
      setPrioritySaving(false);
    }
  };

  const handleTaskUpdate = async (updates: { title: string; description: string }) => {
    if (!task) return;
    const response = await tasksAPI.updateTask(task.id, updates);
    if (response.success) {
      setTask(response.data as any);
    }
  };

  const handleDeleteTask = async () => {
    if (!task || deleteSaving) return;

    const confirmed = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeleteSaving(true);
      setDeleteError("");
      const response = await tasksAPI.deleteTask(task.id);
      if (response.success) {
        return true; // Indicate successful deletion
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
    return false;
  };

  // Subtask operations
  const handleSubtaskCreate = async (title: string, assigneeId?: string) => {
    if (!task) return;
    const response = await tasksAPI.createSubtask(task.id, {
      title,
      assignee_id: assigneeId,
    });
    if (response.success) {
      setTask({
        ...task,
        subtasks: [...(task.subtasks || []), response.data],
      });
    }
  };

  const handleSubtaskUpdate = async (subtaskId: string, updates: any) => {
    if (!task) return;
    const response = await tasksAPI.updateSubtask(task.id, subtaskId, updates);
    if (response.success) {
      setTask({
        ...task,
        subtasks: (task.subtasks || []).map(subtask =>
          subtask.id === subtaskId ? response.data : subtask
        ),
      });
    }
  };

  const handleSubtaskDelete = async (subtaskId: string) => {
    if (!task) return;
    const response = await tasksAPI.deleteSubtask(task.id, subtaskId);
    if (response.success) {
      setTask({
        ...task,
        subtasks: (task.subtasks || []).filter(subtask => subtask.id !== subtaskId),
      });
    }
  };

  // Test case operations
  const handleRunTestCase = async (
    testCaseId: string,
    status: Extract<TestCaseStatus, "Passed" | "Failed" | "Blocked">
  ) => {
    try {
      setTestCaseRunLoadingId(`${testCaseId}:${status}`);
      const response = await testCasesAPI.addExecution(testCaseId, {
        status,
        cycle: task?.sprint?.name || "Task Detail Run",
        note: `Executed from task ${task?.title || ""}`.trim(),
      });
      if (response.success) {
        setLinkedTestCases(current =>
          current.map(item => (item.id === response.data.id ? response.data : item))
        );
      }
    } catch (error) {
      console.error("Failed to run test case:", error);
    } finally {
      setTestCaseRunLoadingId("");
    }
  };

  const handleTestCaseCreated = (testCase: TestCaseRecord) => {
    setLinkedTestCases(current => [testCase, ...current]);
  };

  // Attachment operations
  const handleAttachmentUpload = async (file: File) => {
    if (!task) return;
    const response = await tasksAPI.uploadAttachment(task.id, file);
    if (response.success) {
      setTask({
        ...task,
        attachments: [response.data, ...(task.attachments || [])],
      });
    }
  };

  // PR operations
  const handleLinkPR = async () => {
    // This would be an API call to link the PR
    // For now, just refresh PR data
    fetchPRData();
  };

  // Effects
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
        }
      } catch (error) {
        console.error("Failed to fetch project modules:", error);
      }
    };

    loadProjectModules();
  }, [task?.project?.id]);

  return {
    // Task data
    task,
    loading,
    taskError,
    deleteError,
    
    // Tab data
    pullRequests,
    commits,
    activityLogs,
    prLoading,
    activityLoading,
    
    // Operation states
    statusSaving,
    prioritySaving,
    deleteSaving,
    
    // AI data
    aiSuggestion,
    aiLoading,
    aiError,
    
    // Other data
    workspaceUsers,
    linkedTestCases,
    testCasesLoading,
    testCaseRunLoadingId,
    projectModuleOptions,
    
    // Operations
    handleStatusUpdate,
    handlePriorityUpdate,
    handleTaskUpdate,
    handleDeleteTask,
    handleSubtaskCreate,
    handleSubtaskUpdate,
    handleSubtaskDelete,
    handleRunTestCase,
    handleTestCaseCreated,
    handleAttachmentUpload,
    handleLinkPR,
    
    // Fetch functions
    fetchPRData,
    fetchActivityLogs,
    fetchAiSuggestion: () => task && fetchAiSuggestion(task.title, task.description || ""),
  };
}
