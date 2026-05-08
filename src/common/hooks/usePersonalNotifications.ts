'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { RealtimeEventType } from '@/common/types/realtime';
import { leaveKeys } from '@/features/leave/api';

export function usePersonalNotifications() {
  const queryClient = useQueryClient();

  useRealtimeSubscription('/user/queue/notifications', (envelope) => {
    switch (envelope.type) {
      case RealtimeEventType.LEAVE_REQUEST_APPROVED:
      case RealtimeEventType.LEAVE_REQUEST_REJECTED:
        // Refresh the employee's own leave list so their status is current
        queryClient.invalidateQueries({ queryKey: leaveKeys.requests() });
        if (envelope.entityId) {
          queryClient.invalidateQueries({ queryKey: leaveKeys.detail(envelope.entityId) });
        }
        break;
    }
  });
}
