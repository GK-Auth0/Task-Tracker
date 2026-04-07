import { TASK_STATUSES, getTaskStatusTone, type TaskStatusValue } from "../../utils/taskStatus";

interface TaskDetailHeaderProps {
  issueKey: string;
  issueTypeLabel: string;
  title: string;
  projectName: string;
  taskStatus: TaskStatusValue;
  taskPriority: string;
  priorityColors: { bg: string; text: string };
  slaLabel: string;
  issueHealthTone: string;
  createdDateLabel: string;
  creatorName: string;
  daysSinceCreated: number;
  pullRequestsCount: number;
  commitsCount: number;
  activityPulse: string;
  activityLogsCount: number;
  assigneeLabel: string;
  sprintName?: string | null;
  dueDateLabel: string;
  statusSaving: boolean;
  onOpenProject: () => void;
  onBack: () => void;
  onStatusChange: (status: TaskStatusValue) => void;
  onEdit: () => void;
  onAddTestCase: () => void;
  onMarkDone: () => void;
}

export default function TaskDetailHeader({
  issueKey,
  issueTypeLabel,
  title,
  projectName,
  taskStatus,
  taskPriority,
  priorityColors,
  slaLabel,
  issueHealthTone,
  createdDateLabel,
  creatorName,
  daysSinceCreated,
  pullRequestsCount,
  commitsCount,
  activityPulse,
  activityLogsCount,
  assigneeLabel,
  sprintName,
  dueDateLabel,
  statusSaving,
  onOpenProject,
  onBack,
  onStatusChange,
  onEdit,
  onAddTestCase,
  onMarkDone,
}: TaskDetailHeaderProps) {
  const statusTone = getTaskStatusTone(taskStatus);

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,1)_48%,rgba(239,246,255,0.9)_100%)] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
            <button type="button" onClick={onBack} className="font-medium hover:text-blue-600">
              Tasks
            </button>
            <span>/</span>
            <button type="button" onClick={onOpenProject} className="font-medium hover:text-blue-600">
              {projectName}
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-900">{issueKey}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenProject}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open project
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold tracking-[0.16em] text-slate-600">
                {issueKey}
              </span>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">
                {issueTypeLabel}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusTone.badge}`}>
                {taskStatus}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider ${priorityColors.text}`}>
                <span className={`h-2 w-2 rounded-full ${priorityColors.bg}`}></span>
                {taskPriority}
              </span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${issueHealthTone}`}>
                {slaLabel}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-[30px]">
                {title}
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
                Created by {creatorName} on {createdDateLabel}. Track delivery, execution context,
                linked quality work, and day-to-day progress from one issue view.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Project</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{projectName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Sprint</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{sprintName || "Backlog"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Assignee</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{assigneeLabel}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Due</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{dueDateLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Delivery</p>
            <p className="mt-1 text-sm font-bold text-blue-900">{slaLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Age</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{daysSinceCreated}d</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Engineering</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{pullRequestsCount} PRs • {commitsCount} commits</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Activity</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{activityPulse} • {activityLogsCount} logs</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={taskStatus}
              onChange={(event) => onStatusChange(event.target.value as TaskStatusValue)}
              disabled={statusSaving}
              aria-label="Task status"
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onEdit}>
              <span className="material-symbols-outlined text-base">edit_square</span>
              Update issue
            </button>
            <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onAddTestCase}>
              <span className="material-symbols-outlined text-base">add_task</span>
              Add test case
            </button>
          </div>

          <button
            className="inline-flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onMarkDone}
            disabled={taskStatus === "Done" || statusSaving}
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{taskStatus === "Done" ? "Completed" : statusSaving ? "Updating..." : "Mark as Complete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
