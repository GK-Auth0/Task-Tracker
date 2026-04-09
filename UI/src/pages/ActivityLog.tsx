import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import {
  ActivityLog as AuditActivityLog,
  auditLogsAPI,
} from "../services/dashboard";

type ActivityKind =
  | "comment"
  | "status_change"
  | "assignment"
  | "priority_change"
  | "update";

interface ActivityItem {
  id: string;
  type: ActivityKind;
  user: {
    name: string;
    initials: string;
  };
  action: string;
  target?: string;
  targetUrl?: string;
  comment?: string;
  timestamp: string;
  createdAt: string;
  entityType: "task" | "project";
  badge: {
    type: "success" | "info" | "warning" | "assignment";
    icon: string;
  };
}

interface FiltersState {
  comments: boolean;
  statusChanges: boolean;
  assignments: boolean;
  priorityChanges: boolean;
  taskEvents: boolean;
  projectEvents: boolean;
  teamMember: string;
  dateRange: "last7days" | "last30days" | "thismonth" | "all";
  search: string;
  sortBy: "newest" | "oldest";
}

const DEFAULT_FILTERS: FiltersState = {
  comments: true,
  statusChanges: true,
  assignments: true,
  priorityChanges: true,
  taskEvents: true,
  projectEvents: true,
  teamMember: "all",
  dateRange: "all",
  search: "",
  sortBy: "newest",
};

const PAGE_SIZE = 30;

function asValidDate(input?: string | Date | null): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

const ActivityLog: React.FC = () => {
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const {
    data: logs = [],
    isLoading: loading,
    error,
    refetch: refetchActivities,
  } = useQuery<AuditActivityLog[]>(
    ["activity-logs"],
    async () => {
      const response = await auditLogsAPI.getActivityLogs({ limit: 500 });
      if (!response.success || !response.data) {
        return [];
      }
      return [...response.data].sort(
        (a, b) => getLogDate(b).getTime() - getLogDate(a).getTime(),
      );
    },
    {
      staleTime: 30_000,
    },
  );

  const errorMessage =
    (error as any)?.response?.data?.message ||
    (error as Error | null)?.message ||
    null;

  const handleFilterChange = <K extends keyof FiltersState>(
    key: K,
    value: FiltersState[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const teamMembers = useMemo(() => {
    const unique = new Set<string>();
    logs.forEach((log) => {
      if (log.user?.full_name) unique.add(log.user.full_name);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const activityItems = useMemo(() => logs.map(formatAction), [logs]);

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const searchTerm = filters.search.trim().toLowerCase();

    const result = activityItems.filter((item) => {
      const createdAt = asValidDate(item.createdAt);
      if (!createdAt) return false;

      if (filters.teamMember !== "all" && item.user.name !== filters.teamMember) {
        return false;
      }

      if (filters.dateRange === "last7days") {
        const from = new Date(now);
        from.setDate(now.getDate() - 7);
        if (createdAt < from) return false;
      } else if (filters.dateRange === "last30days") {
        const from = new Date(now);
        from.setDate(now.getDate() - 30);
        if (createdAt < from) return false;
      } else if (filters.dateRange === "thismonth") {
        if (
          createdAt.getMonth() !== now.getMonth() ||
          createdAt.getFullYear() !== now.getFullYear()
        ) {
          return false;
        }
      }

      if (item.type === "comment" && !filters.comments) return false;
      if (item.type === "status_change" && !filters.statusChanges) return false;
      if (item.type === "assignment" && !filters.assignments) return false;
      if (item.type === "priority_change" && !filters.priorityChanges) return false;

      if (item.entityType === "task" && !filters.taskEvents) return false;
      if (item.entityType === "project" && !filters.projectEvents) return false;

      if (searchTerm) {
        const searchable = [
          item.user.name,
          item.action,
          item.target || "",
          item.comment || "",
          item.entityType,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(searchTerm)) return false;
      }

      return true;
    });

    const sorted = [...result].sort((a, b) => {
      const diff =
        (asValidDate(b.createdAt)?.getTime() || 0) -
        (asValidDate(a.createdAt)?.getTime() || 0);
      return filters.sortBy === "newest" ? diff : -diff;
    });

    return sorted;
  }, [activityItems, filters]);

  const visibleActivities = useMemo(
    () => filteredActivities.slice(0, visibleCount),
    [filteredActivities, visibleCount],
  );

  const stats = useMemo(() => {
    return {
      total: filteredActivities.length,
      status: filteredActivities.filter((a) => a.type === "status_change").length,
      assignments: filteredActivities.filter((a) => a.type === "assignment").length,
      updates: filteredActivities.filter((a) => a.type === "update").length,
    };
  }, [filteredActivities]);

  const groupedActivities = useMemo(() => {
    const today = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    return visibleActivities.reduce(
      (acc, activity) => {
        const day = (asValidDate(activity.createdAt) || new Date(0)).toDateString();
        if (day === today) {
          acc.today.push(activity);
        } else if (day === yesterday) {
          acc.yesterday.push(activity);
        } else {
          acc.earlier.push(activity);
        }
        return acc;
      },
      {
        today: [] as ActivityItem[],
        yesterday: [] as ActivityItem[],
        earlier: [] as ActivityItem[],
      },
    );
  }, [visibleActivities]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2">Activity Log</h2>
            <p className="text-slate-500">Live timeline of project and task events from your workspace.</p>
          </div>

          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Filters
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Visible Events" value={stats.total} />
            <StatCard label="Status Changes" value={stats.status} />
            <StatCard label="Assignments" value={stats.assignments} />
            <StatCard label="Other Updates" value={stats.updates} />
          </div>

          <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  search
                </span>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search user, action, task/project..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  aria-label="Sort activities"
                  onChange={(e) =>
                    handleFilterChange("sortBy", e.target.value as FiltersState["sortBy"])
                  }
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-blue-600 focus:border-blue-600"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
                <button
                  onClick={() => void refetchActivities()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-500 mt-2">Loading activity...</p>
            </div>
          ) : errorMessage ? (
            <div className="text-center py-10">
              <p className="text-red-500">{errorMessage || "Failed to load activity logs. Please try again."}</p>
              <button
                onClick={() => void refetchActivities()}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No activity found for current filters.
            </div>
          ) : (
            <>
              {groupedActivities.today.length > 0 && (
                <ActivitySection title="Today" items={groupedActivities.today} />
              )}
              {groupedActivities.yesterday.length > 0 && (
                <ActivitySection title="Yesterday" items={groupedActivities.yesterday} />
              )}
              {groupedActivities.earlier.length > 0 && (
                <ActivitySection title="Earlier" items={groupedActivities.earlier} />
              )}

              {visibleCount < filteredActivities.length && (
                <div className="text-center py-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200"
                  >
                    Load More ({filteredActivities.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ActivityFiltersPanel
        className="hidden w-80 border-l border-slate-200 bg-slate-50 lg:flex"
        filters={filters}
        teamMembers={teamMembers}
        onFilterChange={handleFilterChange}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {showMobileFilters && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            onClick={() => setShowMobileFilters(false)}
            className="absolute inset-0 bg-slate-900/35"
            aria-label="Close filters"
          />
          <ActivityFiltersPanel
            className="absolute right-0 top-0 h-full w-[min(22rem,90vw)] border-l border-slate-200 bg-slate-50 shadow-2xl"
            filters={filters}
            teamMembers={teamMembers}
            onFilterChange={handleFilterChange}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            onClose={() => setShowMobileFilters(false)}
          />
        </div>
      )}
    </div>
  );
};

function getLogDate(log: AuditActivityLog): Date {
  return (
    asValidDate(log.created_at) ||
    asValidDate(log.changes?.timestamp) ||
    asValidDate(log.changes?.action_time) ||
    new Date()
  );
}

function isCommentLike(log: AuditActivityLog): boolean {
  return !!(
    log.changes?.comment ||
    log.new_values?.comment ||
    log.old_values?.comment
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatAction(log: AuditActivityLog): ActivityItem {
  const userName = log.user?.full_name || "System";
  const timestamp = getLogDate(log).toLocaleString();
  const createdAt = getLogDate(log).toISOString();
  const entityType = log.entity_type;

  const labelPrefix = entityType === "task" ? "Task" : "Project";
  const rawEntityId = String(log.entity_id || "");
  const fallbackLabel = rawEntityId ? `#${rawEntityId.slice(-4)}` : "record";
  const entityLabel =
    (log.new_values?.title as string | undefined) ||
    (log.old_values?.title as string | undefined) ||
    (log.new_values?.name as string | undefined) ||
    (log.old_values?.name as string | undefined) ||
    fallbackLabel;
  const target = `${labelPrefix} ${entityLabel}`;
  const targetUrl = rawEntityId
    ? entityType === "project"
      ? `/projects/${rawEntityId}`
      : `/task/${rawEntityId}`
    : undefined;

  const statusFrom =
    (log.changes?.status?.from as string | undefined) ||
    (log.old_values?.status as string | undefined);
  const statusTo =
    (log.changes?.status?.to as string | undefined) ||
    (log.new_values?.status as string | undefined);

  const priorityFrom =
    (log.changes?.priority?.from as string | undefined) ||
    (log.old_values?.priority as string | undefined);
  const priorityTo =
    (log.changes?.priority?.to as string | undefined) ||
    (log.new_values?.priority as string | undefined);

  if (log.action === "status_changed") {
    return {
      id: log.id,
      type: "status_change",
      user: { name: userName, initials: getInitials(userName) },
      action: "changed status on",
      target,
      targetUrl,
      timestamp,
      createdAt,
      entityType,
      badge: { type: "success", icon: "done_all" },
      comment:
        statusFrom && statusTo
          ? `Status changed from "${statusFrom}" to "${statusTo}"`
          : undefined,
    };
  }

  if (log.action === "assigned" || log.action === "unassigned") {
    return {
      id: log.id,
      type: "assignment",
      user: { name: userName, initials: getInitials(userName) },
      action: log.action === "assigned" ? "assigned" : "unassigned",
      target,
      targetUrl,
      timestamp,
      createdAt,
      entityType,
      badge: {
        type: "assignment",
        icon: log.action === "assigned" ? "person_add" : "person_remove",
      },
    };
  }

  if (priorityFrom || priorityTo) {
    return {
      id: log.id,
      type: "priority_change",
      user: { name: userName, initials: getInitials(userName) },
      action: "changed priority on",
      target,
      targetUrl,
      timestamp,
      createdAt,
      entityType,
      badge: { type: "warning", icon: "priority_high" },
      comment:
        priorityFrom && priorityTo
          ? `Priority changed from "${priorityFrom}" to "${priorityTo}"`
          : undefined,
    };
  }

  if (isCommentLike(log)) {
    return {
      id: log.id,
      type: "comment",
      user: { name: userName, initials: getInitials(userName) },
      action: "commented on",
      target,
      targetUrl,
      timestamp,
      createdAt,
      entityType,
      badge: { type: "info", icon: "chat" },
      comment:
        (log.changes?.comment as string | undefined) ||
        (log.new_values?.comment as string | undefined) ||
        (log.old_values?.comment as string | undefined),
    };
  }

  return {
    id: log.id,
    type: "update",
    user: { name: userName, initials: getInitials(userName) },
    action:
      log.action === "created"
        ? "created"
        : log.action === "deleted"
          ? "deleted"
          : "updated",
    target,
    targetUrl,
    timestamp,
    createdAt,
    entityType,
    badge: {
      type: log.action === "created" ? "success" : log.action === "deleted" ? "warning" : "info",
      icon: log.action === "created" ? "add_circle" : log.action === "deleted" ? "delete" : "edit",
    },
  };
}

function getBadgeColor(type: ActivityItem["badge"]["type"]): string {
  switch (type) {
    case "success":
      return "bg-green-500";
    case "info":
      return "bg-blue-600";
    case "warning":
      return "bg-orange-500";
    case "assignment":
    default:
      return "bg-slate-400";
  }
}

function ActivitySection({ title, items }: { title: string; items: ActivityItem[] }) {
  return (
    <div className="mb-10">
      <h3 className="sticky top-0 bg-white py-2 text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-6">
        {title}
      </h3>
      <div className="space-y-6">
        {items.map((activity) => (
          <div key={activity.id} className="flex gap-4">
            <div className="flex-shrink-0 relative">
              <div className="size-10 rounded-full bg-blue-600/15 text-blue-700 ring-2 ring-white flex items-center justify-center text-xs font-bold">
                {activity.user.initials}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 size-5 ${getBadgeColor(activity.badge.type)} rounded-full border-2 border-white flex items-center justify-center`}
              >
                <span className="material-symbols-outlined text-[12px] text-white">
                  {activity.badge.icon}
                </span>
              </div>
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm leading-relaxed">
                <span className="font-semibold">{activity.user.name}</span>{" "}
                {activity.action}{" "}
                {activity.target && activity.targetUrl && (
                  <Link
                    className="text-blue-600 font-medium hover:underline"
                    to={activity.targetUrl}
                  >
                    {activity.target}
                  </Link>
                )}
                <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">
                  {activity.entityType}
                </span>
              </p>
              {activity.comment && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border-l-4 border-blue-600/40 italic text-sm text-slate-600">
                  {activity.comment}
                </div>
              )}
              <span className="text-xs text-slate-400 mt-1 block">{activity.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4"
      />
      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
    </label>
  );
}

function RadioRow({
  label,
  value,
  selected,
  onChange,
}: {
  label: string;
  value: string;
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between group cursor-pointer">
      <span className="text-sm text-slate-600 group-hover:text-slate-900">{label}</span>
      <input
        type="radio"
        name="team"
        value={value}
        checked={selected === value}
        onChange={(e) => onChange(e.target.value)}
        className="border-slate-300 text-blue-600 focus:ring-blue-600 h-3 w-3"
      />
    </label>
  );
}

function ActivityFiltersPanel({
  className,
  filters,
  teamMembers,
  onFilterChange,
  onReset,
  onClose,
}: {
  className?: string;
  filters: FiltersState;
  teamMembers: string[];
  onFilterChange: <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => void;
  onReset: () => void;
  onClose?: () => void;
}) {
  return (
    <aside className={`flex flex-col overflow-y-auto p-6 ${className || ""}`}>
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Filters</h4>
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Reset
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-200"
              aria-label="Close filters panel"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="mb-8">
        <p className="mb-4 text-xs font-bold uppercase text-slate-400">Event Type</p>
        <div className="space-y-3">
          <CheckboxRow
            label="Comments"
            checked={filters.comments}
            onChange={(value) => onFilterChange("comments", value)}
          />
          <CheckboxRow
            label="Status Changes"
            checked={filters.statusChanges}
            onChange={(value) => onFilterChange("statusChanges", value)}
          />
          <CheckboxRow
            label="Assignments"
            checked={filters.assignments}
            onChange={(value) => onFilterChange("assignments", value)}
          />
          <CheckboxRow
            label="Priority Changes"
            checked={filters.priorityChanges}
            onChange={(value) => onFilterChange("priorityChanges", value)}
          />
        </div>
      </div>

      <div className="mb-8">
        <p className="mb-4 text-xs font-bold uppercase text-slate-400">Scope</p>
        <div className="space-y-3">
          <CheckboxRow
            label="Task Events"
            checked={filters.taskEvents}
            onChange={(value) => onFilterChange("taskEvents", value)}
          />
          <CheckboxRow
            label="Project Events"
            checked={filters.projectEvents}
            onChange={(value) => onFilterChange("projectEvents", value)}
          />
        </div>
      </div>

      <div className="mb-8">
        <p className="mb-4 text-xs font-bold uppercase text-slate-400">Team Member</p>
        <div className="space-y-3">
          <RadioRow
            label="All Members"
            value="all"
            selected={filters.teamMember}
            onChange={(value) => onFilterChange("teamMember", value)}
          />
          {teamMembers.map((member) => (
            <RadioRow
              key={member}
              label={member}
              value={member}
              selected={filters.teamMember}
              onChange={(value) => onFilterChange("teamMember", value)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-4 text-xs font-bold uppercase text-slate-400">Date Period</p>
        <select
          value={filters.dateRange}
          aria-label="Filter Activites"
          onChange={(e) =>
            onFilterChange(
              "dateRange",
              e.target.value as FiltersState["dateRange"],
            )
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:ring-blue-600"
        >
          <option value="last7days">Last 7 days</option>
          <option value="last30days">Last 30 days</option>
          <option value="thismonth">This month</option>
          <option value="all">All time</option>
        </select>
      </div>
    </aside>
  );
}

export default ActivityLog;
