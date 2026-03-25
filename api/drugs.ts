import { apiClient } from './client';
import type { DrugResponse, PagedResponse, UpdateDrugRequest } from './types';

export interface CreateDrugRequest {
  drugName: string;
  brand: string | null;
  form: string | null;
  description: string | null;
}

export const drugsApi = {
  getAll: (page = 1, pageSize = 20) =>
    apiClient.get<PagedResponse<DrugResponse>>('/api/drugs', { params: { page, pageSize } }),

  getById: (id: number) => apiClient.get<DrugResponse>(`/api/drugs/${id}`),

  create: (data: CreateDrugRequest) => apiClient.post<DrugResponse>('/api/drugs', data),

  update: (id: number, data: UpdateDrugRequest) => apiClient.put<DrugResponse>(`/api/drugs/${id}`, data),

  delete: (id: number) => apiClient.delete(`/api/drugs/${id}`),
};
