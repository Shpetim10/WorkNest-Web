import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { AdjustDayRecordRequest } from '../types';
import { attendanceKeys } from './get-attendance';

export const useAdjustDayRecord = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { recordId: string; data: AdjustDayRecordRequest }>({
    mutationFn: async ({ recordId, data }) => {
      await apiClient.put(`/staff/attendance/day-records/${recordId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.dashboards() });
    },
  });
};
