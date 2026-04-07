export const TASK_STATUSES = [
  "To Do",
  "In Progress",
  "Ready for QA",
  "In QA",
  "Blocked",
  "Done",
] as const;

export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const DONE_TASK_STATUSES: TaskStatusValue[] = ["Done"];
export const ACTIVE_TASK_STATUSES: TaskStatusValue[] = [
  "In Progress",
  "Ready for QA",
  "In QA",
  "Blocked",
];
export const TODO_TASK_STATUSES: TaskStatusValue[] = ["To Do"];

export const TASK_STATUS_TONES: Record<
  TaskStatusValue,
  { badge: string; dot: string; card: string; icon?: string }
> = {
  "To Do": {
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    card: "bg-slate-100 text-slate-700",
    icon: "radio_button_unchecked",
  },
  "In Progress": {
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    card: "bg-blue-100 text-blue-700",
    icon: "progress_activity",
  },
  "Ready for QA": {
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
    card: "bg-violet-100 text-violet-700",
    icon: "fact_check",
  },
  "In QA": {
    badge: "bg-cyan-100 text-cyan-700",
    dot: "bg-cyan-500",
    card: "bg-cyan-100 text-cyan-700",
    icon: "rule",
  },
  Blocked: {
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    card: "bg-rose-100 text-rose-700",
    icon: "block",
  },
  Done: {
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    card: "bg-emerald-100 text-emerald-700",
    icon: "check_circle",
  },
};

export const isDoneTaskStatus = (status?: string | null) =>
  status === "Done";

export const isActiveTaskStatus = (status?: string | null) =>
  status === "In Progress" ||
  status === "Ready for QA" ||
  status === "In QA" ||
  status === "Blocked";

export const getTaskStatusTone = (status: string) =>
  TASK_STATUS_TONES[(status as TaskStatusValue) || "To Do"] || TASK_STATUS_TONES["To Do"];

