'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/common/hooks/useRealtimeSubscription';
import { RealtimeEventType } from '@/common/types/realtime';
import { companySettingsKeys } from '../api/use-company-settings';

export function useCompanySettingsRealtime(companyId: string | null) {
  const queryClient = useQueryClient();

  useRealtimeSubscription(
    companyId ? `/topic/companies/${companyId}/settings` : null,
    (envelope) => {
      if (envelope.type === RealtimeEventType.COMPANY_SETTINGS_UPDATED && companyId) {
        queryClient.invalidateQueries({ queryKey: companySettingsKeys.detail(companyId) });
      }
    },
  );
}
