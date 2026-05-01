import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { staffKeys } from './get-staff';
import { staffDetailKeys } from './get-staff-details';

type StaffStatusAction = 'activate' | 'terminate';

interface ToggleStaffStatusParams {
  companyId: string;
  staffId: string;
  action: StaffStatusAction;
}

export const useToggleStaffStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, ToggleStaffStatusParams>({
    mutationFn: async ({ companyId, staffId, action }) => {
      const response = await apiClient.patch<ApiResponse<null>>(
        `/companies/${companyId}/provisioning/staff/${staffId}/${action}`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({
        queryKey: staffDetailKeys.detail(variables.companyId, variables.staffId),
      });
    },
  });
};
