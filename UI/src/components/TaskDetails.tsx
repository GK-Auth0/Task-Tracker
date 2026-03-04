import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  tasksAPI,
  PullRequest,
  Commit,
  ActivityLog,
} from "../services/dashboard";
import { aiAssistantAPI, AiTaskSuggestion } from "../services/aiAssistant";

interface TaskDetails {
  id: string;
  title: string;
  description?: string;
  status: "To Do" | "In Progress" | "Done";
  priority: "Low" | "Medium" | "High";
  due_date?: string;
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
  created_at: string;
  updated_at: string;
}

type TaskTab = "overview" | "prs" | "activity" | "attachments";

const isTaskTab = (value: string | null): value is TaskTab =>
  value === "overview" ||
  value === "prs" ||
  value === "activity" ||
  value === "attachments";

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
  const [showLinkPRModal, setShowLinkPRModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiTaskSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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
  const taskTabs: Array<{ id: TaskTab; label: string; icon: string; count?: number }> = [
    { id: "overview", label: "Overview", icon: "description" },
    { id: "prs", label: "PRs & Code", icon: "code", count: pullRequests.length || undefined },
    { id: "activity", label: "Activity", icon: "history", count: activityLogs.length || undefined },
    { id: "attachments", label: "Attachments", icon: "attach_file" },
  ];

  return (
    <>
      {/* Overlay Background */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"></div>

      {/* Centered Modal Task Details */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <div className="bg-white w-full max-w-[1100px] h-full max-h-[850px] overflow-hidden rounded-xl shadow-2xl flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
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

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
            {/* Left Column */}
            <div className="flex-1 p-8 space-y-8 border-r border-slate-200">
              {taskError && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {taskError}
                </div>
              )}

              {/* Title & Status */}
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900">
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
                      className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-blue-600 text-white text-sm font-bold leading-normal tracking-wide hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded uppercase tracking-wider ${getStatusColor(task.status)}`}
                  >
                    {task.status}
                  </span>
                  <p className="text-slate-500 text-sm">
                    Created by {task.creator.full_name} •{" "}
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-200">
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
                <div className="hidden gap-8 overflow-x-auto scrollbar-hide sm:flex">
                  {taskTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`flex items-center gap-2 border-b-[3px] pb-[13px] pt-4 font-bold text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-b-blue-600 text-blue-600"
                          : "border-b-transparent text-slate-500 hover:text-blue-600 transition-colors"
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
                  {/* Description */}
                  <div className="space-y-3 group relative">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">
                        Description
                      </h3>
                      <button className="text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>{" "}
                        Edit
                      </button>
                    </div>
                    <div className="prose max-w-none text-slate-600 leading-relaxed">
                      <p>{task.description || "No description provided."}</p>
                    </div>
                  </div>

                  {/* AI Assistant */}
                  <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-cyan-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">
                          auto_awesome
                        </span>
                        AI Task Assistant
                      </h3>
                      <button
                        className="h-8 px-3 rounded-md bg-cyan-700 text-white text-xs font-semibold hover:bg-cyan-800 disabled:opacity-50"
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
                        <div className="rounded-lg border border-cyan-200 bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Suggested Priority
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {aiSuggestion.priority}
                          </p>
                          <button
                            className="mt-2 text-xs font-semibold text-cyan-700 hover:text-cyan-900"
                            onClick={() =>
                              handlePriorityUpdate(aiSuggestion.priority)
                            }
                            disabled={prioritySaving}
                          >
                            {prioritySaving ? "Applying..." : "Apply priority"}
                          </button>
                        </div>
                        <div className="rounded-lg border border-cyan-200 bg-white p-3">
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
                        <div className="rounded-lg border border-cyan-200 bg-white p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Why
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {aiSuggestion.reason}
                          </p>
                        </div>
                        <div className="rounded-lg border border-cyan-200 bg-white p-3 lg:col-span-3">
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

                  {/* Activity Log */}
                  <div className="space-y-6 pt-4">
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
                <div className="space-y-10">
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
                <div className="space-y-6 pt-4">
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
                            case "updated":
                              const changes = Object.keys(
                                log.changes || {},
                              ).filter(
                                (key) =>
                                  key !== "timestamp" && key !== "action_time",
                              );
                              return `updated ${changes.join(", ")}`;
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
                                {new Date(log.created_at).toLocaleString()}
                              </div>
                              {log.changes &&
                                Object.keys(log.changes).length > 2 && (
                                  <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                    <details>
                                      <summary className="cursor-pointer font-medium">
                                        View changes
                                      </summary>
                                      <pre className="mt-1 text-[10px] overflow-x-auto">
                                        {JSON.stringify(log.changes, null, 2)}
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
                <div className="space-y-6 pt-4">
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

            {/* Right Sidebar */}
            <div className="w-full md:w-80 p-6 bg-slate-50 flex flex-col gap-8">
              {/* Metadata Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Assignee
                  </label>
                  <div className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
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

                {task.due_date && (
                  <div className="space-y-2">
                    <label className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                      Due Date
                    </label>
                    <div className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors text-slate-900">
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
                  <label className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Priority
                  </label>
                  <div className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
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

              <div className="h-px bg-slate-200"></div>

              {/* Delete Button */}
              <div className="mt-auto pt-6 text-center">
                <button className="text-slate-400 hover:text-red-500 transition-colors text-xs font-medium flex items-center justify-center gap-1 mx-auto">
                  <span className="material-symbols-outlined text-sm">
                    delete
                  </span>
                  Delete Task
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Footer */}
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
