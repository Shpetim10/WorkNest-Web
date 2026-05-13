import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { employeeKeys } from './get-employees';
import { employeeDetailKeys } from './get-employee-details';

export interface UpdateEmployeeJobDetailsRequest {
  companyId: string;
  employmentType?: string | null;
  contractDocumentKey?: string | null;
  contractDocumentPath?: string | null;
  contractExpiryDate?: string | null;
  leaveDaysPerYear?: number | null;
  paymentMethod?: string | null;
  monthlySalary?: number | null;
  hourlyRate?: number | null;
  dailyWorkingHours?: number | null;
}

interface UpdateParams {
  employeeId: string;
  data: UpdateEmployeeJobDetailsRequest;
}

export const useUpdateEmployeeJobDetails = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<unknown>, Error, UpdateParams>({
    mutationFn: async ({ employeeId, data }) => {
      const response = await apiClient.put<ApiResponse<unknown>>(
        `/companies/${data.companyId}/provisioning/employee/${employeeId}/job-details`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({
        queryKey: employeeDetailKeys.detail(variables.data.companyId, variables.employeeId),
      });
    },
  });
};
