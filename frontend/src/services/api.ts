import axios from 'axios';
import { Player, Schedule, SwapRequest, AuthResponse, ApiResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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