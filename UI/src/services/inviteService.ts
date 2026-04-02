import api from "./auth";

export interface InviteData {
  email: string;
  role: 'Admin' | 'Member' | 'Viewer';
}

export interface Invite {
  id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id?: string;
  invite_code: string;
  org_code?: string | null;
  status: 'pending' | 'accepted' | 'expired';
  sent_at: string;
  accepted_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  invitee?: {
    id: string;
    full_name: string;
    email: string;
    role?: 'Admin' | 'Member' | 'Viewer';
    avatar_url?: string;
  };
}

export interface InviteDetails {
  inviteCode: string;
  orgCode?: string | null;
  inviterName: string;
  inviteeEmail: string;
  status: string;
  expiresAt: string;
}

export const inviteAPI = {
  sendInvite: async (data: InviteData): Promise<{
    success: boolean;
    data?: {
      inviteCode: string;
      orgCode?: string | null;
      email: string;
      role: string;
    };
    message?: string;
    error?: string;
  }> => {
    const response = await api.post("/api/invites/send", data);
    return response.data;
  },

  getMyInvites: async (): Promise<{
    success: boolean;
    data: Invite[];
  }> => {
    const response = await api.get("/api/invites/my-invites");
    return response.data;
  },

  getInviteDetails: async (inviteCode: string): Promise<{
    success: boolean;
    data: InviteDetails;
  }> => {
    const response = await api.get(`/api/invites/${inviteCode}`);
    return response.data;
  },

  acceptInvite: async (inviteCode: string, data: {
    newPassword: string;
    fullName?: string;
  }): Promise<{
    success: boolean;
    data?: {
      email: string;
      fullName: string;
      role: string;
    };
    message?: string;
    error?: string;
  }> => {
    const response = await api.post(`/api/invites/${inviteCode}/accept`, data);
    return response.data;
  },

  changePassword: async (data: {
    email: string;
    currentPassword: string;
    newPassword: string;
    fullName?: string;
  }): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
  }> => {
    const response = await api.post("/api/invites/change-password", data);
    return response.data;
  },
};
