import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { dashboardAPI, tasksAPI } from "../services/dashboard";
import { aiAssistantAPI, AiDayPlan } from "../services/aiAssistant";
import preferencesAPI, { PinnedItem, SavedView } from "../services/preferences";
import { useAuth } from "../contexts/AuthContext";
import CreateTaskModal from "../components/CreateTaskModal";
import TasksHeader from "../components/tasks/TasksHeader";
import TasksFiltersBar from "../components/tasks/TasksFiltersBar";
import TasksBoardTab from "../components/tasks/TasksBoardTab";
import TasksTimelineTab from "../components/tasks/TasksTimelineTab";
import TasksAiTab from "../components/tasks/TasksAiTab";
import TasksOverviewTab from "../components/tasks/TasksOverviewTab";
import TasksTabs, { TasksTabKey } from "../components/tasks/TasksTabs";
import SavedViewsBar from "../components/preferences/SavedViewsBar";
import {
  DashboardSummary,
  TaskItem,
  TasksPagination as TasksPageData,
} from "../components/tasks/types";
import { canManageWorkspaceContent } from "../types/roles";

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<TasksPageData | null>(null);
  const [dayPlan, setDayPlan] = useState<AiDayPlan | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState("");
  const [pinnedTaskIds, setPinnedTaskIds] = useState<Set<string>>(new Set());
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState("");
  const [newViewName, setNewViewName] = useState("");
  const [savingView, setSavingView] = useState(false);
  const [activeTab, setActiveTab] = useState<TasksTabKey>("overview");
  const itemsPerPage = 12;
  const canCreateTask = canManageWorkspaceContent(user?.role);

  useEffect(() => {
    fetchData();
  }, [filter, priorityFilter, statusFilter, currentPage]);

  useEffect(() => {
    fetchPinnedTasks();
    fetchSavedViews();
  }, []);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query !== null) {
      setSearchTerm(query);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const filters: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (filter === "In Progress") filters.status = "In Progress";
      if (filter === "High Priority") filters.priority = "High";
      if (priorityFilter) filters.priority = priorityFilter;
      if (statusFilter) filters.status = statusFilter;

      const [summaryRes, tasksRes] = await Promise.all([
        dashboardAPI.getSummary(),
        tasksAPI.getTasks(filters),
      ]);
      setSummary(summaryRes.data);
      setTasks(tasksRes.data);
      setPagination(tasksRes.pagination || null);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    fetchData();
  };

  const fetchPinnedTasks = async () => {
    try {
      const pins = await preferencesAPI.getPins("task");
      setPinnedTaskIds(new Set(pins.map((pin: PinnedItem) => pin.entity_id)));
    } catch (error) {
      console.error("Failed to load pinned tasks:", error);
    }
  };

  const fetchSavedViews = async () => {
    try {
      const views = await preferencesAPI.getSavedViews("tasks");
      setSavedViews(views);
    } catch (error) {
      console.error("Failed to load saved views:", error);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!canCreateTask) return;
    try {
      await tasksAPI.updateTask(taskId, {
        status: completed ? "Done" : "To Do",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const visibleTasks = tasks
    .filter((task) =>
      task.title.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    )
    .filter((task) => !showPinnedOnly || pinnedTaskIds.has(task.id));

  const handleToggleTaskPin = async (taskId: string, shouldPin: boolean) => {
    try {
      if (shouldPin) {
        await preferencesAPI.addPin("task", taskId);
      } else {
        await preferencesAPI.removePin("task", taskId);
      }

      setPinnedTaskIds((prev) => {
        const next = new Set(prev);
        if (shouldPin) {
          next.add(taskId);
        } else {
          next.delete(taskId);
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to update task pin:", error);
    }
  };

  const applySavedView = () => {
    if (!selectedViewId) return;
    const view = savedViews.find((item) => item.id === selectedViewId);
    if (!view) return;
    const filters = view.filters;
    setFilter(String(filters.filter ?? ""));
    setPriorityFilter(String(filters.priorityFilter ?? ""));
    setStatusFilter(String(filters.statusFilter ?? ""));
    setSearchTerm(String(filters.searchTerm ?? ""));
    setShowPinnedOnly(Boolean(filters.showPinnedOnly ?? false));
    setCurrentPage(1);
  };

  const saveCurrentView = async () => {
    if (!newViewName.trim()) return;
    try {
      setSavingView(true);
      await preferencesAPI.createSavedView({
        page: "tasks",
        name: newViewName.trim(),
        filters: {
          filter,
          priorityFilter,
          statusFilter,
          searchTerm,
          showPinnedOnly,
        },
      });
      setNewViewName("");
      await fetchSavedViews();
    } catch (error) {
      console.error("Failed to save current view:", error);
    } finally {
      setSavingView(false);
    }
  };

  const deleteSelectedView = async () => {
    if (!selectedViewId) return;
    try {
      await preferencesAPI.deleteSavedView(selectedViewId);
      setSelectedViewId("");
      await fetchSavedViews();
    } catch (error) {
      console.error("Failed to delete saved view:", error);
    }
  };

  const buildDailyPlan = async () => {
    if (!canCreateTask) return;
    try {
      setPlanning(true);
      setPlanError("");
      const payload = visibleTasks.map((task) => ({
        title: task.title,
        priority: task.priority,
        due_date: task.due_date,
        status: task.status,
        estimated_hours:
          task.priority === "High" ? 3 : task.priority === "Medium" ? 2 : 1.25,
      }));
      const result = await aiAssistantAPI.planDay(payload, 6);
      setDayPlan(result);
    } catch (error) {
      setPlanError("AI planner unavailable right now.");
    } finally {
      setPlanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <TasksHeader
          summary={summary}
          onCreate={() => setShowCreateModal(true)}
          canCreate={canCreateTask}
        />

        <SavedViewsBar
          title="Task Saved Views"
          views={savedViews.map((view) => ({ id: view.id, name: view.name }))}
          selectedId={selectedViewId}
          viewName={newViewName}
          onSelectedIdChange={setSelectedViewId}
          onViewNameChange={setNewViewName}
          onApply={applySavedView}
          onSave={saveCurrentView}
          onDelete={deleteSelectedView}
          saving={savingView}
        />

        <TasksFiltersBar
          filter={filter}
          priorityFilter={priorityFilter}
          statusFilter={statusFilter}
          showPriorityDropdown={showPriorityDropdown}
          showStatusDropdown={showStatusDropdown}
          searchTerm={searchTerm}
          onFilterChange={setFilter}
          onPriorityFilterChange={(value) => {
            setPriorityFilter(value);
            setShowPriorityDropdown(false);
            setCurrentPage(1);
          }}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setShowStatusDropdown(false);
            setCurrentPage(1);
          }}
          onTogglePriorityDropdown={() =>
            setShowPriorityDropdown(!showPriorityDropdown)
          }
          onToggleStatusDropdown={() => setShowStatusDropdown(!showStatusDropdown)}
          onSearchChange={setSearchTerm}
          onClearAll={() => {
            setFilter("");
            setPriorityFilter("");
            setStatusFilter("");
            setSearchTerm("");
            setCurrentPage(1);
          }}
        />

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            className={`h-9 rounded-lg border px-3 text-sm font-semibold ${
              showPinnedOnly
                ? "border-amber-400 bg-amber-50 text-amber-800"
                : "border-slate-300 bg-white text-slate-700"
            }`}
            onClick={() => setShowPinnedOnly((previous) => !previous)}
          >
            {showPinnedOnly ? "Showing Pinned Tasks" : "Show Pinned Tasks Only"}
          </button>
        </div>

        <TasksTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "overview" && (
          <TasksOverviewTab
            tasks={visibleTasks}
            canCreateTask={canCreateTask}
            pinnedTaskIds={pinnedTaskIds}
            pagination={pagination}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onCreateTask={() => setShowCreateModal(true)}
            onTaskToggle={handleTaskToggle}
            onTaskClick={(taskId) => navigate(`/task/${taskId}`)}
            onTaskPinToggle={handleToggleTaskPin}
            onPageChange={setCurrentPage}
          />
        )}

        {activeTab === "board" && (
          <TasksBoardTab
            tasks={visibleTasks}
            onTaskClick={(taskId) => navigate(`/task/${taskId}`)}
          />
        )}

        {activeTab === "timeline" && (
          <TasksTimelineTab
            tasks={visibleTasks}
            onTaskClick={(taskId) => navigate(`/task/${taskId}`)}
          />
        )}

        {activeTab === "ai" && (
          <TasksAiTab
            canCreateTask={canCreateTask}
            planning={planning}
            planError={planError}
            dayPlan={dayPlan}
            visibleTasks={visibleTasks}
            onBuildDailyPlan={buildDailyPlan}
          />
        )}

        <div className="mt-8 flex justify-center">
          <button
            className="text-slate-500 text-sm font-semibold hover:text-blue-600 transition-colors flex items-center gap-2"
            onClick={() => {
              setFilter("");
              setPriorityFilter("");
              setStatusFilter("");
              setSearchTerm("");
              setCurrentPage(1);
            }}
          >
            View all tasks
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>

      {canCreateTask && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
