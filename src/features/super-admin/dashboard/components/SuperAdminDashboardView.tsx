"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  ChevronDown,
  Home,
  CheckSquare,
  XCircle,
  Info
} from 'lucide-react';
import { Card, PageHeaderDecorativeCircles } from '@/common/ui';
import { useSuperAdminDashboard } from '@/features/super-admin/dashboard/api/use-super-admin-dashboard';
import {
  CompanyRegistrationPointDto,
  SubscriptionPlanBreakdownDto,
  SuperAdminActivityItemDto,
  SuperAdminDashboardDto,
  SuperAdminDashboardHeaderDto,
  SuperAdminDashboardKpisDto,
  SuperAdminQuickStatDto,
} from '../types';

interface KpiData {
  id: string;
  label: string;
  valueKey: keyof SuperAdminDashboardKpisDto;
  icon: LucideIcon;
  iconColor: string;
}

const KPI_DATA: KpiData[] = [
  {
    id: 'total-companies',
    label: 'Total Companies',
    valueKey: 'totalCompanies',
    icon: Home,
    iconColor: 'text-[#2B7FFF]',
  },
  {
    id: 'active-companies',
    label: 'Active Companies',
    valueKey: 'activeCompanies',
    icon: CheckSquare,
    iconColor: 'text-[#2B7FFF]',
  },
  {
    id: 'suspended-companies',
    label: 'Suspended',
    valueKey: 'suspendedCompanies',
    icon: XCircle,
    iconColor: 'text-[#2B7FFF]',
  },
  {
    id: 'expiring-soon',
    label: 'Expiring Soon',
    valueKey: 'expiringSoon',
    icon: Info,
    iconColor: 'text-[#2B7FFF]',
  },
];

const SUBSCRIPTION_COLORS = ['#2B7FFF', '#155DFC', '#7C3AED', '#00BBA7'];
const PERIOD_FILTER_OPTIONS = [
  { value: '', label: 'All Time' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'this-year', label: 'This Year' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const EMPTY_REGISTRATION_MONTHS: CompanyRegistrationPointDto[] = [
  { label: 'Jan', count: null, percentage: null },
  { label: 'Feb', count: null, percentage: null },
  { label: 'Mar', count: null, percentage: null },
  { label: 'Apr', count: null, percentage: null },
  { label: 'May', count: null, percentage: null },
  { label: 'Jun', count: null, percentage: null },
  { label: 'Jul', count: null, percentage: null },
  { label: 'Aug', count: null, percentage: null },
  { label: 'Sep', count: null, percentage: null },
  { label: 'Oct', count: null, percentage: null },
  { label: 'Nov', count: null, percentage: null },
  { label: 'Dec', count: null, percentage: null },
];
const INITIAL_REGISTRATION_MONTH_COUNT = 6;
const EMPTY_SUBSCRIPTION_PLANS: SubscriptionPlanBreakdownDto[] = [
  { planId: 'starter', label: 'Starter', companyCount: 0, percentage: 0 },
  { planId: 'professional', label: 'Professional', companyCount: 0, percentage: 0 },
  { planId: 'enterprise', label: 'Enterprise', companyCount: 0, percentage: 0 },
];
const EMPTY_QUICK_STATS: SuperAdminQuickStatDto[] = [
  { id: 'active', label: 'Active', valueLabel: '0%', percentage: 0 },
  { id: 'trial', label: 'Trial', valueLabel: '0%', percentage: 0 },
  { id: 'suspended', label: 'Suspended', valueLabel: '0%', percentage: 0 },
];

interface DateTimeLabels {
  time: string;
  date: string;
}

function formatMetric(value?: number | null): string {
  return typeof value === 'number' ? value.toLocaleString() : '0';
}

function clampPercentage(value?: number | null): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

function getRegistrationWidth(row: CompanyRegistrationPointDto, maxCount: number): string {
  if (typeof row.percentage === 'number') {
    return `${clampPercentage(row.percentage)}%`;
  }

  if (typeof row.count === 'number' && maxCount > 0) {
    return `${clampPercentage((row.count / maxCount) * 100)}%`;
  }

  return '0%';
}

function getRegistrationRows(
  registrations?: CompanyRegistrationPointDto[] | null,
): CompanyRegistrationPointDto[] {
  if (!registrations?.length) return EMPTY_REGISTRATION_MONTHS;

  const registrationsByMonth = new Map(
    registrations.map((row) => [row.label.trim().slice(0, 3).toLowerCase(), row]),
  );

  return EMPTY_REGISTRATION_MONTHS.map((month) => {
    const registration = registrationsByMonth.get(month.label.toLowerCase());

    if (!registration) return month;

    return {
      ...month,
      count: registration.count ?? null,
      percentage: registration.percentage ?? null,
    };
  });
}

function getQuickStatRows(stats?: SuperAdminQuickStatDto[] | null): SuperAdminQuickStatDto[] {
  if (!stats?.length) return EMPTY_QUICK_STATS;

  const statsByKey = new Map(
    stats.map((stat) => [(stat.id ?? stat.label).trim().toLowerCase(), stat]),
  );

  return EMPTY_QUICK_STATS.map((placeholder) => {
    const stat = statsByKey.get((placeholder.id ?? placeholder.label).toLowerCase());

    if (!stat) return placeholder;

    return {
      ...placeholder,
      valueLabel: stat.valueLabel ?? `${Math.round(clampPercentage(stat.percentage))}%`,
      percentage: stat.percentage ?? 0,
    };
  });
}

function getPlanPercentage(plan: SubscriptionPlanBreakdownDto, totalCompanies: number): number {
  if (typeof plan.percentage === 'number') return clampPercentage(plan.percentage);
  if (typeof plan.companyCount === 'number' && totalCompanies > 0) {
    return clampPercentage((plan.companyCount / totalCompanies) * 100);
  }

  return 0;
}

function getCurrentDateTimeLabels(): DateTimeLabels {
  const now = new Date();

  return {
    time: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now),
    date: new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(now),
  };
}

function WelcomeBanner({
  header,
  dateTimeLabels,
}: {
  header?: SuperAdminDashboardHeaderDto | null;
  dateTimeLabels: DateTimeLabels;
}) {
  const title = header?.displayName ? `Welcome back, ${header.displayName}` : 'Welcome back';

  return (
    <section
      className="relative flex items-center justify-between overflow-hidden rounded-2xl px-8 py-8"
      style={{
        background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
        minHeight: 120,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      <PageHeaderDecorativeCircles />
      <div className="relative z-10 flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-[20px] font-bold text-white">
            S
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-tight text-white">{title}</h2>
            <p className="mt-0.5 text-sm font-medium text-white/80">
              Good to see you again. Let&apos;s make today productive.
            </p>
          </div>
        </div>
        <div className="text-right text-white">
          <p className="text-[30px] font-bold leading-none tracking-tight">
            {header?.currentTimeLabel ?? dateTimeLabels.time}
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-white/90">
            {header?.currentDateLabel ?? dateTimeLabels.date}
          </p>
        </div>
      </div>
    </section>
  );
}

function KpiCard({ kpi, value }: { kpi: KpiData; value?: number | null }) {
  return (
    <Card className="flex min-h-[160px] min-w-0 flex-col justify-between border-0 p-6">
      <div
        className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] ${kpi.iconColor}`}
        style={{ backgroundColor: '#DBEAFE' }}
      >
        <kpi.icon size={19} strokeWidth={2.2} />
      </div>
      <div className="space-y-0.5">
        <h2 className="text-[22px] font-bold leading-tight text-[#1a1c23]">{formatMetric(value ?? 0)}</h2>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A9BB2]">{kpi.label}</p>
      </div>
    </Card>
  );
}

function PeriodFilterDropdown({
  ariaLabelPrefix,
  value,
  onChange,
}: {
  ariaLabelPrefix: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedOption = PERIOD_FILTER_OPTIONS.find((o) => o.value === value) ?? PERIOD_FILTER_OPTIONS[0];

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative z-30 shrink-0">
      <button
        type="button"
        aria-label={`${ariaLabelPrefix} period filter`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-bold text-[#155DFC] transition-colors hover:text-[#2B7FFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B7FFF]/20"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown size={13} strokeWidth={2.2} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[148px] overflow-hidden rounded-xl border border-[#E5ECF6] bg-white py-1 shadow-[0_14px_34px_rgba(15,23,42,0.13)]">
          {PERIOD_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`flex h-8 w-full items-center justify-between gap-2 px-3 text-left text-[11.5px] font-bold transition-colors ${
                option.value === value ? 'bg-[#F6F9FF] text-[#2B7FFF]' : 'text-[#374151] hover:bg-[#F8FBFF]'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check size={13} strokeWidth={2.4} className="shrink-0 text-[#2B7FFF]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function YearFilterDropdown({ value, onChange }: { value: number; onChange: (year: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative z-30 shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-bold text-[#155DFC] transition-colors hover:text-[#2B7FFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B7FFF]/20"
      >
        <span>{value}</span>
        <ChevronDown size={13} strokeWidth={2.2} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[100px] overflow-hidden rounded-xl border border-[#E5ECF6] bg-white py-1 shadow-[0_14px_34px_rgba(15,23,42,0.13)]">
          {YEAR_OPTIONS.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => { onChange(year); setIsOpen(false); }}
              className={`flex h-8 w-full items-center justify-between px-3 text-[11.5px] font-bold transition-colors ${
                year === value ? 'bg-[#F6F9FF] text-[#2B7FFF]' : 'text-[#374151] hover:bg-[#F8FBFF]'
              }`}
            >
              <span>{year}</span>
              {year === value && <Check size={13} strokeWidth={2.4} className="shrink-0 text-[#2B7FFF]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SubscriptionPieChart({ plans, totalCompanies }: { plans: SubscriptionPlanBreakdownDto[]; totalCompanies: number }) {
  const segments = plans.reduce<
    Array<{ key: string; color: string; percentage: number; dashOffset: number }>
  >((acc, plan, index) => {
    const usedPercentage = acc.reduce((sum, segment) => sum + segment.percentage, 0);
    const percentage = getPlanPercentage(plan, totalCompanies);

    return [
      ...acc,
      {
        key: plan.planId ?? plan.label,
        color: SUBSCRIPTION_COLORS[index % SUBSCRIPTION_COLORS.length],
        percentage,
        dashOffset: -usedPercentage,
      },
    ];
  }, []);
  const hasData = segments.some((segment) => segment.percentage > 0);

  return (
    <div className="relative shrink-0">
      <svg
        aria-label="Subscription plan breakdown"
        className="h-[86px] w-[86px]"
        viewBox="0 0 86 86"
        role="img"
      >
        <circle cx="43" cy="43" r="30" fill="none" stroke="#E8F1FF" strokeWidth="13" />
        {hasData && (
          <g transform="rotate(-90 43 43)">
            {segments.map((segment) => (
              <circle
                key={segment.key}
                cx="43"
                cy="43"
                r="30"
                fill="none"
                stroke={segment.color}
                strokeWidth="13"
                pathLength="100"
                strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`}
                strokeDashoffset={segment.dashOffset}
              />
            ))}
          </g>
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[16px] font-bold leading-none text-[#1f2937]">{totalCompanies}</span>
        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-widest text-[#8A9BB2]">total</span>
      </div>
    </div>
  );
}

function RegistrationBars({
  registrations,
  maxCount,
}: {
  registrations: CompanyRegistrationPointDto[];
  maxCount: number;
}) {
  return (
    <div className="space-y-[10px]">
      {registrations.map((row) => {
        const barWidth = getRegistrationWidth(row, maxCount);
        const hasVisibleBar = barWidth !== '0%';

        return (
          <div key={row.label} className="grid grid-cols-[28px_1fr] items-center gap-3">
            <span className="truncate text-[11px] font-medium text-[#4B5563]">{row.label}</span>
            <div className="h-[16px] overflow-hidden rounded-full bg-[#E6EAF0] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
              {hasVisibleBar && (
                <div
                  className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] pr-2 transition-[width] duration-300"
                  style={{ width: barWidth }}
                >
                  {typeof row.count === 'number' && (
                    <span className="text-[10px] font-bold text-white">{row.count}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RegistrationsChart({ registrations }: { registrations?: CompanyRegistrationPointDto[] | null }) {
  const [showAllMonths, setShowAllMonths] = useState(false);
  const registrationRows = getRegistrationRows(registrations);
  const visibleRegistrations = registrationRows.slice(0, INITIAL_REGISTRATION_MONTH_COUNT);
  const hiddenRegistrations = registrationRows.slice(INITIAL_REGISTRATION_MONTH_COUNT);
  const maxCount = Math.max(
    ...registrationRows.map((row) => (typeof row.count === 'number' ? row.count : 0)),
    0,
  );

  return (
    <div>
      <RegistrationBars registrations={visibleRegistrations} maxCount={maxCount} />
      <div
        aria-hidden={!showAllMonths}
        className="grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out"
        style={{
          marginTop: showAllMonths ? 10 : 0,
          gridTemplateRows: showAllMonths ? '1fr' : '0fr',
          opacity: showAllMonths ? 1 : 0,
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <RegistrationBars registrations={hiddenRegistrations} maxCount={maxCount} />
        </div>
      </div>

      <button
        type="button"
        aria-expanded={showAllMonths}
        onClick={() => setShowAllMonths((value) => !value)}
        className="mx-auto mt-3 block rounded-md px-2 py-1 text-[11px] font-bold text-[#2B7FFF]/80 transition-colors hover:text-[#155DFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B7FFF]/20"
      >
        {showAllMonths ? 'Show Less' : 'Show More'}
      </button>
    </div>
  );
}

function SubscriptionBreakdownCard({
  plans,
  period,
  onPeriodChange,
}: {
  plans?: SubscriptionPlanBreakdownDto[] | null;
  period: string;
  onPeriodChange: (value: string) => void;
}) {
  const visiblePlans = plans?.length ? plans : EMPTY_SUBSCRIPTION_PLANS;
  const totalCompanies = visiblePlans.reduce(
    (sum, plan) => sum + (typeof plan.companyCount === 'number' ? plan.companyCount : 0),
    0,
  );
  const hasSubscriptionData = visiblePlans.some((plan) => getPlanPercentage(plan, totalCompanies) > 0);

  return (
    <Card className="relative z-30 min-h-[160px] min-w-0 overflow-visible border-0 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[13px] font-bold leading-tight text-[#1f2937]">Subscription Breakdown</h3>
          <p className="mt-0.5 text-[11px] font-medium text-[#8A9BB2]">Companies by plan</p>
        </div>
        <PeriodFilterDropdown ariaLabelPrefix="Subscription breakdown" value={period} onChange={onPeriodChange} />
      </div>

      <div className="flex items-center gap-4">
        <SubscriptionPieChart plans={visiblePlans} totalCompanies={totalCompanies} />
        <div className="min-w-0 flex-1 space-y-2">
          {visiblePlans.map((plan, index) => {
            const percentage = getPlanPercentage(plan, totalCompanies);

            return (
              <div key={plan.planId ?? plan.label} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: hasSubscriptionData
                        ? SUBSCRIPTION_COLORS[index % SUBSCRIPTION_COLORS.length]
                        : '#C8D8EE',
                    }}
                  />
                  <span className="truncate text-[11.5px] font-medium text-[#4B5563]">{plan.label}</span>
                </div>
                <span className="text-[11.5px] font-bold text-[#1f2937]">
                  {`${Math.round(percentage)}%`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function RecentActivity({ items }: { items?: SuperAdminActivityItemDto[] | null }) {
  if (!items?.length) {
    return (
      <div className="mt-1 flex min-h-[150px] items-center justify-center rounded-xl bg-[#F8FBFF]">
        <p className="text-[12px] font-medium text-[#8A9BB2]">No recent activity yet</p>
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-col divide-y divide-[#F3F6FB]">
      {items.slice(0, 4).map((activity) => (
        <div key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <div className="h-2 w-2 shrink-0 rounded-full bg-[#2B7FFF] shadow-[0_0_0_3px_rgba(43,127,255,0.12)]" />
          <p className="min-w-0 flex-1 text-[12px] leading-snug text-gray-600">
            {activity.actorName && (
              <>
                <span className="font-bold text-[#1a1c23]">{activity.actorName}</span>{' '}
              </>
            )}
            <span className="text-[#6B7280]">{activity.description}</span>
          </p>
          <span className="shrink-0 text-[10.5px] font-medium tabular-nums text-[#8A9BB2]">
            {activity.occurredAtLabel ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function QuickStats({ stats }: { stats?: SuperAdminQuickStatDto[] | null }) {
  const visibleStats = getQuickStatRows(stats);

  return (
    <div className="mt-2 space-y-4">
      {visibleStats.map((stat) => {
        const percentage = clampPercentage(stat.percentage);

        return (
          <div key={stat.id ?? stat.label} className="rounded-xl bg-[#F8FBFF] px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#4B5563]">{stat.label}</span>
              <span className="text-[12px] font-bold text-[#1f2937]">
                {stat.valueLabel ?? `${Math.round(percentage)}%`}
              </span>
            </div>
            <div className="h-[10px] overflow-hidden rounded-full bg-[#E6EAF0] shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
              {percentage > 0 && (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] transition-[width] duration-300"
                  style={{ width: `${percentage}%` }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h3 className="min-w-0 text-[15px] font-bold leading-tight text-[#1a1c23]">{title}</h3>
      {typeof action === 'string' ? (
        <span className="text-[11px] font-bold text-[#2B7FFF]">{action}</span>
      ) : (
        action
      )}
    </div>
  );
}

interface SuperAdminDashboardViewProps {
  data?: SuperAdminDashboardDto;
  enableDashboardQuery?: boolean;
}

export function SuperAdminDashboardView({
  data: initialData,
  enableDashboardQuery = false,
}: SuperAdminDashboardViewProps = {}) {
  const [dateTimeLabels, setDateTimeLabels] = useState<DateTimeLabels>(() => getCurrentDateTimeLabels());
  const [registrationYear, setRegistrationYear] = useState(CURRENT_YEAR);
  const [statsPeriod, setStatsPeriod] = useState('');
  const dashboardQuery = useSuperAdminDashboard(
    { year: registrationYear, period: statsPeriod },
    { enabled: enableDashboardQuery },
  );
  const dashboardData = dashboardQuery.data ?? initialData;
  const kpis = dashboardData?.kpis;

  useEffect(() => {
    const updateDateTimeLabels = () => setDateTimeLabels(getCurrentDateTimeLabels());
    updateDateTimeLabels();

    const intervalId = window.setInterval(updateDateTimeLabels, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
      <WelcomeBanner header={dashboardData?.header} dateTimeLabels={dateTimeLabels} />

      <div
        className="relative z-10 gap-5"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr)) minmax(0, 1.6fr)' }}
      >
        {KPI_DATA.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} value={kpis?.[kpi.valueKey]} />
        ))}
        <SubscriptionBreakdownCard
          plans={dashboardData?.subscriptionPlans}
          period={statsPeriod}
          onPeriodChange={setStatsPeriod}
        />
      </div>

      <div
        className="relative z-0 gap-5"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        <Card className="!rounded-[20px] min-h-[270px] min-w-0 overflow-hidden border-0 p-6">
          <SectionHeader
            title="Company Registrations"
            action={<YearFilterDropdown value={registrationYear} onChange={setRegistrationYear} />}
          />
          <RegistrationsChart registrations={dashboardData?.companyRegistrations} />
        </Card>

        <Card className="!rounded-[20px] min-h-[270px] min-w-0 overflow-hidden border-0 p-6">
          <SectionHeader title="Recent Activity" />
          <RecentActivity items={dashboardData?.recentActivity} />
        </Card>

        <Card className="!rounded-[20px] relative z-20 min-w-0 self-start overflow-visible border-0 p-6">
          <SectionHeader title="Quick Stats" action={<PeriodFilterDropdown ariaLabelPrefix="Quick stats" value={statsPeriod} onChange={setStatsPeriod} />} />
          <QuickStats stats={dashboardData?.quickStats} />
        </Card>
      </div>
    </div>
  );
}
