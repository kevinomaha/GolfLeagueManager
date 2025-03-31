import axios, { AxiosRequestConfig } from 'axios';
import { Player, Schedule, SwapRequest, AuthResponse, ApiResponse } from '../types';
import { getSession } from './cognito';

const API_URL = process.env.REACT_APP_API_URL;
console.log('API URL:', API_URL);

// Use a CORS proxy for API requests
const CORS_PROXY = 'https://corsproxy.io/?';
const getProxiedUrl = (url: string): string => `${CORS_PROXY}${encodeURIComponent(url)}`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Override the request method to use the CORS proxy
const originalRequest = api.request;
api.request = function (config: AxiosRequestConfig): Promise<any> {
  // Only proxy API requests, not local requests
  if (config.url && API_URL && API_URL.includes('amazonaws.com')) {
    const fullUrl = `${API_URL}${config.url}`.replace(/\/\//g, '/');
    config.url = getProxiedUrl(fullUrl);
    config.baseURL = ''; // Reset baseURL as we're using full URL with proxy
  }
  return originalRequest.call(this, config);
};

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const session = await getSession();
    if (session) {
      const token = session.getIdToken().getJwtToken();
      console.log('Adding auth token to request:', token.substring(0, 20) + '...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No active session found');
    }
  } catch (error) {
    console.error('Failed to get session:', error);
  }
  return config;
});

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    if (response.data.statusCode === 200) {
      const { accessToken, idToken, refreshToken } = response.data.body.tokens;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
  },
};

export const playerService = {
  async getAllPlayers(): Promise<ApiResponse<Player[]>> {
    const response = await api.get<ApiResponse<Player[]>>('/players');
    return response.data;
  },

  async getPlayer(id: string): Promise<ApiResponse<Player>> {
    const response = await api.get<ApiResponse<Player>>(`/players/${id}`);
    return response.data;
  },

  async createPlayer(player: Omit<Player, 'id' | 'weeksScheduled'>): Promise<ApiResponse<Player>> {
    const response = await api.post<ApiResponse<Player>>('/players', player);
    return response.data;
  },

  async updatePlayer(id: string, player: Partial<Player>): Promise<ApiResponse<Player>> {
    const response = await api.put<ApiResponse<Player>>(`/players/${id}`, player);
    return response.data;
  },

  async deletePlayer(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/players/${id}`);
    return response.data;
  },
};

export const scheduleService = {
  async getAllWeeks(): Promise<ApiResponse<Schedule[]>> {
    const response = await api.get<ApiResponse<Schedule[]>>('/schedule');
    return response.data;
  },

  async getWeek(weekId: string): Promise<ApiResponse<Schedule>> {
    const response = await api.get<ApiResponse<Schedule>>(`/schedule/${weekId}`);
    return response.data;
  },

  async createSchedule(schedule: Schedule): Promise<ApiResponse<Schedule>> {
    const response = await api.post<ApiResponse<Schedule>>('/schedule', schedule);
    return response.data;
  },

  async updateSchedule(weekId: string, schedule: Partial<Schedule>): Promise<ApiResponse<Schedule>> {
    const response = await api.put<ApiResponse<Schedule>>(`/schedule/${weekId}`, schedule);
    return response.data;
  },
};

export const swapService = {
  async getAllSwaps(): Promise<ApiResponse<SwapRequest[]>> {
    const response = await api.get<ApiResponse<SwapRequest[]>>('/swaps');
    return response.data;
  },

  async getSwap(id: string): Promise<ApiResponse<SwapRequest>> {
    const response = await api.get<ApiResponse<SwapRequest>>(`/swaps/${id}`);
    return response.data;
  },

  async createSwap(swap: Omit<SwapRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<SwapRequest>> {
    const response = await api.post<ApiResponse<SwapRequest>>('/swaps', swap);
    return response.data;
  },

  async approveSwap(id: string): Promise<ApiResponse<SwapRequest>> {
    const response = await api.put<ApiResponse<SwapRequest>>(`/swaps/${id}/approve`);
    return response.data;
  },

  async rejectSwap(id: string): Promise<ApiResponse<SwapRequest>> {
    const response = await api.put<ApiResponse<SwapRequest>>(`/swaps/${id}/reject`);
    return response.data;
  },
};