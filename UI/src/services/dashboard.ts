import api from './auth'

export interface DashboardSummary {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  todo_tasks: number
  overdue_tasks: number
  completion_rate: number
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'To Do' | 'In Progress' | 'Done'
  priority: 'Low' | 'Medium' | 'High'
  due_date?: string
  project: {
    id: string
    name: string
  }
  creator: {
    id: string
    full_name: string
    email: string
  }
  assignee?: {
    id: string
    full_name: string
    email: string
  }
  created_at: string
  updated_at: string
}

export const dashboardAPI = {
  getSummary: async (): Promise<{ success: boolean; data: DashboardSummary }> => {
    const response = await api.get('/api/dashboard/summary')
    return response.data
  },
}

export const usersAPI = {
  getUsers: async (): Promise<{ success: boolean; data: { id: string; full_name: string; email: string }[] }> => {
    const response = await api.get('/api/users')
    return response.data
  },
}

export const projectsAPI = {
  getProjects: async (): Promise<{ success: boolean; data: { id: string; name: string }[] }> => {
    const response = await api.get('/api/projects')
    return response.data
  },
}

export const tasksAPI = {
  getTasks: async (filters?: { 
    status?: string; 
    priority?: string; 
    project_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ 
    success: boolean; 
    data: Task[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.project_id) params.append('project_id', filters.project_id)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    const response = await api.get(`/api/tasks?${params.toString()}`)
    return response.data
  },

  createTask: async (data: {
    title: string
    description?: string
    project_id: string
    assignee_id?: string
    due_date?: string
    priority: 'Low' | 'Medium' | 'High'
  }): Promise<{ success: boolean; data: Task }> => {
    const response = await api.post('/api/tasks', data)
    return response.data
  },

  getTask: async (id: string): Promise<{ success: boolean; data: Task }> => {
    const response = await api.get(`/api/tasks/${id}`)
    return response.data
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<{ success: boolean; data: Task }> => {
    const response = await api.patch(`/api/tasks/${id}`, data)
    return response.data
  },
}