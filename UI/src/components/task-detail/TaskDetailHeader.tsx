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
  const signalCards = [
    { label: "Delivery", value: slaLabel, tone: "border-blue-100 bg-blue-50/80 text-blue-900", labelTone: "text-blue-700" },
    { label: "Age", value: `${daysSinceCreated}d`, tone: "border-slate-200 bg-white text-slate-900", labelTone: "text-slate-500" },
    { label: "Engineering", value: `${pullRequestsCount} PRs • ${commitsCount} commits`, tone: "border-slate-200 bg-white text-slate-900", labelTone: "text-slate-500" },
    { label: "Activity", value: `${activityPulse} • ${activityLogsCount} logs`, tone: "border-slate-200 bg-white text-slate-900", labelTone: "text-slate-500" },
  ];

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,1)_48%,rgba(239,246,255,0.9)_100%)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
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
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Open project
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.75fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-600">
                {issueKey}
              </span>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
                {issueTypeLabel}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${statusTone.badge}`}>
                {taskStatus}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${priorityColors.text}`}>
                <span className={`h-2 w-2 rounded-full ${priorityColors.bg}`}></span>
                {taskPriority}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${issueHealthTone}`}>
                {slaLabel}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="max-w-4xl text-[30px] font-bold leading-[1.08] text-slate-900 sm:text-[34px]">
                {title}
              </h1>
              <p className="max-w-3xl text-[15px] leading-7 text-slate-500">
                Created by {creatorName} on {createdDateLabel}. Track delivery, execution context,
                linked quality work, and day-to-day progress from one issue view.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {signalCards.map((card) => (
                <div key={card.label} className={`rounded-xl border p-3 ${card.tone}`}>
                  <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${card.labelTone}`}>
                    {card.label}
                  </p>
                  <p className="mt-1 text-sm font-bold">{card.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-sm">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Project</p>
                <p className="mt-1 text-[15px] font-semibold leading-6 text-slate-900">{projectName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Sprint</p>
                <p className="mt-1 text-[15px] font-semibold leading-6 text-slate-900">{sprintName || "Backlog"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Assignee</p>
                <p className="mt-1 text-[15px] font-semibold leading-6 text-slate-900">{assigneeLabel}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Due</p>
                <p className="mt-1 text-[15px] font-semibold leading-6 text-slate-900">{dueDateLabel}</p>
              </div>
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Quick Actions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={onEdit}
                >
                  <span className="material-symbols-outlined text-base">edit_square</span>
                  Update issue
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={onAddTestCase}
                >
                  <span className="material-symbols-outlined text-base">add_task</span>
                  Add test case
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={taskStatus}
              onChange={(event) => onStatusChange(event.target.value as TaskStatusValue)}
              disabled={statusSaving}
              aria-label="Task status"
              className="h-10 min-w-[170px] rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
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
