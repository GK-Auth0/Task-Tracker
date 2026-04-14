interface TaskDetailSidebarProps {
  assigneeInitials: string;
  assigneeLabel: string;
  projectName: string;
  sprintName?: string | null;
  dueDateLabel: string;
  issueTypeLabel: string;
  taskPriority: string;
  priorityColors: { bg: string; text: string };
  createdAtLabel: string;
  updatedAtLabel: string;
  slaLabel: string;
  pullRequestsCount: number;
  commitsCount: number;
  activityLogsCount: number;
  completedSubtasks: number;
  totalSubtasks: number;
  deleteSaving: boolean;
  onOpenProject: () => void;
  onAddTestCase: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskDetailSidebar({
  assigneeInitials,
  assigneeLabel,
  projectName,
  sprintName,
  dueDateLabel,
  issueTypeLabel,
  taskPriority,
  priorityColors,
  createdAtLabel,
  updatedAtLabel,
  slaLabel,
  pullRequestsCount,
  commitsCount,
  activityLogsCount,
  completedSubtasks,
  totalSubtasks,
  deleteSaving,
  onOpenProject,
  onAddTestCase,
  onEdit,
  onDelete,
}: TaskDetailSidebarProps) {
  return (
    <div className="bg-slate-50/70 p-4 sm:p-5">
      <div className="space-y-4 lg:sticky lg:top-6">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Issue Details</p>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-600/15 text-sm font-bold text-blue-700">
              {assigneeInitials}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Assignee</p>
              <p className="truncate text-sm font-semibold text-slate-900">{assigneeLabel}</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Project</label>
            <button type="button" onClick={onOpenProject} className="flex w-full items-center gap-3 rounded-lg bg-slate-50 p-2 text-left text-slate-900 hover:bg-blue-50">
              <span className="material-symbols-outlined text-blue-600">folder_open</span>
              <span className="text-sm font-semibold">{projectName}</span>
            </button>
          </div>
          {sprintName ? (
            <div className="space-y-2">
              <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Sprint</label>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 text-slate-900">
                <span className="material-symbols-outlined text-blue-600">view_kanban</span>
                <span className="text-sm font-semibold">{sprintName}</span>
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Due Date</label>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 text-slate-900">
              <span className="material-symbols-outlined text-blue-600">calendar_today</span>
              <span className="text-sm font-semibold">{dueDateLabel}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Issue Type</label>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2">
              <span className="material-symbols-outlined text-blue-600">confirmation_number</span>
              <span className="text-sm font-semibold text-slate-900">{issueTypeLabel}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Priority</label>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2">
              <div className={`h-3 w-3 rounded-full ${priorityColors.bg}`}></div>
              <span className={`text-sm font-semibold ${priorityColors.text}`}>{taskPriority}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Issue Timeline</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{createdAtLabel}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Last Updated</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{updatedAtLabel}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Delivery Signal</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{slaLabel}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Snapshot</p>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Linked PRs</span>
              <span className="font-semibold text-slate-900">{pullRequestsCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Related Commits</span>
              <span className="font-semibold text-slate-900">{commitsCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Activity Entries</span>
              <span className="font-semibold text-slate-900">{activityLogsCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Subtasks</span>
              <span className="font-semibold text-slate-900">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</p>
          <div className="space-y-2">
            <button type="button" onClick={onAddTestCase} className="w-full text-slate-700 transition-colors text-xs font-medium flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
              <span className="material-symbols-outlined text-sm">add_task</span>
              Open Coverage
            </button>
            <button type="button" onClick={onEdit} className="w-full text-slate-700 transition-colors text-xs font-medium flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
              <span className="material-symbols-outlined text-sm">edit_square</span>
              Update Task
            </button>
            <button type="button" onClick={onDelete} disabled={deleteSaving} className="w-full text-slate-500 hover:text-red-500 transition-colors text-xs font-medium flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
              <span className="material-symbols-outlined text-sm">delete</span>
              {deleteSaving ? "Deleting..." : "Delete Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
