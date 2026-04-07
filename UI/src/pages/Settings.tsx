import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { projectService } from "../services/projectService";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type {
  ProjectConfidentialAccessConfig,
  ProjectConfidentialAccessProjectSummary,
} from "../types/project";
import { isWorkspaceAdmin } from "../types/roles";

type SearchUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

const EMPTY_CONFIG: ProjectConfidentialAccessConfig = {
  access_scope: "specific_users",
  allowed_user_ids: [],
  allowed_users: [],
  updated_at: null,
};

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageProjectAccess = Boolean(user && isWorkspaceAdmin(user.role));

  const [projects, setProjects] = useState<ProjectConfidentialAccessProjectSummary[]>(
    [],
  );
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [draftConfig, setDraftConfig] =
    useState<ProjectConfidentialAccessConfig>(EMPTY_CONFIG);
  const [configSaving, setConfigSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [configMessage, setConfigMessage] = useState("");
  const [configError, setConfigError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<SearchUser[]>([]);
  const debouncedUserSearch = useDebouncedValue(userSearch, 300);

  useEffect(() => {
    if (!canManageProjectAccess) return;
    loadProjects();
  }, [canManageProjectAccess]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const loadProjects = async () => {
    try {
      setProjectsLoading(true);
      setProjectsError("");
      const response = await projectService.getConfidentialAccessProjects();
      const nextProjects = response.success ? response.data || [] : [];
      setProjects(nextProjects);

      if (nextProjects.length === 0) {
        setSelectedProjectId("");
        setDraftConfig(EMPTY_CONFIG);
        return;
      }

      setSelectedProjectId((current) => {
        const nextSelected =
          current && nextProjects.some((project) => project.id === current)
            ? current
            : nextProjects[0].id;
        const matched = nextProjects.find((project) => project.id === nextSelected);
        setDraftConfig(matched?.config || EMPTY_CONFIG);
        return nextSelected;
      });
    } catch (error: any) {
      setProjects([]);
      setProjectsError(
        error?.response?.data?.message || "Failed to load project access settings.",
      );
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleProjectChange = async (projectId: string) => {
    const nextProjectId = projectId;
    setSelectedProjectId(nextProjectId);
    setConfigMessage("");
    setConfigError("");
    setShowBulkConfirm(false);
    setUserSearch("");
    setUserOptions([]);

    if (!nextProjectId) {
      setDraftConfig(EMPTY_CONFIG);
      return;
    }

    const matched = projects.find((project) => project.id === nextProjectId);
    if (matched?.config) {
      setDraftConfig(matched.config);
      return;
    }

    try {
      const response = await projectService.getConfidentialAccessConfig(nextProjectId);
      setDraftConfig(response.success ? response.data : EMPTY_CONFIG);
    } catch (error: any) {
      setDraftConfig(EMPTY_CONFIG);
      setConfigError(
        error?.response?.data?.message || "Failed to load project access config.",
      );
    }
  };

  const handleScopeChange = (scope: "specific_users" | "organization") => {
    setConfigMessage("");
    setConfigError("");
    setDraftConfig((prev) => ({
      ...prev,
      access_scope: scope,
      allowed_user_ids: scope === "organization" ? [] : prev.allowed_user_ids,
      allowed_users: scope === "organization" ? [] : prev.allowed_users,
    }));
  };

  useEffect(() => {
    if (!canManageProjectAccess) return;

    const query = debouncedUserSearch.trim();
    if (!query) {
      setUserOptions([]);
      setUserSearchLoading(false);
      return;
    }

    let cancelled = false;

    const loadUserOptions = async () => {
      try {
        setUserSearchLoading(true);
        const response = await projectService.getProjectUsers(query);
        if (!cancelled) {
          setUserOptions(response.success ? response.data || [] : []);
        }
      } catch {
        if (!cancelled) {
          setUserOptions([]);
        }
      } finally {
        if (!cancelled) {
          setUserSearchLoading(false);
        }
      }
    };

    loadUserOptions();

    return () => {
      cancelled = true;
    };
  }, [canManageProjectAccess, debouncedUserSearch]);

  const handleUserSearch = (value: string) => {
    setUserSearch(value);
    if (!value.trim()) {
      setUserSearchLoading(false);
      setUserOptions([]);
    }
  };

  const handleToggleAllowedUser = (person: SearchUser) => {
    setConfigMessage("");
    setConfigError("");
    setDraftConfig((prev) => {
      const exists = prev.allowed_user_ids.includes(person.id);
      return {
        ...prev,
        access_scope: "specific_users",
        allowed_user_ids: exists
          ? prev.allowed_user_ids.filter((id) => id !== person.id)
          : [...prev.allowed_user_ids, person.id],
        allowed_users: exists
          ? prev.allowed_users.filter((userItem) => userItem.id !== person.id)
          : [...prev.allowed_users, person],
      };
    });
  };

  const handleRemoveAllowedUser = (userId: string) => {
    setConfigMessage("");
    setConfigError("");
    setDraftConfig((prev) => ({
      ...prev,
      allowed_user_ids: prev.allowed_user_ids.filter((id) => id !== userId),
      allowed_users: prev.allowed_users.filter((userItem) => userItem.id !== userId),
    }));
  };

  const handleSaveConfig = async () => {
    if (!selectedProjectId) return;

    try {
      setConfigSaving(true);
      setConfigMessage("");
      setConfigError("");
      const response = await projectService.updateConfidentialAccessConfig(
        selectedProjectId,
        {
          access_scope: draftConfig.access_scope,
          allowed_user_ids:
            draftConfig.access_scope === "organization"
              ? []
              : draftConfig.allowed_user_ids,
        },
      );

      if (response.success) {
        setDraftConfig(response.data);
        setConfigMessage("Project access settings saved.");
        setProjects((prev) =>
          prev.map((project) =>
            project.id === selectedProjectId
              ? { ...project, config: response.data }
              : project,
          ),
        );
      }
    } catch (error: any) {
      setConfigError(
        error?.response?.data?.message || "Failed to save project access settings.",
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const handleApplyToAllProjects = async () => {
    if (projects.length === 0 || bulkSaving) return;

    try {
      setBulkSaving(true);
      setConfigMessage("");
      setConfigError("");

      await Promise.all(
        projects.map((project) =>
          projectService.updateConfidentialAccessConfig(project.id, {
            access_scope: draftConfig.access_scope,
            allowed_user_ids:
              draftConfig.access_scope === "organization"
                ? []
                : draftConfig.allowed_user_ids,
          }),
        ),
      );

      setConfigMessage("Applied this permission rule to all projects.");
      await loadProjects();
      if (selectedProjectId) {
        const response = await projectService.getConfidentialAccessConfig(
          selectedProjectId,
        );
        setDraftConfig(response.success ? response.data : EMPTY_CONFIG);
      }
    } catch (error: any) {
      setConfigError(
        error?.response?.data?.message ||
          "Failed to apply permission rule to all projects.",
      );
    } finally {
      setBulkSaving(false);
      setShowBulkConfirm(false);
    }
  };

  const configuredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.config.access_scope === "organization" ||
          project.config.allowed_user_ids.length > 0,
      ),
    [projects],
  );

  const selectedProjectPermissionLabel = selectedProject
    ? canManageProjectAccess
      ? "Admin default access"
      : draftConfig.access_scope === "organization"
      ? "Whole organization"
      : draftConfig.allowed_users.length > 0
        ? `${draftConfig.allowed_users.length} selected people`
        : "No extra access granted"
    : "No project selected";

  const getProjectPermissionLabel = (
    project: ProjectConfidentialAccessProjectSummary,
  ) =>
    canManageProjectAccess
      ? "Admin default access"
      : project.config.access_scope === "organization"
      ? "Whole organization"
      : project.config.allowed_user_ids.length > 0
        ? `${project.config.allowed_user_ids.length} people`
        : "Restricted";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">
            Settings
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Workspace Preferences
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain workspace security and project-level access rules from one place.
          </p>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Project Access Control
            </h2>
            {!canManageProjectAccess ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Only workspace admins can manage project permission rules for the
                organization from this page.
              </div>
            ) : projectsLoading ? (
              <div className="text-sm text-slate-500">Loading project access settings...</div>
            ) : projectsError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {projectsError}
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No projects found for this organization.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">
                    {selectedProject
                      ? `${selectedProject.name} • ${selectedProjectPermissionLabel}`
                      : "Choose a project to view or change permission"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Click a project row below to open its options.
                  </p>
                </div>

                {projects.map((project) => {
                  const isSelected = project.id === selectedProjectId;

                  return (
                    <div
                      key={project.id}
                      className={`rounded-xl border transition-colors ${
                        isSelected
                          ? "border-blue-200 bg-blue-50/40"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleProjectChange(project.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {project.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {getProjectPermissionLabel(project)} • Owner {project.owner.full_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {isSelected ? "Open" : "Configure"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                            {project.status}
                          </span>
                          <span className="material-symbols-outlined text-slate-400">
                            {isSelected ? "expand_less" : "expand_more"}
                          </span>
                        </div>
                      </button>

                      {isSelected && (
                        <div className="border-t border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900">
                                {project.name}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                Owner: {project.owner.full_name} • Status: {project.status}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleSaveConfig}
                              disabled={configSaving || bulkSaving}
                              className="h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {configSaving ? "Saving..." : "Save Access"}
                            </button>
                          </div>

                          {configMessage && (
                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                              {configMessage}
                            </div>
                          )}
                          {configError && (
                            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                              {configError}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleScopeChange("organization")}
                              className={`rounded-lg border px-3 py-2 text-left ${
                                draftConfig.access_scope === "organization"
                                  ? "border-blue-300 bg-blue-50"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <p className="text-xs font-semibold text-slate-900">
                                Whole organization
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScopeChange("specific_users")}
                              className={`rounded-lg border px-3 py-2 text-left ${
                                draftConfig.access_scope === "specific_users"
                                  ? "border-blue-300 bg-blue-50"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <p className="text-xs font-semibold text-slate-900">
                                Few people only
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowBulkConfirm((value) => !value)}
                              disabled={bulkSaving || configSaving}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                            >
                              {showBulkConfirm ? "Hide Bulk Action" : "Apply To All Projects"}
                            </button>
                          </div>

                          {showBulkConfirm && (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                              <p className="text-sm font-semibold text-amber-900">
                                Apply this rule to all projects?
                              </p>
                              <p className="mt-1 text-xs text-amber-700">
                                This will update every project in the organization with the
                                current access setting.
                              </p>
                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleApplyToAllProjects}
                                  disabled={bulkSaving}
                                  className="h-8 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                                >
                                  {bulkSaving ? "Applying..." : "Confirm"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowBulkConfirm(false)}
                                  className="h-8 rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {draftConfig.access_scope === "organization" ? (
                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                              Everyone in the organization can access this project's protected details.
                            </div>
                          ) : null}

                          {draftConfig.access_scope === "specific_users" && (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Add people from the organization
                              </label>
                              <input
                                value={userSearch}
                                onChange={(event) => handleUserSearch(event.target.value)}
                                placeholder="Search by name or email"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                              />

                              <div className="mt-2 flex flex-wrap gap-2">
                                {draftConfig.allowed_users.length === 0 ? (
                                  <span className="text-xs text-slate-500">
                                    No users selected for this project yet.
                                  </span>
                                ) : (
                                  draftConfig.allowed_users.map((person) => (
                                    <span
                                      key={person.id}
                                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                    >
                                      {person.full_name}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAllowedUser(person.id)}
                                        className="text-slate-500 hover:text-rose-600"
                                        aria-label={`Remove ${person.full_name}`}
                                      >
                                        <span className="material-symbols-outlined text-sm">
                                          close
                                        </span>
                                      </button>
                                    </span>
                                  ))
                                )}
                              </div>

                              <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
                                {userSearchLoading ? (
                                  <p className="text-xs text-slate-500">Searching users...</p>
                                ) : userOptions.length === 0 && userSearch.trim() ? (
                                  <p className="text-xs text-slate-500">No matching users found.</p>
                                ) : (
                                  userOptions.map((person) => {
                                    const selected = draftConfig.allowed_user_ids.includes(
                                      person.id,
                                    );
                                    return (
                                      <button
                                        key={person.id}
                                        type="button"
                                        onClick={() => handleToggleAllowedUser(person)}
                                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${
                                          selected
                                            ? "border-blue-300 bg-blue-50"
                                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                                        }`}
                                      >
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">
                                            {person.full_name}
                                          </p>
                                          <p className="text-xs text-slate-500">{person.email}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500">
                                          {selected ? "Selected" : person.role}
                                        </span>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Permission Details
                            </p>
                            {draftConfig.access_scope === "organization" ? (
                              <p className="mt-1 text-sm text-slate-700">
                                Whole organization has access.
                              </p>
                            ) : draftConfig.allowed_users.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {draftConfig.allowed_users.map((person) => (
                                  <span
                                    key={person.id}
                                    className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {person.full_name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-1 text-sm text-slate-500">
                                No extra permission assigned.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Notifications
            </h2>
            <div className="space-y-3">
              {[
                {
                  label: "Task assignments",
                  helper: "Get alerted when a task is assigned to you.",
                },
                {
                  label: "Due date reminders",
                  helper: "Receive reminders 24 hours before due dates.",
                },
                {
                  label: "Project updates",
                  helper: "Stay informed about project status changes.",
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{item.helper}</p>
                  </div>
                  <input type="checkbox" className="mt-1 h-4 w-4" defaultChecked />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Security
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/change-password")}
                className="h-10 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Change Password
              </button>
              <button className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Enable 2FA
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Workspace
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/team")}
                className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Manage Team
              </button>
              <button className="h-10 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Invite Members
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Usage Summary
            </h3>
            <div className="text-xs text-slate-500 space-y-2">
              <p>Active projects: 5</p>
              <p>Open tasks: 23</p>
              <p>Team members: 8</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Access Summary
            </h3>
            <div className="text-xs text-slate-500 space-y-2">
              <p>Configured projects: {configuredProjects.length}</p>
              <p>Org-wide access projects: {configuredProjects.filter((project) => project.config.access_scope === "organization").length}</p>
              <p>Specific-user projects: {configuredProjects.filter((project) => project.config.access_scope === "specific_users").length}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Configured Projects
            </h3>
            <div className="space-y-2">
              {configuredProjects.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No project permission rules saved yet.
                </p>
              ) : (
                configuredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleProjectChange(project.id)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
                  >
                    <p className="text-sm font-medium text-slate-800">{project.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {project.config.access_scope === "organization"
                        ? "Whole organization"
                        : `${project.config.allowed_user_ids.length} specific user(s)`}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Support
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Need help? Visit our support hub or contact the team.
            </p>
            <button
              onClick={() => navigate("/help")}
              className="h-9 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              Open Help Center
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
