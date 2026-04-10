import type { TaskStatusValue } from "../utils/taskStatus";
import { TaskIssueType, TaskPriority } from "../enums";

export interface TaskFilters {
  status?: TaskStatusValue;
  priority?: TaskPriority;
  project_id?: string;
  sprint_id?: string;
  due_from?: Date;
  due_to?: Date;
  created_from?: Date;
  created_to?: Date;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status: TaskStatusValue;
  priority: TaskPriority;
  issue_type?: TaskIssueType;
  project_id: string;
  assignee_id?: string;
  defect_id?: string;
  sprint_id?: string;
  creator_id: string;
  due_date?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatusValue;
  priority?: TaskPriority;
  issue_type?: TaskIssueType;
  assignee_id?: string;
  defect_id?: string;
  sprint_id?: string;
  due_date?: string;
}

export interface CreateSubtaskDto {
  title: string;
  assignee_id?: string;
}

export interface UpdateSubtaskDto {
  title?: string;
  is_completed?: boolean;
  assignee_id?: string;
}
