import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';

export interface AssignmentBoardManagerDTO {
  roleAssignmentId: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
}

export interface AssignmentBoardEmployeeDTO {
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName: string;
  jobTitle: string;
}

export interface AssignmentBoardDTO {
  manager: AssignmentBoardManagerDTO;
  assignedEmployees: AssignmentBoardEmployeeDTO[];
  unassignedEmployees: AssignmentBoardEmployeeDTO[];
  assignedCount: number;
  unassignedCount: number;
}

export const assignmentBoardKeys = {
  all: ['assignment-board'] as const,
  lists: () => [...assignmentBoardKeys.all, 'list'] as const,
  list: (companyId: string, roleAssignmentId: string) =>
    [...assignmentBoardKeys.lists(), { companyId, roleAssignmentId }] as const,
};

function isAssignmentBoardDTO(value: unknown): value is AssignmentBoardDTO {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<AssignmentBoardDTO>;

  return (
    Array.isArray(candidate.assignedEmployees) &&
    Array.isArray(candidate.unassignedEmployees)
  );
}

export const useAssignmentBoard = (roleAssignmentId: string | null) => {
  const companyId =
    typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;

  return useQuery<AssignmentBoardDTO>({
    queryKey: assignmentBoardKeys.list(companyId || '', roleAssignmentId || ''),
    queryFn: async () => {
      if (!companyId) throw new Error('Company Context Missing');
      if (!roleAssignmentId) throw new Error('Role Assignment ID Missing');

      const response = await apiClient.get<ApiResponse<AssignmentBoardDTO> | AssignmentBoardDTO>(
        `/companies/${companyId}/staff/${roleAssignmentId}/employee-assignments`
      );

      const payload = response.data;

      if (isAssignmentBoardDTO(payload)) {
        return payload;
      }

      if (isAssignmentBoardDTO(payload.data)) {
        return payload.data;
      }

      throw new Error('Invalid assignment board response');
    },
    enabled: !!companyId && !!roleAssignmentId,
    staleTime: 0,
  });
};
