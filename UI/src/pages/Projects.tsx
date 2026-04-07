import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { projectService } from "../services/projectService";
import { tasksAPI } from "../services/dashboard";
import { aiAssistantAPI, AiProjectInsights } from "../services/aiAssistant";
import preferencesAPI, { PinnedItem, SavedView } from "../services/preferences";
import { Project, CreateProjectRequest } from "../types/project";
import CreateProjectModal from "../components/CreateProjectModal";
import ProjectsHeader from "../components/projects/ProjectsHeader";
import ProjectsFiltersBar, { ViewMode } from "../components/projects/ProjectsFiltersBar";
import ProjectsList from "../components/projects/ProjectsList";
import ProjectsEmptyState from "../components/projects/ProjectsEmptyState";
import { useAuth } from "../contexts/AuthContext";
import { canManageWorkspaceContent } from "../types/roles";
import { ProjectStatus } from "../enums";

type ProjectStatusFilter = "all" | ProjectStatus;

const Projects: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [insights, setInsights] = useState<AiProjectInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [pinnedProjectIds, setPinnedProjectIds] = useState<Set<string>>(new Set());
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState("");
  const [newViewName, setNewViewName] = useState("");
  const [savingView, setSavingView] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const canCreateProject = canManageWorkspaceContent(user?.role);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects();
      const payload = Array.isArray((response as any)?.data)
        ? (response as any).data
        : Array.isArray((response as any)?.data?.data)
          ? (response as any).data.data
          : [];
      setProjects(payload);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      setInsightsLoading(true);
      setInsightsError("");
      const tasksRes = await tasksAPI.getTasks({ limit: 200 });
      const payload = tasksRes.data.map((task) => ({
        title: task.title,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
      }));
      const result = await aiAssistantAPI.projectInsights(payload);
      setInsights(result);
    } catch (error) {
      setInsightsError("AI insights currently unavailable.");
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const fetchPinnedProjects = useCallback(async () => {
    try {
      const pins = await preferencesAPI.getPins("project");
      setPinnedProjectIds(new Set(pins.map((pin: PinnedItem) => pin.entity_id)));
    } catch (error) {
      console.error("Failed to load pinned projects:", error);
    }
  }, []);

  const fetchSavedViews = useCallback(async () => {
    try {
      const views = await preferencesAPI.getSavedViews("projects");
      setSavedViews(views);
    } catch (error) {
      console.error("Failed to load saved views:", error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchInsights();
    fetchPinnedProjects();
    fetchSavedViews();
  }, [fetchInsights, fetchPinnedProjects, fetchProjects, fetchSavedViews]);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  const handleCreateProject = useCallback(async (projectData: CreateProjectRequest) => {
    if (!canCreateProject) return null;
    try {
      const response = await projectService.createProject(projectData);
      if (!response.success) {
        throw new Error("Project creation failed");
      }
      setShowCreateModal(false);
      await fetchProjects();
      return {
        id: response.data.id,
        name: response.data.name,
      };
    } catch (error: any) {
      console.error("Error creating project:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      throw new Error(errorMessage);
    }
  }, [canCreateProject, fetchProjects]);

  const filteredProjects = projects.filter((project) => {
    const projectName = String(project?.name ?? "");
    const projectDescription = String(project?.description ?? "");
    const projectStatus = String(project?.status ?? "").toLowerCase();
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      projectName.toLowerCase().includes(normalizedSearch) ||
      projectDescription.toLowerCase().includes(normalizedSearch);
    const matchesStatus =
      statusFilter === "all" || projectStatus === statusFilter;
    const matchesPinned = !showPinnedOnly || pinnedProjectIds.has(project.id);
    return matchesSearch && matchesStatus && matchesPinned;
  });

  const handleToggleProjectPin = useCallback(async (projectId: string, shouldPin: boolean) => {
    try {
      if (shouldPin) {
        await preferencesAPI.addPin("project", projectId);
      } else {
        await preferencesAPI.removePin("project", projectId);
      }

      setPinnedProjectIds((prev) => {
        const next = new Set(prev);
        if (shouldPin) {
          next.add(projectId);
        } else {
          next.delete(projectId);
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to update project pin:", error);
    }
  }, []);

  const applySavedView = useCallback(() => {
    if (!selectedViewId) return;
    const view = savedViews.find((item) => item.id === selectedViewId);
    if (!view) return;
    const filters = view.filters;
    setSearchTerm(String(filters.searchTerm ?? ""));
    const status = String(filters.statusFilter ?? "all");
    if (
      status === "all" ||
      status === ProjectStatus.PLANNING ||
      status === ProjectStatus.ACTIVE ||
      status === ProjectStatus.ON_HOLD ||
      status === ProjectStatus.COMPLETED ||
      status === ProjectStatus.CANCELLED
    ) {
      setStatusFilter(status as ProjectStatusFilter);
    }
    setShowPinnedOnly(Boolean(filters.showPinnedOnly ?? false));
  }, [savedViews, selectedViewId]);

  const saveCurrentView = useCallback(async () => {
    if (!newViewName.trim()) return;
    try {
      setSavingView(true);
      await preferencesAPI.createSavedView({
        page: "projects",
        name: newViewName.trim(),
        filters: {
          searchTerm,
          statusFilter,
          showPinnedOnly,
        },
      });
      setNewViewName("");
      await fetchSavedViews();
    } catch (error) {
      console.error("Failed to save current project view:", error);
    } finally {
      setSavingView(false);
    }
  }, [fetchSavedViews, newViewName, searchTerm, showPinnedOnly, statusFilter]);

  const deleteSelectedView = useCallback(async () => {
    if (!selectedViewId) return;
    try {
      await preferencesAPI.deleteSavedView(selectedViewId);
      setSelectedViewId("");
      await fetchSavedViews();
    } catch (error) {
      console.error("Failed to delete saved project view:", error);
    }
  }, [fetchSavedViews, selectedViewId]);

  const handleOpenCreateProject = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateProject = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleTogglePinnedOnly = useCallback(() => {
    setShowPinnedOnly((previous) => !previous);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-8">
        <ProjectsHeader
          onCreate={handleOpenCreateProject}
          canCreate={canCreateProject}
        />

        <ProjectsFiltersBar
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          showPinnedOnly={showPinnedOnly}
          viewMode={viewMode}
          savedViews={savedViews.map((view) => ({ id: view.id, name: view.name }))}
          selectedViewId={selectedViewId}
          newViewName={newViewName}
          savingView={savingView}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onTogglePinnedOnly={handleTogglePinnedOnly}
          onViewModeChange={setViewMode}
          onSelectedViewIdChange={setSelectedViewId}
          onViewNameChange={setNewViewName}
          onApplyView={applySavedView}
          onSaveView={saveCurrentView}
          onDeleteView={deleteSelectedView}
        />

        <section className="mb-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  insights
                </span>
                AI Project Insights
              </p>
              {insights && (
                <p className="text-xs text-blue-900/80 mt-1">{insights.summary}</p>
              )}
            </div>
            <button
              type="button"
              onClick={fetchInsights}
              disabled={insightsLoading}
              className="h-9 px-4 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {insightsLoading ? "Analyzing..." : "Refresh Insights"}
            </button>
          </div>

          {insightsError && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              {insightsError}
            </p>
          )}

          {insights && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-blue-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Risk Level
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {insights.risk_level}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-white p-3 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Key Signals
                </p>
                <ul className="mt-1 space-y-1">
                  {insights.signals.slice(0, 3).map((signal) => (
                    <li key={signal} className="text-sm text-slate-700">
                      • {signal}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-blue-200 bg-white p-3 md:col-span-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recommendations
                </p>
                <ul className="mt-1 space-y-1">
                  {insights.recommendations.slice(0, 3).map((item) => (
                    <li key={item} className="text-sm text-slate-700">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <ProjectsList
          projects={filteredProjects}
          onCreate={handleOpenCreateProject}
          pinnedProjectIds={pinnedProjectIds}
          onProjectPinToggle={handleToggleProjectPin}
          canCreate={canCreateProject}
          viewMode={viewMode}
        />

        {filteredProjects.length === 0 && <ProjectsEmptyState />}
      </div>

      {/* Create Project Modal */}
      {canCreateProject && showCreateModal && (
        <CreateProjectModal
          onClose={handleCloseCreateProject}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
};

export default Projects;
