import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { staffKeys } from './get-staff';
import { staffDetailKeys } from './get-staff-details';

export interface UpdateStaffRequest {
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
}

export interface UpdateStaffResponse {
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
  startDate: string;
  message: string;
}

interface UpdateStaffParams {
  staffId: string;
  data: UpdateStaffRequest;
}

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<UpdateStaffResponse>, Error, UpdateStaffParams>({
    mutationFn: async ({ staffId, data }) => {
      const response = await apiClient.put<ApiResponse<UpdateStaffResponse>>(
        `/companies/${data.companyId}/provisioning/staff/${staffId}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate staff lists for this company
      queryClient.invalidateQueries({ queryKey: staffKeys.list(variables.data.companyId) });
      queryClient.invalidateQueries({
        queryKey: staffDetailKeys.detail(variables.data.companyId, variables.staffId),
      });
    },
  });
};
