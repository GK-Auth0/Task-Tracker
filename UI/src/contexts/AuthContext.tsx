import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { authAPI } from "../services/auth";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { user: auth0User, isAuthenticated, isLoading, getAccessTokenSilently, logout: auth0Logout } = useAuth0();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated && auth0User) {
        try {
          // Get Auth0 token
          const auth0Token = await getAccessTokenSilently();
          
          // Create user object from Auth0 data
          const mappedUser: User = {
            id: auth0User.sub || '',
            email: auth0User.email || '',
            full_name: auth0User.name || '',
            role: 'Member' // Default role, can be customized
          };
          
          setUser(mappedUser);
          setToken(auth0Token);
        } catch (error) {
          console.error('Auth0 token error:', error);
        }
      } else if (token && !isAuthenticated) {
        // Fallback to custom auth for existing users
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem("token");
          setToken(null);
        }
      } else if (!isAuthenticated) {
        setUser(null);
        setToken(null);
      }
      
      if (!isLoading) {
        setLoading(false);
      }
    };

    if (!isLoading) {
      initAuth();
    } else {
      setLoading(true);
    }
  }, [isAuthenticated, auth0User, isLoading, token, getAccessTokenSilently]);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const { user, token } = response.data;

    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => {
    const response = await authAPI.register({
      email,
      password,
      firstName,
      lastName,
    });
    const { user, token } = response.data;

    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    
    // If using Auth0, logout from Auth0 as well
    if (isAuthenticated) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
