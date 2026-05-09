export interface SuperAdminDashboardHeaderDto {
  displayName?: string | null;
  currentTimeLabel?: string | null;
  currentDateLabel?: string | null;
}

export interface SuperAdminDashboardKpisDto {
  totalCompanies?: number | null;
  activeCompanies?: number | null;
  suspendedCompanies?: number | null;
  expiringSoon?: number | null;
}

export interface CompanyRegistrationPointDto {
  label: string;
  count?: number | null;
  percentage?: number | null;
}

export interface SubscriptionPlanBreakdownDto {
  planId?: string | null;
  label: string;
  companyCount?: number | null;
  percentage?: number | null;
}

export interface SuperAdminActivityItemDto {
  id: string;
  actorName?: string | null;
  description: string;
  occurredAtLabel?: string | null;
}

export interface SuperAdminQuickStatDto {
  id?: string | null;
  label: string;
  valueLabel?: string | null;
  percentage?: number | null;
}

export interface SuperAdminDashboardDto {
  header?: SuperAdminDashboardHeaderDto | null;
  kpis?: SuperAdminDashboardKpisDto | null;
  companyRegistrations?: CompanyRegistrationPointDto[] | null;
  subscriptionPlans?: SubscriptionPlanBreakdownDto[] | null;
  recentActivity?: SuperAdminActivityItemDto[] | null;
  quickStats?: SuperAdminQuickStatDto[] | null;
}
