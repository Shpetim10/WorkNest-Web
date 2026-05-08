'use client';

import { useDepartmentsRealtime } from '@/features/departments';
import { useAnnouncementsRealtime } from '@/features/announcements';
import { useLeaveRealtime } from '@/features/leave';
import { useAttendanceRealtime } from '@/features/attendance';
import { useEmployeesRealtime } from '@/features/employees';
import { useLocationsRealtime } from '@/features/locations';
import { useCompanySettingsRealtime } from '@/features/company-settings/hooks/useCompanySettingsRealtime';
import { usePersonalNotifications } from '@/common/hooks/usePersonalNotifications';

export function useDashboardRealtime(companyId: string | null) {
  useDepartmentsRealtime(companyId);
  useAnnouncementsRealtime(companyId);
  useLeaveRealtime(companyId);
  useAttendanceRealtime(companyId);
  useEmployeesRealtime(companyId);
  useLocationsRealtime(companyId);
  useCompanySettingsRealtime(companyId);
  usePersonalNotifications();
}
