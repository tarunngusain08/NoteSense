import axios from 'axios';

// const API_BASE_URL = "http://localhost:8080"
const API_BASE_URL = "https://notesense-backend.onrender.com";

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
  interceptorId: null as number | null,

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post(`/login`, credentials);
    return {
      token: response.data.token,
      userId: response.data.user.id,
      name: response.data.user.name,
      email: response.data.user.email
    };
  },

  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post(`/signup`, userData);
    return {
      token: response.data.token,
      userId: response.data.user.id,
      name: response.data.user.name,
      email: response.data.user.email
    };
  },

  logout: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await api.post('/logout', {}, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
    }
  },

  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
  },

  setupAxiosInterceptors(token: string) {
    // Remove any existing interceptors
    if (this.interceptorId !== null) {
      api.interceptors.response.eject(this.interceptorId);
    }

    // Add token to headers for all requests
    api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor to handle token expiration
    this.interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Check if the error is due to token expiration
        if (error.response && error.response.status === 401) {
          // Clear authentication data
          this.clearAuthData();
          
          // Redirect to login page
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  },

  // Expose the api for other services to use
  api: api
};

export function clearAuthData() {
  // Remove token from local storage
  localStorage.removeItem('token');
  // Remove user info from local storage
  localStorage.removeItem('user');
  // Optional: Clear any other auth-related data
}

class AuthService {
  async login(email: string, password: string) {
    try {
      const response = await api.post('/login', { email, password });
      
      // Store token and user info in local storage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      // Handle login errors
      throw error;
    }
  }

  async signup(userData: any) {
    try {
      const response = await api.post('/signup', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Add method to check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token; // Returns true if token exists
  }

  // Logout method
  logout() {
    clearAuthData();
    window.location.href = '/login';
  }
}

export default authService;
