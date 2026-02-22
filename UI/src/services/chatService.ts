import api from "./auth";

export interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  project_id?: string;
  created_by: string;
  is_project_group: boolean;
  memberCount: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const chatAPI = {
  getGroups: async (): Promise<{
    success: boolean;
    data: ChatGroup[];
  }> => {
    const response = await api.get("/api/chat/groups");
    return response.data;
  },

  createGroup: async (data: {
    name: string;
    description?: string;
  }): Promise<{
    success: boolean;
    data: ChatGroup;
  }> => {
    const response = await api.post("/api/chat/groups", data);
    return response.data;
  },

  getMessages: async (
    groupId: string,
    limit?: number
  ): Promise<{
    success: boolean;
    data: ChatMessage[];
  }> => {
    const params = limit ? `?limit=${limit}` : "";
    const response = await api.get(`/api/chat/groups/${groupId}/messages${params}`);
    return response.data;
  },

  sendMessage: async (
    groupId: string,
    data: {
      content: string;
      attachment_url?: string;
      attachment_name?: string;
    }
  ): Promise<{
    success: boolean;
    data: ChatMessage;
  }> => {
    const response = await api.post(`/api/chat/groups/${groupId}/messages`, data);
    return response.data;
  },
};