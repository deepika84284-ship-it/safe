import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { apiClient } from '../services/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('safecart_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('safecart_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('safecart_token');
      if (storedToken) {
        try {
          const res = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('safecart_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session check failed or expired');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClient.post<{ success: boolean; token: string; user: User; message: string }>('/auth/login', {
        email,
        password
      });
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('safecart_token', res.data.token);
        localStorage.setItem('safecart_user', JSON.stringify(res.data.user));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: 'Authentication failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please verify credentials.'
      };
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const res = await apiClient.post<{ success: boolean; token: string; user: User; message: string }>('/admin/login', {
        email,
        password
      });
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('safecart_token', res.data.token);
        localStorage.setItem('safecart_user', JSON.stringify(res.data.user));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: 'Admin authentication failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid administrative credentials.'
      };
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'USER') => {
    try {
      const res = await apiClient.post<{ success: boolean; token: string; user: User; message: string }>('/auth/register', {
        name,
        email,
        password,
        role
      });
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('safecart_token', res.data.token);
        localStorage.setItem('safecart_user', JSON.stringify(res.data.user));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: 'Registration failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please check inputs.'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('safecart_token');
    localStorage.removeItem('safecart_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin: user?.role === 'ADMIN',
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        adminLogin,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
