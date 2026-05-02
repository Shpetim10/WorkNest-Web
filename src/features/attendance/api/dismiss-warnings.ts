import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { DismissWarningsRequest } from '../types';
import { attendanceKeys } from './get-attendance';

export const useDismissWarnings = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { recordId: string; data: DismissWarningsRequest }>({
    mutationFn: async ({ recordId, data }) => {
      await apiClient.post(`/staff/attendance/day-records/${recordId}/dismiss-warnings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.dashboards() });
    },
  });
};
