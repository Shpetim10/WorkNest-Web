'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/common/hooks/useRealtimeSubscription';
import { RealtimeEventType } from '@/common/types/realtime';
import { departmentKeys } from '../api';

export function useDepartmentsRealtime(companyId: string | null) {
  const queryClient = useQueryClient();

  useRealtimeSubscription(
    companyId ? `/topic/companies/${companyId}/departments` : null,
    (envelope) => {
      switch (envelope.type) {
        case RealtimeEventType.DEPARTMENT_CREATED:
        case RealtimeEventType.DEPARTMENT_UPDATED:
        case RealtimeEventType.DEPARTMENT_DELETED:
          queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
          queryClient.invalidateQueries({ queryKey: departmentKeys.lookup() });
          if (envelope.entityId) {
            queryClient.invalidateQueries({ queryKey: departmentKeys.detail(envelope.entityId) });
          }
          break;
      }
    },
  );
}
