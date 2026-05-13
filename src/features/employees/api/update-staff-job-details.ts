import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { staffKeys } from './get-staff';
import { staffDetailKeys } from './get-staff-details';

export interface UpdateStaffJobDetailsRequest {
  companyId: string;
  employmentType?: string | null;
  contractDocumentKey?: string | null;
  contractDocumentPath?: string | null;
  contractExpiryDate?: string | null;
  leaveDaysPerYear?: number | null;
  paymentMethod?: string | null;
  monthlySalary?: number | null;
  hourlyRate?: number | null;
}

interface UpdateParams {
  staffId: string;
  data: UpdateStaffJobDetailsRequest;
}

export const useUpdateStaffJobDetails = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<unknown>, Error, UpdateParams>({
    mutationFn: async ({ staffId, data }) => {
      const response = await apiClient.put<ApiResponse<unknown>>(
        `/companies/${data.companyId}/provisioning/staff/${staffId}/job-details`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({
        queryKey: staffDetailKeys.detail(variables.data.companyId, variables.staffId),
      });
    },
  });
};
