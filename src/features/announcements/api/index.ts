import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { AnnouncementListResponse, CreateAnnouncementBody } from '../types';

export interface EmployeeLookupItem {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
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
  list: () => [...announcementKeys.all, 'list'] as const,
  employeeLookup: () => [...announcementKeys.all, 'employee-lookup'] as const,
};

export const useAnnouncements = () => {
  return useQuery<AnnouncementListResponse[]>({
    queryKey: announcementKeys.list(),
    queryFn: async () => {
      const companyId = getCurrentCompanyId();
      if (!companyId) throw new Error('Company context missing.');
      const response = await apiClient.get<ApiResponse<AnnouncementListResponse[]>>(
        getBasePath(companyId),
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

export const useEmployeeLookup = () => {
  return useQuery<EmployeeLookupItem[]>({
    queryKey: announcementKeys.employeeLookup(),
    queryFn: async () => {
      const companyId = getCurrentCompanyId();
      if (!companyId) throw new Error('Company context missing.');
      const response = await apiClient.get<ApiResponse<EmployeeLookupItem[]>>(
        `/companies/${companyId}/employees`,
      );
      return response.data.data;
    },
    enabled: typeof window !== 'undefined' && !!getCurrentCompanyId(),
  });
};