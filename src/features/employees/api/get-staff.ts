import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { StaffDTO } from '../types';
import { ApiResponse } from '@/common/types/api';

/**
 * Filter keys for cache invalidation
 */
export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (companyId: string) => [...staffKeys.lists(), { companyId }] as const,
};

/**
 * Hook to fetch a list of staff members for the current company
 */
export const useStaff = () => {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;

  return useQuery<ApiResponse<StaffDTO[]>>({
    queryKey: staffKeys.list(companyId || ''),
    queryFn: async () => {
      if (!companyId) throw new Error('Company Context Missing');

      const response = await apiClient.get<ApiResponse<StaffDTO[]>>(`/companies/${companyId}/staff`);
      return response.data;
    },
    enabled: !!companyId,
  });
};
