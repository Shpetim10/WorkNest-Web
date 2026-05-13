import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { SuperAdminDashboardDto } from '../types';

export interface DashboardParams {
  year?: number;
  period?: string;
}

export const superAdminDashboardKeys = {
  all: ['super-admin-dashboard'] as const,
  summary: (params: DashboardParams) => [...superAdminDashboardKeys.all, 'summary', params] as const,
};

function unwrapDashboardResponse(
  body: ApiResponse<SuperAdminDashboardDto> | SuperAdminDashboardDto,
): SuperAdminDashboardDto {
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data;
  }

  return body;
}

export async function fetchSuperAdminDashboard(params: DashboardParams = {}): Promise<SuperAdminDashboardDto> {
  const response = await apiClient.get<ApiResponse<SuperAdminDashboardDto> | SuperAdminDashboardDto>(
    '/super-admin/dashboard',
    {
      params: {
        ...(params.year ? { year: params.year } : {}),
        ...(params.period ? { period: params.period } : {}),
      },
    },
  );

  return unwrapDashboardResponse(response.data);
}

export function useSuperAdminDashboard(params: DashboardParams = {}, options?: { enabled?: boolean }) {
  return useQuery<SuperAdminDashboardDto>({
    queryKey: superAdminDashboardKeys.summary(params),
    queryFn: () => fetchSuperAdminDashboard(params),
    enabled: options?.enabled ?? false,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}