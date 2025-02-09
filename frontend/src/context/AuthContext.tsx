import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    name: string;
    email: string;
    userId: string;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthContextType['user']>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const name = localStorage.getItem('name');
        const email = localStorage.getItem('email');

        if (token && userId && name && email) {
          setIsAuthenticated(true);
          setUser({ userId, name, email });
          authService.setupAxiosInterceptors(token);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear any invalid auth data
        authService.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    
    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      if (isAuthenticated) {
        refreshToken().catch(console.error);
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      
      // Store authentication data in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('name', response.name);
      localStorage.setItem('email', response.email);
      
      // Set up axios interceptors with the token
      authService.setupAxiosInterceptors(response.token);
      
      // Update authentication state
      setIsAuthenticated(true);
      setUser({
        userId: response.userId,
        name: response.name,
        email: response.email
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await authService.signup({ email, password, name });
      
      // Store authentication data in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('name', response.name);
      localStorage.setItem('email', response.email);
      
      // Set up axios interceptors with the token
      authService.setupAxiosInterceptors(response.token);
      
      // Update authentication state
      setIsAuthenticated(true);
      setUser({
        userId: response.userId,
        name: response.name,
        email: response.email
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to invalidate token
      await authService.logout();
      
      // Clear authentication data
      authService.clearAuthData();
      
      // Reset authentication state
      setIsAuthenticated(false);
      setUser(null);
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      // Implement token refresh logic
      // This would typically involve calling a backend refresh token endpoint
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('/api/refresh-token', { refreshToken });
      
      // Update tokens in localStorage
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Update axios interceptors
      authService.setupAxiosInterceptors(response.data.accessToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, log out the user
      await logout();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user, 
      login, 
      signup, 
      logout,
      refreshToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}