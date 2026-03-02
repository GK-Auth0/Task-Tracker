import { useState, useEffect } from "react";
import { dashboardAPI, tasksAPI } from "../services/dashboard";
import CreateTaskModal from "../components/CreateTaskModal";
import TasksHeader from "../components/tasks/TasksHeader";
import TasksFiltersBar from "../components/tasks/TasksFiltersBar";
import TasksList from "../components/tasks/TasksList";
import TasksPagination from "../components/tasks/TasksPagination";
import TasksEmptyState from "../components/tasks/TasksEmptyState";
import { DashboardSummary, TaskItem, TasksPagination as TasksPageData } from "../components/tasks/types";

export default function Dashboard() {
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
  const itemsPerPage = 5;

  useEffect(() => {
    fetchData();
  }, [filter, priorityFilter, statusFilter, currentPage]);

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

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await tasksAPI.updateTask(taskId, {
        status: completed ? "Done" : "To Do",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const visibleTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );

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

        {visibleTasks.length > 0 ? (
          <TasksList
            tasks={visibleTasks}
            onTaskToggle={handleTaskToggle}
            onTaskClick={(taskId) => {
              window.location.href = `/task/${taskId}`;
            }}
          />
        ) : (
          <TasksEmptyState onCreateTask={() => setShowCreateModal(true)} />
        )}

        <TasksPagination
          pagination={pagination}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />

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

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
