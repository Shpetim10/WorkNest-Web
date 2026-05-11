'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/common/hooks/useRealtimeSubscription';
import { RealtimeEventType } from '@/common/types/realtime';
import { attendanceKeys } from '../api/get-attendance';

export function useAttendanceRealtime(companyId: string | null) {
  const queryClient = useQueryClient();

  useRealtimeSubscription(
    companyId ? `/topic/companies/${companyId}/attendance` : null,
    (envelope) => {
      switch (envelope.type) {
        case RealtimeEventType.ATTENDANCE_MANUAL_CHECK_IN:
        case RealtimeEventType.ATTENDANCE_MANUAL_CHECK_OUT:
        case RealtimeEventType.ATTENDANCE_EVENT_REVIEWED:
        case RealtimeEventType.ATTENDANCE_DAY_ADJUSTED:
          queryClient.invalidateQueries({ queryKey: attendanceKeys.dashboards() });
          if (envelope.entityId) {
            queryClient.invalidateQueries({ queryKey: attendanceKeys.details() });
          }
          break;
      }
    },
  );
}
