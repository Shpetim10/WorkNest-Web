'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/common/hooks/useRealtimeSubscription';
import { RealtimeEventType } from '@/common/types/realtime';
import { locationKeys } from '../api';

export function useLocationsRealtime(companyId: string | null) {
  const queryClient = useQueryClient();

  useRealtimeSubscription(
    companyId ? `/topic/companies/${companyId}/sites` : null,
    (envelope) => {
      switch (envelope.type) {
        case RealtimeEventType.COMPANY_SITE_CREATED:
          queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
          break;
        case RealtimeEventType.COMPANY_SITE_UPDATED:
        case RealtimeEventType.COMPANY_SITE_ACTIVATED:
        case RealtimeEventType.COMPANY_SITE_DISABLED:
          queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
          if (envelope.entityId) {
            queryClient.invalidateQueries({ queryKey: locationKeys.detail(envelope.entityId) });
            queryClient.invalidateQueries({ queryKey: locationKeys.setupStatus(envelope.entityId) });
          }
          break;
      }
    },
  );
}
