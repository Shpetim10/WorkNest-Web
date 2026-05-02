import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { CompanySettingsResponse } from '../types';

export async function fetchCompanySettings(companyId: string): Promise<CompanySettingsResponse> {
  const response = await apiClient.get<ApiResponse<CompanySettingsResponse>>(
    `/companies/${companyId}/settings`,
  );
  return response.data.data;
}
