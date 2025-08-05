import axios, { AxiosRequestConfig, AxiosInstance, AxiosResponse, RawAxiosRequestHeaders } from 'axios';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

interface UserSession {
  access_token: string;
}

const API_BASE_URL = 'https://student-portal-lms-seven.vercel.app';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
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
    (config.headers as RawAxiosRequestHeaders).Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new UnauthorizedError();
    }
    return Promise.reject(error);
  }
);

export interface CustomResponse {
    ok: boolean;
    status: number;
    statusText: string;
    json: () => Promise<any>;
    headers: RawAxiosRequestHeaders;
}

export const fetchWithAuth = async (url: string, options: AxiosRequestConfig = {}): Promise<CustomResponse> => {
    const response: AxiosResponse = await api(url, options);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      json: async () => response.data,
      headers: response.headers as RawAxiosRequestHeaders,
    };
};

export const handleApiResponse = async <T>(response: CustomResponse): Promise<T> => {
  if (!response.ok) {
    const errorBody = await response.json();
    const errorMessage = errorBody.message || errorBody.detail || JSON.stringify(errorBody);
    throw new Error(errorMessage);
  }
  return response.json();
};

export { api };
