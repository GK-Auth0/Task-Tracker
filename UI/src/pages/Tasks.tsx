import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { dashboardAPI, tasksAPI } from "../services/dashboard";
import { aiAssistantAPI, AiDayPlan } from "../services/aiAssistant";
import preferencesAPI, { PinnedItem, SavedView } from "../services/preferences";
import { useAuth } from "../contexts/AuthContext";
import RingLoader from "../components/RingLoader";
import CreateTaskModal from "../components/CreateTaskModal";
import TasksHeader from "../components/tasks/TasksHeader";
import TasksFiltersBar from "../components/tasks/TasksFiltersBar";
import TasksBoardTab from "../components/tasks/TasksBoardTab";
import TasksTimelineTab from "../components/tasks/TasksTimelineTab";
import TasksAiTab from "../components/tasks/TasksAiTab";
import TasksOverviewTab from "../components/tasks/TasksOverviewTab";
import TasksTabs, { TasksTabKey } from "../components/tasks/TasksTabs";
import {
  DashboardSummary,
  TaskGroupOption,
  TaskItem,
  TaskSortOption,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [sortBy, setSortBy] = useState<TaskSortOption>("recent");
  const [groupBy, setGroupBy] = useState<TaskGroupOption>("none");
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
  const [showManageViews, setShowManageViews] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
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
    .filter((task) => {
      if (!showCompleted) return task.status !== "Done";
      return true;
    })
    .filter((task) => {
      if (filter === "Due Soon") {
        if (!task.due_date) return false;
        const due = new Date(task.due_date);
        if (Number.isNaN(due.getTime())) return false;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.round(
          (new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() -
            today.getTime()) /
            86400000,
        );
        return diffDays >= 0 && diffDays <= 3;
      }
      if (filter === "My Focus") {
        return task.priority === "High" || task.status === "In Progress";
      }
      return true;
    })
    .filter((task) => !showPinnedOnly || pinnedTaskIds.has(task.id));

  const sortedTasks = [...visibleTasks].sort((a, b) => {
    const priorityWeight = (value: TaskItem["priority"]) =>
      value === "High" ? 3 : value === "Medium" ? 2 : 1;

    const dateWeight = (value?: string, fallback: number = Number.MAX_SAFE_INTEGER) => {
      if (!value) return fallback;
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    if (sortBy === "title_asc") {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === "priority_desc") {
      return priorityWeight(b.priority) - priorityWeight(a.priority);
    }
    if (sortBy === "priority_asc") {
      return priorityWeight(a.priority) - priorityWeight(b.priority);
    }
    if (sortBy === "due_asc") {
      return dateWeight(a.due_date) - dateWeight(b.due_date);
    }
    if (sortBy === "due_desc") {
      return dateWeight(b.due_date, 0) - dateWeight(a.due_date, 0);
    }
    return 0;
  });

  const highPriorityVisible = sortedTasks.filter(
    (task) => task.priority === "High" && task.status !== "Done",
  ).length;
  const inProgressVisible = sortedTasks.filter(
    (task) => task.status === "In Progress",
  ).length;
  const doneVisible = sortedTasks.filter((task) => task.status === "Done").length;
  const completionVisibleRate = sortedTasks.length
    ? Math.round((doneVisible / sortedTasks.length) * 100)
    : 0;

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
    setShowCompleted(
      filters.showCompleted === undefined ? true : Boolean(filters.showCompleted),
    );
    setCompactMode(Boolean(filters.compactMode ?? false));
    setSortBy(String(filters.sortBy ?? "recent") as TaskSortOption);
    setGroupBy(String(filters.groupBy ?? "none") as TaskGroupOption);
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
          showCompleted,
          compactMode,
          sortBy,
          groupBy,
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
        <RingLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8">
        <TasksHeader
          summary={summary}
          visibleCount={sortedTasks.length}
          onCreate={() => setShowCreateModal(true)}
          canCreate={canCreateTask}
        />

        <TasksFiltersBar
          filter={filter}
          priorityFilter={priorityFilter}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          showCompleted={showCompleted}
          compactMode={compactMode}
          sortBy={sortBy}
          groupBy={groupBy}
          onFilterChange={setFilter}
          onPriorityFilterChange={(value) => {
            setPriorityFilter(value);
            setCurrentPage(1);
          }}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          onSearchChange={setSearchTerm}
          onShowCompletedChange={setShowCompleted}
          onCompactModeChange={setCompactMode}
          onSortByChange={setSortBy}
          onGroupByChange={setGroupBy}
          onClearAll={() => {
            setFilter("");
            setPriorityFilter("");
            setStatusFilter("");
            setSearchTerm("");
            setShowCompleted(true);
            setCompactMode(false);
            setSortBy("recent");
            setGroupBy("none");
            setCurrentPage(1);
          }}
        />

        <section className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                Visible: {sortedTasks.length}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                Focus: {highPriorityVisible + inProgressVisible}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                Pinned: {pinnedTaskIds.size}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                Completion: {completionVisibleRate}%
              </span>
            </div>
            <button
              type="button"
              className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setShowMetrics((prev) => !prev)}
            >
              {showMetrics ? "Hide Details" : "Show Details"}
            </button>
          </div>
          {showMetrics && (
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Visible Tasks
                </p>
                <p className="mt-1 text-xl font-black text-slate-900">{sortedTasks.length}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Focus Queue
                </p>
                <p className="mt-1 text-xl font-black text-blue-800">
                  {highPriorityVisible + inProgressVisible}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Pinned
                </p>
                <p className="mt-1 text-xl font-black text-amber-800">{pinnedTaskIds.size}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Completion
                </p>
                <p className="mt-1 text-xl font-black text-slate-900">{completionVisibleRate}%</p>
              </div>
            </div>
          )}
        </section>

        <div className="mb-4 sticky top-2 z-20 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <TasksTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 px-1 pb-1 lg:pb-0">
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
              <button
                type="button"
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setShowManageViews((prev) => !prev)}
              >
                {showManageViews ? "Hide Views" : `Manage Views (${savedViews.length})`}
              </button>
            </div>
          </div>
          {showManageViews && (
            <div className="mt-3 border-t border-slate-200 px-2 pt-3 pb-1">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <select
                  value={selectedViewId}
                  onChange={(event) => setSelectedViewId(event.target.value)}
                  aria-label="Select a saved task view"
                  className="h-9 min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="">Select saved view</option>
                  {savedViews.map((view) => (
                    <option key={view.id} value={view.id}>
                      {view.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  onClick={applySavedView}
                  disabled={!selectedViewId}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="h-9 rounded-lg border border-rose-300 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  onClick={deleteSelectedView}
                  disabled={!selectedViewId}
                >
                  Delete
                </button>
                <input
                  value={newViewName}
                  onChange={(event) => setNewViewName(event.target.value)}
                  placeholder="New view name"
                  className="h-9 min-w-[170px] rounded-lg border border-slate-300 px-3 text-sm"
                />
                <button
                  type="button"
                  className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                  onClick={saveCurrentView}
                  disabled={savingView || !newViewName.trim()}
                >
                  {savingView ? <RingLoader size="sm" className="text-white" /> : "Save Current"}
                </button>
              </div>
            </div>
          )}
        </div>

        {activeTab === "overview" && (
          <TasksOverviewTab
            tasks={sortedTasks}
            canCreateTask={canCreateTask}
            pinnedTaskIds={pinnedTaskIds}
            groupBy={groupBy}
            compactMode={compactMode}
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
            tasks={sortedTasks}
            onTaskClick={(taskId) => navigate(`/task/${taskId}`)}
          />
        )}

        {activeTab === "timeline" && (
          <TasksTimelineTab
            tasks={sortedTasks}
            onTaskClick={(taskId) => navigate(`/task/${taskId}`)}
          />
        )}

        {activeTab === "ai" && (
          <TasksAiTab
            canCreateTask={canCreateTask}
            planning={planning}
            planError={planError}
            dayPlan={dayPlan}
            visibleTasks={sortedTasks}
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
