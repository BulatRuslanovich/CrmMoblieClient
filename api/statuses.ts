import { apiClient } from './client';
import type { StatusResponse } from './types';

export const statusesApi = {
  getAll: () => apiClient.get<StatusResponse[]>('/api/statuses'),
};
