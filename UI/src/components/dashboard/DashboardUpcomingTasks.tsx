import React from "react";
import { DashboardOverviewUpcomingTask } from "../../services/dashboard";
import { getFullName } from "../../utils/user";

interface DashboardUpcomingTasksProps {
  tasks: DashboardOverviewUpcomingTask[];
  onOpenTask: (taskId: string) => void;
  onOpenTasksBoard: () => void;
  formatDueText: (daysToDue: number | null) => string;
  getPriorityClass: (priority: DashboardOverviewUpcomingTask["priority"]) => string;
  getStatusClass: (status: DashboardOverviewUpcomingTask["status"]) => string;
}

const DashboardUpcomingTasks: React.FC<DashboardUpcomingTasksProps> = ({
  tasks,
  onOpenTask,
  onOpenTasksBoard,
  formatDueText,
  getPriorityClass,
  getStatusClass,
}) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 sm:px-6 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Upcoming Tasks</h3>
          <p className="text-xs text-slate-500 mt-0.5">Prioritized by nearest due date</p>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          onClick={onOpenTasksBoard}
        >
          Manage tasks
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="p-6">
          <p className="text-sm text-slate-500">No upcoming tasks found.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Task</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Project</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Due</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => onOpenTask(task.id)}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">{task.title}</td>
                    <td className="px-4 py-3 text-slate-600">{task.project?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusClass(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getPriorityClass(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDueText(task.days_to_due)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.assignee ? getFullName(task.assignee) : "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden p-4 space-y-3">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTask(task.id)}
                className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                <p className="text-xs text-slate-500 mt-1">{task.project?.name || "No Project"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusClass(task.status)}`}
                  >
                    {task.status}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getPriorityClass(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDueText(task.days_to_due)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default DashboardUpcomingTasks;
