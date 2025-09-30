import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService, type User } from '../services/api';
import { connectRealtime, disconnectRealtime } from '../services/realtime';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    extraFields?: { firstName?: string; lastName?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  googleLogin: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token exists and is valid
  const checkAuth = async () => {
    if (!apiService.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.getCurrentUser();
      if (response.success) {
        setUser(response.user);
        const token = localStorage.getItem('auth_token');
        if (token) {
          try { disconnectRealtime(); } catch {}
          connectRealtime(token);
        }
      } else {
        apiService.clearAuthToken();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      apiService.clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email/password
  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });

      if (response.success && response.token) {
        apiService.setAuthToken(response.token);
        // connect realtime with the fresh token
        try { disconnectRealtime(); } catch {}
        connectRealtime(response.token);

        if (response.user) {
          setUser(response.user);
        } else {
          try {
            const me = await apiService.getCurrentUser();
            if (me.success && me.user) {
              setUser(me.user);
            }
          } catch (e) {
            console.debug('Fetching current user after login failed', e);
          }
        }
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  // Register new user
  const register = async (
    email: string,
    password: string,
    extraFields?: { firstName?: string; lastName?: string }
  ) => {
    try {
      const response = await apiService.register({ email, password, ...extraFields });

      if (response.success && response.token) {
        apiService.setAuthToken(response.token);
        // connect realtime with the fresh token
        try { disconnectRealtime(); } catch {}
        connectRealtime(response.token);

        setUser(response.user || null);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  // Logout user
  const logout = () => {
    try {
      localStorage.setItem('just_logged_out', '1');
    } catch {}
    try { disconnectRealtime(); } catch {}
    apiService.logout();
    setUser(null);
  };

  // Google OAuth login (redirect flow)
  const googleLogin = async () => {
    try {
      const raw = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:4000/api';
      const base = raw.trim().replace(/\/api\/?$/, '');
      const url = `${base}/api/auth/google`;

      console.debug('[googleLogin] redirecting to', url);
      window.location.href = url;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Google login failed' };
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user || apiService.isAuthenticated(),
    login,
    register,
    logout,
    checkAuth,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
