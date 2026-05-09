'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/common/hooks/useRealtimeSubscription';
import { RealtimeEventType } from '@/common/types/realtime';
import { leaveKeys } from '../api';

export function useLeaveRealtime(companyId: string | null) {
  const queryClient = useQueryClient();

  useRealtimeSubscription(
    companyId ? `/topic/companies/${companyId}/leave-requests` : null,
    (envelope) => {
      switch (envelope.type) {
        case RealtimeEventType.LEAVE_REQUEST_SUBMITTED:
        case RealtimeEventType.LEAVE_REQUEST_APPROVED:
        case RealtimeEventType.LEAVE_REQUEST_REJECTED:
          queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
          if (envelope.entityId) {
            queryClient.invalidateQueries({ queryKey: leaveKeys.detail(envelope.entityId) });
          }
          break;
      }
    },
  );
}
