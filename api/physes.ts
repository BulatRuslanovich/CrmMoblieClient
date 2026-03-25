import { apiClient } from './client';
import type { PhysResponse, CreatePhysRequest, UpdatePhysRequest, PagedResponse } from './types';

export const physesApi = {
  getAll: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<PhysResponse>>('/api/physes', { params: { page, pageSize } }),

  getById: (id: number) => apiClient.get<PhysResponse>(`/api/physes/${id}`),

  create: (data: CreatePhysRequest) => apiClient.post<PhysResponse>('/api/physes', data),

  update: (id: number, data: UpdatePhysRequest) => apiClient.put<PhysResponse>(`/api/physes/${id}`, data),

  delete: (id: number) => apiClient.delete(`/api/physes/${id}`),

  linkOrg: (physId: number, orgId: number) => apiClient.post(`/api/physes/${physId}/orgs/${orgId}`),

  unlinkOrg: (physId: number, orgId: number) => apiClient.delete(`/api/physes/${physId}/orgs/${orgId}`),
};
