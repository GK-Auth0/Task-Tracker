import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tasksAPI } from "../services/dashboard";

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

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

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
                <div className="flex gap-8">
                  <a
                    className="flex items-center gap-2 border-b-[3px] border-b-blue-600 text-blue-600 pb-[13px] pt-4 font-bold text-sm"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-lg">
                      description
                    </span>
                    <span>Overview</span>
                  </a>
                  <a
                    className="flex items-center gap-2 border-b-[3px] border-b-transparent text-slate-500 pb-[13px] pt-4 font-bold text-sm hover:text-blue-600 transition-colors"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-lg">
                      history
                    </span>
                    <span>Activity</span>
                  </a>
                  <a
                    className="flex items-center gap-2 border-b-[3px] border-b-transparent text-slate-500 pb-[13px] pt-4 font-bold text-sm hover:text-blue-600 transition-colors"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-lg">
                      attach_file
                    </span>
                    <span>Attachments</span>
                  </a>
                </div>
              </div>

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
    </>
  );
}
