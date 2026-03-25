import { apiClient } from './client';
import type { SpecResponse } from './types';

export const specsApi = {
  getAll: () => apiClient.get<SpecResponse[]>('/api/physes/specs'),

  getById: (id: number) => apiClient.get<SpecResponse>(`/api/physes/specs/${id}`),

  create: (specName: string) => apiClient.post<SpecResponse>('/api/physes/specs', { specName }),

  delete: (id: number) => apiClient.delete(`/api/physes/specs/${id}`),
};
