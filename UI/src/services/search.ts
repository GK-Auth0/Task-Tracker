import api from "./auth";

export interface GlobalSearchTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  updated_at: string;
  project: {
    id: string;
    name: string;
  } | null;
}

export interface GlobalSearchProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
  updated_at: string;
}

export const searchAPI = {
  global: async (
    q: string,
    limit = 5,
    signal?: AbortSignal,
  ): Promise<{
    success: boolean;
    data: {
      tasks: GlobalSearchTask[];
      projects: GlobalSearchProject[];
    };
  }> => {
    const response = await api.get("/api/search/global", {
      params: { q, limit },
      signal,
    });
    return response.data;
  },
};
