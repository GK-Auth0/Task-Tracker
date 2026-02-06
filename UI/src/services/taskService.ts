import axios from "axios";
import { Task, CreateTaskRequest, TasksResponse } from "../types/task";

import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const taskService = {
  // Get all tasks
  getTasks: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    projectId?: string;
    assigneeId?: string;
  }): Promise<TasksResponse> => {
    // Convert frontend params to backend format
    const backendParams: any = {};
    if (params?.page) backendParams.page = params.page;
    if (params?.limit) backendParams.limit = params.limit;
    if (params?.status) backendParams.status = params.status;
    if (params?.priority) backendParams.priority = params.priority;
    if (params?.projectId) backendParams.project_id = params.projectId;
    if (params?.assigneeId) backendParams.assignee_id = params.assigneeId;

    const response = await api.get("/tasks", { params: backendParams });
    return response.data;
  },

  // Get task by ID
  getTask: async (id: string): Promise<{ success: boolean; data: Task }> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  createTask: async (
    data: CreateTaskRequest,
  ): Promise<{ success: boolean; data: Task }> => {
    const response = await api.post("/tasks", data);
    return response.data;
  },

  // Update task
  updateTask: async (
    id: string,
    data: Partial<CreateTaskRequest>,
  ): Promise<{ success: boolean; data: Task }> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Delete task
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

export default taskService;
