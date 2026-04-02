import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { AuthResponse, LoginRequest } from '../types';
import { ApiErrorResponse } from '@/common/types/api';

/**
 * Mutation hook for user login
 */
export const useLogin = () => {
  return useMutation<AuthResponse, ApiErrorResponse, LoginRequest>({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Store token in local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        if (data.user.companyId) {
          localStorage.setItem('current_company_id', data.user.companyId);
        }
      }
    },
  });
};
