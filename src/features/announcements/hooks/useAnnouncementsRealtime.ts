'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/common/hooks/useRealtimeSubscription';
import { RealtimeEventType } from '@/common/types/realtime';
import { announcementKeys } from '../api';

export function useAnnouncementsRealtime(companyId: string | null) {
  const queryClient = useQueryClient();

  useRealtimeSubscription(
    companyId ? `/topic/companies/${companyId}/announcements` : null,
    (envelope) => {
      switch (envelope.type) {
        case RealtimeEventType.ANNOUNCEMENT_CREATED:
        case RealtimeEventType.ANNOUNCEMENT_DELETED:
          queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
          break;
      }
    },
  );
}
