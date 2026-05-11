'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/common/hooks/useRealtimeSubscription';
import { RealtimeEventType } from '@/common/types/realtime';
import { employeeKeys } from '../api/get-employees';

export function useEmployeesRealtime(companyId: string | null) {
  const queryClient = useQueryClient();

  useRealtimeSubscription(
    companyId ? `/topic/companies/${companyId}/employees` : null,
    (envelope) => {
      if (envelope.type === RealtimeEventType.EMPLOYEE_PROVISIONED) {
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      }
    },
  );
}
