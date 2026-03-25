import { apiClient } from './client';
import type { OrgResponse, CreateOrgRequest, UpdateOrgRequest, PagedResponse } from './types';

export const orgsApi = {
  getAll: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<OrgResponse>>('/api/orgs', { params: { page, pageSize } }),

  getById: (id: number) => apiClient.get<OrgResponse>(`/api/orgs/${id}`),

  create: (data: CreateOrgRequest) => apiClient.post<OrgResponse>('/api/orgs', data),

  update: (id: number, data: UpdateOrgRequest) => apiClient.put<OrgResponse>(`/api/orgs/${id}`, data),

  delete: (id: number) => apiClient.delete(`/api/orgs/${id}`),
};
