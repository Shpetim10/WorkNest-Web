import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { SuperAdminDashboardDto } from '../types';

export const superAdminDashboardKeys = {
  all: ['super-admin-dashboard'] as const,
  summary: () => [...superAdminDashboardKeys.all, 'summary'] as const,
};

function unwrapDashboardResponse(
  body: ApiResponse<SuperAdminDashboardDto> | SuperAdminDashboardDto,
): SuperAdminDashboardDto {
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data;
  }

  return body;
}

export async function fetchSuperAdminDashboard(): Promise<SuperAdminDashboardDto> {
  const response = await apiClient.get<ApiResponse<SuperAdminDashboardDto> | SuperAdminDashboardDto>(
    '/super-admin/dashboard',
  );

  return unwrapDashboardResponse(response.data);
}

export function useSuperAdminDashboard(options?: { enabled?: boolean }) {
  return useQuery<SuperAdminDashboardDto>({
    queryKey: superAdminDashboardKeys.summary(),
    queryFn: fetchSuperAdminDashboard,
    enabled: options?.enabled ?? false,
    staleTime: 60_000,
  });
}
