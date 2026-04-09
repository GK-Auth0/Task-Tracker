import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  authAPI,
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "../services/auth";
import type {
  AuthenticatedUser,
  OtpChallenge,
  OrganizationSummary,
} from "../services/auth";
import {
  normalizeWorkspaceRole,
  type WorkspaceRole,
} from "../types/roles";

interface User extends Omit<AuthenticatedUser, "role"> {
  role: WorkspaceRole;
}

const normalizeUserRole = (role: unknown): WorkspaceRole =>
  normalizeWorkspaceRole(role) || "Member";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  loginWithAuth0: (accessToken: string) => Promise<User>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<OtpChallenge>;
  verifyOtp: (otpSessionId: string, otp: string) => Promise<User>;
  resendOtp: (otpSessionId: string) => Promise<OtpChallenge>;
  setOrganization: (organization: OrganizationSummary) => void;
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
  setOrganization: () => {},
  logout: () => {},
  loading: true,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

const normalizeUser = (user: AuthenticatedUser): User => ({
  ...user,
  role: normalizeUserRole(user.role),
});

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const applyAuthenticatedUser = (nextUser: AuthenticatedUser) => {
      if (!isMountedRef.current || !isActive) return;
      setUser(normalizeUser(nextUser));
    };

    const clearAuthState = () => {
      if (!isMountedRef.current || !isActive) return;
      clearStoredAccessToken();
      setUser(null);
    };

    const initAuth = async () => {
      if (!isMountedRef.current || !isActive) return;
      setLoading(true);
      const bootstrapToken = getStoredAccessToken();
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";
      const isAuthPage =
        currentPath.startsWith("/login") ||
        currentPath.startsWith("/register") ||
        currentPath.startsWith("/forgot-password") ||
        currentPath.startsWith("/reset-password") ||
        currentPath.startsWith("/auth/callback");

      try {
        const storedToken = bootstrapToken;

        if (storedToken) {
          try {
            const response = await authAPI.getCurrentUser();
            applyAuthenticatedUser(response.data);
            return;
          } catch (tokenError) {
            if (isAuthPage) {
              throw tokenError;
            }

            const response = await authAPI.refreshSession();
            const authenticatedData = response.data as Extract<
              typeof response.data,
              { user: AuthenticatedUser; token?: string }
            >;
            const { user, token } = authenticatedData;
            if (token) {
              setStoredAccessToken(token);
            }
            if (user) {
              applyAuthenticatedUser(user);
              return;
            }
          }
        }

        if (!isAuthPage) {
          const response = await authAPI.refreshSession();
          const authenticatedData = response.data as Extract<
            typeof response.data,
            { user: AuthenticatedUser; token?: string }
          >;
          const { user, token } = authenticatedData;
          if (token) {
            setStoredAccessToken(token);
          }
          if (user) {
            applyAuthenticatedUser(user);
            return;
          }
        }

        if (!isMountedRef.current || !isActive) return;
        setUser(null);
      } catch (error) {
        if (!isMountedRef.current || !isActive) return;
        if (getStoredAccessToken() === "") {
          clearAuthState();
          return;
        }

        const currentToken = getStoredAccessToken();
        if (!currentToken || currentToken === bootstrapToken) {
          clearAuthState();
        }
      } finally {
        if (!isMountedRef.current || !isActive) return;
        setLoading(false);
      }
    };

    void initAuth();

    return () => {
      isActive = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
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

    const authenticatedData = data as Extract<
      typeof data,
      { user: AuthenticatedUser; token?: string }
    >;
    const { user, token } = authenticatedData;
    if (token) setStoredAccessToken(token);
    const normalizedUser = normalizeUser(user);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const loginWithAuth0 = async (accessToken: string): Promise<User> => {
    const response = await authAPI.loginWithAuth0(accessToken);
    const authenticatedData = response.data as Extract<
      typeof response.data,
      { user: AuthenticatedUser; token?: string }
    >;
    const { user, token } = authenticatedData;
    if (token) setStoredAccessToken(token);
    const normalizedUser = normalizeUser(user);
    setUser(normalizedUser);
    return normalizedUser;
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

  const verifyOtp = async (otpSessionId: string, otp: string): Promise<User> => {
    const response = await authAPI.verifyOtp(otpSessionId, otp);
    const authenticatedData = response.data as Extract<
      typeof response.data,
      { user: AuthenticatedUser; token?: string }
    >;
    const { user, token } = authenticatedData;
    if (token) setStoredAccessToken(token);
    const normalizedUser = normalizeUser(user);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const resendOtp = async (otpSessionId: string): Promise<OtpChallenge> => {
    const response = await authAPI.resendOtp(otpSessionId);
    return response.data;
  };

  const setOrganization = (organization: OrganizationSummary) => {
    setUser((currentUser) =>
      currentUser
        ? {
            ...currentUser,
            organization_id: organization.id,
            organization,
            onboardingRequired: false,
          }
        : currentUser,
    );
  };

  const logout = () => {
    void authAPI.logout().catch(() => undefined);
    clearStoredAccessToken();
    setUser(null);
  };

  const value = {
    user,
    token: null,
    login,
    loginWithAuth0,
    register,
    verifyOtp,
    resendOtp,
    setOrganization,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
