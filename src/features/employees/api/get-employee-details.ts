import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/types';
import { EmployeeDTO } from '../types';

export const employeeDetailKeys = {
  all: ['employee'] as const,
  detail: (companyId: string, employeeId: string) => [...employeeDetailKeys.all, companyId, employeeId] as const,
};

export const getEmployeeDetails = async (companyId: string, employeeId: string): Promise<EmployeeDTO> => {
  const { data } = await apiClient.get<ApiResponse<EmployeeDTO>>(
    `/companies/${companyId}/employees/${employeeId}`
  );
  return data.data;
};

export const useEmployee = (companyId: string, employeeId: string | null) => {
  return useQuery({
    queryKey: employeeDetailKeys.detail(companyId, employeeId || ''),
    queryFn: () => getEmployeeDetails(companyId, employeeId!),
    enabled: !!employeeId && !!companyId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};
