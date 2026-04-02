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

/**
 * Hook to fetch a paginated list of employees
 */
export const useEmployees = (filters: EmployeeFilters) => {
  return useQuery<PaginatedResponse<EmployeeDTO>>({
    queryKey: employeeKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<EmployeeDTO>>('/employees', {
        params: {
          ...filters,
          page: (filters.page || 1) - 1, // API is 0-indexed, UI is 1-indexed
        },
      });
      return response.data;
    },
  });
};
