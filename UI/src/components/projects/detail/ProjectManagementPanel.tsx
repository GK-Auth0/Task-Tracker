import React, { useMemo, useState } from "react";
import { Project } from "../../../types/project";
import aiChatAPI from "../../../services/aiChat";
import { buildProjectTemplate } from "../../../utils/descriptionTemplates";
import { ProjectPriority } from "../../../enums";

interface ProjectUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface ProjectManagementPanelProps {
  project: Project;
  isOwnerOrAdmin: boolean;
  loadingUsers: boolean;
  searchedUsers: ProjectUser[];
  onSearchUsers: (query: string) => void;
  onAddMember: (userId: string, role: "admin" | "member" | "viewer") => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onUpdateMemberRole: (
    userId: string,
    role: "owner" | "admin" | "member" | "viewer",
  ) => Promise<void>;
  onUpdateProject: (payload: {
    name: string;
    description: string;
    priority: ProjectPriority;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
}

const ProjectManagementPanel: React.FC<ProjectManagementPanelProps> = ({
  project,
  isOwnerOrAdmin,
  loadingUsers,
  searchedUsers,
  onSearchUsers,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onUpdateProject,
}) => {
  const [search, setSearch] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member" | "viewer">("member");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [editName, setEditName] = useState(project.name || "");
  const [editDescription, setEditDescription] = useState(project.description || "");
  const [editPriority, setEditPriority] = useState<ProjectPriority>(project.priority || ProjectPriority.MEDIUM);
  const [editStartDate, setEditStartDate] = useState(project.startDate?.slice(0, 10) || "");
  const [editEndDate, setEditEndDate] = useState(project.endDate?.slice(0, 10) || "");

  const memberIds = useMemo(() => new Set((project.members || []).map((member) => member.user?.id)), [project.members]);

  if (!isOwnerOrAdmin) {
    return null;
  }

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      await onUpdateProject({
        name: editName.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        startDate: editStartDate || undefined,
        endDate: editEndDate || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = () => {
    setEditDescription(buildProjectTemplate(editName));
    setAiError("");
  };

  const handleGenerateAiDraft = async () => {
    const name = editName.trim() || project.name || "Untitled Project";
    try {
      setAiLoading(true);
      setAiError("");
      const prompt = [
        "Generate a practical project description using this section order:",
        "Overview, Problem Statement, Goals, Success Metrics, Scope, Milestones, Stakeholders, Risks & Mitigation.",
        `Project name: ${name}.`,
        "Use plain text bullets and keep it concise.",
      ].join(" ");
      const response = await aiChatAPI.chat(prompt, `/projects/${project.id}`, "balanced");
      const draft = String(response?.data?.reply || "").trim();
      if (!draft) {
        setAiError("AI did not return a draft.");
        return;
      }
      setEditDescription(draft.slice(0, 2000));
    } catch (error) {
      setAiError("AI draft unavailable right now.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-black text-slate-900">Project Management</h3>
        <span className="text-xs font-medium text-slate-500">Owner/Admin controls</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h4 className="text-sm font-bold text-slate-800">Edit Project</h4>
          <input
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm"
            placeholder="Project name"
          />
          <textarea
            value={editDescription}
            onChange={(event) => setEditDescription(event.target.value.slice(0, 2000))}
            maxLength={2000}
            className="w-full min-h-[92px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Project description"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleApplyTemplate}
              className="h-8 rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Jira Template
            </button>
            <button
              type="button"
              onClick={handleGenerateAiDraft}
              disabled={aiLoading || saving}
              className="h-8 rounded-md border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-800 hover:bg-cyan-100 disabled:opacity-60"
            >
              {aiLoading ? "Generating..." : "AI Draft"}
            </button>
            <span className="ml-auto text-[11px] text-slate-500">
              {editDescription.length}/2000
            </span>
          </div>
          {aiError && (
            <p className="text-xs text-amber-700 rounded-md border border-amber-200 bg-amber-50 px-2 py-1">
              {aiError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={editPriority}
              onChange={(event) => setEditPriority(event.target.value as ProjectPriority)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value={ProjectPriority.LOW}>Low</option>
              <option value={ProjectPriority.MEDIUM}>Medium</option>
              <option value={ProjectPriority.HIGH}>High</option>
            </select>
            <input
              type="date"
              value={editStartDate}
              onChange={(event) => setEditStartDate(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            />
            <input
              type="date"
              value={editEndDate}
              onChange={(event) => setEditEndDate(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveProject}
            disabled={saving || !editName.trim() || !editDescription.trim()}
            className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Update Project"}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h4 className="text-sm font-bold text-slate-800">Add Member</h4>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                onSearchUsers(value);
              }}
              className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-sm"
              placeholder="Search by name or email"
            />
            <select
              value={newMemberRole}
              onChange={(event) => setNewMemberRole(event.target.value as "admin" | "member" | "viewer")}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="max-h-44 overflow-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
            {loadingUsers ? (
              <p className="px-3 py-4 text-xs text-slate-500">Searching users...</p>
            ) : searchedUsers.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-500">No users found.</p>
            ) : (
              searchedUsers.map((item) => {
                const alreadyMember = memberIds.has(item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{item.email}</p>
                    </div>
                    <button
                      type="button"
                      disabled={alreadyMember}
                      onClick={() => onAddMember(item.id, newMemberRole)}
                      className="h-8 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      {alreadyMember ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
          <h4 className="text-sm font-bold text-slate-800">Current Members</h4>
        </div>
        <div className="divide-y divide-slate-100">
          {(project.members || []).length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No members available.</p>
          ) : (
            (project.members || []).map((member) => {
              const memberUserId =
                (member as any).userId ||
                (member as any).user_id ||
                (member.user as any)?.id;
              const memberName =
                (member.user as any)?.name ||
                (member.user as any)?.full_name ||
                "Unknown";
              const memberEmail = (member.user as any)?.email || "";

              return (
                <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{memberName}</p>
                    <p className="text-xs text-slate-500">{memberEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(event) =>
                        onUpdateMemberRole(
                          memberUserId,
                          event.target.value as "owner" | "admin" | "member" | "viewer",
                        )
                      }
                      disabled={member.role === "owner"}
                      className="h-8 rounded-md border border-slate-200 px-2 text-xs"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onRemoveMember(memberUserId)}
                      disabled={member.role === "owner"}
                      className="h-8 rounded-md border border-rose-200 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectManagementPanel;
