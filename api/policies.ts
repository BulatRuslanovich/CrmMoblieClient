import { apiClient } from './client';
import type { PolicyResponse } from './types';

export const policiesApi = {
  getAll: () => apiClient.get<PolicyResponse[]>('/api/users/policies'),

  getById: (id: number) => apiClient.get<PolicyResponse>(`/api/users/policies/${id}`),
};
