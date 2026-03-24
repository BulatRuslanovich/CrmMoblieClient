import { apiClient } from './client';
import type { SpecResponse } from './types';

export const specsApi = {
  getAll: () => apiClient.get<SpecResponse[]>('/api/specs'),
  create: (specName: string) => apiClient.post<SpecResponse>('/api/specs', { specName }),
  delete: (id: number) => apiClient.delete(`/api/specs/${id}`),
};
