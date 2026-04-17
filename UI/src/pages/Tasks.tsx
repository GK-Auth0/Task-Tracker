import { useState, useEffect, useCallback, useMemo } from "react";
import { getFullName } from "../utils/user";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GridRowSelectionModel } from "@mui/x-data-grid";
import { useQuery, useQueryClient } from "react-query";
import { dashboardAPI, tasksAPI } from "../services/dashboard";
import { aiAssistantAPI, AiDayPlan } from "../services/aiAssistant";
import preferencesAPI, { PinnedItem } from "../services/preferences";
import { useAuth } from "../contexts/AuthContext";
import RingLoader from "../components/RingLoader";
import CreateTaskModal from "../components/CreateTaskModal";
import TasksHeader from "../components/tasks/TasksHeader";
import TasksFiltersBar, { ViewMode } from "../components/tasks/TasksFiltersBar";
import TasksBoardTab from "../components/tasks/TasksBoardTab";
import TasksTimelineTab from "../components/tasks/TasksTimelineTab";
import TasksAiTab from "../components/tasks/TasksAiTab";
import TasksOverviewTab from "../components/tasks/TasksOverviewTab";
import TasksTabs, { TasksTabKey } from "../components/tasks/TasksTabs";
import TableExportActions, { TableExportColumn } from "../components/TableExportActions";
import {
  TaskGroupOption,
  TaskItem,
  TaskSortOption,
} from "../components/tasks/types";
import { canManageWorkspaceContent } from "../types/roles";
import { TaskStatus } from "../enums";
import { isActiveTaskStatus, isDoneTaskStatus } from "../utils/taskStatus";

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dayPlan, setDayPlan] = useState<AiDayPlan | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState("");
  const [newViewName, setNewViewName] = useState("");
  const [savingView, setSavingView] = useState(false);
  const [activeTab, setActiveTab] = useState<TasksTabKey>("overview");
  const [showManageViews, setShowManageViews] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedRowIds, setSelectedRowIds] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });
  const canCreateTask = canManageWorkspaceContent(user?.role);

  const taskFilters = useMemo(() => {
    const filters: Record<string, string | number> = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (filter === TaskStatus.IN_PROGRESS) filters.status = TaskStatus.IN_PROGRESS;
    if (filter === "High Priority") filters.priority = "High";
    if (priorityFilter) filters.priority = priorityFilter;
    if (statusFilter) filters.status = statusFilter;
    return filters;
  }, [currentPage, filter, itemsPerPage, priorityFilter, statusFilter]);

  const { data: summary = null } = useQuery(
    ["dashboard-summary"],
    async () => {
      const response = await dashboardAPI.getSummary();
      return response.data;
    },
    {
      staleTime: 30_000,
    },
  );

  const { data: tasksQueryData, isLoading: tasksLoading } = useQuery(
    ["tasks-page-data", taskFilters],
    async () => {
      const response = await tasksAPI.getTasks(taskFilters);
      const tasks = (response.data as any[]).map((t) => ({
        ...t,
        assignee: t.assignee
          ? { ...t.assignee, full_name: getFullName(t.assignee) }
          : undefined,
      }));
      return {
        tasks,
        pagination: response.pagination || null,
      };
    },
    {
      keepPreviousData: true,
    },
  );

  const { data: pins = [] } = useQuery(
    ["task-pins"],
    () => preferencesAPI.getPins("task"),
    {
      staleTime: 30_000,
    },
  );

  const { data: savedViews = [] } = useQuery(
    ["saved-task-views"],
    () => preferencesAPI.getSavedViews("tasks"),
    {
      staleTime: 30_000,
    },
  );

  const tasks = tasksQueryData?.tasks || [];
  const pagination = tasksQueryData?.pagination || null;
  const pinnedTaskIds = useMemo(
    () => new Set(pins.map((pin: PinnedItem) => pin.entity_id)),
    [pins],
  );

  useEffect(() => {
    const query = searchParams.get("q");
    if (query !== null) {
      setSearchTerm(query);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const handleTaskCreated = useCallback(() => {
    queryClient.invalidateQueries(["tasks-page-data"]);
    queryClient.invalidateQueries(["dashboard-summary"]);
  }, [queryClient]);

  const handleTaskToggle = useCallback(async (taskId: string, completed: boolean) => {
    if (!canCreateTask) return;
    try {
      await tasksAPI.updateTask(taskId, {
        status: completed ? TaskStatus.DONE : TaskStatus.TODO,
      });
      await Promise.all([
        queryClient.invalidateQueries(["tasks-page-data"]),
        queryClient.invalidateQueries(["dashboard-summary"]),
      ]);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }, [canCreateTask, queryClient]);

  const visibleTasks = tasks
    .filter((task) =>
      task.title.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    )
    .filter((task) => {
      if (!showCompleted) return !isDoneTaskStatus(task.status);
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
        return task.priority === "High" || isActiveTaskStatus(task.status);
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
    (task) => task.priority === "High" && !isDoneTaskStatus(task.status),
  ).length;
  const inProgressVisible = sortedTasks.filter(
    (task) => isActiveTaskStatus(task.status),
  ).length;
  const doneVisible = sortedTasks.filter((task) => isDoneTaskStatus(task.status)).length;
  const selectedTasks = sortedTasks.filter((task) =>
    selectedRowIds.type === "include"
      ? selectedRowIds.ids.has(task.id)
      : !selectedRowIds.ids.has(task.id),
  );
  const exportColumns: TableExportColumn<TaskItem>[] = [
    { key: "title", label: "Task", value: (task) => task.title },
    { key: "status", label: "Status", value: (task) => task.status },
    { key: "priority", label: "Priority", value: (task) => task.priority },
    {
      key: "assignee",
      label: "Assignee",
      value: (task) => task.assignee?.full_name || "Unassigned",
    },
    {
      key: "due_date",
      label: "Due Date",
      value: (task) => {
        if (!task.due_date) return "No due date";
        const date = new Date(task.due_date);
        if (Number.isNaN(date.getTime())) return "No due date";
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
  ];
  const completionVisibleRate = sortedTasks.length
    ? Math.round((doneVisible / sortedTasks.length) * 100)
    : 0;

  const handleToggleTaskPin = useCallback(async (taskId: string, shouldPin: boolean) => {
    try {
      if (shouldPin) {
        await preferencesAPI.addPin("task", taskId);
      } else {
        await preferencesAPI.removePin("task", taskId);
      }
      await queryClient.invalidateQueries(["task-pins"]);
    } catch (error) {
      console.error("Failed to update task pin:", error);
    }
  }, [queryClient]);

  const applySavedView = useCallback(() => {
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
  }, [savedViews, selectedViewId]);

  const saveCurrentView = useCallback(async () => {
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
      await queryClient.invalidateQueries(["saved-task-views"]);
    } catch (error) {
      console.error("Failed to save current view:", error);
    } finally {
      setSavingView(false);
    }
  }, [
    compactMode,
    filter,
    groupBy,
    newViewName,
    queryClient,
    priorityFilter,
    searchTerm,
    showCompleted,
    showPinnedOnly,
    sortBy,
    statusFilter,
  ]);

  const deleteSelectedView = useCallback(async () => {
    if (!selectedViewId) return;
    try {
      await preferencesAPI.deleteSavedView(selectedViewId);
      setSelectedViewId("");
      await queryClient.invalidateQueries(["saved-task-views"]);
    } catch (error) {
      console.error("Failed to delete saved view:", error);
    }
  }, [queryClient, selectedViewId]);

  const buildDailyPlan = useCallback(async () => {
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
  }, [canCreateTask, visibleTasks]);

  const handleCreateTask = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handlePriorityFilterChange = useCallback((value: string) => {
    setPriorityFilter(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setSearchTerm("");
    setShowCompleted(true);
    setCompactMode(false);
    setSortBy("recent");
    setGroupBy("none");
    setCurrentPage(1);
  }, []);

  const handleTaskClick = useCallback((taskId: string) => {
    navigate(`/task/${taskId}`);
  }, [navigate]);

  if (tasksLoading && !tasksQueryData) {
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
          onCreate={handleCreateTask}
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
          viewMode={viewMode}
          onFilterChange={setFilter}
          onPriorityFilterChange={handlePriorityFilterChange}
          onStatusFilterChange={handleStatusFilterChange}
          onSearchChange={setSearchTerm}
          onShowCompletedChange={setShowCompleted}
          onCompactModeChange={setCompactMode}
          onSortByChange={setSortBy}
          onGroupByChange={setGroupBy}
          onViewModeChange={setViewMode}
          onClearAll={handleClearAllFilters}
        />

        <section className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                Visible: {sortedTasks.length}
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                Focus: {highPriorityVisible + inProgressVisible}
              </span>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                Pinned: {pinnedTaskIds.size}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                Done: {completionVisibleRate}%
              </span>
            </div>
            <button
              type="button"
              className="h-7 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setShowMetrics((prev) => !prev)}
            >
              {showMetrics ? "Hide" : "Details"}
            </button>
          </div>
          {showMetrics && (
            <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Visible Tasks
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">{sortedTasks.length}</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Focus Queue
                </p>
                <p className="mt-1 text-lg font-black text-blue-800">
                  {highPriorityVisible + inProgressVisible}
                </p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Pinned
                </p>
                <p className="mt-1 text-lg font-black text-amber-800">{pinnedTaskIds.size}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Completion
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">{completionVisibleRate}%</p>
              </div>
            </div>
          )}
        </section>

        <div className="mb-3 sticky top-2 z-20 rounded-xl border border-slate-200/90 bg-white/95 p-2 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <TasksTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1">
              {activeTab === "overview" && viewMode === "table" && (
                <TableExportActions
                  rows={sortedTasks}
                  selectedRows={selectedTasks}
                  columns={exportColumns}
                  fileNamePrefix="tasks"
                  variant="inline"
                />
              )}
              <button
                type="button"
                className={`h-8 rounded-md border px-2 text-xs font-medium ${
                  showPinnedOnly
                    ? "border-amber-400 bg-amber-50 text-amber-800"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setShowPinnedOnly((previous) => !previous)}
              >
                {showPinnedOnly ? "Pinned Only" : "Show Pinned"}
              </button>
              <button
                type="button"
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setShowManageViews((prev) => !prev)}
              >
                {showManageViews ? "Hide Views" : `Views (${savedViews.length})`}
              </button>
            </div>
          </div>
          {showManageViews && (
            <div className="mt-2 border-t border-slate-200 pt-2">
              <div className="flex flex-1 flex-wrap items-center gap-1">
                <select
                  value={selectedViewId}
                  onChange={(event) => setSelectedViewId(event.target.value)}
                  aria-label="Select a saved task view"
                  className="h-8 min-w-[140px] rounded-md border border-slate-300 bg-white px-2 text-xs"
                >
                  <option value="">Select view</option>
                  {savedViews.map((view) => (
                    <option key={view.id} value={view.id}>
                      {view.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="h-8 rounded-md border border-slate-300 px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  onClick={applySavedView}
                  disabled={!selectedViewId}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="h-8 rounded-md border border-red-300 px-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  onClick={deleteSelectedView}
                  disabled={!selectedViewId}
                >
                  Delete
                </button>
                <input
                  value={newViewName}
                  onChange={(event) => setNewViewName(event.target.value)}
                  placeholder="New view name"
                  className="h-8 min-w-[120px] rounded-md border border-slate-300 px-2 text-xs"
                />
                <button
                  type="button"
                  className="h-8 rounded-md bg-blue-600 px-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                  onClick={saveCurrentView}
                  disabled={savingView || !newViewName.trim()}
                >
                  {savingView ? <RingLoader size="sm" className="text-white" /> : "Save"}
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
            viewMode={viewMode}
            pagination={pagination}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onCreateTask={handleCreateTask}
            onTaskToggle={handleTaskToggle}
            onTaskClick={handleTaskClick}
            onTaskPinToggle={handleToggleTaskPin}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            selectedRowIds={selectedRowIds}
            onSelectedRowIdsChange={setSelectedRowIds}
          />
        )}

        {activeTab === "board" && (
          <TasksBoardTab
            tasks={sortedTasks}
            onTaskClick={handleTaskClick}
          />
        )}

        {activeTab === "timeline" && (
          <TasksTimelineTab
            tasks={sortedTasks}
            onTaskClick={handleTaskClick}
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
