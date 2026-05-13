import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ForgotPasswordRequest, ResetPasswordRequest } from '../types';
import { ApiResponse, ApiErrorResponse } from '@/common/types/api';

/**
 * Mutation hook to initiate the password reset process (Step 1)
 */
export const useForgotPassword = (path = '/auth/forgot-password') => {
  return useMutation<ApiResponse<{ message?: string }>, ApiErrorResponse, ForgotPasswordRequest>({
    mutationFn: async (data: ForgotPasswordRequest) => {
      const response = await apiClient.post<ApiResponse<{ message?: string }>>(path, data);
      return response.data;
    },
  });
};

/**
 * Mutation hook to execute the password reset with a token (Step 2)
 */
export const useResetPassword = () => {
  return useMutation<ApiResponse<{ message?: string }>, ApiErrorResponse, ResetPasswordRequest>({
    mutationFn: async (data: ResetPasswordRequest) => {
      const response = await apiClient.post<ApiResponse<{ message?: string }>>('/auth/reset-password', data);
      return response.data;
    },
  });
};
