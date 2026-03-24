import { apiClient } from './client';
import type { OrgResponse, CreateOrgRequest } from './types';

export const orgsApi = {
  getAll: () => apiClient.get<OrgResponse[]>('/api/orgs'),
  getById: (id: number) => apiClient.get<OrgResponse>(`/api/orgs/${id}`),
  create: (data: CreateOrgRequest) => apiClient.post<OrgResponse>('/api/orgs', data),
};
