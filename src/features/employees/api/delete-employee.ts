import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { employeeKeys } from './get-employees';

interface DeleteParams {
  companyId: string;
  employeeId: string;
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, DeleteParams>({
    mutationFn: async ({ companyId, employeeId }) => {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/companies/${companyId}/provisioning/employee/${employeeId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};
