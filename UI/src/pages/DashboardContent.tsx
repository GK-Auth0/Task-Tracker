import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dashboardAPI, tasksAPI, Task, DashboardSummary } from '../services/dashboard'
import CreateTaskModal from '../components/CreateTaskModal'

export default function DashboardContent() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const itemsPerPage = 5

  useEffect(() => {
    fetchData()
  }, [filter, priorityFilter, statusFilter, currentPage])

  const fetchData = async () => {
    try {
      const filters: any = {
        page: currentPage,
        limit: itemsPerPage,
      }
      if (filter === 'In Progress') filters.status = 'In Progress'
      if (filter === 'High Priority') filters.priority = 'High'
      if (priorityFilter) filters.priority = priorityFilter
      if (statusFilter) filters.status = statusFilter

      const [summaryRes, tasksRes] = await Promise.all([
        dashboardAPI.getSummary(),
        tasksAPI.getTasks(filters),
      ])
      setSummary(summaryRes.data)
      setTasks(tasksRes.data)
      setPagination(tasksRes.pagination)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskCreated = () => {
    fetchData()
  }

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await tasksAPI.updateTask(taskId, {
        status: completed ? 'Done' : 'To Do',
      })
      const tasksRes = await tasksAPI.getTasks(
        filter === 'In Progress'
          ? { status: 'In Progress' }
          : filter === 'High Priority'
            ? { priority: 'High' }
            : {},
      )
      setTasks(tasksRes.data)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
      case 'Medium':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
      case 'Low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const taskDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    )

    if (taskDate < today) {
      return {
        text: `Overdue - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        isOverdue: true,
      }
    } else if (taskDate.getTime() === today.getTime()) {
      return { text: 'Today', isToday: true }
    } else {
      return {
        text: `Due ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        isOverdue: false,
      }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      {/* Page Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-gray-900 text-3xl font-black tracking-tight">
            My Tasks
          </h2>
          <p className="text-gray-600 mt-1">
            You have {summary?.total_tasks || 0} tasks,{' '}
            {summary?.overdue_tasks || 0} overdue.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>Create Task</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
          Filter by:
        </span>

        {/* Priority Dropdown */}
        <div className="relative">
          <button
            className="flex h-9 items-center gap-x-2 rounded-lg bg-white border border-slate-200 px-4 hover:border-blue-600/50 transition-colors"
            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
          >
            <p className="text-slate-700 text-sm font-medium">
              {priorityFilter || 'Priority'}
            </p>
            <span className="material-symbols-outlined text-slate-400 text-lg">
              expand_more
            </span>
          </button>
          {showPriorityDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg"
                onClick={() => {
                  setPriorityFilter('')
                  setShowPriorityDropdown(false)
                }}
              >
                All Priorities
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                  setPriorityFilter('High')
                  setShowPriorityDropdown(false)
                }}
              >
                High
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                  setPriorityFilter('Medium')
                  setShowPriorityDropdown(false)
                }}
              >
                Medium
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 last:rounded-b-lg"
                onClick={() => {
                  setPriorityFilter('Low')
                  setShowPriorityDropdown(false)
                }}
              >
                Low
              </button>
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <button
            className="flex h-9 items-center gap-x-2 rounded-lg bg-white border border-slate-200 px-4 hover:border-blue-600/50 transition-colors"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <p className="text-slate-700 text-sm font-medium">
              {statusFilter || 'Status'}
            </p>
            <span className="material-symbols-outlined text-slate-400 text-lg">
              expand_more
            </span>
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 first:rounded-t-lg"
                onClick={() => {
                  setStatusFilter('')
                  setShowStatusDropdown(false)
                }}
              >
                All Status
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                  setStatusFilter('To Do')
                  setShowStatusDropdown(false)
                }}
              >
                To Do
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                  setStatusFilter('In Progress')
                  setShowStatusDropdown(false)
                }}
              >
                In Progress
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 last:rounded-b-lg"
                onClick={() => {
                  setStatusFilter('Done')
                  setShowStatusDropdown(false)
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        <button
          className={`px-4 py-1.5 rounded-full text-xs font-bold ${
            filter === 'In Progress'
              ? 'bg-blue-600/10 text-blue-600'
              : 'bg-slate-100 text-slate-500'
          }`}
          onClick={() => setFilter('In Progress')}
        >
          In Progress
        </button>
        <button
          className={`px-4 py-1.5 rounded-full text-xs font-bold ${
            filter === 'High Priority'
              ? 'bg-blue-600/10 text-blue-600'
              : 'bg-slate-100 text-slate-500'
          }`}
          onClick={() => setFilter('High Priority')}
        >
          High Priority
        </button>
        <button
          className="text-blue-600 text-xs font-bold ml-auto hover:underline"
          onClick={() => {
            setFilter('')
            setPriorityFilter('')
            setStatusFilter('')
          }}
        >
          Clear all filters
        </button>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3">
        {tasks.map((task) => {
          const dateInfo = task.due_date
            ? formatDate(task.due_date)
            : null
          const isCompleted = task.status === 'Done'

          return (
            <div
              key={task.id}
              className="group flex items-center gap-4 bg-white px-6 py-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => (window.location.href = `/task/${task.id}`)}
            >
              <div className="flex size-6 items-center justify-center">
                <input
                  className="h-5 w-5 rounded border-slate-300 bg-transparent text-blue-600 focus:ring-blue-600 focus:ring-offset-0 focus:outline-none cursor-pointer"
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) =>
                    handleTaskToggle(task.id, e.target.checked)
                  }
                />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div className="flex flex-col">
                  <p
                    className={`text-gray-900 text-base font-semibold leading-normal group-hover:text-blue-600 transition-colors ${
                      isCompleted ? 'line-through opacity-60' : ''
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    {dateInfo && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span
                          className={`material-symbols-outlined text-sm ${
                            dateInfo.isOverdue
                              ? 'text-red-500'
                              : dateInfo.isToday
                                ? 'text-blue-600'
                                : ''
                          }`}
                        >
                          calendar_today
                        </span>
                        <span
                          className={
                            dateInfo.isOverdue
                              ? 'text-red-500 font-medium'
                              : dateInfo.isToday
                                ? 'text-blue-600 font-medium'
                                : ''
                          }
                        >
                          {dateInfo.text}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-sm">
                        chat_bubble
                      </span>
                      <span>0 comments</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {task.assignee ? (
                    <div className="size-8 rounded-full border-2 border-white bg-blue-600/20 flex items-center justify-center text-[10px] font-bold text-blue-600">
                      {task.assignee.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  ) : (
                    <div className="size-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      ??
                    </div>
                  )}
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </div>
                  <button className="p-1 text-slate-300 hover:text-slate-500 transition-colors">
                    <span className="material-symbols-outlined">
                      more_vert
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, pagination.total)} of{' '}
            {pagination.total} tasks
          </p>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum =
                    currentPage <= 3 ? i + 1 : currentPage - 2 + i
                  if (pageNum > pagination.totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 bg-white border border-slate-300 hover:bg-slate-50'
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                },
              )}
            </div>
            <button
              className="px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Load More */}
      <div className="mt-8 flex justify-center">
        <button
          className="text-slate-500 text-sm font-semibold hover:text-blue-600 transition-colors flex items-center gap-2"
          onClick={() => {
            setFilter('')
            setPriorityFilter('')
            setStatusFilter('')
            setCurrentPage(1)
          }}
        >
          View all tasks
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  )
}