import axios from "axios";

import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  // First try to get Auth0 token from localStorage
  const auth0Token = localStorage.getItem("auth0_token");
  // Fallback to custom JWT token
  const customToken = localStorage.getItem("token");
  
  const token = auth0Token || customToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API Request with token:', token ? 'Token present' : 'No token');
  } else {
    console.log('API Request without token');
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - clearing tokens');
      localStorage.removeItem("token");
      localStorage.removeItem("auth0_token");
    }
    return Promise.reject(error);
  }
);

export interface LoginData {
  email: string;
  password: string;
}

export interface Auth0SyncData {
  auth0Id: string;
  email: string;
  name: string;
  picture?: string;
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

export const authAPI = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/register", data);
    return response.data;
  },

  syncAuth0User: async (data: Auth0SyncData): Promise<AuthResponse> => {
    // Don't send auth header for sync endpoint since we're establishing auth
    const response = await axios.post(`${API_BASE_URL}/api/auth/sync-auth0`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },
};

export default api;
