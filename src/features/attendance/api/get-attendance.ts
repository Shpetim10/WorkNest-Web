import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { AttendanceDashboardData, AttendanceDashboardFilters } from '../types';

export const attendanceKeys = {
  all: ['attendance'] as const,
  dashboards: () => [...attendanceKeys.all, 'dashboard'] as const,
  dashboard: (filters: AttendanceDashboardFilters) => [...attendanceKeys.dashboards(), { filters }] as const,
  details: () => [...attendanceKeys.all, 'detail'] as const,
  detail: (employeeId: string, date?: string) => [...attendanceKeys.details(), employeeId, date] as const,
};

export const useAttendanceDashboard = (filters: AttendanceDashboardFilters, isAdmin: boolean) => {
  return useQuery<AttendanceDashboardData>({
    queryKey: attendanceKeys.dashboard(filters),
    queryFn: async () => {
      const endpoint = isAdmin
        ? '/admin/attendance/dashboard'
        : '/staff/attendance';
      const response = await apiClient.get<{ status: string; data: AttendanceDashboardData }>(endpoint, {
        params: filters,
      });
      return response.data.data;
    },
  });
};
