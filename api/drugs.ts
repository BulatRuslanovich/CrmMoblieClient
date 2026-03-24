import { apiClient } from './client';
import type { DrugResponse } from './types';

export interface CreateDrugRequest {
  drugName: string;
  brand: string | null;
  form: string | null;
  description: string | null;
}

export const drugsApi = {
  getAll: () => apiClient.get<DrugResponse[]>('/api/drugs'),
  getById: (id: number) => apiClient.get<DrugResponse>(`/api/drugs/${id}`),
  create: (data: CreateDrugRequest) => apiClient.post<DrugResponse>('/api/drugs', data),
  delete: (id: number) => apiClient.delete(`/api/drugs/${id}`),
};
