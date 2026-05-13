import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/common/network/api-client';
import type { ApiErrorResponse, ApiResponse } from '@/common/types/api';
import { setCookie } from '@/common/utils/cookies';
import { persistUserProfileFromAuthPayload } from '@/common/utils/user-session-profile';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { LoginRequest, LoginResponse } from '@/features/auth/types';

export const useSuperAdminLogin = () => {
  const setLoginResponse = useAuthStore((state) => state.setLoginResponse);

  return useMutation<LoginResponse, ApiErrorResponse, LoginRequest>({
    mutationFn: async (data: LoginRequest) => {
      try {
        const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
        return response.data.data;
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        console.error('Super admin login failed:', {
          response: axiosError.response?.data,
          status: axiosError.response?.status,
        });
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('user_email', variables.email);

        if (data.accessTokenExpiresAt) {
          localStorage.setItem('access_token_expires_at', data.accessTokenExpiresAt);
        }

        if (data.role) {
          localStorage.setItem('platform_role', data.role);
        }

        setCookie('auth_token', data.accessToken, 7);
      }
      persistUserProfileFromAuthPayload(data, { email: variables.email, role: data.role });

      setLoginResponse(data);
    },
  });
};
