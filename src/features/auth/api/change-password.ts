import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

export function useChangePassword() {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<ChangePasswordResponse>>(
        '/auth/change-password',
        data,
      );
      return response.data.data;
    },
  });
}