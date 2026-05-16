"use client";

import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  UserCheck,
  UserMinus,
  Clock,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Card, PageHeaderDecorativeCircles } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { useAdminDashboard } from '../api/use-admin-dashboard';
import {
  AdminDashboardDto,
  AdminDashboardHeaderDto,
  AdminDashboardKpisDto,
  AdminActivityItemDto,
  AdminQuickStatDto,
  AttendanceTrendPointDto,
  ActiveDayPointDto,
} from '../types';

interface KpiData {
  id: string;
  labelKey: string;
  valueKey: keyof AdminDashboardKpisDto;
  icon: LucideIcon;
}

const KPI_DATA: KpiData[] = [
  {
    id: 'total-employees',
    labelKey: 'dashboard.kpis.totalEmployees',
    valueKey: 'totalEmployees',
    icon: Users,
  },
  {
    id: 'present-today',
    labelKey: 'dashboard.kpis.presentToday',
    valueKey: 'presentToday',
    icon: UserCheck,
  },
  {
    id: 'on-leave-today',
    labelKey: 'dashboard.kpis.onLeaveToday',
    valueKey: 'onLeaveToday',
    icon: UserMinus,
  },
  {
    id: 'pending-requests',
    labelKey: 'dashboard.kpis.pendingRequests',
    valueKey: 'pendingRequests',
    icon: Clock,
  },
];

const PERIOD_FILTER_OPTIONS = [
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'this-year', label: 'This Year' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  header?: AdminDashboardHeaderDto | null;
  dateTimeLabels: DateTimeLabels;
}) {
  const { t } = useI18n();
  const title = header?.displayName
    ? t('dashboard.welcomeBackName', { name: header.displayName })
    : t('dashboard.welcomeBack');

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
            {header?.displayName ? header.displayName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-tight text-white">{title}</h2>
            <p className="mt-0.5 text-sm font-medium text-white/80">
              {t('dashboard.welcomeSubtitle')}
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
  const { t } = useI18n();

  return (
    <Card className="flex min-h-[160px] min-w-0 flex-col justify-between border-0 p-6">
      <div
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] text-[#2B7FFF]"
        style={{ backgroundColor: '#DBEAFE' }}
      >
        <kpi.icon size={19} strokeWidth={2.2} />
      </div>
      <div className="space-y-0.5">
        <h2 className="text-[22px] font-bold leading-tight text-[#1a1c23]">{formatMetric(value ?? 0)}</h2>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A9BB2]">{t(kpi.labelKey)}</p>
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

function VerticalBarChart({ 
  data, 
  color = '#2B7FFF', 
  height = 100 
}: { 
  data: { label: string; percentage: number }[]; 
  color?: string;
  height?: number;
}) {
  return (
    <div className="flex items-end justify-between gap-1 h-full w-full">
      {data.map((point) => (
        <div key={point.label} className="flex flex-col items-center flex-1 min-w-0 gap-1">
          <div 
            className="w-full rounded-t-sm transition-all duration-500" 
            style={{ 
              height: `${clampPercentage(point.percentage)}%`, 
              backgroundColor: color,
              minHeight: point.percentage > 0 ? '4px' : '0'
            }} 
          />
          <span className="text-[8px] font-bold text-[#8A9BB2] uppercase overflow-hidden text-ellipsis whitespace-nowrap max-w-full text-center">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function ActiveDayCard({ data }: { data?: ActiveDayPointDto[] | null }) {
  const { t } = useI18n();
  const chartData = WEEKDAYS.map((day) => {
    const point = data?.find((p) => p.label.startsWith(day));
    return {
      label: day,
      percentage: point?.percentage ?? 0,
    };
  });

  return (
    <Card className="flex min-h-[160px] min-w-0 flex-col border-0 p-6">
      <h3 className="mb-4 text-[13px] font-bold leading-tight text-[#1f2937]">
        {t('dashboard.mostActiveDayOfWeek')}
      </h3>
      <div className="flex-1">
        <VerticalBarChart data={chartData} color="#00BBA7" />
      </div>
    </Card>
  );
}

function RecentActivity({ items }: { items?: AdminActivityItemDto[] | null }) {
  const { t } = useI18n();

  if (!items?.length) {
    return (
      <div className="mt-1 flex min-h-[150px] items-center justify-center rounded-xl bg-[#F8FBFF]">
        <p className="text-[12px] font-medium text-[#8A9BB2]">{t('dashboard.noRecentActivity')}</p>
      </div>
    );
  }

  const getTagStyles = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'check-in':
        return { bg: '#DBEAFE', text: '#2B7FFF' };
      case 'leave':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'payroll':
        return { bg: '#EDE9FE', text: '#7C3AED' };
      case 'request':
        return { bg: '#FEF3C7', text: '#D97706' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  return (
    <div className="mt-1 flex flex-col divide-y divide-[#F3F6FB]">
      {items.slice(0, 5).map((activity) => {
        const tagStyle = activity.tag ? getTagStyles(activity.tag) : null;
        return (
          <div key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="h-2 w-2 shrink-0 rounded-full bg-[#2B7FFF] shadow-[0_0_0_3px_rgba(43,127,255,0.12)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] leading-snug text-gray-600">
                {activity.actorName && (
                  <>
                    <span className="font-bold text-[#1a1c23]">{activity.actorName}</span>{' '}
                  </>
                )}
                <span className="text-[#6B7280]">{activity.description}</span>
              </p>
              <p className="mt-0.5 text-[10.5px] font-medium tabular-nums text-[#8A9BB2]">
                {activity.occurredAtLabel ?? ''}
              </p>
            </div>
            {activity.tag && tagStyle && (
              <span 
                className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: tagStyle.bg, color: tagStyle.text }}
              >
                {activity.tag}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuickStats({ stats }: { stats?: AdminQuickStatDto[] | null }) {
  const { t } = useI18n();
  
  const getLabel = (stat: AdminQuickStatDto) => {
    const key = stat.id === 'attendance-rate' ? 'attendanceRate' : 
                stat.id === 'on-time-check-ins' ? 'onTimeCheckIns' : 
                stat.id === 'leave-utilization' ? 'leaveUtilization' : null;
    return key ? t(`dashboard.quickStatsItems.${key}`) : stat.label;
  };

  const defaultStats: AdminQuickStatDto[] = [
    { id: 'attendance-rate', label: 'Attendance Rate', valueLabel: '0%', percentage: 0 },
    { id: 'on-time-check-ins', label: 'On-time Check-ins', valueLabel: '0%', percentage: 0 },
    { id: 'leave-utilization', label: 'Leave Utilization', valueLabel: '0%', percentage: 0 },
  ];

  const visibleStats = stats?.length ? stats : defaultStats;

  return (
    <div className="mt-2 space-y-4">
      {visibleStats.map((stat) => {
        const percentage = clampPercentage(stat.percentage);

        return (
          <div key={stat.id ?? stat.label} className="rounded-xl bg-[#F8FBFF] px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#4B5563]">{getLabel(stat)}</span>
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

interface AdminDashboardViewProps {
  data?: AdminDashboardDto;
  enableDashboardQuery?: boolean;
}

export function AdminDashboardView({
  data: initialData,
  enableDashboardQuery = false,
}: AdminDashboardViewProps = {}) {
  const { t } = useI18n();
  const [dateTimeLabels, setDateTimeLabels] = useState<DateTimeLabels>(() => getCurrentDateTimeLabels());
  const [statsPeriod, setStatsPeriod] = useState('this-month');
  const [trendPeriod, setTrendPeriod] = useState('this-week');
  
  const dashboardQuery = useAdminDashboard(
    { period: statsPeriod, trendPeriod: trendPeriod },
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
        <ActiveDayCard data={dashboardData?.activeDays} />
      </div>

      <div
        className="relative z-0 gap-5"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        <Card className="!rounded-[20px] min-h-[320px] min-w-0 overflow-hidden border-0 p-6 flex flex-col">
          <SectionHeader
            title={t('dashboard.attendanceTrend')}
            action={<PeriodFilterDropdown ariaLabelPrefix="Attendance trend" value={trendPeriod} onChange={setTrendPeriod} />}
          />
          <div className="flex-1">
            <VerticalBarChart 
              data={(dashboardData?.attendanceTrend ?? []).map(p => ({ label: p.label, percentage: p.percentage ?? 0 }))} 
              color="#2B7FFF" 
            />
          </div>
        </Card>

        <Card className="!rounded-[20px] min-h-[320px] min-w-0 overflow-hidden border-0 p-6">
          <SectionHeader title={t('dashboard.recentActivity')} />
          <RecentActivity items={dashboardData?.recentActivity} />
        </Card>

        <Card className="!rounded-[20px] relative z-20 min-w-0 self-start overflow-visible border-0 p-6">
          <SectionHeader 
            title={t('dashboard.quickStats')} 
            action={<PeriodFilterDropdown ariaLabelPrefix="Quick stats" value={statsPeriod} onChange={setStatsPeriod} />} 
          />
          <QuickStats stats={dashboardData?.quickStats} />
        </Card>
      </div>
    </div>
  );
}
