import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { assignmentBoardKeys } from './get-assignment-board';
import { staffKeys } from './get-staff';

export interface UpdateAssignmentsVariables {
  roleAssignmentId: string;
  assignedEmployeeIds: string[];
}

export interface UpdateAssignmentsResponse {
  message?: string;
}

export const useUpdateAssignments = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<UpdateAssignmentsResponse>, Error, UpdateAssignmentsVariables>({
    mutationFn: async ({ roleAssignmentId, assignedEmployeeIds }) => {
      const companyId =
        typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;

      if (!companyId) throw new Error('Company Context Missing');

      const response = await apiClient.put<ApiResponse<UpdateAssignmentsResponse>>(
        `/companies/${companyId}/staff/${roleAssignmentId}/employee-assignments`,
        { assignedEmployeeIds }
      );

      return response.data;
    },
    onSuccess: (_, variables) => {
      const companyId =
        typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;

      if (!companyId) return;

      queryClient.invalidateQueries({
        queryKey: assignmentBoardKeys.list(companyId, variables.roleAssignmentId),
      });
      queryClient.invalidateQueries({ queryKey: staffKeys.list(companyId) });
    },
  });
};
