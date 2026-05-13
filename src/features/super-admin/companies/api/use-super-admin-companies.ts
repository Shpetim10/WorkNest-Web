import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import type { ApiResponse } from '@/common/types/api';
import type { CompanyManagementRow } from '../types';

export interface CompaniesQuery {
  search?: string;
  status?: string;
  page: number;
  size: number;
}

export interface CompaniesResult {
  rows: CompanyManagementRow[];
  total: number;
  totalPages: number;
}

export interface ToggleSuspendPayload {
  companyId: string;
  reason: string;
}

const ENDPOINT = '/super-admin/companies';

export const superAdminCompaniesKeys = {
  all: ['super-admin-companies'] as const,
  list: (params: CompaniesQuery) => [...superAdminCompaniesKeys.all, 'list', params] as const,
};

type CompanyDto = Record<string, unknown>;

function mapRow(dto: CompanyDto): CompanyManagementRow {
  return {
    id: String(dto.id ?? ''),
    companyName: String(dto.companyName ?? ''),
    legalName: String(dto.legalName ?? dto.companyName ?? ''),
    countryCode: String(dto.countryCode ?? ''),
    nipt: String(dto.nipt ?? ''),
    registrationNumber: String(dto.registrationNumber ?? dto.nipt ?? ''),
    email: String(dto.email ?? ''),
    plan: String(dto.plan ?? '') as CompanyManagementRow['plan'],
    status: String(dto.status ?? 'active').toLowerCase() as CompanyManagementRow['status'],
    createdAt: String(dto.createdAt ?? ''),
  };
}

type BackendPage = {
  items: CompanyDto[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

async function fetchCompanies(params: CompaniesQuery): Promise<CompaniesResult> {
  const response = await apiClient.get<ApiResponse<BackendPage>>(ENDPOINT, {
    params: {
      page: params.page,
      size: params.size,
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });

  const payload: BackendPage = (response.data as ApiResponse<BackendPage>).data;

  return {
    rows: (payload.items ?? []).map(mapRow),
    total: payload.totalItems ?? 0,
    totalPages: Math.max(1, payload.totalPages ?? 1),
  };
}

export function useSuperAdminCompanies(params: CompaniesQuery) {
  return useQuery<CompaniesResult>({
    queryKey: superAdminCompaniesKeys.list(params),
    queryFn: () => fetchCompanies(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useToggleSuspend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, reason }: ToggleSuspendPayload) => {
      await apiClient.post(`${ENDPOINT}/${companyId}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: superAdminCompaniesKeys.all });
    },
  });
}