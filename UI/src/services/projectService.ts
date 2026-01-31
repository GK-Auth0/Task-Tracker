import axios from 'axios';
import { Project, CreateProjectRequest, UpdateProjectRequest, ProjectsResponse, ProjectResponse } from '../types/project';

import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const projectService = {
  // Get all projects
  getProjects: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ProjectsResponse> => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // Get project by ID
  getProject: async (id: string): Promise<ProjectResponse> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create new project
  createProject: async (data: CreateProjectRequest): Promise<ProjectResponse> => {
    console.log('API call - Creating project with data:', data);
    const response = await api.post('/projects', data);
    console.log('API response:', response.data);
    return response.data;
  },

  // Update project service to accept string UUID instead of number
  updateProject: async (id: string, data: UpdateProjectRequest): Promise<ProjectResponse> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  // Delete project
  deleteProject: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Add member to project
  addMember: async (projectId: number, userId: number, role: string = 'member'): Promise<void> => {
    await api.post(`/projects/${projectId}/members`, { userId, role });
  },

  // Remove member from project
  removeMember: async (projectId: number, userId: number): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  // Update member role
  updateMemberRole: async (projectId: number, userId: number, role: string): Promise<void> => {
    await api.put(`/projects/${projectId}/members/${userId}`, { role });
  },

  // Get project statistics
  getProjectStats: async (id: number): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    progress: number;
  }> => {
    const response = await api.get(`/projects/${id}/stats`);
    return response.data;
  },

  // Get project files
  getProjectFiles: async (id: string): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(`/projects/${id}/files`);
    return response.data;
  },
};

export default projectService;