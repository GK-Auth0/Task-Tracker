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
    localStorage.getItem("auth0_token") || localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      console.log('Auth initialization:', { isAuthenticated, isLoading, user: auth0User?.email });
      
      if (isAuthenticated && auth0User) {
        try {
          // Check if email is verified
          if (!auth0User.email_verified) {
            console.log('Email not verified, logging out');
            auth0Logout({ logoutParams: { returnTo: window.location.origin } });
            return;
          }
          
          console.log('Getting Auth0 access token...');
          // Get Auth0 token
          const auth0Token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              scope: "openid profile email"
            }
          });
          
          console.log('Auth0 token retrieved:', auth0Token ? 'Success' : 'Failed');
          
          // Sync Auth0 user to database
          try {
            console.log('Syncing user to database...');
            await authAPI.syncAuth0User({
              auth0Id: auth0User.sub || '',
              email: auth0User.email || '',
              name: auth0User.name || '',
              picture: auth0User.picture
            });
            console.log('User sync successful');
          } catch (syncError) {
            console.error('Failed to sync user to database:', syncError);
          }
          
          // Create user object from Auth0 data
          const mappedUser: User = {
            id: auth0User.sub || '',
            email: auth0User.email || '',
            full_name: auth0User.name || '',
            role: 'Member' // Default role, can be customized
          };
          
          console.log('Setting user and token in context');
          setUser(mappedUser);
          setToken(auth0Token);
          localStorage.setItem("auth0_token", auth0Token);
          // Clear any old custom tokens
          localStorage.removeItem("token");
        } catch (error) {
          console.error('Auth0 token error:', error);
        }
      } else if (!isAuthenticated) {
        console.log('Not authenticated, clearing tokens');
        // Clear all tokens when not authenticated
        localStorage.removeItem("token");
        localStorage.removeItem("auth0_token");
        setUser(null);
        setToken(null);
      }
      
      if (!isLoading) {
        console.log('Auth loading complete');
        setLoading(false);
      }
    };

    if (!isLoading) {
      initAuth();
    } else {
      setLoading(true);
    }
  }, [isAuthenticated, auth0User, isLoading, getAccessTokenSilently, auth0Logout]);

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
    localStorage.removeItem("auth0_token");
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
