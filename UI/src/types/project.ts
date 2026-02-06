export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  startDate?: string;
  endDate?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  members?: ProjectMember[];
  tasks?: ProjectTask[];
  progress?: number;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  status?: "planning" | "active" | "on_hold";
  priority?: "low" | "medium" | "high";
  startDate?: string;
  endDate?: string;
  memberIds?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
  startDate?: string;
  endDate?: string;
}

export interface ProjectsResponse {
  data: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectResponse {
  success: boolean;
  data: Project;
}
