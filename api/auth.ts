import { apiClient, BASE_URL } from './client';
import type { UserResponse } from './types';
import axios from 'axios';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  login: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export const authApi = {
  login: (data: LoginRequest) =>
    axios.post<AuthResponse>(`${BASE_URL}/api/auth/login`, data, {
      headers: { 'Content-Type': 'application/json' },
    }),

  register: (data: RegisterRequest) =>
    axios.post<AuthResponse>(`${BASE_URL}/api/auth/register`, data, {
      headers: { 'Content-Type': 'application/json' },
    }),

  logout: (refreshToken: string) =>
    apiClient.post('/api/auth/logout', JSON.stringify(refreshToken)),
};
