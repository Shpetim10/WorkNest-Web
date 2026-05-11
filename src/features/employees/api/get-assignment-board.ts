import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import type { ApiResponse, OffsetPaginatedCollection } from '@/common/types/api';

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
  assignedEmployees: OffsetPaginatedCollection<AssignmentBoardEmployeeDTO>;
  unassignedEmployees: OffsetPaginatedCollection<AssignmentBoardEmployeeDTO>;
  assignedCount: number;
  unassignedCount: number;
}

export interface AssignmentBoardParams {
  assignedPage?: number;
  assignedSize?: number;
  unassignedPage?: number;
  unassignedSize?: number;
}

export const assignmentBoardKeys = {
  all: ['assignment-board'] as const,
  lists: () => [...assignmentBoardKeys.all, 'list'] as const,
  list: (companyId: string, roleAssignmentId: string, params: AssignmentBoardParams) =>
    [...assignmentBoardKeys.lists(), { companyId, roleAssignmentId, params }] as const,
};

function isPaginatedEmployees(
  value: unknown,
): value is OffsetPaginatedCollection<AssignmentBoardEmployeeDTO> {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<OffsetPaginatedCollection<AssignmentBoardEmployeeDTO>>;
  return Array.isArray(candidate.items);
}

function isAssignmentBoardDTO(value: unknown): value is AssignmentBoardDTO {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<AssignmentBoardDTO>;

  return (
    isPaginatedEmployees(candidate.assignedEmployees) &&
    isPaginatedEmployees(candidate.unassignedEmployees)
  );
}

export const useAssignmentBoard = (
  roleAssignmentId: string | null,
  params: AssignmentBoardParams = {
    assignedPage: 1,
    assignedSize: 100,
    unassignedPage: 1,
    unassignedSize: 100,
  },
) => {
  const companyId =
    typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;

  return useQuery<AssignmentBoardDTO>({
    queryKey: assignmentBoardKeys.list(companyId || '', roleAssignmentId || '', params),
    queryFn: async () => {
      if (!companyId) throw new Error('Company Context Missing');
      if (!roleAssignmentId) throw new Error('Role Assignment ID Missing');

      const response = await apiClient.get<ApiResponse<AssignmentBoardDTO> | AssignmentBoardDTO>(
        `/companies/${companyId}/staff/${roleAssignmentId}/employee-assignments`,
        {
          params: {
            assignedPage: Math.max(0, (params.assignedPage ?? 1) - 1),
            assignedSize: params.assignedSize ?? 100,
            unassignedPage: Math.max(0, (params.unassignedPage ?? 1) - 1),
            unassignedSize: params.unassignedSize ?? 100,
          },
        },
      );

      const payload = response.data;

      if (isAssignmentBoardDTO(payload)) {
        return payload;
      }

      if (isAssignmentBoardDTO((payload as ApiResponse<AssignmentBoardDTO>).data)) {
        return (payload as ApiResponse<AssignmentBoardDTO>).data;
      }

      throw new Error('Invalid assignment board response');
    },
    enabled: !!companyId && !!roleAssignmentId,
    staleTime: 0,
  });
};
