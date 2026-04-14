import { Op } from "sequelize";
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

export const isDoneTaskStatus = (status?: string | null) =>
  DONE_TASK_STATUSES.includes((status || "") as TaskStatusValue);

export const isActiveTaskStatus = (status?: string | null) =>
  ACTIVE_TASK_STATUSES.includes((status || "") as TaskStatusValue);

export const isTodoTaskStatus = (status?: string | null) =>
  TODO_TASK_STATUSES.includes((status || "") as TaskStatusValue);

export const notDoneTaskStatusWhere = {
  [Op.notIn]: DONE_TASK_STATUSES,
};
