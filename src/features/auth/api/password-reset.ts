import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ForgotPasswordRequest, ResetPasswordRequest } from '../types';
import { ApiResponse, ApiErrorResponse } from '@/common/types/api';

/**
 * Mutation hook to initiate the password reset process (Step 1)
 */
export const useForgotPassword = () => {
  return useMutation<ApiResponse<unknown>, ApiErrorResponse, ForgotPasswordRequest>({
    mutationFn: async (data: ForgotPasswordRequest) => {
      const response = await apiClient.post<ApiResponse<unknown>>('/auth/forgot-password', data);
      return response.data;
    },
  });
};

/**
 * Mutation hook to execute the password reset with a token (Step 2)
 */
export const useResetPassword = () => {
  return useMutation<ApiResponse<unknown>, ApiErrorResponse, ResetPasswordRequest>({
    mutationFn: async (data: ResetPasswordRequest) => {
      const response = await apiClient.post<ApiResponse<unknown>>('/auth/reset-password', data);
      return response.data;
    },
  });
};
