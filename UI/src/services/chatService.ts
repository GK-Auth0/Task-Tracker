import api from "./auth";

export interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  project_id?: string;
  created_by: string;
  is_project_group: boolean;
  is_direct?: boolean;
  memberCount: number;
  members?: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
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
    member_ids?: string[];
  }): Promise<{
    success: boolean;
    data: ChatGroup;
  }> => {
    const response = await api.post("/api/chat/groups", data);
    return response.data;
  },

  getMessages: async (
    groupId: string,
    limit?: number,
    before?: string,
  ): Promise<{
    success: boolean;
    data: ChatMessage[];
  }> => {
    const query = new URLSearchParams();
    if (limit) query.append("limit", String(limit));
    if (before) query.append("before", before);
    const params = query.toString();
    const suffix = params ? `?${params}` : "";
    const response = await api.get(`/api/chat/groups/${groupId}/messages${suffix}`);
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

  searchUsers: async (
    q: string,
    limit: number = 20,
  ): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
    }>;
  }> => {
    const response = await api.get(
      `/api/chat/users/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    );
    return response.data;
  },

  openDirectChat: async (userId: string): Promise<{
    success: boolean;
    data: ChatGroup;
  }> => {
    const response = await api.post(`/api/chat/direct/${userId}`);
    return response.data;
  },

  uploadAttachment: async (
    groupId: string,
    file: File,
  ): Promise<{
    success: boolean;
    data: {
      attachment_url: string;
      attachment_name: string;
    };
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/api/chat/groups/${groupId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
