import type { ActivityLog } from "../../../services/dashboard";
import { getFullName } from "../../../utils/user";

interface ProjectActivityTabProps {
  activityLoading: boolean;
  tabError: string;
  activityLogs: ActivityLog[];
}

export default function ProjectActivityTab({
  activityLoading,
  tabError,
  activityLogs,
}: ProjectActivityTabProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-lg font-black text-slate-900">Project Activity</h3>

      {activityLoading ? (
        <div className="py-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <p className="mt-2 text-sm text-slate-500">Loading activity...</p>
        </div>
      ) : tabError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {tabError}
        </div>
      ) : activityLogs.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">No activity found.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {activityLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-slate-900">{getFullName(log.user)}</span>
                <span className="text-slate-600">{log.action.replace(/_/g, " ")}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
