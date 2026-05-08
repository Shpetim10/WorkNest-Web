"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Globe,
  LayoutGrid,
  Menu,
  Search,
  ShieldCheck,
  X,
  Home,
  CheckSquare,
  XCircle,
  Info
} from 'lucide-react';
import { Card } from '@/common/ui';
import { useSuperAdminDashboard } from '../api/use-super-admin-dashboard';
import {
  CompanyRegistrationPointDto,
  SubscriptionPlanBreakdownDto,
  SuperAdminActivityItemDto,
  SuperAdminDashboardDto,
  SuperAdminDashboardHeaderDto,
  SuperAdminDashboardKpisDto,
  SuperAdminQuickStatDto,
} from '../types';

interface NavItem {
  name: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
}

interface KpiData {
  id: string;
  label: string;
  valueKey: keyof SuperAdminDashboardKpisDto;
  icon: LucideIcon;
  iconColor: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: LayoutGrid, href: '/superadmin_dashboard', active: true },
  { name: 'Companies', icon: Building2, href: '#' },
  { name: 'Audit Log', icon: ShieldCheck, href: '#' },
];

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
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'last-6-months', label: 'Last 6 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'custom-range', label: 'Custom Range' },
];
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

// EXACT ORIGINAL SIDEBAR
function SuperAdminSidebar({
  isSidebarExpanded,
  toggleSidebar,
}: {
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
}) {
  const activeItemStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.35)',
    boxShadow: '0px 4px 12px rgba(255, 255, 255, 0.20)',
    borderRadius: '16px',
    color: '#ffffff',
  };

  const inactiveItemStyle: React.CSSProperties = {
    borderRadius: '16px',
    color: 'rgba(255,255,255,0.82)',
  };

  return (
    <aside
      className={`fixed left-3 top-3 z-30 flex h-[calc(100vh-24px)] flex-col rounded-[24px] bg-[#4080ED] shadow-[0_12px_36px_rgba(0,0,0,0.20),0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? 'w-[228px]' : 'w-[62px]'
      }`}
    >
      <div className={`shrink-0 pb-1 pt-3 transition-all duration-300 ${isSidebarExpanded ? 'px-3' : 'px-2'}`}>
        <div
          className={`flex items-center rounded-xl bg-white/15 transition-all duration-300 ${
            isSidebarExpanded ? 'gap-2.5 px-3 py-2.5' : 'justify-center px-0 py-2'
          }`}
        >
          {isSidebarExpanded ? (
            <>
              <div
                className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <Image
                  src="/logos/worktrezz-symbol-cropped.png"
                  alt=""
                  width={36}
                  height={36}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-[15px] text-white leading-tight tracking-tight truncate">
                  WorkTrezz
                </h1>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="shrink-0 text-white/60 transition-colors hover:text-white"
              >
                <ChevronsUpDown size={15} strokeWidth={2} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center text-white/70 transition-all hover:text-white"
            >
              <Menu size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <nav
        className={`flex-1 space-y-0.5 overflow-y-auto pb-6 pt-3 transition-all duration-300 ${
          isSidebarExpanded ? 'px-3' : 'px-2'
        }`}
        style={{ scrollbarWidth: 'none' }}
      >
        {NAV_ITEMS.map((item) => {
          const labelClass = `text-[13.5px] font-semibold leading-none whitespace-nowrap transition-all duration-200 overflow-hidden ${
            isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
          }`;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isSidebarExpanded ? item.name : undefined}
              className={`flex h-10 items-center transition-all duration-200 ${
                isSidebarExpanded ? 'justify-between px-3' : 'justify-center px-0'
              } ${!item.active ? 'hover:bg-white/10' : ''}`}
              style={item.active ? activeItemStyle : inactiveItemStyle}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <item.icon size={18} strokeWidth={item.active ? 2.2 : 1.8} className="shrink-0" />
                <span className={labelClass}>{item.name}</span>
              </div>
              {!item.active && isSidebarExpanded && (
                <ChevronRight size={13} strokeWidth={2.5} className="shrink-0 text-white/40" />
              )}
            </Link>
          );
        })}
      </nav>

      {!isSidebarExpanded && (
        <div className="flex shrink-0 justify-center pb-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}
    </aside>
  );
}

// EXACT ORIGINAL TOP HEADER
function SuperAdminTopHeader() {
  return (
    <header className="flex h-[60px] w-full items-center justify-between rounded-2xl bg-white px-6 shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
      <div className="max-w-[400px] flex-1">
        <div className="relative flex items-center">
          <Search size={15} className="pointer-events-none absolute left-3.5 text-gray-400" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search companies, staff..."
            className="h-9 w-full rounded-xl border border-gray-100 bg-gray-50 pl-10 pr-4 text-[13px] text-gray-600 transition-all placeholder:text-gray-400 focus:border-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button type="button" className="flex items-center gap-1.5 text-gray-500 transition-colors hover:text-gray-700">
          <Globe size={16} strokeWidth={2} />
          <span className="text-[12px] font-semibold tracking-wide">EN</span>
        </button>

        <button type="button" className="relative text-gray-400 transition-colors hover:text-gray-600">
          <Bell size={18} strokeWidth={2} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-white bg-red-500" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2B7FFF] text-[14px] font-bold text-white transition-colors hover:bg-[#155DFC]">
          S
        </div>
      </div>
    </header>
  );
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

function PeriodFilterDropdown({ ariaLabelPrefix }: { ariaLabelPrefix: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_FILTER_OPTIONS[0].value);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const selectedOption =
    PERIOD_FILTER_OPTIONS.find((option) => option.value === selectedPeriod) ?? PERIOD_FILTER_OPTIONS[0];

  useEffect(() => {
    if (!isDatePickerOpen) return;

    const pickerTimer = window.setTimeout(() => {
      startDateInputRef.current?.showPicker?.();
      startDateInputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(pickerTimer);
  }, [isDatePickerOpen]);

  return (
    <div className="relative z-30 shrink-0">
      <button
        type="button"
        aria-label={`${ariaLabelPrefix} period filter`}
        aria-expanded={isOpen || isDatePickerOpen}
        onClick={() => {
          setIsDatePickerOpen(false);
          setIsOpen((value) => !value);
        }}
        className="flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-bold text-[#155DFC] transition-colors hover:text-[#2B7FFF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2B7FFF]/20"
      >
        <span>{selectedOption.label}</span>
        <ChevronDown
          size={13}
          strokeWidth={2.2}
          className={`transition-transform duration-200 ${isOpen || isDatePickerOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[156px] overflow-hidden rounded-xl border border-[#E5ECF6] bg-white py-1 shadow-[0_14px_34px_rgba(15,23,42,0.13)]">
          {PERIOD_FILTER_OPTIONS.map((option) => {
            const isSelected = option.value === selectedPeriod;
            const isCustomRange = option.value === 'custom-range';

            return (
              <React.Fragment key={option.value}>
                {isCustomRange && <div className="mx-3 my-1 h-px bg-[#EEF2F7]" />}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeriod(option.value);
                    setIsOpen(false);
                    setIsDatePickerOpen(isCustomRange);
                  }}
                  className={`flex h-8 w-full items-center justify-between gap-2 px-3 text-left text-[11.5px] font-bold transition-colors ${
                    isSelected ? 'bg-[#F6F9FF] text-[#2B7FFF]' : 'text-[#374151] hover:bg-[#F8FBFF]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{option.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {isCustomRange && (
                      <CalendarDays size={14} strokeWidth={2} className="shrink-0 text-[#374151]" />
                    )}
                    {isSelected && <Check size={14} strokeWidth={2.4} className="shrink-0 text-[#2B7FFF]" />}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {isDatePickerOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[230px] rounded-xl border border-[#E5ECF6] bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.13)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#1f2937]">Custom Range</span>
            <CalendarDays size={15} strokeWidth={2} className="text-[#2B7FFF]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-[#8A9BB2]">
              Start
              <input
                ref={startDateInputRef}
                type="date"
                value={customStartDate}
                max={customEndDate || undefined}
                onChange={(event) => setCustomStartDate(event.target.value)}
                className="mt-1 h-8 w-full rounded-lg border border-[#DDE8F8] bg-[#F8FBFF] px-2 text-[11px] font-semibold text-[#374151] outline-none focus:border-[#9DBBEA] focus:ring-2 focus:ring-[#2B7FFF]/10"
              />
            </label>
            <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-[#8A9BB2]">
              End
              <input
                type="date"
                value={customEndDate}
                min={customStartDate || undefined}
                onChange={(event) => setCustomEndDate(event.target.value)}
                className="mt-1 h-8 w-full rounded-lg border border-[#DDE8F8] bg-[#F8FBFF] px-2 text-[11px] font-semibold text-[#374151] outline-none focus:border-[#9DBBEA] focus:ring-2 focus:ring-[#2B7FFF]/10"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCustomStartDate('');
                setCustomEndDate('');
                setSelectedPeriod(PERIOD_FILTER_OPTIONS[0].value);
                setIsDatePickerOpen(false);
              }}
              className="rounded-md px-2 py-1 text-[11px] font-bold text-[#8A9BB2] transition-colors hover:text-[#4B5563]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!customStartDate || !customEndDate}
              onClick={() => setIsDatePickerOpen(false)}
              className="rounded-md bg-[#2B7FFF] px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#155DFC] disabled:cursor-not-allowed disabled:bg-[#C8D8EE]"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionPieChart({ plans }: { plans: SubscriptionPlanBreakdownDto[] }) {
  const totalCompanies = plans.reduce(
    (sum, plan) => sum + (typeof plan.companyCount === 'number' ? plan.companyCount : 0),
    0,
  );
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
    <svg
      aria-label="Subscription plan breakdown"
      className="h-[44px] w-[44px] shrink-0"
      viewBox="0 0 64 64"
      role="img"
    >
      <circle cx="32" cy="32" r="18" fill="none" stroke="#E8F1FF" strokeWidth="12" />
      {hasData && (
        <g transform="rotate(-90 32 32)">
          {segments.map((segment) => (
            <circle
              key={segment.key}
              cx="32"
              cy="32"
              r="18"
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              pathLength="100"
              strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`}
              strokeDashoffset={segment.dashOffset}
            />
          ))}
        </g>
      )}
    </svg>
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

function SubscriptionBreakdownCard({ plans }: { plans?: SubscriptionPlanBreakdownDto[] | null }) {
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
        <PeriodFilterDropdown ariaLabelPrefix="Subscription breakdown" />
      </div>

      <div className="flex items-center gap-5">
        <SubscriptionPieChart plans={visiblePlans} />
        <div className="min-w-0 flex-1 space-y-1.5">
          {visiblePlans.map((plan, index) => {
            const percentage = getPlanPercentage(plan, totalCompanies);

            return (
              <div key={plan.planId ?? plan.label} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: hasSubscriptionData
                        ? SUBSCRIPTION_COLORS[index % SUBSCRIPTION_COLORS.length]
                        : '#C8D8EE',
                    }}
                  />
                  <span className="truncate text-[11px] font-medium text-[#4B5563]">{plan.label}</span>
                </div>
                <span className="text-[11px] font-bold text-[#1f2937]">
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
      {items.map((activity) => (
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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [dateTimeLabels, setDateTimeLabels] = useState<DateTimeLabels>(() => getCurrentDateTimeLabels());
  const dashboardQuery = useSuperAdminDashboard({ enabled: enableDashboardQuery && !initialData });
  const dashboardData = initialData ?? dashboardQuery.data;
  const kpis = dashboardData?.kpis;

  useEffect(() => {
    const updateDateTimeLabels = () => setDateTimeLabels(getCurrentDateTimeLabels());
    updateDateTimeLabels();

    const intervalId = window.setInterval(updateDateTimeLabels, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#E8EFFA] font-sans">
      <SuperAdminSidebar
        isSidebarExpanded={isSidebarExpanded}
        toggleSidebar={() => setIsSidebarExpanded((v) => !v)}
      />

      <div
        className="flex min-w-0 flex-1 flex-col transition-all duration-300"
        style={{ paddingLeft: isSidebarExpanded ? '252px' : '86px' }}
      >
        <div className="sticky top-0 z-50 bg-[#E8EFFA] pr-3 pt-3">
          <SuperAdminTopHeader />
        </div>

        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <div className="mx-auto w-full max-w-[1360px] space-y-6 pb-12">
              <WelcomeBanner header={dashboardData?.header} dateTimeLabels={dateTimeLabels} />

              <div
                className="relative z-10 gap-5"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr)) minmax(0, 1.6fr)' }}
              >
                {KPI_DATA.map((kpi) => (
                  <KpiCard key={kpi.id} kpi={kpi} value={kpis?.[kpi.valueKey]} />
                ))}
                <SubscriptionBreakdownCard plans={dashboardData?.subscriptionPlans} />
              </div>

              <div
                className="relative z-0 gap-5"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
              >
                <Card className="!rounded-[20px] min-h-[270px] min-w-0 overflow-hidden border-0 p-6">
                  <SectionHeader title="Company Registrations" />
                  <RegistrationsChart registrations={dashboardData?.companyRegistrations} />
                </Card>

                <Card className="!rounded-[20px] h-[270px] min-w-0 overflow-hidden border-0 p-6">
                  <SectionHeader title="Recent Activity" />
                  <RecentActivity items={dashboardData?.recentActivity} />
                </Card>

                <Card className="!rounded-[20px] relative z-20 h-[270px] min-w-0 overflow-visible border-0 p-6">
                  <SectionHeader title="Quick Stats" action={<PeriodFilterDropdown ariaLabelPrefix="Quick stats" />} />
                  <QuickStats stats={dashboardData?.quickStats} />
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
