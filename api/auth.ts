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

export interface PendingConfirmationResponse {
  email: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    axios.post<AuthResponse>(`${BASE_URL}/api/auth/login`, data, {
      headers: { 'Content-Type': 'application/json' },
    }),

  register: (data: RegisterRequest) =>
    axios.post<PendingConfirmationResponse>(`${BASE_URL}/api/auth/register`, data, {
      headers: { 'Content-Type': 'application/json' },
    }),

  confirmEmail: (email: string, code: string) =>
    axios.post<AuthResponse>(`${BASE_URL}/api/auth/confirm-email`, { email, code }, {
      headers: { 'Content-Type': 'application/json' },
    }),

  resendConfirmation: (email: string) =>
    axios.post(`${BASE_URL}/api/auth/resend-confirmation`, JSON.stringify(email), {
      headers: { 'Content-Type': 'application/json' },
    }),

  forgotPassword: (email: string) =>
    axios.post(`${BASE_URL}/api/auth/forgot-password`, { email }, {
      headers: { 'Content-Type': 'application/json' },
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    axios.post(`${BASE_URL}/api/auth/reset-password`, { email, code, newPassword }, {
      headers: { 'Content-Type': 'application/json' },
    }),

  logout: (refreshToken: string) =>
    apiClient.post('/api/auth/logout', JSON.stringify(refreshToken)),
};
