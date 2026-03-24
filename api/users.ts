import { apiClient } from './client';
import type { UserResponse } from './types';

export interface UpdateUserRequest {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export const usersApi = {
  getMe: () => apiClient.get<UserResponse>('/api/users/me'),
  getAll: () => apiClient.get<UserResponse[]>('/api/users'),
  getById: (id: number) => apiClient.get<UserResponse>(`/api/users/${id}`),
  update: (id: number, data: UpdateUserRequest) =>
    apiClient.put<UserResponse>(`/api/users/${id}`, data),
  changePassword: (id: number, data: ChangePasswordRequest) =>
    apiClient.patch(`/api/users/${id}/password`, data),
  addPolicy: (userId: number, policyId: number) =>
    apiClient.post(`/api/users/${userId}/policies/${policyId}`),
  removePolicy: (userId: number, policyId: number) =>
    apiClient.delete(`/api/users/${userId}/policies/${policyId}`),
};
