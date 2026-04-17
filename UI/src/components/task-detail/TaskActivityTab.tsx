import { ActivityLog } from "../../services/dashboard";
import { getFullName } from "../../utils/user";

interface TaskActivityTabProps {
  activityLogs: ActivityLog[];
  activityLoading: boolean;
}

const ACTIVITY_METADATA_KEYS = new Set(["timestamp", "action_time"]);

const ACTIVITY_FIELD_LABELS: Record<string, string> = {
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  due_date: "due date",
  assignee: "assignee",
  assignee_id: "assignee",
};

function asValidDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getActivityTimestamp(log: ActivityLog): string {
  const fallbackCandidates = [
    log.created_at,
    typeof log.changes?.timestamp === "string" ? log.changes.timestamp : null,
    log.changes?.action_time instanceof Date
      ? log.changes.action_time.toISOString()
      : typeof log.changes?.action_time === "string"
        ? log.changes.action_time
        : null,
  ];

  const validDate = fallbackCandidates
    .map(value => asValidDate(value))
    .find((value): value is Date => value !== null);

  return validDate ? validDate.toLocaleString() : "Time unavailable";
}

function getVisibleChangeKeys(log: ActivityLog): string[] {
  return Object.keys(log.changes || {}).filter(key => !ACTIVITY_METADATA_KEYS.has(key));
}

function formatChangeLabel(key: string): string {
  return ACTIVITY_FIELD_LABELS[key] || key.replace(/_/g, " ");
}

export default function TaskActivityTab({ activityLogs, activityLoading }: TaskActivityTabProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return { icon: "add_circle", color: "text-green-600" };
      case "status_changed":
        return { icon: "swap_horiz", color: "text-blue-600" };
      case "assigned":
        return { icon: "person_add", color: "text-purple-600" };
      case "unassigned":
        return { icon: "person_remove", color: "text-orange-600" };
      case "updated":
        return { icon: "edit", color: "text-amber-600" };
      case "deleted":
        return { icon: "delete", color: "text-red-600" };
      default:
        return { icon: "history", color: "text-slate-600" };
    }
  };

  const getActionText = (log: ActivityLog) => {
    switch (log.action) {
      case "created":
        return "created this task";
      case "status_changed":
        return `changed status from "${log.changes?.status?.from}" to "${log.changes?.status?.to}"`;
      case "assigned":
        return "assigned this task";
      case "unassigned":
        return "unassigned this task";
      case "updated": {
        const visibleChanges = getVisibleChangeKeys(log);
        if (visibleChanges.length === 0) {
          return "updated this task";
        }
        return `updated ${visibleChanges.map(formatChangeLabel).join(", ")}`;
      }
      case "deleted":
        return "deleted this task";
      default:
        return log.action;
    }
  };

  if (activityLoading) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Activity Log</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-2">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">Activity Log</h3>
      {activityLogs.length > 0 ? (
        <div className="space-y-4">
          {activityLogs.map(log => {
            const actorName = log.user ? getFullName(log.user) : "System";
            const actionIcon = getActionIcon(log.action);

            return (
              <div
                key={log.id}
                className="flex gap-3 p-4 bg-white border border-slate-200 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="bg-blue-600/20 text-blue-600 rounded-full size-8 flex items-center justify-center text-xs font-bold">
                    {actorName
                      .split(" ")
                      .map(n => n[0])
                      .join("")}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`material-symbols-outlined ${actionIcon.color} text-lg`}>
                      {actionIcon.icon}
                    </span>
                    <span className="font-semibold text-slate-900">{actorName}</span>
                    <span className="text-slate-600">{getActionText(log)}</span>
                  </div>
                  <div className="text-xs text-slate-500">{getActivityTimestamp(log)}</div>
                  {log.changes && getVisibleChangeKeys(log).length > 0 && (
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                      <details>
                        <summary className="cursor-pointer font-medium">View changes</summary>
                        <pre className="mt-1 text-[10px] overflow-x-auto">
                          {JSON.stringify(
                            Object.fromEntries(
                              Object.entries(log.changes).filter(
                                ([key]) => !ACTIVITY_METADATA_KEYS.has(key)
                              )
                            ),
                            null,
                            2
                          )}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-slate-500 text-center py-8">No activity found for this task.</div>
      )}
    </div>
  );
}