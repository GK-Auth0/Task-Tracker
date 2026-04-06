import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL } from "../config/api";

const ACCESS_TOKEN_STORAGE_KEY = "token";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const buildDefaultHeaders = () => ({
  "Content-Type": "application/json",
});

const createBaseClient = (baseURL: string) =>
  axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: true,
    headers: buildDefaultHeaders(),
  });

export const getStoredAccessToken = () => localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

export const setStoredAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
};

export const clearStoredAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
};

const isBrowserAuthRoute = () => {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  return (
    currentPath.startsWith("/login") ||
    currentPath.startsWith("/register") ||
    currentPath.startsWith("/forgot-password") ||
    currentPath.startsWith("/reset-password") ||
    currentPath.startsWith("/auth/callback")
  );
};

const isAuthRefreshExcludedRequest = (requestUrl: string) =>
  requestUrl.includes("/api/auth/login") ||
  requestUrl.includes("/api/auth/register") ||
  requestUrl.includes("/api/auth/verify-otp") ||
  requestUrl.includes("/api/auth/resend-otp") ||
  requestUrl.includes("/api/auth/forgot-password") ||
  requestUrl.includes("/api/auth/reset-password") ||
  requestUrl.includes("/api/auth/change-password-invited") ||
  requestUrl.includes("/api/auth/auth0") ||
  requestUrl.includes("/api/auth/refresh") ||
  requestUrl.includes("/api/auth/logout");

const redirectToLogin = () => {
  if (typeof window !== "undefined" && !isBrowserAuthRoute()) {
    window.location.assign("/login");
  }
};

const refreshClient = createBaseClient(API_BASE_URL);
let refreshRequest: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  const response = await refreshClient.post("/api/auth/refresh");
  const nextToken = response.data?.data?.token;

  if (nextToken) {
    setStoredAccessToken(nextToken);
    return nextToken as string;
  }

  clearStoredAccessToken();
  return null;
};

export const applyAuthInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const originalRequest = error.config as RetryableRequestConfig | undefined;
      const requestUrl = String(originalRequest?.url || "");

      const shouldAttemptRefresh =
        (status === 401 || status === 403) &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthRefreshExcludedRequest(requestUrl);

      if (shouldAttemptRefresh) {
        originalRequest._retry = true;

        try {
          if (!refreshRequest) {
            refreshRequest = refreshAccessToken().finally(() => {
              refreshRequest = null;
            });
          }

          const nextToken = await refreshRequest;
          if (nextToken) {
            originalRequest.headers.Authorization = `Bearer ${nextToken}`;
            return client(originalRequest);
          }
        } catch {
          clearStoredAccessToken();
          redirectToLogin();
          return Promise.reject(error);
        }
      }

      if (status === 401 || status === 403) {
        clearStoredAccessToken();
        redirectToLogin();
      }

      return Promise.reject(error);
    },
  );

  return client;
};

const api = applyAuthInterceptors(createBaseClient(API_BASE_URL));

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: LoginResponseData;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  org_code: string;
  slug: string;
  status: string;
  logo_url?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id?: string | null;
  organization: OrganizationSummary | null;
  onboardingRequired: boolean;
}

export interface OtpChallenge {
  requiresOtp: true;
  otpSessionId: string;
  email: string;
  expiresAt: string;
  otp?: string;
  resent?: boolean;
}

export interface OtpChallengeResponse {
  success: boolean;
  message: string;
  data: OtpChallenge;
}

export type LoginResponseData =
  | {
      user: AuthenticatedUser;
      token: string;
    }
  | { requiresPasswordChange: true; email: string }
  | OtpChallenge;

export interface BasicResponse {
  success: boolean;
  message: string;
}

export const authAPI = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<OtpChallengeResponse> => {
    const response = await api.post("/api/auth/register", data);
    return response.data;
  },

  loginWithAuth0: async (accessToken: string): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/auth0", { accessToken });
    return response.data;
  },

  verifyOtp: async (
    otpSessionId: string,
    otp: string,
  ): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/verify-otp", {
      otpSessionId,
      otp,
    });
    return response.data;
  },

  resendOtp: async (otpSessionId: string): Promise<OtpChallengeResponse> => {
    const response = await api.post("/api/auth/resend-otp", { otpSessionId });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<OtpChallengeResponse> => {
    const response = await api.post("/api/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (
    otpSessionId: string,
    otp: string,
    newPassword: string,
  ): Promise<BasicResponse> => {
    const response = await api.post("/api/auth/reset-password", {
      otpSessionId,
      otp,
      newPassword,
    });
    return response.data;
  },

  refreshSession: async (): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/refresh");
    return response.data;
  },

  logout: async (): Promise<BasicResponse> => {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  changePasswordForInvitedUser: async (
    email: string,
    newPassword: string,
  ): Promise<BasicResponse> => {
    const response = await api.post("/api/auth/change-password-invited", {
      email,
      newPassword,
    });
    return response.data;
  },
};

export default api;
