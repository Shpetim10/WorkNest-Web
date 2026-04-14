import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/types';
import { StaffDTO } from '../types';

export const staffDetailKeys = {
  all: ['staff-detail'] as const,
  detail: (companyId: string, staffId: string) => [...staffDetailKeys.all, companyId, staffId] as const,
};

export const getStaffDetails = async (companyId: string, staffId: string): Promise<StaffDTO> => {
  const { data } = await apiClient.get<ApiResponse<StaffDTO>>(
    `/companies/${companyId}/staff/${staffId}`
  );
  return data.data;
};

export const useStaffDetails = (companyId: string, staffId: string | null) => {
  return useQuery({
    queryKey: staffDetailKeys.detail(companyId, staffId || ''),
    queryFn: () => getStaffDetails(companyId, staffId!),
    enabled: !!staffId && !!companyId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};
