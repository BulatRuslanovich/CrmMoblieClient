import { apiClient } from './client';
import type { PhysResponse, CreatePhysRequest } from './types';

export const physesApi = {
  getAll: () => apiClient.get<PhysResponse[]>('/api/physes'),
  getById: (id: number) => apiClient.get<PhysResponse>(`/api/physes/${id}`),
  create: (data: CreatePhysRequest) => apiClient.post<PhysResponse>('/api/physes', data),
};
