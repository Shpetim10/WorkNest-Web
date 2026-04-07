import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse, ApiErrorResponse } from '@/common/types/api';
import { RefreshTokenRequest } from '../types';

/**
 * Mutation hook for user logout.
 * Invalidates the refresh token on the server side.
 */
export const useLogout = () => {
  return useMutation<ApiResponse<null>, ApiErrorResponse, RefreshTokenRequest>({
    mutationFn: async (data: RefreshTokenRequest) => {
      const response = await apiClient.post<ApiResponse<null>>('/auth/logout', data);
      return response.data;
    },
  });
};
