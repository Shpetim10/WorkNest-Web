import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import {
  PayrollAdjustmentRequest,
  PayrollBatchCalculateRequest,
  PayrollBatchCalculateResponse,
  PayrollCalculationResponse,
  PayrollPeriod,
  PayrollPersistRequest,
} from '../types';

export const payrollKeys = {
  all: ['payroll'] as const,
  details: () => [...payrollKeys.all, 'details'] as const,
  detail: (employeeId: string, period: PayrollPeriod) =>
    [...payrollKeys.details(), employeeId, period.year, period.month] as const,
};

export function usePayrollDetails(employeeId: string | null, period: PayrollPeriod) {
  return useQuery<PayrollCalculationResponse>({
    queryKey: employeeId ? payrollKeys.detail(employeeId, period) : [...payrollKeys.details(), 'empty'],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee is required');
      const response = await apiClient.get<ApiResponse<PayrollCalculationResponse>>(
        `/admin/payroll/employees/${employeeId}/details`,
        { params: period },
      );
      return response.data.data;
    },
    enabled: !!employeeId,
    retry: 1,
  });
}

export function useAddPayrollBonus() {
  const queryClient = useQueryClient();
  return useMutation<PayrollCalculationResponse, unknown, PayrollAdjustmentRequest>({
    mutationFn: async ({ employeeId, year, month, amount, reason, notes }) => {
      const response = await apiClient.post<ApiResponse<PayrollCalculationResponse>>(
        `/admin/payroll/employees/${employeeId}/adjustments/bonus`,
        { year, month, amount, reason, notes },
      );
      return response.data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: payrollKeys.detail(vars.employeeId, { year: vars.year, month: vars.month }),
      });
      queryClient.invalidateQueries({ queryKey: payrollKeys.details() });
    },
  });
}

export function useAddPayrollDeduction() {
  const queryClient = useQueryClient();
  return useMutation<PayrollCalculationResponse, unknown, PayrollAdjustmentRequest>({
    mutationFn: async ({ employeeId, year, month, amount, reason, notes }) => {
      const response = await apiClient.post<ApiResponse<PayrollCalculationResponse>>(
        `/admin/payroll/employees/${employeeId}/adjustments/deduction`,
        { year, month, amount, reason, notes },
      );
      return response.data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: payrollKeys.detail(vars.employeeId, { year: vars.year, month: vars.month }),
      });
      queryClient.invalidateQueries({ queryKey: payrollKeys.details() });
    },
  });
}

export function usePersistPayrollCalculation() {
  const queryClient = useQueryClient();
  return useMutation<PayrollCalculationResponse, unknown, PayrollPersistRequest>({
    mutationFn: async ({ employeeId, year, month }) => {
      const response = await apiClient.post<ApiResponse<PayrollCalculationResponse>>(
        `/admin/payroll/employees/${employeeId}/calculate`,
        { year, month },
      );
      return response.data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: payrollKeys.detail(vars.employeeId, { year: vars.year, month: vars.month }),
      });
      queryClient.invalidateQueries({ queryKey: payrollKeys.details() });
    },
  });
}

export function useBatchCalculatePayroll() {
  const queryClient = useQueryClient();
  return useMutation<PayrollBatchCalculateResponse, unknown, PayrollBatchCalculateRequest>({
    mutationFn: async ({ year, month, employeeIds }) => {
      const response = await apiClient.post<ApiResponse<PayrollBatchCalculateResponse>>(
        '/admin/payroll/calculate',
        { year, month, employeeIds: employeeIds?.length ? employeeIds : null },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.details() });
    },
  });
}
