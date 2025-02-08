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
    // Remove any existing interceptors to prevent duplicates
    api.interceptors.request.eject(this.interceptorId);

    // Add a request interceptor to add the token to every request
    this.interceptorId = api.interceptors.request.use(
      (config) => {
        // Only add Authorization header if token exists and request is to our API
        if (token && config.url?.startsWith(API_BASE_URL)) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add a response interceptor to handle token expiration
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        // If the server responds with a 401 (Unauthorized), it might mean the token has expired
        if (error.response && error.response.status === 401) {
          // Trigger logout or token refresh
          this.clearAuthData();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  },

  // Expose the api for other services to use
  api: api
};

export default authService;
