import { useState, useEffect, useRef } from "react";
import { tasksAPI, usersAPI, projectsAPI } from "../services/dashboard";
import { getTaskAiSuggestion } from "../utils/taskAiAssistant";
import { aiAssistantAPI, AiTaskSuggestion } from "../services/aiAssistant";

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitees, setInvitees] = useState<Array<{ full_name: string; email: string }>>([]);
  const [descriptionError, setDescriptionError] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiTaskSuggestion>(() => {
    const local = getTaskAiSuggestion("", "");
    return {
      priority: local.priority,
      due_date: local.dueDate || "",
      estimated_hours: 1.5,
      checklist: local.checklist,
      reason: local.reason,
    };
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch users and projects when modal opens
      fetchUsersAndProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !title.trim()) {
      const local = getTaskAiSuggestion(title, description);
      setAiSuggestion({
        priority: local.priority,
        due_date: local.dueDate || "",
        estimated_hours: 1.5,
        checklist: local.checklist,
        reason: local.reason,
      });
      setAiError("");
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setAiLoading(true);
        setAiError("");
        const remote = await aiAssistantAPI.suggestTask(title, description);
        if (!cancelled) {
          setAiSuggestion(remote);
        }
      } catch (error) {
        const local = getTaskAiSuggestion(title, description);
        if (!cancelled) {
          setAiSuggestion({
            priority: local.priority,
            due_date: local.dueDate || "",
            estimated_hours: 1.5,
            checklist: local.checklist,
            reason: local.reason,
          });
          setAiError("AI service unavailable. Using local smart suggestions.");
        }
      } finally {
        if (!cancelled) {
          setAiLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, title, description]);

  const fetchUsersAndProjects = async () => {
    try {
      const [usersResponse, projectsResponse] = await Promise.all([
        usersAPI.getUsers(),
        projectsAPI.getProjects(),
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data);
      }

      if (projectsResponse.success && projectsResponse.data.length > 0) {
        setProjects(projectsResponse.data);
        // Don't auto-select first project, let user choose
      }
    } catch (error) {
      console.error("Failed to fetch users and projects:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setCreatingProject(true);
    try {
      const response = await projectsAPI.createProject({
        name: newProjectName.trim(),
        description: `Project created for task: ${title}`,
      });

      if (response.success) {
        const newProject = response.data;
        setProjects([...projects, newProject]);
        setProjectId(newProject.id);
        setNewProjectName("");
        setShowCreateProject(false);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (projects.length > 0 && !projectId)) return;
    if (!description.trim()) {
      setDescriptionError("Description is required");
      return;
    }
    if (description.trim().length < 10) {
      setDescriptionError("Description should be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      console.log('Creating task with data:', {
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: projectId,
        assignee_id: assigneeId || undefined,
        due_date: dueDate || undefined,
        priority,
        invitees,
      });
      
      await tasksAPI.createTask({
        title: title.trim(),
        description: description.trim(),
        project_id: projectId,
        assignee_id: assigneeId || undefined,
        due_date: dueDate || undefined,
        priority: priority || "Medium", // Ensure priority is never undefined
        invitees,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setDueDate("");
      setPriority("Medium");
      setProjectId("");
      setInvitees([]);
      setInviteName("");
      setInviteEmail("");

      onTaskCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const addInvitee = () => {
    const full_name = inviteName.trim();
    const email = inviteEmail.trim().toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!full_name || !emailValid) return;

    const existsInUsers = users.some((user) => user.email.toLowerCase() === email);
    const existsInInvitees = invitees.some((item) => item.email === email);
    if (existsInUsers || existsInInvitees) return;

    setInvitees((prev) => [...prev, { full_name, email }]);
    setInviteName("");
    setInviteEmail("");
  };

  const removeInvitee = (email: string) => {
    setInvitees((prev) => prev.filter((item) => item.email !== email));
  };

  const formatDescription = (
    mode: "bold" | "italic" | "bullet" | "numbered" | "quote",
  ) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.slice(start, end);
    const hasSelection = start !== end;

    const apply = (prefix: string, suffix: string = "") => {
      const next =
        description.slice(0, start) +
        (hasSelection ? `${prefix}${selectedText}${suffix}` : `${prefix}${suffix}`) +
        description.slice(end);
      setDescription(next.slice(0, 1000));
      if (descriptionError) setDescriptionError("");
    };

    if (mode === "bold") apply("**", "**");
    if (mode === "italic") apply("*", "*");
    if (mode === "bullet") apply("- ");
    if (mode === "numbered") apply("1. ");
    if (mode === "quote") apply("> ");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[760px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex flex-col">
            <h2 className="text-gray-900 text-xl font-bold leading-tight">
              Create New Task
            </h2>
            <p className="text-gray-600 text-xs font-normal">
              Add details to organize and assign work to your team.
            </p>
          </div>
          <button
            className="text-slate-400 hover:text-slate-600 transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body (Form) */}
        <div className="px-6 py-4 overflow-y-auto max-h-[80vh]">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
                Task Preview
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {title.trim() || "Untitled Task"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {priority} Priority {projectId ? "• Project Selected" : ""}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    priority === "High"
                      ? "bg-rose-100 text-rose-700"
                      : priority === "Medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {priority}
                </span>
              </div>
            </div>

            {/* Task Name */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 text-sm font-semibold">
                Task Name
              </label>
              <input
                className="w-full rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 h-12 px-4 placeholder:text-slate-400"
                placeholder="e.g. Design system update"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Project */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 text-sm font-semibold">
                Project
              </label>
              {projects.length > 0 ? (
                <select
                  className="w-full rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 h-12 px-4"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-3">
                  {!showCreateProject ? (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-slate-600 text-sm font-medium">
                          No projects available
                        </p>
                        <p className="text-slate-500 text-xs">
                          Create a project first to organize your tasks
                        </p>
                      </div>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        type="button"
                        onClick={() => setShowCreateProject(true)}
                      >
                        <span className="material-symbols-outlined text-sm">
                          add
                        </span>
                        Create Project
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-blue-900 text-sm font-medium">
                          Create New Project
                        </p>
                        <button
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          type="button"
                          onClick={() => {
                            setShowCreateProject(false);
                            setNewProjectName("");
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">
                            close
                          </span>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="flex-1 rounded-lg text-gray-900 border-blue-300 bg-white focus:ring-blue-600 focus:border-blue-600 h-10 px-3 text-sm placeholder:text-slate-400"
                          placeholder="Project name"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleCreateProject()
                          }
                        />
                        <button
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          type="button"
                          onClick={handleCreateProject}
                          disabled={!newProjectName.trim() || creatingProject}
                        >
                          {creatingProject ? "Creating..." : "Create"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Assignee & Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assignee */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 text-sm font-semibold">
                  Assignee
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 h-12 pl-10 pr-4 appearance-none"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                    <option value="">Select a team member</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                      <span className="material-symbols-outlined text-lg text-slate-500">
                        person
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 text-sm font-semibold">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 h-12 pl-10 px-4"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-lg">
                      calendar_today
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-900 text-sm font-semibold">
                Invite Collaborator (Not in Workspace)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2">
                <input
                  className="h-11 rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 px-3 text-sm"
                  placeholder="Full name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
                <input
                  className="h-11 rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 px-3 text-sm"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addInvitee}
                  className="h-11 rounded-lg bg-slate-900 text-white text-sm font-semibold px-4 hover:bg-slate-800"
                >
                  Add Invite
                </button>
              </div>
              {invitees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {invitees.map((item) => (
                    <div
                      key={item.email}
                      className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold"
                    >
                      <span>{item.full_name}</span>
                      <span className="text-slate-500">{item.email}</span>
                      <button
                        type="button"
                        onClick={() => removeInvitee(item.email)}
                        className="material-symbols-outlined text-[14px]"
                      >
                        close
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 text-sm font-semibold">
                Priority
              </label>
              <div className="flex gap-2">
                <button
                  className={`flex-1 py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-medium ${
                    priority === "Low"
                      ? "border-2 border-blue-600/40 bg-blue-600/5 text-blue-600 font-bold shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  type="button"
                  onClick={() => setPriority("Low")}
                >
                  <span className="size-2 rounded-full bg-emerald-500"></span>
                  Low
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-medium ${
                    priority === "Medium"
                      ? "border-2 border-blue-600/40 bg-blue-600/5 text-blue-600 font-bold shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  type="button"
                  onClick={() => setPriority("Medium")}
                >
                  <span className="size-2 rounded-full bg-amber-500"></span>
                  Medium
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-medium ${
                    priority === "High"
                      ? "border-2 border-blue-600/40 bg-blue-600/5 text-blue-600 font-bold shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  type="button"
                  onClick={() => setPriority("High")}
                >
                  <span className="size-2 rounded-full bg-rose-500"></span>
                  High
                </button>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="rounded-lg border border-cyan-200 bg-cyan-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-700 text-lg">
                    auto_awesome
                  </span>
                  <p className="text-sm font-semibold text-cyan-900">
                    Smart Task Assist
                  </p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700">
                  {aiLoading ? "Analyzing..." : "Automatic"}
                </span>
              </div>

              <p className="text-xs text-cyan-900/80">{aiSuggestion.reason}</p>
              {aiError && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  {aiError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  className="rounded-md border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-cyan-50 transition-colors"
                  onClick={() => setPriority(aiSuggestion.priority)}
                >
                  Apply Priority: {aiSuggestion.priority}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-cyan-50 transition-colors"
                  onClick={() =>
                    aiSuggestion.due_date && setDueDate(aiSuggestion.due_date)
                  }
                >
                  Apply Due Date
                </button>
                <button
                  type="button"
                  className="rounded-md border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-cyan-50 transition-colors"
                  onClick={() => {
                    const checklistText = aiSuggestion.checklist
                      .map((item) => `- ${item}`)
                      .join("\n");
                    const next = description.trim()
                      ? `${description.trim()}\n\nChecklist:\n${checklistText}`
                      : `Checklist:\n${checklistText}`;
                    setDescription(next);
                  }}
                >
                  Insert Checklist
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-900 text-sm font-semibold">
                  Description
                </label>
                <div className="flex gap-1">
                  <button
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    type="button"
                    onClick={() => formatDescription("bold")}
                  >
                    <span className="material-symbols-outlined text-lg">
                      format_bold
                    </span>
                  </button>
                  <button
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    type="button"
                    onClick={() => formatDescription("italic")}
                  >
                    <span className="material-symbols-outlined text-lg">
                      format_italic
                    </span>
                  </button>
                  <button
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    type="button"
                    onClick={() => formatDescription("bullet")}
                  >
                    <span className="material-symbols-outlined text-lg">
                      format_list_bulleted
                    </span>
                  </button>
                  <button
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    type="button"
                    onClick={() => formatDescription("numbered")}
                  >
                    <span className="material-symbols-outlined text-lg">
                      format_list_numbered
                    </span>
                  </button>
                  <button
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    type="button"
                    onClick={() => formatDescription("quote")}
                  >
                    <span className="material-symbols-outlined text-lg">
                      format_quote
                    </span>
                  </button>
                </div>
              </div>
              <textarea
                ref={descriptionRef}
                maxLength={1000}
                className={`w-full rounded-lg text-gray-900 border bg-white focus:ring-blue-600 focus:border-blue-600 min-h-[120px] p-4 text-sm placeholder:text-slate-400 ${
                  descriptionError ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="Describe the work to be done, outcome, and acceptance criteria..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descriptionError) setDescriptionError("");
                }}
              ></textarea>
              <div className="flex items-center justify-between">
                {descriptionError ? (
                  <p className="text-xs text-red-500">{descriptionError}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Description is required (min 10 characters).
                  </p>
                )}
                <p className="text-xs text-slate-400">{description.length}/1000</p>
              </div>
            </div>

            {/* Attachments Placeholder */}
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:border-blue-600/50 hover:text-blue-600 transition-all cursor-pointer">
              <span className="material-symbols-outlined">attach_file</span>
              <span className="text-sm font-medium">
                Drop files to attach or click to browse
              </span>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center gap-3">
          <button
            className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            type="submit"
            onClick={handleSubmit}
            disabled={
              loading ||
              !title.trim() ||
              !description.trim() ||
              description.trim().length < 10 ||
              (projects.length > 0 && !projectId)
            }
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
