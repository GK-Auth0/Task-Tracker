import { TASK_STATUSES, getTaskStatusTone, type TaskStatusValue } from "../../utils/taskStatus";

interface TaskDetailHeaderProps {
  issueKey: string;
  issueTypeLabel: string;
  title: string;
  projectName: string;
  taskStatus: TaskStatusValue;
  taskPriority: string;
  priorityColors: { bg: string; text: string };
  createdDateLabel: string;
  creatorName: string;
  statusSaving: boolean;
  onOpenProject: () => void;
  onBack: () => void;
  onStatusChange: (status: TaskStatusValue) => void;
}

export default function TaskDetailHeader({
  issueKey,
  issueTypeLabel,
  title,
  projectName,
  taskStatus,
  taskPriority,
  priorityColors,
  createdDateLabel,
  creatorName,
  statusSaving,
  onOpenProject,
  onBack,
  onStatusChange,
}: TaskDetailHeaderProps) {
  const statusTone = getTaskStatusTone(taskStatus);

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,1)_62%,rgba(239,246,255,0.82)_100%)] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
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
              onClick={onBack}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onOpenProject}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Open project
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
              </div>

              <div className="lg:ml-4 lg:flex lg:justify-end">
                <div className="flex flex-col gap-1.5">
                  <select
                    value={taskStatus}
                    onChange={(event) => onStatusChange(event.target.value as TaskStatusValue)}
                    disabled={statusSaving}
                    aria-label="Task status"
                    className="h-9 min-w-[190px] rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="max-w-4xl text-[28px] font-bold leading-[1.08] text-slate-900 sm:text-[32px]">
                {title}
              </h1>
              <p className="max-w-3xl text-[15px] leading-6 text-slate-500">
                Created by {creatorName} on {createdDateLabel}. Everything important for delivery,
                quality, and engineering progress is organized below.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
