import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse, OffsetPaginatedCollection, PaginationParams } from '@/common/types/api';
import { AnnouncementListResponse, CreateAnnouncementBody } from '../types';
import { fetchAllEmployees } from '@/features/employees/api/get-employees';

export interface EmployeeLookupItem {
  id: string;
  fullName: string;
  email: string;
  departmentId?: string;
  departmentName?: string;
  department?: {
    id?: string;
    name?: string;
  };
}

function getCurrentCompanyId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('current_company_id');
}

function getBasePath(companyId: string) {
  return `/companies/${companyId}/announcements`;
}

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (params: PaginationParams = {}) => [...announcementKeys.all, 'list', params] as const,
  employeeLookup: (departmentIds: string[], departmentNames: string[]) =>
    [...announcementKeys.all, 'employee-lookup', { departmentIds, departmentNames }] as const,
};

export const useAnnouncements = (params: PaginationParams = {}) => {
  return useQuery<OffsetPaginatedCollection<AnnouncementListResponse>>({
    queryKey: announcementKeys.list(params),
    queryFn: async () => {
      const companyId = getCurrentCompanyId();
      if (!companyId) throw new Error('Company context missing.');
      const response = await apiClient.get<ApiResponse<OffsetPaginatedCollection<AnnouncementListResponse>>>(
        getBasePath(companyId),
        {
          params: {
            page: Math.max(0, (params.page ?? 1) - 1),
            size: params.size ?? 10,
          },
        },
      );
      return response.data.data;
    },
    enabled: typeof window !== 'undefined' && !!getCurrentCompanyId(),
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation<AnnouncementListResponse, unknown, CreateAnnouncementBody>({
    mutationFn: async (body) => {
      const companyId = getCurrentCompanyId();
      if (!companyId) throw new Error('Company context missing.');
      const response = await apiClient.post<ApiResponse<AnnouncementListResponse>>(
        getBasePath(companyId),
        body,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (id) => {
      const companyId = getCurrentCompanyId();
      if (!companyId) throw new Error('Company context missing.');
      await apiClient.delete(`${getBasePath(companyId)}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
    },
  });
};

function normalizeLookupValue(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

export const useEmployeeLookup = (
  departmentIds: string[],
  departmentNames: string[],
  enabled = true,
) => {
  return useQuery<EmployeeLookupItem[]>({
    queryKey: announcementKeys.employeeLookup(departmentIds, departmentNames),
    queryFn: async () => {
      const companyId = getCurrentCompanyId();
      if (!companyId) throw new Error('Company context missing.');

      const responses = await Promise.all(
        departmentIds.map((departmentId) =>
          fetchAllEmployees(companyId, { departmentId }),
        ),
      );

      const employeesById = new Map<string, EmployeeLookupItem>();
      responses.forEach((employees) => {
        employees.forEach((employee) => {
          employeesById.set(employee.id, {
            id: employee.id,
            fullName:
              employee.name ||
              [employee.firstName, employee.lastName].filter(Boolean).join(' ') ||
              employee.email,
            email: employee.email,
            departmentId: employee.departmentId,
            departmentName: employee.departmentName,
            department: employee.departmentId || employee.departmentName
              ? {
                  id: employee.departmentId,
                  name: employee.departmentName,
                }
              : undefined,
          });
        });
      });

      const selectedDepartmentIds = new Set(departmentIds);
      const selectedDepartmentNames = new Set(departmentNames.map(normalizeLookupValue));

      return Array.from(employeesById.values()).filter((employee) => {
        const employeeDepartmentId = employee.departmentId ?? employee.department?.id;
        const employeeDepartmentName = normalizeLookupValue(
          employee.departmentName ?? employee.department?.name,
        );

        return (
          (employeeDepartmentId ? selectedDepartmentIds.has(employeeDepartmentId) : false) ||
          (employeeDepartmentName ? selectedDepartmentNames.has(employeeDepartmentName) : false)
        );
      });
    },
    enabled:
      enabled &&
      typeof window !== 'undefined' &&
      !!getCurrentCompanyId() &&
      departmentIds.length > 0,
  });
};
