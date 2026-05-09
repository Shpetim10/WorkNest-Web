import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { AuditLogPage, AuditLogParams } from '../types';

// TODO backend: confirm the final audit log endpoint with the backend contract.
// This placeholder follows the existing admin-resource API pattern used by Leave/Attendance.
const AUDIT_LOG_ENDPOINT = '/admin/audit-logs';

export const auditLogKeys = {
  all: ['audit-log'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (params: AuditLogParams) => [...auditLogKeys.lists(), params] as const,
};

export const useAuditLogs = (params: AuditLogParams) => {
  return useQuery<AuditLogPage>({
    queryKey: auditLogKeys.list(params),
    queryFn: async () => {
      const { page = 1, size = 10 } = params;
      const response = await apiClient.get<{ status?: string; data: AuditLogPage }>(
        AUDIT_LOG_ENDPOINT,
        { params: { page: page - 1, size } },
      );
      return response.data.data;
    },
  });
};
