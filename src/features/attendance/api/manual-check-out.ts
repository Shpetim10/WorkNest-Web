import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ManualCheckOutRequest } from '../types';
import { attendanceKeys } from './get-attendance';

export const useManualCheckOut = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { employeeId: string; data: ManualCheckOutRequest }>({
    mutationFn: async ({ employeeId, data }) => {
      await apiClient.post(`/staff/attendance/employees/${employeeId}/check-out`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.dashboards() });
    },
  });
};
