export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: 'To Do' | 'In Progress' | 'Done';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
}

export interface TasksResponse {
  success: boolean;
  data: Task[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}