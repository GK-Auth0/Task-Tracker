import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tasksAPI, PullRequest, Commit } from "../services/dashboard";

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

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState<'overview' | 'prs' | 'activity' | 'attachments'>('overview');
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [prLoading, setPrLoading] = useState(false);
  const [showLinkPRModal, setShowLinkPRModal] = useState(false);
  
  // Debug log for modal state
  useEffect(() => {
    console.log('showLinkPRModal state changed:', showLinkPRModal);
  }, [showLinkPRModal]);
  const [prForm, setPrForm] = useState({
    title: '',
    repository: '',
    branch: '',
    number: '',
    author: '',
    github_url: '',
    status: 'open' as 'open' | 'merged' | 'closed'
  });

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'prs') {
      fetchPRData();
    }
  }, [id, activeTab]);

  const fetchTask = async () => {
    try {
      const response = await tasksAPI.getTask(id!);
      if (response.success) {
        setTask(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch task:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPRData = async () => {
    if (!id) return;
    try {
      setPrLoading(true);
      const [prResponse, commitResponse] = await Promise.all([
        tasksAPI.getPullRequests(id),
        tasksAPI.getCommits(id)
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

  const handleStatusUpdate = async (
    newStatus: "To Do" | "In Progress" | "Done",
  ) => {
    if (!task) return;
    try {
      const response = await tasksAPI.updateTask(task.id, {
        status: newStatus,
      });
      if (response.success) {
        setTask({ ...task, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    try {
      // For now, just clear the comment - you can add comment API later
      setComment("");
      console.log("Comment submitted:", comment);
    } catch (error) {
      console.error("Failed to submit comment:", error);
    }
  };

  const handleLinkPR = async () => {
    if (!id || !prForm.title || !prForm.repository || !prForm.number) return;
    
    try {
      // This would be an API call to link the PR
      console.log('Linking PR:', prForm);
      setShowLinkPRModal(false);
      setPrForm({
        title: '',
        repository: '',
        branch: '',
        number: '',
        author: '',
        github_url: '',
        status: 'open'
      });
      // Refresh PR data
      fetchPRData();
    } catch (error) {
      console.error('Failed to link PR:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        Task not found
      </div>
    );
  }

  const priorityColors = getPriorityColor(task.priority);

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
                <a
                  className="text-slate-500 font-medium hover:text-blue-600"
                  href="#"
                >
                  Projects
                </a>
                <span className="text-slate-500 font-medium">/</span>
                <a
                  className="text-slate-500 font-medium hover:text-blue-600"
                  href="#"
                >
                  {task.project.name}
                </a>
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
                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-500 transition-colors ml-2"
                onClick={() => navigate(-1)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
            {/* Left Column */}
            <div className="flex-1 p-8 space-y-8 border-r border-slate-200">
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
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                    <button
                      className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-blue-600 text-white text-sm font-bold leading-normal tracking-wide hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleStatusUpdate("Done")}
                      disabled={task.status === "Done"}
                    >
                      <span className="material-symbols-outlined mr-2 text-lg">
                        check_circle
                      </span>
                      <span className="truncate">
                        {task.status === "Done"
                          ? "Completed"
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
                <div className="flex gap-8 overflow-x-auto scrollbar-hide">
                  <button
                    className={`flex items-center gap-2 border-b-[3px] pb-[13px] pt-4 font-bold text-sm whitespace-nowrap ${
                      activeTab === 'overview' 
                        ? 'border-b-blue-600 text-blue-600' 
                        : 'border-b-transparent text-slate-500 hover:text-blue-600 transition-colors'
                    }`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <span className="material-symbols-outlined text-lg">
                      description
                    </span>
                    <span>Overview</span>
                  </button>
                  <button
                    className={`flex items-center gap-2 border-b-[3px] pb-[13px] pt-4 font-bold text-sm whitespace-nowrap ${
                      activeTab === 'prs' 
                        ? 'border-b-blue-600 text-blue-600' 
                        : 'border-b-transparent text-slate-500 hover:text-blue-600 transition-colors'
                    }`}
                    onClick={() => setActiveTab('prs')}
                  >
                    <span className="material-symbols-outlined text-lg">
                      code
                    </span>
                    <span>PRs & Code</span>
                    {pullRequests.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-600/10 text-blue-600 text-[10px] rounded-full">
                        {pullRequests.length}
                      </span>
                    )}
                  </button>
                  <button
                    className={`flex items-center gap-2 border-b-[3px] pb-[13px] pt-4 font-bold text-sm whitespace-nowrap ${
                      activeTab === 'activity' 
                        ? 'border-b-blue-600 text-blue-600' 
                        : 'border-b-transparent text-slate-500 hover:text-blue-600 transition-colors'
                    }`}
                    onClick={() => setActiveTab('activity')}
                  >
                    <span className="material-symbols-outlined text-lg">
                      history
                    </span>
                    <span>Activity</span>
                  </button>
                  <button
                    className={`flex items-center gap-2 border-b-[3px] pb-[13px] pt-4 font-bold text-sm whitespace-nowrap ${
                      activeTab === 'attachments' 
                        ? 'border-b-blue-600 text-blue-600' 
                        : 'border-b-transparent text-slate-500 hover:text-blue-600 transition-colors'
                    }`}
                    onClick={() => setActiveTab('attachments')}
                  >
                    <span className="material-symbols-outlined text-lg">
                      attach_file
                    </span>
                    <span>Attachments</span>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
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

                  {/* Activity Log */}
                  <div className="space-y-6 pt-4">
                    <h3 className="text-lg font-bold text-slate-900">Activity</h3>
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

              {activeTab === 'prs' && (
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
                          <h3 className="text-lg font-bold text-slate-900">Linked Pull Requests</h3>
                          <button 
                            onClick={() => {
                              console.log('Link PR button clicked');
                              setShowLinkPRModal(true);
                            }}
                            className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:underline"
                          >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Link Pull Request
                          </button>
                        </div>
                        {pullRequests.length > 0 ? (
                          <div className="space-y-3">
                            {pullRequests.map((pr) => {
                              const getStatusIcon = (status: string) => {
                                switch (status) {
                                  case 'open': return { icon: 'data_check', color: 'text-green-500' };
                                  case 'merged': return { icon: 'merge', color: 'text-purple-500' };
                                  case 'closed': return { icon: 'close', color: 'text-red-500' };
                                  default: return { icon: 'code', color: 'text-slate-500' };
                                }
                              };
                              
                              const getStatusBadge = (status: string) => {
                                switch (status) {
                                  case 'open': return 'bg-green-100 text-green-600';
                                  case 'merged': return 'bg-purple-100 text-purple-600';
                                  case 'closed': return 'bg-red-100 text-red-600';
                                  default: return 'bg-slate-100 text-slate-600';
                                }
                              };
                              
                              const statusIcon = getStatusIcon(pr.status);
                              const statusBadge = getStatusBadge(pr.status);
                              
                              return (
                                <div key={pr.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-600/40 transition-colors shadow-sm">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`material-symbols-outlined ${statusIcon.color} text-lg`}>{statusIcon.icon}</span>
                                        <h4 className="font-bold text-slate-900 truncate">{pr.title}</h4>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="font-medium text-slate-600">{pr.repository} / {pr.branch}</span>
                                        <span>#{pr.number} • {pr.status} {new Date(pr.created_at).toLocaleDateString()} by {pr.author}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                      <span className={`px-2 py-0.5 ${statusBadge} text-[10px] font-bold rounded-full uppercase tracking-wider`}>
                                        {pr.status}
                                      </span>
                                      <a className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:underline" href={pr.github_url} target="_blank" rel="noopener noreferrer">
                                        View in GitHub <span className="material-symbols-outlined text-sm">open_in_new</span>
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
                        <h3 className="text-lg font-bold text-slate-900">Related Commits</h3>
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
                                  <tr key={commit.id} className="hover:bg-white transition-colors group">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <code className="text-xs font-mono text-blue-600 bg-blue-600/5 px-1.5 py-0.5 rounded">
                                        {commit.hash.substring(0, 7)}
                                      </code>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{commit.message}</td>
                                    <td className="px-4 py-3 whitespace-nowrap flex items-center gap-2">
                                      <div 
                                        className="size-5 rounded-full bg-slate-300 bg-cover" 
                                        style={{ backgroundImage: `url('${commit.author.avatar}')` }}
                                      ></div>
                                      <span>{commit.author.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500">
                                      {new Date(commit.created_at).toLocaleDateString()}
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

              {activeTab === 'activity' && (
                <div className="space-y-6 pt-4">
                  <h3 className="text-lg font-bold text-slate-900">Activity Log</h3>
                  <div className="text-slate-500 text-center py-8">
                    Activity log content will be displayed here.
                  </div>
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="space-y-6 pt-4">
                  <h3 className="text-lg font-bold text-slate-900">Attachments</h3>
                  <div className="text-slate-500 text-center py-8">
                    No attachments found.
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
              <h3 className="text-lg font-bold text-slate-900">Link Pull Request</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={prForm.title}
                  onChange={(e) => setPrForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="PR title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Repository</label>
                  <input
                    type="text"
                    value={prForm.repository}
                    onChange={(e) => setPrForm(prev => ({ ...prev, repository: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="repo-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={prForm.branch}
                    onChange={(e) => setPrForm(prev => ({ ...prev, branch: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="feature-branch"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PR Number</label>
                  <input
                    type="number"
                    value={prForm.number}
                    onChange={(e) => setPrForm(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={prForm.status}
                    onChange={(e) => setPrForm(prev => ({ ...prev, status: e.target.value as 'open' | 'merged' | 'closed' }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="open">Open</option>
                    <option value="merged">Merged</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
                <input
                  type="text"
                  value={prForm.author}
                  onChange={(e) => setPrForm(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={prForm.github_url}
                  onChange={(e) => setPrForm(prev => ({ ...prev, github_url: e.target.value }))}
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
