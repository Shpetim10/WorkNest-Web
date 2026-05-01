import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { employeeKeys } from './get-employees';
import { employeeDetailKeys } from './get-employee-details';

type EmployeeStatusAction = 'activate' | 'terminate';

interface ToggleEmployeeStatusParams {
  companyId: string;
  employeeId: string;
  action: EmployeeStatusAction;
}

export const useToggleEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, ToggleEmployeeStatusParams>({
    mutationFn: async ({ companyId, employeeId, action }) => {
      const response = await apiClient.patch<ApiResponse<null>>(
        `/companies/${companyId}/provisioning/employee/${employeeId}/${action}`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({
        queryKey: employeeDetailKeys.detail(variables.companyId, variables.employeeId),
      });
    },
  });
};
