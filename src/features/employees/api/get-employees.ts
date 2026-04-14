import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { EmployeeDTO, EmployeeFilters } from '../types';
import { PaginatedResponse } from '@/common/types/api';

/**
 * Filter keys for cache invalidation
 */
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...employeeKeys.lists(), { filters }] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

import { ApiResponse } from '@/common/types/api';

/**
 * Hook to fetch a list of employees for the current company
 */
export const useEmployees = (filters: EmployeeFilters) => {
  return useQuery<ApiResponse<EmployeeDTO[]>>({
    queryKey: employeeKeys.list(filters),
    queryFn: async () => {
      const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;
      if (!companyId) throw new Error('Company Context Missing');

      const response = await apiClient.get<ApiResponse<EmployeeDTO[]>>(`/companies/${companyId}/employees`, {
        params: filters,
      });
      return response.data;
    },
  });
};
