import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import type { ApiResponse, OffsetPaginatedCollection, PaginationParams } from '@/common/types/api';
import { StaffDTO } from '../types';

type StaffFilters = PaginationParams;

type StaffPageResponse = ApiResponse<OffsetPaginatedCollection<StaffDTO>>;

/**
 * Filter keys for cache invalidation
 */
export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (companyId: string, filters: StaffFilters = {}) =>
    [...staffKeys.lists(), { companyId, filters }] as const,
};

/**
 * Hook to fetch a list of staff members for the current company
 */
export const useStaff = (filters: StaffFilters = {}) => {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;

  return useQuery<StaffPageResponse>({
    queryKey: staffKeys.list(companyId || '', filters),
    queryFn: async () => {
      if (!companyId) throw new Error('Company Context Missing');

      const page = filters.page ?? 1;
      const size = filters.size ?? 10;

      const response = await apiClient.get<StaffPageResponse>(`/companies/${companyId}/staff`, {
        params: {
          page: Math.max(0, page - 1),
          size,
        },
      });
      return response.data;
    },
    enabled: !!companyId,
  });
};
