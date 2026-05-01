import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { staffKeys } from './get-staff';

interface DeleteParams {
  companyId: string;
  staffId: string;
}

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, DeleteParams>({
    mutationFn: async ({ companyId, staffId }) => {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/companies/${companyId}/provisioning/staff/${staffId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
};
