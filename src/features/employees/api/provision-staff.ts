import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { staffKeys } from './get-staff';

export interface CreateStaffRequest {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentId?: string;
  companySiteId?: string;
  startDate?: string;
  assignedEmployeeIds?: string[];
  permissionCodes?: string[];
  preferredLanguage?: string;
}

export interface ProvisioningResponse {
  employeeId: string;
  userId: string;
  roleAssignmentId: string;
  invitationId: string;
  email: string;
  rawActivationToken: string;
  invitationExpiresAt: string;
  message: string;
}

export const useProvisionStaff = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<ProvisioningResponse>, Error, CreateStaffRequest>({
    mutationFn: async (data: CreateStaffRequest) => {
      const response = await apiClient.post<ApiResponse<ProvisioningResponse>>(
        `/companies/${data.companyId}/provisioning/staff`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate staff lists for this company
      queryClient.invalidateQueries({ queryKey: staffKeys.list(variables.companyId) });
    },
  });
};
