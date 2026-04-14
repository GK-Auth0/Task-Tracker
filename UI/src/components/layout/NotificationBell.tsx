import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auditLogsAPI, tasksAPI } from "../../services/dashboard";
import { chatAPI } from "../../services/chatService";
import { useAuth } from "../../contexts/AuthContext";

type NotificationType = "chat" | "task" | "project" | "system";
type NotificationAudience = "org" | "member";

interface NotificationItem {
  id: string;
  type: NotificationType;
  audience: NotificationAudience;
  title: string;
  subtitle: string;
  createdAt: string;
  route: string;
}

const READ_IDS_KEY = "task_tracker_notification_read_ids";
const POLL_MS = 45000;

const getRelativeTime = (value: string) => {
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return "";
  const deltaSec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (deltaSec < 60) return `${deltaSec}s ago`;
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)}h ago`;
  return `${Math.floor(deltaSec / 86400)}d ago`;
};

const normalizeDate = (value?: string) => {
  if (!value) return new Date().toISOString();
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return new Date().toISOString();
  return new Date(time).toISOString();
};

const getReadIdsStorageKey = (userId?: string, organizationId?: string | null) =>
  `${READ_IDS_KEY}:${userId || "anonymous"}:${organizationId || "no-org"}`;

const loadReadIds = (storageKey: string) => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
};

const saveReadIds = (storageKey: string, readIds: Set<string>) => {
  localStorage.setItem(storageKey, JSON.stringify([...readIds]));
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const readIdsStorageKey = getReadIdsStorageKey(user?.id, user?.organization_id);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | NotificationType>("all");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds(readIdsStorageKey));

  const fetchNotifications = async () => {
    if (!user?.id || !user.organization_id) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const [auditRes, taskRes, groupsRes] = await Promise.allSettled([
        auditLogsAPI.getActivityLogs({ limit: 20 }),
        tasksAPI.getTasks({ limit: 30 }),
        chatAPI.getGroups(),
      ]);

      const nextItems: NotificationItem[] = [];

      if (auditRes.status === "fulfilled" && auditRes.value.success) {
        for (const log of auditRes.value.data.slice(0, 10)) {
          const label = log.entity_type === "task" ? "Task" : "Project";
          nextItems.push({
            id: `audit-${log.id}`,
            type: log.entity_type === "task" ? "task" : "project",
            audience: "org",
            title: `Org ${label.toLowerCase()} ${log.action.replace("_", " ")}`,
            subtitle: log.user?.full_name
              ? `${log.user.full_name} updated your organization workspace`
              : "Organization workspace update",
            createdAt: normalizeDate(log.created_at),
            route: log.entity_type === "task" ? `/task/${log.entity_id}` : "/projects",
          });
        }
      }

      if (taskRes.status === "fulfilled" && taskRes.value.success) {
        const now = new Date();
        const todayOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).getTime();

        for (const task of taskRes.value.data) {
          if (!task.due_date || task.status === "Done") continue;
          const due = new Date(task.due_date);
          const dueOnly = new Date(
            due.getFullYear(),
            due.getMonth(),
            due.getDate(),
          ).getTime();
          if (Number.isNaN(dueOnly)) continue;

          if (dueOnly < todayOnly) {
            nextItems.push({
              id: `due-overdue-${task.id}-${task.due_date}`,
              type: "system",
              audience: "member",
              title: `Overdue: ${task.title}`,
              subtitle: "Assigned or created task is past due date",
              createdAt: normalizeDate(task.updated_at || task.created_at),
              route: `/task/${task.id}`,
            });
          } else if (dueOnly === todayOnly) {
            nextItems.push({
              id: `due-today-${task.id}-${task.due_date}`,
              type: "task",
              audience: "member",
              title: `Due today: ${task.title}`,
              subtitle: `Priority: ${task.priority}`,
              createdAt: normalizeDate(task.updated_at || task.created_at),
              route: `/task/${task.id}`,
            });
          }
        }
      }

      if (groupsRes.status === "fulfilled" && groupsRes.value.success) {
        const groups = groupsRes.value.data.slice(0, 5);
        const messageResults = await Promise.allSettled(
          groups.map((group) => chatAPI.getMessages(group.id, 1)),
        );

        messageResults.forEach((result, index) => {
          if (result.status !== "fulfilled" || !result.value.success) return;
          const latest = result.value.data[0];
          if (!latest) return;
          const group = groups[index];
          if (latest.user_id === user?.id) return;
          const from = latest.user?.full_name || "User";
          const preview = latest.content?.trim()
            ? latest.content.slice(0, 72)
            : latest.attachment_name
              ? `sent: ${latest.attachment_name}`
              : "sent an attachment";
          const tab = group.is_direct ? "direct" : "groups";
          const route = `/chat?tab=${encodeURIComponent(tab)}&group=${encodeURIComponent(group.id)}`;

          nextItems.push({
            id: `chat-${group.id}-${latest.id}`,
            type: "chat",
            audience: "member",
            title: `New in ${group.name}`,
            subtitle: `${from}: ${preview}`,
            createdAt: normalizeDate(latest.created_at),
            route,
          });
        });
      }

      const dedupedItems = nextItems.filter(
        (item, index, source) => source.findIndex((candidate) => candidate.id === item.id) === index,
      );

      dedupedItems.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setItems(dedupedItems.slice(0, 30));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setReadIds(loadReadIds(readIdsStorageKey));
  }, [readIdsStorageKey]);

  useEffect(() => {
    if (!user?.id) {
      setItems([]);
      return;
    }

    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, POLL_MS);
    return () => window.clearInterval(timer);
  }, [user?.id, user?.organization_id]);

  useEffect(() => {
    const onClickOutside = (event: PointerEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onClickOutside);
    return () => window.removeEventListener("pointerdown", onClickOutside);
  }, []);

  const visibleItems = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.type === filter)),
    [items, filter],
  );

  const unreadCount = useMemo(
    () => items.filter((item) => !readIds.has(item.id)).length,
    [items, readIds],
  );

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(readIdsStorageKey, next);
      return next;
    });
  };

  const markAllAsRead = () => {
    const next = new Set(readIds);
    items.forEach((item) => next.add(item.id));
    setReadIds(next);
    saveReadIds(readIdsStorageKey, next);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative touch-manipulation"
        onClick={() => setOpen((prev) => !prev)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-16 z-50 max-h-[70vh] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[360px] sm:max-w-[calc(100vw-2rem)] sm:max-h-[420px]">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">Notifications</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                onClick={fetchNotifications}
              >
                Refresh
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-slate-600 hover:text-slate-700"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap gap-1.5">
            {(["all", "chat", "task", "project", "system"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold ${
                  filter === type
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {type === "all" ? "All" : type[0].toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(70vh-112px)] overflow-y-auto sm:max-h-[320px]">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">Loading notifications...</p>
            ) : visibleItems.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No notifications</p>
            ) : (
              visibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                    readIds.has(item.id) ? "bg-white" : "bg-blue-50/40"
                  }`}
                  onClick={() => {
                    markAsRead(item.id);
                    setOpen(false);
                    navigate(item.route);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                            item.audience === "org"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.audience}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {getRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.subtitle}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
