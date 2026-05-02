"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  MoreHorizontal,
  Lock,
  UserPlus,
  Filter,
} from 'lucide-react';
import { TablePagination } from '@/common/ui';
import { useAttendanceDashboard } from '../api/get-attendance';
import { useDepartmentLookup } from '@/features/departments/api';
import { useLocations } from '@/features/locations/api';
import {
  AttendanceDayStatus,
  AttendanceEmployeeRow,
  AttendanceState,
} from '../types';
import { ViewDetailModal } from './ViewDetailModal';
import { ManualCheckInModal } from './ManualCheckInModal';
import { ManualCheckOutModal } from './ManualCheckOutModal';
import { DismissWarningsModal } from './DismissWarningsModal';
import { AdjustDayRecordModal } from './AdjustDayRecordModal';
import {
  getStoredCompanyDateFormat,
  getStoredCompanyLocale,
  getStoredCompanyTimezone,
} from '@/features/company-settings/storage';

const ITEMS_PER_PAGE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(utcString: string | null, timezone: string, locale: string): string {
  if (!utcString) return '—';
  try {
    return new Date(utcString).toLocaleTimeString(locale, {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '—';
  }
}

function formatDateForDisplay(dateString: string, dateFormat: string): string {
  if (!dateString) return '—';

  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;

  switch (dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

function formatWorked(minutes: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-[#4F46E5]',
  'bg-[#0EA5E9]',
  'bg-[#10B981]',
  'bg-[#F59E0B]',
  'bg-[#EF4444]',
  'bg-[#8B5CF6]',
  'bg-[#EC4899]',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function normalizeRole(rawRole: string | null): string {
  return (rawRole ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function attendanceStateBadge(state: AttendanceState): { label: string; cls: string } {
  const map: Record<AttendanceState, { label: string; cls: string }> = {
    [AttendanceState.NOT_CHECKED_IN]: { label: 'Not Checked In', cls: 'bg-gray-100 text-gray-600' },
    [AttendanceState.CHECKED_IN]: { label: 'Checked In', cls: 'bg-green-100 text-green-700' },
    [AttendanceState.CHECKED_OUT]: { label: 'Checked Out', cls: 'bg-blue-100 text-blue-700' },
    [AttendanceState.MISSING_CHECKOUT]: { label: 'Missing check out', cls: 'bg-orange-100 text-orange-700' },
    [AttendanceState.PENDING_REVIEW]: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700' },
  };
  return map[state] ?? { label: state, cls: 'bg-gray-100 text-gray-600' };
}

function dayStatusBadge(status: AttendanceDayStatus): { label: string; cls: string } {
  const map: Record<AttendanceDayStatus, { label: string; cls: string }> = {
    [AttendanceDayStatus.PRESENT]: { label: 'Present', cls: 'bg-green-100 text-green-700' },
    [AttendanceDayStatus.ABSENT]: { label: 'Absent', cls: 'bg-red-100 text-red-700' },
    [AttendanceDayStatus.LATE]: { label: 'Late', cls: 'bg-orange-100 text-orange-700' },
    [AttendanceDayStatus.HALF_DAY]: { label: 'Half Day', cls: 'bg-yellow-100 text-yellow-700' },
    [AttendanceDayStatus.ON_LEAVE]: { label: 'On Leave', cls: 'bg-blue-100 text-blue-700' },
    [AttendanceDayStatus.HOLIDAY]: { label: 'Holiday', cls: 'bg-purple-100 text-purple-700' },
    [AttendanceDayStatus.MISSING_CHECKOUT]: { label: 'Missing check out', cls: 'bg-orange-100 text-orange-700' },
    [AttendanceDayStatus.FLAGGED]: { label: 'Flagged', cls: 'bg-red-100 text-red-700' },
    [AttendanceDayStatus.PENDING_REVIEW]: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700' },
  };
  return map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
}

// ─── Action Dropdown ─────────────────────────────────────────────────────────

type ModalState =
  | { kind: 'none' }
  | { kind: 'view'; row: AttendanceEmployeeRow }
  | { kind: 'checkIn'; row: AttendanceEmployeeRow }
  | { kind: 'checkOut'; row: AttendanceEmployeeRow }
  | { kind: 'dismiss'; row: AttendanceEmployeeRow }
  | { kind: 'adjust'; row: AttendanceEmployeeRow };

interface ActionDropdownProps {
  row: AttendanceEmployeeRow;
  onAction: (kind: ModalState['kind'], row: AttendanceEmployeeRow) => void;
  isToday: boolean;
  isAdmin: boolean;
}

function ActionDropdown({ row, onAction, isToday, isAdmin }: ActionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const allowed = isToday || isAdmin;
  const canCheckIn = allowed && row.attendanceState === AttendanceState.NOT_CHECKED_IN;
  const canCheckOut = allowed && row.attendanceState === AttendanceState.CHECKED_IN;
  const canDismiss = allowed && row.hasWarnings && !row.payrollLocked && !!row.dayRecordId;
  const canAdjust = allowed && !!row.dayRecordId && !row.payrollLocked;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t) && !triggerRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.right - 180 + window.scrollX });
    }
    setOpen((v) => !v);
  };

  const pick = (kind: ModalState['kind']) => {
    setOpen(false);
    onAction(kind, row);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggle}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        title="Actions"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'absolute', top: pos.top, left: pos.left }}
            className="z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-150"
          >
            <MenuItem label="View Detail" onClick={() => pick('view')} />
            {canCheckIn && <MenuItem label="Manual Check-In" onClick={() => pick('checkIn')} />}
            {canCheckOut && <MenuItem label="Manual Check-Out" onClick={() => pick('checkOut')} />}
            {canDismiss && <MenuItem label="Dismiss Warnings" onClick={() => pick('dismiss')} />}
            {canAdjust && <MenuItem label="Adjust Day Record" onClick={() => pick('adjust')} />}
          </div>,
          document.body,
        )}
    </>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
    >
      {label}
    </button>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function AttendanceDashboardView() {
  const initialStoredTimezone =
    typeof window === 'undefined' ? 'UTC' : getStoredCompanyTimezone();
  const initialTodayInCompanyTz = new Intl.DateTimeFormat('sv-SE', {
    timeZone: initialStoredTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const [isAdmin] = useState(() => {
    if (typeof window === 'undefined') return false;
    const role = normalizeRole(localStorage.getItem('platform_role'));
    return ['ADMIN', 'SUPERADMIN'].includes(role);
  });
  const [companyId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('current_company_id');
  });

  const [companyLocale] = useState(() =>
    typeof window === 'undefined' ? 'en-US' : getStoredCompanyLocale(),
  );
  const [companyDateFormat] = useState(() =>
    typeof window === 'undefined' ? 'YYYY-MM-DD' : getStoredCompanyDateFormat(),
  );
  const [storedTimezone] = useState(initialStoredTimezone);

  const [date, setDate] = useState(initialTodayInCompanyTz);
  const [search, setSearch] = useState('');
  const [siteId, setSiteId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    date: initialTodayInCompanyTz,
    siteId: '',
    departmentId: '',
  });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });

  const { data, isLoading, isError } = useAttendanceDashboard(
    {
      date: appliedFilters.date || undefined,
      siteId: isAdmin && appliedFilters.siteId ? appliedFilters.siteId : undefined,
      departmentId: isAdmin && appliedFilters.departmentId ? appliedFilters.departmentId : undefined,
    },
    isAdmin,
  );

  const { data: departments } = useDepartmentLookup();
  const { data: locationsData } = useLocations(isAdmin ? companyId : null);

  const employees = data?.employees ?? [];
  const timezone = storedTimezone || data?.timezone || 'UTC';
  const activeWorkDate = data?.workDate ?? appliedFilters.date;
  const displayWorkDate = formatDateForDisplay(activeWorkDate, companyDateFormat);

  const todayInCompanyTz = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const isViewingToday = (data?.workDate ?? appliedFilters.date) === todayInCompanyTz;

  // Client-side search filter
  const filtered = search.trim()
    ? employees.filter((e) =>
        e.employeeName.toLowerCase().includes(search.toLowerCase()),
      )
    : employees;

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const applyFilters = () => {
    const safeDate = date > todayInCompanyTz ? todayInCompanyTz : date;
    setDate(safeDate);
    setAppliedFilters({ date: safeDate, siteId, departmentId });
    setPage(1);
  };

  const summary = data?.summary;

  const summaryCards = [
    {
      label: 'Present',
      value: summary?.present ?? 0,
      icon: <CheckCircle2 size={22} className="text-green-500" />,
      badge: 'OK',
      badgeCls: 'bg-green-100 text-green-700',
      ring: 'border-green-100',
    },
    {
      label: 'Absent',
      value: summary?.absent ?? 0,
      icon: <XCircle size={22} className="text-red-500" />,
      badge: 'ABS',
      badgeCls: 'bg-red-100 text-red-600',
      ring: 'border-red-100',
    },
    {
      label: 'Late',
      value: summary?.late ?? 0,
      icon: <Clock size={22} className="text-orange-500" />,
      badge: 'LATE',
      badgeCls: 'bg-orange-100 text-orange-600',
      ring: 'border-orange-100',
    },
    {
      label: 'On Leave',
      value: summary?.onLeave ?? 0,
      icon: <Briefcase size={22} className="text-blue-500" />,
      badge: 'LV',
      badgeCls: 'bg-blue-100 text-blue-600',
      ring: 'border-blue-100',
    },
    {
      label: 'Warnings',
      value: summary?.withWarnings ?? 0,
      icon: <AlertTriangle size={22} className="text-amber-500" />,
      badge: 'WARN',
      badgeCls: 'bg-amber-100 text-amber-600',
      ring: 'border-amber-100',
    },
  ];

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4 pb-10">
      {/* Hero banner */}
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 50%, #10B981 100%)',
          minHeight: 120,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Clock size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Attendance</h1>
            <p className="text-white/80 text-sm mt-0.5">
              Track daily attendance for all employees
              {' · '}
              {displayWorkDate}
              {' · '}
              {timezone}
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
          <UserPlus size={28} className="text-white" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-xl border ${card.ring} p-5 flex items-center justify-between shadow-sm`}
          >
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {card.icon}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeCls}`}>
                {card.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search employee locally..."
            className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={todayInCompanyTz}
          className="h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
        />
        <span className="text-xs font-medium text-gray-400">
          {formatDateForDisplay(date, companyDateFormat)}
        </span>

        {/* Admin-only filters */}
        {isAdmin && (
          <>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
            >
              <option value="">All sites</option>
              {locationsData?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteName}
                </option>
              ))}
            </select>

            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
            >
              <option value="">All departments</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          onClick={applyFilters}
          className="h-10 px-5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Filter size={14} />
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-xs font-semibold text-white uppercase tracking-wide"
              style={{ background: 'linear-gradient(90deg, #2563EB 0%, #0EA5E9 60%, #10B981 100%)' }}
            >
              {['Name', 'Site', 'Department', 'Status', 'Check In', 'Check Out', 'Day Status', 'Worked', 'Warnings', 'Actions'].map(
                (h) => (
                  <th key={h} className="px-4 py-3.5 text-left font-semibold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={10} className="py-16 text-center text-gray-400">
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-red-500 text-sm">
                  Failed to load attendance data.
                </td>
              </tr>
            )}
            {!isLoading && !isError && paginated.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-400 text-sm">
                  No attendance records found.
                </td>
              </tr>
            )}
            {paginated.map((row, idx) => {
              const stateBadge = attendanceStateBadge(row.attendanceState);
              const dsBadge = dayStatusBadge(row.dayStatus);
              return (
                <tr
                  key={row.employeeId}
                  className={`border-b border-[#E5E7EB] hover:bg-blue-50/30 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                >
                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(row.employeeName)}`}
                      >
                        {getInitials(row.employeeName)}
                      </div>
                      <span className="font-medium text-gray-800 whitespace-nowrap">
                        {row.employeeName}
                      </span>
                      {row.payrollLocked && (
                        <Lock size={12} className="text-gray-400 shrink-0" aria-label="Payroll locked" />
                      )}
                    </div>
                  </td>

                  {/* Site */}
                  <td className="px-4 py-3.5 text-gray-600">{row.siteName ?? '—'}</td>

                  {/* Department */}
                  <td className="px-4 py-3.5">
                    {row.departmentName ? (
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {row.departmentName}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Attendance state */}
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stateBadge.cls}`}>
                      {stateBadge.label}
                    </span>
                  </td>

                  {/* Check in */}
                  <td className="px-4 py-3.5 text-gray-600">
                    {formatTime(row.firstCheckInAt, timezone, companyLocale)}
                  </td>

                  {/* Check out */}
                  <td className="px-4 py-3.5 text-gray-600">
                    {formatTime(row.lastCheckOutAt, timezone, companyLocale)}
                  </td>

                  {/* Day status */}
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dsBadge.cls}`}>
                      {dsBadge.label}
                    </span>
                  </td>

                  {/* Worked */}
                  <td className="px-4 py-3.5 text-gray-600">{formatWorked(row.workedMinutes)}</td>

                  {/* Warnings */}
                  <td className="px-4 py-3.5">
                    {row.hasWarnings ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                        <AlertTriangle size={11} />
                        Warnings
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <ActionDropdown
                      row={row}
                      onAction={(kind, r) => setModal({ kind, row: r } as ModalState)}
                      isToday={isViewingToday}
                      isAdmin={isAdmin}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-50">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {modal.kind === 'view' && (
        <ViewDetailModal
          isOpen
          onClose={() => setModal({ kind: 'none' })}
          employeeId={modal.row.employeeId}
          date={appliedFilters.date || initialTodayInCompanyTz}
        />
      )}
      {modal.kind === 'checkIn' && (
        <ManualCheckInModal
          key={`checkin-${modal.row.employeeId}-${timezone}`}
          isOpen
          onClose={() => setModal({ kind: 'none' })}
          employeeId={modal.row.employeeId}
          employeeName={modal.row.employeeName}
          timezone={timezone}
          isAdmin={isAdmin}
        />
      )}
      {modal.kind === 'checkOut' && (
        <ManualCheckOutModal
          key={`checkout-${modal.row.employeeId}-${timezone}`}
          isOpen
          onClose={() => setModal({ kind: 'none' })}
          employeeId={modal.row.employeeId}
          employeeName={modal.row.employeeName}
          timezone={timezone}
          isAdmin={isAdmin}
        />
      )}
      {modal.kind === 'dismiss' && modal.row.dayRecordId && (
        <DismissWarningsModal
          isOpen
          onClose={() => setModal({ kind: 'none' })}
          dayRecordId={modal.row.dayRecordId}
          warningFlags={[]}
        />
      )}
      {modal.kind === 'adjust' && modal.row.dayRecordId && (
        <AdjustDayRecordModal
          key={`adjust-${modal.row.dayRecordId}-${timezone}-${modal.row.firstCheckInAt ?? 'none'}-${modal.row.lastCheckOutAt ?? 'none'}`}
          isOpen
          onClose={() => setModal({ kind: 'none' })}
          dayRecordId={modal.row.dayRecordId}
          firstCheckInAt={modal.row.firstCheckInAt}
          lastCheckOutAt={modal.row.lastCheckOutAt}
          workedMinutes={modal.row.workedMinutes}
          dayStatus={modal.row.dayStatus}
          workDate={data?.workDate ?? ''}
          timezone={timezone}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
