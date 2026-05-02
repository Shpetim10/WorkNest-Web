import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { AttendanceDetailData } from '../types';
import { attendanceKeys } from './get-attendance';

export const useAttendanceEmployeeDetail = (employeeId: string | null, date?: string) => {
  return useQuery<AttendanceDetailData>({
    queryKey: attendanceKeys.detail(employeeId ?? '', date),
    queryFn: async () => {
      const response = await apiClient.get<{ status: string; data: AttendanceDetailData }>(
        `/attendance/employees/${employeeId}/detail`,
        { params: date ? { date } : undefined },
      );
      return response.data.data;
    },
    enabled: !!employeeId,
  });
};
