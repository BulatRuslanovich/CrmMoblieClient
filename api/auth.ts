import { apiClient, BASE_URL } from './client';
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    axios.post<AuthTokens>(`${BASE_URL}/api/auth/login`, data, {
      headers: { 'Content-Type': 'application/json' },
    }),

  register: (data: RegisterRequest) =>
    axios.post(`${BASE_URL}/api/auth/register`, data, {
      headers: { 'Content-Type': 'application/json' },
    }),

  logout: (refreshToken: string) =>
    apiClient.post('/api/auth/logout', JSON.stringify(refreshToken)),
};
