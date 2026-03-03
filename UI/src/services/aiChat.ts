import api from "./auth";

export interface AiChatResponse {
  success: boolean;
  data: {
    reply: string;
    contextSnapshot?: string;
  };
}

export const aiChatAPI = {
  chat: async (
    message: string,
    routeContext: string,
    responseMode: "concise" | "balanced" | "detailed" = "balanced",
  ): Promise<AiChatResponse> => {
    const response = await api.post("/api/ai/chat", {
      message,
      routeContext,
      responseMode,
    });
    return response.data;
  },
};

export default aiChatAPI;
