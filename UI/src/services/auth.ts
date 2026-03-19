import axios from "axios";

import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isAuthRoute =
        currentPath.startsWith("/login") ||
        currentPath.startsWith("/register") ||
        currentPath.startsWith("/forgot-password") ||
        currentPath.startsWith("/reset-password") ||
        currentPath.startsWith("/auth/callback");

      if (!isAuthRoute) {
        localStorage.removeItem("token");
        if (typeof window !== "undefined") {
          window.location.assign("/login");
        }
      }
    }
    return Promise.reject(error);
  },
);

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
  data: {
    user: {
      id: string;
      email: string;
      full_name: string;
      role: string;
    };
    token: string;
  };
}

export interface OtpChallenge {
  requiresOtp: true;
  otpSessionId: string;
  email: string;
  expiresAt: string;
  otp?: string;
}

export interface OtpChallengeResponse {
  success: boolean;
  message: string;
  data: OtpChallenge;
}

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

  getCurrentUser: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },
};

export default api;
