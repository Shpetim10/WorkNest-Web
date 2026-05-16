export interface AdminDashboardHeaderDto {
  displayName?: string | null;
  currentTimeLabel?: string | null;
  currentDateLabel?: string | null;
}

export interface AdminDashboardKpisDto {
  totalEmployees?: number | null;
  presentToday?: number | null;
  onLeaveToday?: number | null;
  pendingRequests?: number | null;
}

export interface AttendanceTrendPointDto {
  label: string;
  count?: number | null;
  percentage?: number | null;
}

export interface ActiveDayPointDto {
  label: string; // Sun-Sat
  count?: number | null;
  percentage?: number | null;
}

export interface AdminActivityItemDto {
  id: string;
  actorName?: string | null;
  description: string;
  tag?: string | null;
  tagColor?: string | null;
  occurredAtLabel?: string | null;
}

export interface AdminQuickStatDto {
  id?: string | null;
  label: string;
  valueLabel?: string | null;
  percentage?: number | null;
}

export interface AdminDashboardDto {
  header?: AdminDashboardHeaderDto | null;
  kpis?: AdminDashboardKpisDto | null;
  attendanceTrend?: AttendanceTrendPointDto[] | null;
  activeDays?: ActiveDayPointDto[] | null;
  recentActivity?: AdminActivityItemDto[] | null;
  quickStats?: AdminQuickStatDto[] | null;
}
