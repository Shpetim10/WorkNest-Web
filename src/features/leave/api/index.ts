import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { LeaveRequestDto, LeaveStatus, Page, RejectLeaveRequestBody } from '../types';

export interface LeaveRequestParams {
  search?: string;
  status?: LeaveStatus;
  page?: number;
  size?: number;
}

export const leaveKeys = {
  all: ['leave'] as const,
  requests: () => [...leaveKeys.all, 'requests'] as const,
  list: (params: LeaveRequestParams) => [...leaveKeys.requests(), params] as const,
  detail: (id: string) => [...leaveKeys.all, 'detail', id] as const,
};

export const useLeaveRequests = (params: LeaveRequestParams) => {
  return useQuery<Page<LeaveRequestDto>>({
    queryKey: leaveKeys.list(params),
    queryFn: async () => {
      const { page = 1, ...rest } = params;
      const response = await apiClient.get<{ status: string; data: Page<LeaveRequestDto> }>(
        '/admin/leave/requests',
        { params: { ...rest, page: page - 1 } },
      );
      return response.data.data;
    },
  });
};

export const useLeaveRequest = (id: string) => {
  return useQuery<LeaveRequestDto>({
    queryKey: leaveKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<{ status: string; data: LeaveRequestDto }>(
        `/admin/leave/requests/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { id: string; note?: string }>({
    mutationFn: async ({ id, note }) => {
      const body = note?.trim() ? { note: note.trim() } : undefined;
      await apiClient.post(`/admin/leave/requests/${id}/approve`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
    },
  });
};

export const useRejectLeave = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      await apiClient.post<RejectLeaveRequestBody>(`/admin/leave/requests/${id}/reject`, {
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
    },
  });
};