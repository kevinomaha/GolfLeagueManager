export interface Player {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  percentage: number;
}

export interface Schedule {
  weekId: string;
  playerId: string;
  time: string;
  course: string;
}

export interface SwapRequest {
  id: string;
  weekId: string;
  requestingPlayerId: string;
  targetPlayerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T> {
  statusCode: number;
  body: T;
  message?: string;
  error?: string;
} 