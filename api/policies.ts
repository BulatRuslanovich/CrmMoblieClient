import { apiClient } from './client';
import type { PolicyResponse } from './types';

export const policiesApi = {
  getAll: () => apiClient.get<PolicyResponse[]>('/api/policies'),
};
