import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/common/network/api-client';
import { LoginResponse, LoginRequest, SelectRoleRequest, SelectRoleResponse } from '../types';
import { ApiResponse, ApiErrorResponse } from '@/common/types/api';
import { useAuthStore } from '../store/authStore';
import { setCookie } from '@/common/utils/cookies';
import { fetchCompanySettings } from '@/features/company-settings/api/get-company-settings';
import { persistCompanySettings } from '@/features/company-settings/storage';
import { persistUserProfileFromAuthPayload } from '@/common/utils/user-session-profile';

/**
 * Mutation hook for user login
 */
export const useLogin = () => {
  const setLoginResponse = useAuthStore((state) => state.setLoginResponse);

  return useMutation<LoginResponse, ApiErrorResponse, LoginRequest>({
    mutationFn: async (data: LoginRequest) => {
      // 🚨 [DEBUG] FINAL PAYLOAD VERIFICATION
      console.log('📦 [Mutation] Initiating Login with payload:', JSON.stringify(data, null, 2));

      try {
        const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
        return response.data.data;
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        // Detailed error logging specifically for this mutation
        console.error('❌ [Mutation Error] Login mutation failed:', {
          payload: data,
          response: axiosError.response?.data,
          status: axiosError.response?.status
        });
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      // Store initial tokens (may be partial)
      let companyId: string | null = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('user_email', variables.email);

        if (data.accessTokenExpiresAt) {
          localStorage.setItem('access_token_expires_at', data.accessTokenExpiresAt);
        }
        if (data.tenantContext?.companyId) {
          companyId = data.tenantContext.companyId;
          localStorage.setItem('current_company_id', companyId);
        }
        if (data.role) {
          localStorage.setItem('platform_role', data.role);
        }
        setCookie('auth_token', data.accessToken, 7);
      }
      persistUserProfileFromAuthPayload(data, { email: variables.email, role: data.role });

      if (companyId) {
        try {
          const settings = await fetchCompanySettings(companyId);
          persistCompanySettings(settings);
        } catch (error) {
          console.warn('Failed to fetch company settings after login:', error);
        }
      }

      // Store primary response for role selection if needed
      setLoginResponse(data);
    },
  });
};

/**
 * Mutation hook for workspace session initialization (role selection)
 */
export const useSelectRole = () => {
  return useMutation<SelectRoleResponse, ApiErrorResponse, SelectRoleRequest>({
    mutationFn: async (data: SelectRoleRequest) => {
      const response = await apiClient.post<ApiResponse<SelectRoleResponse>>('/auth/select-role', data);
      return response.data.data;
    },
    onSuccess: async (data) => {
      // Substitute initial tokens with final workspace tokens
      let companyId: string | null = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        if (data.accessTokenExpiresAt) {
          localStorage.setItem('access_token_expires_at', data.accessTokenExpiresAt);
        }
        if (data.tenantContext?.companyId) {
          companyId = data.tenantContext.companyId;
          localStorage.setItem('current_company_id', companyId);
        }
        if (data.platformRole) {
          localStorage.setItem('platform_role', data.platformRole);
        }
        setCookie('auth_token', data.accessToken, 7);
      }
      persistUserProfileFromAuthPayload(data, { role: data.platformRole });

      if (companyId) {
        try {
          const settings = await fetchCompanySettings(companyId);
          persistCompanySettings(settings);
        } catch (error) {
          console.warn('Failed to fetch company settings after role selection:', error);
        }
      }
    },
  });
};
