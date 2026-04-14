import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { employeeKeys } from './get-employees';

export interface ProvisionEmployeeRequest {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentId: string;
  companySiteId?: string;
  supervisorRoleAssignmentId?: string;
  startDate: string;
}

export interface ProvisionEmployeeResponse {
  employeeId: string;
  userId: string;
  roleAssignmentId: string;
  invitationId: string;
  email: string;
  activationToken: string;
  expiresAt: string;
  statusMessage: string;
}

export const useProvisionEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<ProvisionEmployeeResponse>, Error, ProvisionEmployeeRequest>({
    mutationFn: async (data: ProvisionEmployeeRequest) => {
      const response = await apiClient.post<ApiResponse<ProvisionEmployeeResponse>>(
        `/companies/${data.companyId}/provisioning/employee`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the employees list to reflect the newly provisioned employee
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};
