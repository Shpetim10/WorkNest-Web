import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ManualCheckInRequest } from '../types';
import { attendanceKeys } from './get-attendance';

export const useManualCheckIn = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { employeeId: string; data: ManualCheckInRequest }>({
    mutationFn: async ({ employeeId, data }) => {
      await apiClient.post(`/staff/attendance/employees/${employeeId}/check-in`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.dashboards() });
    },
  });
};
