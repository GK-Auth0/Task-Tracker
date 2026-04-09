import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiAssistantAPI, AiTaskSuggestion } from "../../services/aiAssistant";
import { buildTaskTemplate, appendTaskAiDraft } from "../../utils/descriptionTemplates";
import { TaskStatusValue } from "../../utils/taskStatus";

interface TaskOverviewTabProps {
  task: {
    id: string;
    title: string;
    description?: string;
    status: TaskStatusValue;
    priority: "Low" | "Medium" | "High";
    project: { id: string; name: string };
    sprint?: { id: string; name: string } | null;
    subtasks?: Array<{
      id: string;
      title: string;
      is_completed: boolean;
      assignee_id?: string;
      linked_task_id?: string;
      assignee?: { id: string; full_name: string; email: string };
    }>;
  };
  workspaceUsers: Array<{ id: string; full_name: string; email: string }>;
  aiSuggestion: AiTaskSuggestion | null;
  aiLoading: boolean;
  aiError: string;
  prioritySaving: boolean;
  onPriorityUpdate: (priority: "Low" | "Medium" | "High") => void;
  onTaskUpdate: (updates: { title: string; description: string }) => void;
  onSubtaskCreate: (title: string, assigneeId?: string) => void;
  onSubtaskUpdate: (subtaskId: string, updates: any) => void;
  onSubtaskDelete: (subtaskId: string) => void;
  onRefreshAi: () => void;
}

export default function TaskOverviewTab({
  task,
  workspaceUsers,
  aiSuggestion,
  aiLoading,
  aiError,
  prioritySaving,
  onPriorityUpdate,
  onTaskUpdate,
  onSubtaskCreate,
  onSubtaskUpdate,
  onSubtaskDelete,
  onRefreshAi,
}: TaskOverviewTabProps) {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title || "");
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editAiLoading, setEditAiLoading] = useState(false);
  const [editAiError, setEditAiError] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssigneeId, setNewSubtaskAssigneeId] = useState("");
  const [subtaskSaving, setSubtaskSaving] = useState(false);
  const [subtaskError, setSubtaskError] = useState("");
  const [comment, setComment] = useState("");

  const completedSubtasks = (task.subtasks || []).filter(s => s.is_completed).length;

  const handleSaveTaskEdits = async () => {
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
      await onTaskUpdate({ title: trimmedTitle, description: trimmedDescription });
      setEditMode(false);
    } catch (error: any) {
      setEditError(error?.message || "Failed to save task changes.");
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
      const suggestion = await aiAssistantAPI.suggestTask(titleSeed, editDescription.trim());
      setEditDescription(prev => appendTaskAiDraft(prev, titleSeed, suggestion).slice(0, 1000));
    } catch (error) {
      setEditAiError("AI ideas unavailable right now.");
    } finally {
      setEditAiLoading(false);
    }
  };

  const handleStartEditing = () => {
    setEditMode(true);
    setEditError("");
    setEditTitle(task?.title || "");
    setEditDescription(task?.description || "");
  };

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      setSubtaskSaving(true);
      setSubtaskError("");
      await onSubtaskCreate(newSubtaskTitle.trim(), newSubtaskAssigneeId || undefined);
      setNewSubtaskTitle("");
      setNewSubtaskAssigneeId("");
    } catch (error: any) {
      setSubtaskError(error?.message || "Failed to create subtask.");
    } finally {
      setSubtaskSaving(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      setSubtaskSaving(true);
      setSubtaskError("");
      await onSubtaskUpdate(subtaskId, { is_completed: isCompleted });
    } catch (error: any) {
      setSubtaskError(error?.message || "Failed to update subtask.");
    } finally {
      setSubtaskSaving(false);
    }
  };

  const handleSubtaskAssigneeChange = async (subtaskId: string, assigneeId: string) => {
    try {
      setSubtaskSaving(true);
      setSubtaskError("");
      await onSubtaskUpdate(subtaskId, { assignee_id: assigneeId || undefined });
    } catch (error: any) {
      setSubtaskError(error?.message || "Failed to update subtask assignee.");
    } finally {
      setSubtaskSaving(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      setSubtaskSaving(true);
      setSubtaskError("");
      await onSubtaskDelete(subtaskId);
    } catch (error: any) {
      setSubtaskError(error?.message || "Failed to delete subtask.");
    } finally {
      setSubtaskSaving(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    // For now, just clear the comment - you can add comment API later
    setComment("");
  };

  const navigateToCreateTestCase = () => {
    navigate(`/test-cases/create?sourceTaskId=${task.id}`);
  };

  return (
    <>
      {/* Description Section */}
      <div className="group relative space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Description</h3>
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
            <span className="material-symbols-outlined text-sm">edit</span>
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
              <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                placeholder="Task description"
              />
              <p className="mt-1 text-[11px] text-slate-500">{editDescription.length}/1000</p>
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

      {/* Subtasks Section */}
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

        {subtaskError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {subtaskError}
          </div>
        )}

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
                    onChange={(e) => handleToggleSubtask(subtask.id, e.target.checked)}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      subtask.linked_task_id && navigate(`/task/${subtask.linked_task_id}`)
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
                    onChange={(e) => handleSubtaskAssigneeChange(subtask.id, e.target.value)}
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
                  {subtask.linked_task_id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/task/${subtask.linked_task_id}`)}
                      className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                      aria-label="Open subtask"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete subtask"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
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

      {/* Test Case Shortcut */}
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

      {/* AI Assistant */}
      <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-blue-900">
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            AI Task Assistant
          </h3>
          <button
            className="h-8 px-3 rounded-md bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
            onClick={onRefreshAi}
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
                onClick={() => onPriorityUpdate(aiSuggestion.priority)}
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
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Why</p>
              <p className="mt-1 text-sm text-slate-700">{aiSuggestion.reason}</p>
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

      {/* Activity/Comments */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Activity</h3>
        <div className="space-y-4">
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
                      <span className="material-symbols-outlined text-xl">attach_file</span>
                    </button>
                    <button className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500">
                      <span className="material-symbols-outlined text-xl">mood</span>
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
  );
}
