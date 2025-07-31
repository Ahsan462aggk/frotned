// src/lib/api.ts
import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Extend the AxiosInstance type to include our source method
declare module 'axios' {
  interface AxiosInstance {
    source(): { token: any; cancel: (message?: string) => void };
  }
}


interface UserSession {
  access_token: string;
}

// IMPORTANT: Replace this with the actual URL of your deployed Python backend.
// It should look something like: https://your-backend-app.onrender.com/api/admin
const API_BASE_URL = ''; // Use Vercel proxy, no need for absolute URL

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add cancel token source method
api.source = () => {
  return axios.CancelToken.source();
};

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  // Try to get admin token first, then fall back to user token
  let token: string | null = null;
  const adminToken = localStorage.getItem('admin_access_token');
  
  if (adminToken) {
    token = adminToken;
  } else {
    const userSessionString = localStorage.getItem('user');
    if (userSessionString) {
      try {
        const userSession: UserSession = JSON.parse(userSessionString);
        if (userSession?.access_token) {
          token = userSession.access_token;
        }
      } catch (e) {
        console.error("Failed to parse user session from localStorage", e);
      }
    }
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new UnauthorizedError();
    }
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export { api };

// Keep the existing axiosWithAuth for backward compatibility
export const axiosWithAuth = async (
  url: string, 
  options: AxiosRequestConfig = {}
): Promise<any> => {
  try {
    const response = await api({
      ...options,
      url,
      baseURL: url.startsWith('http') ? undefined : API_BASE_URL,
    });
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new UnauthorizedError();
    }
    throw error;
  }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);

  // Try to get admin token first, then fall back to user token
  let token: string | null = null;
  const adminToken = localStorage.getItem('admin_access_token');
  if (adminToken) {
    token = adminToken;
  } else {
    const userSessionString = localStorage.getItem('user');
    if (userSessionString) {
      try {
        const userSession: UserSession = JSON.parse(userSessionString);
        if (userSession && userSession.access_token) {
          token = userSession.access_token;
        }
      } catch (e) {
        console.error("Failed to parse user session from localStorage", e);
      }
    }
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, { ...options, headers });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  return response;
};

export const handleApiResponse = async <T>(res: Response): Promise<T> => {
    if (!res.ok) {
        let errorMessage = `HTTP error! status: ${res.status}`;
        try {
            // Assume error response has a standard shape
            const errorData: { message?: string, detail?: string } = await res.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
            // Response body is not JSON or is empty, use the status-based message.
        }
        throw new Error(errorMessage);
    }
    return res.json();
};
