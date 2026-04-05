import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ActivateInvitationRequest, ActivateInvitationResponse } from '../types/invitation';
import { ApiResponse } from '@/common/types/api';

/**
 * Hook for activating a user invitation (Step 2)
 */
export const useActivateInvitation = () => {
  return useMutation({
    mutationFn: async (request: ActivateInvitationRequest): Promise<ActivateInvitationResponse> => {
      const response = await apiClient.post<ApiResponse<ActivateInvitationResponse>>(
        '/auth/invitations/activate',
        {
          ...request,
          token: request.token.trim(),
        }
      );
      return response.data.data;
    },
  });
};
