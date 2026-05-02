import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ReviewEventRequest } from '../types';
import { attendanceKeys } from './get-attendance';

export const useReviewEvent = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { eventId: string; data: ReviewEventRequest }>({
    mutationFn: async ({ eventId, data }) => {
      await apiClient.post(`/staff/attendance/events/${eventId}/review`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.details() });
    },
  });
};
