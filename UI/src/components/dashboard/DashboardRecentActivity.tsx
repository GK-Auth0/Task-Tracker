import React from "react";
import { DashboardOverviewActivity } from "../../services/dashboard";

interface DashboardRecentActivityProps {
  activity: DashboardOverviewActivity[];
  onOpenActivity: () => void;
  formatActivityText: (item: DashboardOverviewActivity) => string;
}

const DashboardRecentActivity: React.FC<DashboardRecentActivityProps> = ({
  activity,
  onOpenActivity,
  formatActivityText,
}) => {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
        <button
          type="button"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          onClick={onOpenActivity}
        >
          View full log
        </button>
      </div>

      {activity.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No recent activity available.</p>
      ) : (
        <div className="mt-3 divide-y divide-slate-100">
          {activity.map((item) => (
            <div key={item.id} className="py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-700">{formatActivityText(item)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(item.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide rounded-full bg-slate-100 px-2 py-1 text-slate-600 font-semibold">
                {item.entity_type}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DashboardRecentActivity;
