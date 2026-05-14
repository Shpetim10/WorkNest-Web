import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { CompanySettingsResponse, CurrencyExchangeRequest } from '../types';
import { companySettingsKeys } from './use-company-settings';
import { persistCompanySettings } from '../storage';

export function useUpdateCurrency(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<CompanySettingsResponse>, Error, CurrencyExchangeRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<CompanySettingsResponse>>(
        `/companies/${companyId}/settings/currency`,
        data,
      );
      return response.data;
    },
    onSuccess: (response) => {
      persistCompanySettings(response.data);
      queryClient.invalidateQueries({ queryKey: companySettingsKeys.detail(companyId) });
    },
  });
}