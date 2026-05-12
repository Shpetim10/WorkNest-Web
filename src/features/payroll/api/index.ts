import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import {
  PayrollAdjustmentRequest,
  PayrollAdjustmentResponse,
  PayrollBatchCalculateRequest,
  PayrollBatchCalculateResponse,
  PayrollCalculationResponse,
  PayrollPeriod,
  PayrollPersistRequest,
  SickLeavePolicyResponse,
  UpsertSickLeavePolicyRequest,
} from '../types';

export const payrollKeys = {
  all: ['payroll'] as const,
  details: () => [...payrollKeys.all, 'details'] as const,
  detail: (employeeId: string, period: PayrollPeriod) =>
    [...payrollKeys.details(), employeeId, period.year, period.month] as const,
  sickLeavePolicy: () => [...payrollKeys.all, 'sick-leave-policy'] as const,
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
  return useMutation<PayrollAdjustmentResponse, unknown, PayrollAdjustmentRequest>({
    mutationFn: async ({ employeeId, year, month, amount, reason, notes }) => {
      const response = await apiClient.post<ApiResponse<PayrollAdjustmentResponse>>(
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
  return useMutation<PayrollAdjustmentResponse, unknown, PayrollAdjustmentRequest>({
    mutationFn: async ({ employeeId, year, month, amount, reason, notes }) => {
      const response = await apiClient.post<ApiResponse<PayrollAdjustmentResponse>>(
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

export function useSickLeavePolicy() {
  return useQuery<SickLeavePolicyResponse>({
    queryKey: payrollKeys.sickLeavePolicy(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SickLeavePolicyResponse>>(
        '/admin/payroll/sick-leave-policy',
      );
      return response.data.data;
    },
  });
}

export function useUpsertSickLeavePolicy() {
  const queryClient = useQueryClient();
  return useMutation<SickLeavePolicyResponse, unknown, UpsertSickLeavePolicyRequest>({
    mutationFn: async (body) => {
      const response = await apiClient.put<ApiResponse<SickLeavePolicyResponse>>(
        '/admin/payroll/sick-leave-policy',
        body,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.sickLeavePolicy() });
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
