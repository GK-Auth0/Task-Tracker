import api from "./auth";

export interface AiChatHistoryItem {
  role: "user" | "assistant";
  text: string;
}

export interface AiChatResponse {
  success: boolean;
  data: {
    reply: string;
    contextSnapshot?: string;
    quickActions?: string[];
    provider?: string;
    sources?: Array<{
      id?: string;
      type?: string;
      title: string;
      snippet?: string;
    }>;
  };
}

export const aiChatAPI = {
  chat: async (
    message: string,
    routeContext: string,
    responseMode: "concise" | "balanced" | "detailed" = "balanced",
    history: AiChatHistoryItem[] = [],
  ): Promise<AiChatResponse> => {
    const response = await api.post("/api/ai/chat", {
      message,
      routeContext,
      responseMode,
      history,
    });
    return response.data;
  },
};

export default aiChatAPI;
