export interface TaskFilters {
  status?: string;
  priority?: string;
  project_id?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status: string;
  priority: string;
  project_id: string;
  assignee_id?: string;
  creator_id: string;
  due_date?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string;
  due_date?: string;
}
