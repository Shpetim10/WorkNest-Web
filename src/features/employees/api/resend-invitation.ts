import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';

export interface ResendInvitationResponse {
  employeeId: string;
  email: string;
  activationToken: string;
  expiresAt: string;
  statusMessage: string;
}

export const useResendInvitation = () => {
  return useMutation<ApiResponse<ResendInvitationResponse>, Error, { companyId: string; employeeId: string }>({
    mutationFn: async ({ companyId, employeeId }) => {
      const response = await apiClient.post<ApiResponse<ResendInvitationResponse>>(
        `/companies/${companyId}/provisioning/${employeeId}/resend`
      );
      return response.data;
    },
  });
};
