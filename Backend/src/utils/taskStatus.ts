import { Op } from "sequelize";

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

export const isDoneTaskStatus = (status?: string | null) =>
  DONE_TASK_STATUSES.includes((status || "") as TaskStatusValue);

export const isActiveTaskStatus = (status?: string | null) =>
  ACTIVE_TASK_STATUSES.includes((status || "") as TaskStatusValue);

export const isTodoTaskStatus = (status?: string | null) =>
  TODO_TASK_STATUSES.includes((status || "") as TaskStatusValue);

export const notDoneTaskStatusWhere = {
  [Op.notIn]: DONE_TASK_STATUSES,
};

