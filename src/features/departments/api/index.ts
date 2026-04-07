import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse, ApiErrorResponse } from '@/common/types/api';
import {
  DepartmentListItem,
  DepartmentDetails,
  DepartmentLookupItem,
  CreateDepartmentRequest,
  UpdateDepartmentRequest
} from '../types';

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: () => [...departmentKeys.lists()] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
  lookup: () => [...departmentKeys.all, 'lookup'] as const,
};

/**
 * Hook to fetch all departments for the current company
 */
export const useDepartments = () => {
  return useQuery<DepartmentListItem[]>({
    queryKey: departmentKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DepartmentListItem[]>>('/departments');
      return response.data.data;
    },
  });
};

/**
 * Hook to fetch a single department's details
 */
export const useDepartment = (id: string | null) => {
  return useQuery<DepartmentDetails>({
    queryKey: departmentKeys.detail(id || ''),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DepartmentDetails>>(`/departments/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch lightweight department items for selectors
 */
export const useDepartmentLookup = () => {
  return useQuery<DepartmentLookupItem[]>({
    queryKey: departmentKeys.lookup(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DepartmentLookupItem[]>>('/departments/lookup');
      return response.data.data;
    },
  });
};

/**
 * Hook to create a new department
 */
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation<DepartmentDetails, ApiErrorResponse, CreateDepartmentRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<DepartmentDetails>>('/departments', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.lookup() });
    },
  });
};

/**
 * Hook to update an existing department
 */
export const useUpdateDepartment = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<DepartmentDetails, ApiErrorResponse, UpdateDepartmentRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.put<ApiResponse<DepartmentDetails>>(`/departments/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.lookup() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
    },
  });
};

/**
 * Hook to delete a department
 */
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation<void, ApiErrorResponse, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/departments/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.lookup() });
      queryClient.removeQueries({ queryKey: departmentKeys.detail(id) });
    },
  });
};
