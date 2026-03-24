import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authAPI } from "../services/auth";
import type { OtpChallenge } from "../services/auth";
import {
  normalizeWorkspaceRole,
  type WorkspaceRole,
} from "../types/roles";
import RingLoader from "../components/RingLoader";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: WorkspaceRole;
}

const normalizeUserRole = (role: unknown): WorkspaceRole =>
  normalizeWorkspaceRole(role) || "Member";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithAuth0: (accessToken: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<OtpChallenge>;
  verifyOtp: (otpSessionId: string, otp: string) => Promise<void>;
  resendOtp: (otpSessionId: string) => Promise<OtpChallenge>;
  logout: () => void;
  loading: boolean;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  login: async () => {
    throw new Error("AuthProvider is not ready yet");
  },
  loginWithAuth0: async () => {
    throw new Error("AuthProvider is not ready yet");
  },
  register: async () => {
    throw new Error("AuthProvider is not ready yet");
  },
  verifyOtp: async () => {
    throw new Error("AuthProvider is not ready yet");
  },
  resendOtp: async () => {
    throw new Error("AuthProvider is not ready yet");
  },
  logout: () => {},
  loading: true,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser({
            ...response.data,
            role: normalizeUserRole(response.data.role),
          });
        } catch (error) {
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await authAPI.login({ email, password });
    const data: any = response.data;

    if (data?.requiresPasswordChange) {
      throw new Error("PASSWORD_CHANGE_REQUIRED");
    }

    if (data?.requiresOtp) {
      const err: any = new Error("OTP_REQUIRED");
      err.code = "OTP_REQUIRED";
      err.data = data;
      throw err;
    }

    const { user, token } = data;
    localStorage.setItem("token", token);
    setToken(token);
    setUser({ ...user, role: normalizeUserRole(user.role) });
  };

  const loginWithAuth0 = async (accessToken: string): Promise<void> => {
    const response = await authAPI.loginWithAuth0(accessToken);
    const { user, token } = response.data;
    localStorage.setItem("token", token);
    setToken(token);
    setUser({ ...user, role: normalizeUserRole(user.role) });
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<OtpChallenge> => {
    const response = await authAPI.register({
      email,
      password,
      firstName,
      lastName,
    });
    return response.data;
  };

  const verifyOtp = async (otpSessionId: string, otp: string) => {
    const response = await authAPI.verifyOtp(otpSessionId, otp);
    const { user, token } = response.data;

    localStorage.setItem("token", token);
    setToken(token);
    setUser({ ...user, role: normalizeUserRole(user.role) });
  };

  const resendOtp = async (otpSessionId: string): Promise<OtpChallenge> => {
    const response = await authAPI.resendOtp(otpSessionId);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    loginWithAuth0,
    register,
    verifyOtp,
    resendOtp,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
