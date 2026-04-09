import api from "./auth";
import { normalizeTaskPriority } from "../utils/normalizeTaskPriority";
import type { TaskStatusValue } from "../utils/taskStatus";

export interface DashboardSummary {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

export interface DashboardOverviewUpcomingTask {
  id: string;
  title: string;
  status: TaskStatusValue;
  priority: "Low" | "Medium" | "High";
  due_date?: string;
  days_to_due: number | null;
  project: {
    id: string;
    name: string;
  } | null;
  assignee: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface DashboardOverviewActivity {
  id: string;
  entity_type: "task" | "project";
  entity_id: string;
  action:
    | "created"
    | "updated"
    | "deleted"
    | "status_changed"
    | "assigned"
    | "unassigned";
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  metrics: {
    open_tasks: number;
    high_priority_upcoming: number;
    due_today: number;
    due_this_week: number;
  };
  upcoming_tasks: DashboardOverviewUpcomingTask[];
  recent_activity: DashboardOverviewActivity[];
}

export interface DashboardInsightsProjectHealth {
  id: string;
  name: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
  completion_rate: number;
}

export interface DashboardInsights {
  task_status_breakdown: {
    todo: number;
    in_progress: number;
    done: number;
  };
  task_priority_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
  due_date_breakdown: {
    overdue: number;
    today: number;
    this_week: number;
    later: number;
    no_due_date: number;
  };
  project_status_breakdown: {
    planning: number;
    active: number;
    on_hold: number;
    completed: number;
    cancelled: number;
  };
  project_health: DashboardInsightsProjectHealth[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatusValue;
  priority: "Low" | "Medium" | "High";
  issue_type?: "Story" | "Task" | "Bug";
  due_date?: string;
  attachments?: Array<{
    id: string;
    original_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    created_at: string;
    uploader?: {
      id: string;
      full_name: string;
      email: string;
    };
  }>;
  subtasks?: Array<{
    id: string;
    title: string;
    is_completed: boolean;
    position?: number;
    assignee_id?: string;
    linked_task_id?: string;
    assignee?: {
      id: string;
      full_name: string;
      email: string;
    };
  }>;
  project: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    full_name: string;
    email: string;
  };
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  };
  defect_id?: string | null;
  sprint_id?: string | null;
  sprint?: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface PullRequest {
  id: string;
  title: string;
  status: "open" | "merged" | "closed";
  repository: string;
  branch: string;
  number: number;
  author: string;
  created_at: string;
  github_url: string;
}

export interface Commit {
  id: string;
  hash: string;
  message: string;
  author: {
    name: string;
    avatar: string;
  };
  created_at: string;
}

export interface ActivityLog {
  id: string;
  entity_type: "task" | "project";
  entity_id: string;
  action:
    | "created"
    | "updated"
    | "deleted"
    | "status_changed"
    | "assigned"
    | "unassigned";
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  old_values?: any;
  new_values?: any;
  changes?: any;
  created_at: string;
}

export const dashboardAPI = {
  getSummary: async (): Promise<{
    success: boolean;
    data: DashboardSummary;
  }> => {
    const response = await api.get("/api/dashboard/summary");
    return response.data;
  },

  getOverview: async (params?: {
    upcomingLimit?: number;
    activityLimit?: number;
  }): Promise<{
    success: boolean;
    data: DashboardOverview;
  }> => {
    const query = new URLSearchParams();
    if (params?.upcomingLimit) {
      query.append("upcomingLimit", String(params.upcomingLimit));
    }
    if (params?.activityLimit) {
      query.append("activityLimit", String(params.activityLimit));
    }
    const queryString = query.toString();
    const response = await api.get(
      `/api/dashboard/overview${queryString ? `?${queryString}` : ""}`,
    );
    return response.data;
  },

  getInsights: async (): Promise<{
    success: boolean;
    data: DashboardInsights;
  }> => {
    const response = await api.get("/api/dashboard/insights");
    return response.data;
  },
};

export const auditLogsAPI = {
  getActivityLogs: async (params?: {
    entity_type?: "task" | "project";
    entity_id?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: ActivityLog[];
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.entity_type) queryParams.append("entity_type", params.entity_type);
    if (params?.entity_id) queryParams.append("entity_id", params.entity_id);
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const response = await api.get(
      `/api/audit-logs${queryString ? `?${queryString}` : ""}`,
    );
    return response.data;
  },
};

export const usersAPI = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{
    success: boolean;
    data: {
      id: string;
      full_name: string;
      email: string;
      role: "Admin" | "Member" | "Viewer";
      avatar_url?: string;
    }[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.role) queryParams.append("role", params.role);

    const response = await api.get(`/api/users?${queryParams.toString()}`);
    return response.data;
  },
};

export const projectsAPI = {
  getProjects: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: { id: string; name: string }[];
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await api.get(
      `/api/projects${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
    );
    return response.data;
  },

  createProject: async (data: {
    name: string;
    description?: string;
  }): Promise<{ success: boolean; data: { id: string; name: string } }> => {
    const response = await api.post("/api/projects", data);
    return response.data;
  },

  getActivityLogs: async (
    projectId: string,
  ): Promise<{
    success: boolean;
    data: ActivityLog[];
  }> => {
    const response = await api.get(`/api/projects/${projectId}/activity`);
    return response.data;
  },
};

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
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.project_id) params.append("project_id", filters.project_id);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await api.get(`/api/v1/tasks?${params.toString()}`);
    return response.data;
  },

  createTask: async (data: {
    title: string;
    description: string;
    project_id: string;
    assignee_id?: string;
    defect_id?: string;
    sprint_id?: string;
    due_date?: string;
    priority: "Low" | "Medium" | "High";
    issue_type?: "Story" | "Task" | "Bug";
    invitees?: Array<{
      full_name: string;
      email: string;
    }>;
  }): Promise<{ success: boolean; data: Task }> => {
    const response = await api.post("/api/v1/tasks", {
      ...data,
      priority: normalizeTaskPriority(data.priority) || "Medium",
    });
    return response.data;
  },

  getTask: async (id: string): Promise<{ success: boolean; data: Task }> => {
    const response = await api.get(`/api/v1/tasks/${id}`);
    return response.data;
  },

  updateTask: async (
    id: string,
    data: Partial<Task>,
  ): Promise<{ success: boolean; data: Task }> => {
    const response = await api.patch(`/api/v1/tasks/${id}`, {
      ...data,
      ...(data.priority
        ? { priority: normalizeTaskPriority(data.priority) || data.priority }
        : {}),
    });
    return response.data;
  },

  deleteTask: async (
    id: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.delete(`/api/v1/tasks/${id}`);
    return response.data;
  },

  getPullRequests: async (
    taskId: string,
  ): Promise<{
    success: boolean;
    data: PullRequest[];
  }> => {
    const response = await api.get(`/api/v1/tasks/${taskId}/pull-requests`);
    return response.data;
  },

  getCommits: async (
    taskId: string,
  ): Promise<{
    success: boolean;
    data: Commit[];
  }> => {
    const response = await api.get(`/api/v1/tasks/${taskId}/commits`);
    return response.data;
  },

  getActivityLogs: async (
    taskId: string,
  ): Promise<{
    success: boolean;
    data: ActivityLog[];
  }> => {
    const response = await api.get(`/api/v1/tasks/${taskId}/activity`);
    return response.data;
  },

  uploadAttachment: async (
    taskId: string,
    file: File,
  ): Promise<{
    success: boolean;
    data: {
      id: string;
      original_name: string;
      file_url: string;
      file_size: number;
      mime_type: string;
      created_at: string;
      uploader?: {
        id: string;
        full_name: string;
        email: string;
      };
    };
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/api/v1/tasks/${taskId}/attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  createSubtask: async (
    taskId: string,
    data: { title: string; assignee_id?: string },
  ): Promise<{
    success: boolean;
    data: {
      id: string;
      title: string;
      is_completed: boolean;
      position?: number;
      assignee_id?: string;
      linked_task_id?: string;
      assignee?: {
        id: string;
        full_name: string;
        email: string;
      };
    };
  }> => {
    const response = await api.post(`/api/v1/tasks/${taskId}/subtasks`, data);
    return response.data;
  },

  updateSubtask: async (
    taskId: string,
    subtaskId: string,
    data: { title?: string; is_completed?: boolean; assignee_id?: string },
  ): Promise<{
    success: boolean;
    data: {
      id: string;
      title: string;
      is_completed: boolean;
      position?: number;
      assignee_id?: string;
      linked_task_id?: string;
      assignee?: {
        id: string;
        full_name: string;
        email: string;
      };
    };
  }> => {
    const response = await api.patch(
      `/api/v1/tasks/${taskId}/subtasks/${subtaskId}`,
      data,
    );
    return response.data;
  },

  deleteSubtask: async (
    taskId: string,
    subtaskId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.delete(
      `/api/v1/tasks/${taskId}/subtasks/${subtaskId}`,
    );
    return response.data;
  },
};
