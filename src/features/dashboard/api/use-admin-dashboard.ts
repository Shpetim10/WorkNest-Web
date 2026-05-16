import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { AdminDashboardDto } from '../types';

export interface DashboardParams {
  year?: number;
  period?: string;
  trendPeriod?: string;
}

export const adminDashboardKeys = {
  all: ['admin-dashboard'] as const,
  summary: (params: DashboardParams) => [...adminDashboardKeys.all, 'summary', params] as const,
};

function unwrapDashboardResponse(
  body: ApiResponse<AdminDashboardDto> | AdminDashboardDto,
): AdminDashboardDto {
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data;
  }

  return body;
}

export async function fetchAdminDashboard(params: DashboardParams = {}): Promise<AdminDashboardDto> {
  const response = await apiClient.get<ApiResponse<AdminDashboardDto> | AdminDashboardDto>(
    '/admin/dashboard',
    {
      params: {
        ...(params.year ? { year: params.year } : {}),
        ...(params.period ? { period: params.period } : {}),
        ...(params.trendPeriod ? { trendPeriod: params.trendPeriod } : {}),
      },
    },
  );

  return unwrapDashboardResponse(response.data);
}

export function useAdminDashboard(params: DashboardParams = {}, options?: { enabled?: boolean }) {
  return useQuery<AdminDashboardDto>({
    queryKey: adminDashboardKeys.summary(params),
    queryFn: () => fetchAdminDashboard(params),
    enabled: options?.enabled ?? false,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
