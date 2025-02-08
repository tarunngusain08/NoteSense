import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
}

const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post(`/login`, credentials);
    return {
      token: response.data,
      userId: credentials.email, // Using email as userId for now
      name: credentials.email.split('@')[0], // Using part of email as name
      email: credentials.email
    };
  },

  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post(`/signup`, userData);
    return {
      token: response.data,
      userId: userData.email,
      name: userData.name,
      email: userData.email
    };
  },

  // Store auth data in localStorage
  setAuthData: (authData: AuthResponse) => {
    localStorage.setItem('token', authData.token);
    localStorage.setItem('userId', authData.userId);
    localStorage.setItem('name', authData.name);
    localStorage.setItem('email', authData.email);
  },

  // Clear auth data from localStorage
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
  },

  // Configure axios to use the auth token
  setupAxiosInterceptors: (token: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export default authService;
