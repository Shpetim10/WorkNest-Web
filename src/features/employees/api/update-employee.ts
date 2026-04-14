import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { employeeKeys } from './get-employees';
import { employeeDetailKeys } from './get-employee-details';

export interface UpdateEmployeeRequest {
  companyId: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  departmentId?: string;
  companySiteId?: string;
  supervisorRoleAssignmentId?: string;
  startDate?: string;
}

export interface UpdateEmployeeResponse {
  employeeId: string;
  userId: string;
  roleAssignmentId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentId: string;
  departmentName: string;
  companySiteId: string;
  companySiteName: string;
  supervisorRoleAssignmentId?: string;
  startDate: string;
  message: string;
}

interface UpdateParams {
  employeeId: string;
  data: UpdateEmployeeRequest;
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<UpdateEmployeeResponse>, Error, UpdateParams>({
    mutationFn: async ({ employeeId, data }) => {
      const response = await apiClient.put<ApiResponse<UpdateEmployeeResponse>>(
        `/companies/${data.companyId}/provisioning/employee/${employeeId}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the employees list to reflect the updates
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({
        queryKey: employeeDetailKeys.detail(variables.data.companyId, variables.employeeId),
      });
    },
  });
};
