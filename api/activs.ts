import { apiClient } from './client';
import type { ActivResponse, CreateActivRequest, UpdateActivRequest } from './types';

export const activsApi = {
  getAll: () => apiClient.get<ActivResponse[]>('/api/activs'),
  getById: (id: number) => apiClient.get<ActivResponse>(`/api/activs/${id}`),
  create: (data: CreateActivRequest) => apiClient.post('/api/activs', data),
  update: (id: number, data: UpdateActivRequest) =>
    apiClient.put<ActivResponse>(`/api/activs/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/activs/${id}`),
  addDrug: (activId: number, drugId: number) =>
    apiClient.post(`/api/activs/${activId}/drugs/${drugId}`),
  removeDrug: (activId: number, drugId: number) =>
    apiClient.delete(`/api/activs/${activId}/drugs/${drugId}`),
};
