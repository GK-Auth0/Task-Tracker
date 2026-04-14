import { TaskStatus } from "../enums";

export const TASK_STATUSES = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.READY_FOR_QA,
  TaskStatus.IN_QA,
  TaskStatus.BLOCKED,
  TaskStatus.DONE,
] as const;

export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const DONE_TASK_STATUSES: TaskStatusValue[] = [TaskStatus.DONE];
export const ACTIVE_TASK_STATUSES: TaskStatusValue[] = [
  TaskStatus.IN_PROGRESS,
  TaskStatus.READY_FOR_QA,
  TaskStatus.IN_QA,
  TaskStatus.BLOCKED,
];
export const TODO_TASK_STATUSES: TaskStatusValue[] = [TaskStatus.TODO];
export const TASK_STATUS_ORDER: TaskStatusValue[] = [...TASK_STATUSES];

export const TASK_STATUS_TONES: Record<
  TaskStatusValue,
  { badge: string; dot: string; card: string; icon?: string }
> = {
  [TaskStatus.TODO]: {
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    card: "bg-slate-100 text-slate-700",
    icon: "radio_button_unchecked",
  },
  [TaskStatus.IN_PROGRESS]: {
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    card: "bg-blue-100 text-blue-700",
    icon: "progress_activity",
  },
  [TaskStatus.READY_FOR_QA]: {
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
    card: "bg-violet-100 text-violet-700",
    icon: "fact_check",
  },
  [TaskStatus.IN_QA]: {
    badge: "bg-cyan-100 text-cyan-700",
    dot: "bg-cyan-500",
    card: "bg-cyan-100 text-cyan-700",
    icon: "rule",
  },
  [TaskStatus.BLOCKED]: {
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    card: "bg-rose-100 text-rose-700",
    icon: "block",
  },
  [TaskStatus.DONE]: {
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    card: "bg-emerald-100 text-emerald-700",
    icon: "check_circle",
  },
};

export const isDoneTaskStatus = (status?: string | null) =>
  status === TaskStatus.DONE;

export const isActiveTaskStatus = (status?: string | null) =>
  status === TaskStatus.IN_PROGRESS ||
  status === TaskStatus.READY_FOR_QA ||
  status === TaskStatus.IN_QA ||
  status === TaskStatus.BLOCKED;

export const getTaskStatusTone = (status: string) =>
  TASK_STATUS_TONES[(status as TaskStatusValue) || TaskStatus.TODO] || TASK_STATUS_TONES[TaskStatus.TODO];
