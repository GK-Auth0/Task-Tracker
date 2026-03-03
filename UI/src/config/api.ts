const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolveUrlOrEmpty = (value?: string) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return trimTrailingSlash(normalized);
};

// API base URL:
// - Prefer explicit VITE_API_BASE_URL when provided.
// - Otherwise use same-origin (empty base URL), so requests to /api/* work behind a reverse proxy.
// - In local development, default to localhost backend for convenience.
const getApiBaseUrl = (): string => {
  const envApiUrl = resolveUrlOrEmpty(import.meta.env.VITE_API_BASE_URL);
  if (envApiUrl) return envApiUrl;

  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }

  return "";
};

// WebSocket base URL:
// - Prefer explicit VITE_WS_BASE_URL when provided.
// - Otherwise derive from API base URL when absolute.
// - Fallback to current origin with ws/wss protocol.
const getWsBaseUrl = (): string => {
  const envWsUrl = resolveUrlOrEmpty(import.meta.env.VITE_WS_BASE_URL);
  if (envWsUrl) return envWsUrl;

  const apiBase = getApiBaseUrl();
  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    return apiBase.replace(/^http/i, "ws");
  }

  if (typeof window !== "undefined") {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}`;
  }

  return "ws://localhost:3000";
};

// AI service URL:
// - Prefer explicit VITE_AI_ASSISTANT_URL.
// - Otherwise in development use localhost AI service.
// - In production default to same-origin "/ai-assistant" so deployments can reverse-proxy safely.
const getAiBaseUrl = (): string => {
  const envAiUrl = resolveUrlOrEmpty(import.meta.env.VITE_AI_ASSISTANT_URL);
  if (envAiUrl) return envAiUrl;

  if (import.meta.env.DEV) {
    return "http://127.0.0.1:8787";
  }

  return "/ai-assistant";
};

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();
export const AI_BASE_URL = getAiBaseUrl();

export default API_BASE_URL;
