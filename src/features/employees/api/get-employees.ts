"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import type { ApiResponse, OffsetPaginatedCollection } from '@/common/types/api';
import { CompanyPersonRow, EmployeeDTO, EmployeeFilters } from '../types';
import { normalizeCompanyPersonRow } from '../utils/people';

const MAX_PAGE_SIZE = 100;

function getCurrentCompanyId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('current_company_id');
}

type EmployeePageResponse = ApiResponse<OffsetPaginatedCollection<EmployeeDTO>>;
type CompanyPeoplePageResponse = ApiResponse<OffsetPaginatedCollection<CompanyPersonRow>>;

async function fetchEmployeesPage(
  companyId: string,
  filters: EmployeeFilters,
): Promise<EmployeePageResponse> {
  const page = filters.page ?? 1;
  const size = filters.size ?? 10;

  const response = await apiClient.get<EmployeePageResponse>(`/companies/${companyId}/employees`, {
    params: {
      ...filters,
      page: Math.max(0, page - 1),
      size: Math.min(Math.max(1, size), MAX_PAGE_SIZE),
    },
  });

  return response.data;
}

async function fetchEmployeesWithExpandedSize(
  companyId: string,
  filters: EmployeeFilters,
): Promise<EmployeePageResponse> {
  const requestedSize = filters.size ?? 10;

  if (requestedSize <= MAX_PAGE_SIZE) {
    return fetchEmployeesPage(companyId, filters);
  }

  const firstPage = await fetchEmployeesPage(companyId, {
    ...filters,
    page: filters.page ?? 1,
    size: MAX_PAGE_SIZE,
  });
  const items = [...firstPage.data.items];
  const totalItems = firstPage.data.totalItems;
  const totalPages = firstPage.data.totalPages;
  const remainingPages = Math.ceil(requestedSize / MAX_PAGE_SIZE) - 1;

  for (let step = 1; step <= remainingPages && step < totalPages; step += 1) {
    const nextPage = await fetchEmployeesPage(companyId, {
      ...filters,
      page: (filters.page ?? 1) + step,
      size: MAX_PAGE_SIZE,
    });
    items.push(...nextPage.data.items);
  }

  return {
    ...firstPage,
    data: {
      ...firstPage.data,
      items: items.slice(0, requestedSize),
      pageSize: Math.min(requestedSize, totalItems),
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / requestedSize)),
      hasNext: requestedSize < totalItems,
      hasPrevious: false,
    },
  };
}

export async function fetchAllEmployees(
  companyId: string,
  filters: Omit<EmployeeFilters, 'page' | 'size'> = {},
  size = MAX_PAGE_SIZE,
): Promise<EmployeeDTO[]> {
  const requestedSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
  const items: EmployeeDTO[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetchEmployeesPage(companyId, {
      ...filters,
      page,
      size: requestedSize,
    });

    items.push(...(response.data.items ?? []));
    totalPages = Math.max(1, response.data.totalPages ?? 1);
    page += 1;
  } while (page <= totalPages);

  return items;
}

/**
 * Filter keys for cache invalidation
 */
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...employeeKeys.lists(), { filters }] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

/**
 * Hook to fetch a list of employees for the current company
 */
export const useEmployees = (filters: EmployeeFilters) => {
  return useQuery<EmployeePageResponse>({
    queryKey: employeeKeys.list(filters),
    queryFn: async () => {
      const companyId = getCurrentCompanyId();
      if (!companyId) throw new Error('Company Context Missing');

      return fetchEmployeesWithExpandedSize(companyId, filters);
    },
  });
};

export const useCompanyPeople = (filters: EmployeeFilters) => {
  return useQuery<CompanyPeoplePageResponse>({
    queryKey: [...employeeKeys.list(filters), 'normalized'],
    queryFn: async () => {
      const companyId = getCurrentCompanyId();
      if (!companyId) throw new Error('Company Context Missing');

      const response = await fetchEmployeesWithExpandedSize(companyId, filters);

      return {
        ...response,
        data: {
          ...response.data,
          items: (response.data.items ?? []).map(normalizeCompanyPersonRow),
        },
      };
    },
  });
};
