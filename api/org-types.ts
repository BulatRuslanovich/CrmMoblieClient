import { apiClient } from './client';
import type { OrgTypeResponse } from './types';

export const orgTypesApi = {
  getAll: () => apiClient.get<OrgTypeResponse[]>('/api/org-types'),
};
