import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { CompanySettingsResponse, UpdateCompanySettingsRequest } from '../types';
import { fetchCompanySettings } from './get-company-settings';

export const companySettingsKeys = {
  all: ['company-settings'] as const,
  detail: (companyId: string) => ['company-settings', companyId] as const,
};

export function useCompanySettings(companyId: string | null) {
  return useQuery({
    queryKey: companySettingsKeys.detail(companyId ?? ''),
    queryFn: () => fetchCompanySettings(companyId!),
    enabled: !!companyId,
  });
}

export function useUpdateCompanySettings(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<CompanySettingsResponse>, Error, UpdateCompanySettingsRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.put<ApiResponse<CompanySettingsResponse>>(
        `/companies/${companyId}/settings`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companySettingsKeys.detail(companyId) });
    },
  });
}