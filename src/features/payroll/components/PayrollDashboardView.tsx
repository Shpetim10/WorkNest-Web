"use client";

import React, { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Minus,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { TablePagination } from '@/common/ui';
import { useCompanyPeople } from '@/features/employees/api/get-employees';
import { CompanyPersonRow, EmployeeStatus } from '@/features/employees/types';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { getStoredCompanyCurrency, getStoredCompanyLocale } from '@/features/company-settings/storage';
import {
  PayrollCalculationResponse,
  PayrollPeriod,
  PayrollStatus,
} from '../types';
import {
  payrollKeys,
  useAddPayrollBonus,
  useAddPayrollDeduction,
  useBatchCalculatePayroll,
  usePayrollDetails,
  usePersistPayrollCalculation,
} from '../api';

const PAGE_SIZE = 8;

type ModalState =
  | { kind: 'none' }
  | { kind: 'view'; person: CompanyPersonRow; details?: PayrollCalculationResponse }
  | { kind: 'bonus'; person: CompanyPersonRow; details?: PayrollCalculationResponse }
  | { kind: 'deduction'; person: CompanyPersonRow; details?: PayrollCalculationResponse };

function currentPeriod(): PayrollPeriod {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function toMonthInput(period: PayrollPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

function fromMonthInput(value: string): PayrollPeriod {
  const [year, month] = value.split('-').map(Number);
  return { year, month };
}

function monthName(period: PayrollPeriod): string {
  return new Date(period.year, period.month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function employeeTypeValue(person: CompanyPersonRow): string {
  return person.employmentType ?? '';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatCurrency(
  value: number | undefined | null,
  currency = 'EUR',
  locale = 'en-US',
): string {
  const safeValue = Number.isFinite(value ?? NaN) ? Number(value) : 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: safeValue % 1 === 0 ? 0 : 2,
  }).format(safeValue);
}

function compactCurrency(value: number, currency = 'EUR', locale = 'en-US'): string {
  const abs = Math.abs(value);
  const compactValue = abs >= 1000 ? `${(value / 1000).toFixed(abs >= 10000 ? 0 : 1)}k` : `${value.toFixed(0)}`;
  const formattedZero = formatCurrency(0, currency, locale);
  const symbol = formattedZero.replace(/[\d\s.,]/g, '') || currency;
  return `${symbol}${compactValue}`;
}

function paymentLabel(value?: string | null): string {
  if (value === 'HOURLY') return 'Hourly';
  if (value === 'FIXED_MONTHLY') return 'Fixed monthly';
  return 'Not set';
}

function payrollTotals(details?: PayrollCalculationResponse | null) {
  return {
    basePay: details?.totals?.basePay ?? 0,
    grossEarnings: details?.totals?.grossEarnings ?? 0,
    totalDeductions: details?.totals?.totalDeductions ?? 0,
    netPay: details?.totals?.netPay ?? 0,
    negativeNetPay: details?.totals?.negativeNetPay ?? false,
  };
}

function payrollAdjustments(details?: PayrollCalculationResponse | null) {
  return {
    bonuses: details?.adjustments?.bonuses ?? [],
    deductions: details?.adjustments?.deductions ?? [],
    totalBonus: details?.adjustments?.totalBonus ?? 0,
    totalManualDeduction: details?.adjustments?.totalManualDeduction ?? 0,
  };
}

function payrollWarnings(details?: PayrollCalculationResponse | null): string[] {
  return details?.warnings ?? [];
}

function formatBasePayDisplay(
  details: PayrollCalculationResponse | undefined,
  person: CompanyPersonRow,
  currency: string,
  locale: string,
): string {
  const paymentMethod = details?.paymentMethod ?? person.raw.paymentMethod;
  if (paymentMethod === 'HOURLY') {
    const hourlyRate = details?.basePayCalculation?.hourlyRate ?? person.raw.hourlyRate;
    if (typeof hourlyRate === 'number') {
      return `${formatCurrency(hourlyRate, currency, locale)}/hour`;
    }
  }
  return formatCurrency(payrollTotals(details).basePay, currency, locale);
}

function statusBadge(status?: PayrollStatus, preview?: boolean): { label: string; cls: string } {
  if (preview) return { label: 'Preview', cls: 'bg-sky-100 text-sky-700' };
  const map: Record<PayrollStatus, { label: string; cls: string }> = {
    DRAFT: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    CALCULATED: { label: 'Calculated', cls: 'bg-blue-100 text-blue-700' },
    APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
    FINALIZED: { label: 'Finalized', cls: 'bg-teal-100 text-teal-700' },
    PAID: { label: 'Paid', cls: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
  };
  return status && map[status] ? map[status] : { label: 'Unavailable', cls: 'bg-red-50 text-red-600' };
}

function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Action failed. Please try again.';
  }
  const axiosError = error as AxiosError<{ message?: string; code?: string; errorCode?: string }>;
  const code = axiosError.response?.data?.code ?? axiosError.response?.data?.errorCode;
  if (code === 'PAYROLL_PERIOD_LOCKED') return 'This payroll period is locked.';
  return axiosError.response?.data?.message ?? 'Action failed. Please try again.';
}

function isLockedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const axiosError = error as AxiosError<{ code?: string; errorCode?: string }>;
  return (
    axiosError.response?.data?.code === 'PAYROLL_PERIOD_LOCKED' ||
    axiosError.response?.data?.errorCode === 'PAYROLL_PERIOD_LOCKED'
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'success' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm min-w-0">
      <p className="text-xs text-slate-500 font-semibold mb-1">{label}</p>
      <p className={`text-2xl font-bold truncate ${tone === 'danger' ? 'text-red-600' : tone === 'success' ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}

function MoneyTile({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'good' | 'bad' }) {
  const cls =
    tone === 'good'
      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
      : tone === 'bad'
        ? 'bg-red-50 border-red-100 text-red-600'
        : 'bg-slate-50 border-slate-100 text-slate-950';
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function PayrollModalShell({
  title,
  subtitle,
  onClose,
  children,
  width = 'max-w-[520px]',
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} />
      <section className={`relative w-full ${width} bg-white rounded-2xl shadow-2xl overflow-hidden border border-white`}>
        <div className="px-7 py-6 text-white flex items-start justify-between" style={{ background: 'linear-gradient(120deg, #2B7FFF 0%, #00BBA7 100%)' }}>
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm text-white/80 mt-1">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/90 hover:bg-white/15" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function PersonHeader({ person, details, period }: { person: CompanyPersonRow; details?: PayrollCalculationResponse; period: PayrollPeriod }) {
  const name = details?.employeeName ?? person.fullName;
  return (
    <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)' }}>
        {getInitials(name)}
      </div>
      <div>
        <p className="font-bold text-slate-900 text-lg leading-tight">{name}</p>
        <p className="text-xs text-slate-500">{monthName(period)} payroll</p>
      </div>
    </div>
  );
}

function ViewPayrollModal({
  person,
  initialDetails,
  period,
  onClose,
}: {
  person: CompanyPersonRow;
  initialDetails?: PayrollCalculationResponse;
  period: PayrollPeriod;
  onClose: () => void;
}) {
  const companyCurrency = getStoredCompanyCurrency();
  const companyLocale = getStoredCompanyLocale();
  const detailsQuery = usePayrollDetails(person.id, period);
  const details = detailsQuery.data ?? initialDetails;
  const currency = companyCurrency;
  const persist = usePersistPayrollCalculation();
  const [error, setError] = useState<string | null>(null);

  const saveCalculation = () => {
    setError(null);
    persist.mutate(
      { employeeId: person.id, ...period },
      { onError: (err) => setError(extractErrorMessage(err)) },
    );
  };

  return (
    <PayrollModalShell
      title="View Details"
      subtitle="View the payroll details for this employee"
      width="max-w-[640px]"
      onClose={onClose}
    >
      <div className="p-7 max-h-[78vh] overflow-y-auto">
        <PersonHeader person={person} details={details} period={period} />
        {detailsQuery.isLoading && !details ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        ) : !details ? (
          <p className="py-10 text-sm text-red-600">Payroll details are unavailable for this employee.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5">
              <div>
                <p className="text-xs text-slate-500 mb-2">Employee Name</p>
                <p className="text-sm font-semibold text-slate-900">{details.employeeName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Payment Method</p>
                <p className="text-sm font-semibold text-slate-900">{paymentLabel(details.paymentMethod)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MoneyTile label="Base Pay" value={formatCurrency(payrollTotals(details).basePay, currency, companyLocale)} />
              <MoneyTile label="Bonuses" value={formatCurrency(payrollAdjustments(details).totalBonus, currency, companyLocale)} tone="good" />
              <MoneyTile label="Deductions" value={`-${formatCurrency(payrollTotals(details).totalDeductions, currency, companyLocale)}`} tone="bad" />
            </div>

            <div className={`mt-4 rounded-2xl border overflow-hidden ${payrollTotals(details).negativeNetPay ? 'border-red-200' : 'border-cyan-100'}`}>
              <div className={`px-5 py-5 flex items-center justify-between ${payrollTotals(details).negativeNetPay ? 'bg-red-50' : 'bg-cyan-50'}`}>
                <div>
                  <p className="text-lg font-bold text-slate-900">{monthName(period)}</p>
                  <p className="text-xs text-slate-500">Payroll status: {statusBadge(details.payrollStatus, details.preview).label}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Gross Earnings</p>
                  <p className={`text-3xl font-bold ${payrollTotals(details).negativeNetPay ? 'text-red-600' : 'text-slate-950'}`}>
                    {formatCurrency(payrollTotals(details).grossEarnings, currency, companyLocale)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-5 py-5">
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-3">Earnings</p>
                  <Line label="Base Pay" value={formatCurrency(payrollTotals(details).basePay, currency, companyLocale)} />
                  <Line label="Adjustments" value={formatCurrency(payrollAdjustments(details).totalBonus, currency, companyLocale)} />
                  <Line label="Gross Earnings" value={formatCurrency(payrollTotals(details).grossEarnings, currency, companyLocale)} strong />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-3">Deductions</p>
                  <Line label="Manual deductions" value={`-${formatCurrency(payrollAdjustments(details).totalManualDeduction, currency, companyLocale)}`} danger />
                  <Line label="Leave deduction" value={`-${formatCurrency(details.leaveCalculation?.unpaidLeaveDeduction ?? 0, currency, companyLocale)}`} danger />
                  <Line label="Total Deductions" value={formatCurrency(payrollTotals(details).totalDeductions, currency, companyLocale)} strong danger />
                </div>
              </div>
            </div>

            {payrollWarnings(details).length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    {payrollWarnings(details).map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap justify-between gap-3">
              <button onClick={onClose} className="h-11 px-8 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200">
                Close
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="h-11 px-5 rounded-xl border border-blue-100 text-blue-700 text-sm font-bold hover:bg-blue-50 inline-flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Payslip
                </button>
                <button
                  onClick={saveCalculation}
                  disabled={persist.isPending}
                  className="h-11 px-5 rounded-xl text-white text-sm font-bold disabled:opacity-60 inline-flex items-center gap-2"
                  style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
                >
                  <CheckCircle2 size={16} />
                  {persist.isPending ? 'Saving...' : 'Save Calculation'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </PayrollModalShell>
  );
}

function Line({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1.5 text-sm ${strong ? 'font-bold border-t border-slate-100 mt-2 pt-3' : ''}`}>
      <span className="text-slate-500">{label}</span>
      <span className={danger ? 'text-red-600' : 'text-slate-900'}>{value}</span>
    </div>
  );
}

function AdjustmentModal({
  kind,
  person,
  initialDetails,
  period,
  onClose,
}: {
  kind: 'bonus' | 'deduction';
  person: CompanyPersonRow;
  initialDetails?: PayrollCalculationResponse;
  period: PayrollPeriod;
  onClose: () => void;
}) {
  const companyCurrency = getStoredCompanyCurrency();
  const companyLocale = getStoredCompanyLocale();
  const detailsQuery = usePayrollDetails(person.id, period);
  const details = detailsQuery.data ?? initialDetails;
  const currency = companyCurrency;
  const bonusMutation = useAddPayrollBonus();
  const deductionMutation = useAddPayrollDeduction();
  const mutation = kind === 'bonus' ? bonusMutation : deductionMutation;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(kind === 'bonus' ? 'Performance bonus' : 'Salary advance repayment');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const locked = isLockedError(detailsQuery.error);
  const parsedAmount = Number(amount) || 0;
  const currentTotal =
    kind === 'bonus'
      ? payrollAdjustments(details).totalBonus
      : payrollAdjustments(details).totalManualDeduction;
  const newTotal = currentTotal + parsedAmount;
  const title = kind === 'bonus' ? 'Add Bonus' : 'Add Deduction';
  const label = kind === 'bonus' ? 'Bonus' : 'Deduction';

  const submit = () => {
    setError(null);
    if (parsedAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }
    mutation.mutate(
      {
        employeeId: person.id,
        ...period,
        amount: parsedAmount,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: onClose,
        onError: (err) => setError(extractErrorMessage(err)),
      },
    );
  };

  return (
    <PayrollModalShell
      title={title}
      subtitle={`Add a payroll ${kind} for this employee`}
      onClose={onClose}
    >
      <div className="p-7">
        <PersonHeader person={person} details={details} period={period} />

        <div className="grid grid-cols-2 gap-3 py-5">
          <MoneyTile label={`Current ${label}`} value={formatCurrency(currentTotal, currency, companyLocale)} />
          <MoneyTile
            label={`New ${label}`}
            value={`${kind === 'deduction' ? '-' : ''}${formatCurrency(newTotal, currency, companyLocale)}`}
            tone={kind === 'bonus' ? 'good' : 'bad'}
          />
        </div>

        {locked && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            This payroll period is locked. Adjustments are disabled.
          </div>
        )}

        <div className="space-y-4">
          <Field label={`${label} Amount`}>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={locked}
              inputMode="decimal"
              placeholder={kind === 'bonus' ? '150' : '120'}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60"
            />
          </Field>
          <Field label={`${label} Type`}>
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={locked}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60"
            />
          </Field>
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={locked}
              rows={3}
              placeholder={kind === 'bonus' ? 'Employee exceeded monthly performance targets.' : 'Payroll adjustment approved after review.'}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60 resize-none"
            />
          </Field>
        </div>

        <div className={`mt-4 rounded-xl px-4 py-3 text-xs ${kind === 'bonus' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          This amount will be {kind === 'bonus' ? 'added to' : 'subtracted from'} the employee&apos;s payroll for {monthName(period)}.
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between gap-3">
          <button onClick={onClose} className="h-11 px-7 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={locked || mutation.isPending}
            className="h-11 px-7 rounded-xl text-white text-sm font-bold disabled:opacity-60"
            style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
          >
            {mutation.isPending ? 'Saving...' : `Save ${label}`}
          </button>
        </div>
      </div>
    </PayrollModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-2">{label}</span>
      {children}
    </label>
  );
}

export function PayrollDashboardView() {
  const companyCurrency = getStoredCompanyCurrency();
  const companyLocale = getStoredCompanyLocale();
  const [period, setPeriod] = useState<PayrollPeriod>(currentPeriod);
  const [appliedPeriod, setAppliedPeriod] = useState<PayrollPeriod>(currentPeriod);
  const [search, setSearch] = useState('');
  const [employeeType, setEmployeeType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  const { data: employeesData, isLoading: employeesLoading, isError: employeesError } = useCompanyPeople({
    status: EmployeeStatus.ACTIVE,
    size: 200,
  });
  const people = useMemo(() => employeesData?.data ?? [], [employeesData?.data]);

  const filteredEmployees = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return people.filter((person) => {
      const matchesSearch =
        !needle ||
        person.fullName.toLowerCase().includes(needle) ||
        person.email.toLowerCase().includes(needle);
      const matchesType = !employeeType || employeeTypeValue(person) === employeeType;
      const matchesPayment = !paymentMethod || person.raw.paymentMethod === paymentMethod;
      return matchesSearch && matchesType && matchesPayment;
    });
  }, [employeeType, paymentMethod, people, search]);

  const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
  const visiblePeople = filteredEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const detailQueries = useQueries({
    queries: visiblePeople.map((person) => ({
      queryKey: payrollKeys.detail(person.id, appliedPeriod),
      queryFn: async () => {
        const response = await apiClient.get<ApiResponse<PayrollCalculationResponse>>(
          `/admin/payroll/employees/${person.id}/details`,
          { params: appliedPeriod },
        );
        return response.data.data;
      },
      retry: 1,
    })),
  });

  const detailByEmployeeId = new Map<string, PayrollCalculationResponse>();
  detailQueries.forEach((query, index) => {
    if (query.data) detailByEmployeeId.set(visiblePeople[index].id, query.data);
  });

  const loadedDetails = detailQueries.map((query) => query.data).filter(Boolean) as PayrollCalculationResponse[];
  const currency = companyCurrency;
  const summary = loadedDetails.reduce(
    (acc, details) => {
      const totals = payrollTotals(details);
      const adjustments = payrollAdjustments(details);
      acc.totalPayroll += totals.grossEarnings;
      acc.totalBonuses += adjustments.totalBonus;
      acc.totalDeductions += totals.totalDeductions;
      acc.pending += details.preview || details.payrollStatus === 'DRAFT' ? 1 : 0;
      acc.warnings += payrollWarnings(details).length;
      return acc;
    },
    { totalPayroll: 0, totalBonuses: 0, totalDeductions: 0, pending: 0, warnings: 0 },
  );

  const batchCalculate = useBatchCalculatePayroll();

  const applyFilters = () => {
    setAppliedPeriod(period);
    setPage(1);
  };

  const calculateAll = () => {
    setBatchMessage(null);
    batchCalculate.mutate(
      {
        ...appliedPeriod,
        employeeIds: filteredEmployees.map((person) => person.id),
      },
      {
        onSuccess: (result) => {
          const success = result.successCount ?? filteredEmployees.length;
          const failed = result.failedCount ?? 0;
          const skipped = result.skippedCount ?? 0;
          setBatchMessage(`Calculated ${success} employees. Failed: ${failed}. Skipped: ${skipped}.`);
        },
        onError: (error) => setBatchMessage(extractErrorMessage(error)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4 pb-10">
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between min-h-[120px]"
        style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <ReceiptText size={25} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Payroll Overview</h1>
            <p className="text-white/80 text-sm mt-0.5">Manage monthly payroll for {monthName(appliedPeriod)}</p>
          </div>
        </div>
        <button
          onClick={calculateAll}
          disabled={batchCalculate.isPending || filteredEmployees.length === 0}
          className="h-12 px-5 rounded-xl bg-white/20 hover:bg-white/25 text-white font-bold text-sm inline-flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={18} className={batchCalculate.isPending ? 'animate-spin' : ''} />
          Calculate All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Page Gross Earnings" value={compactCurrency(summary.totalPayroll, currency, companyLocale)} />
        <StatCard label="Previewed Employees" value={String(loadedDetails.length)} />
        <StatCard label="Page Bonuses" value={compactCurrency(summary.totalBonuses, currency, companyLocale)} tone="success" />
        <StatCard label="Page Deductions" value={compactCurrency(summary.totalDeductions, currency, companyLocale)} tone="danger" />
        <StatCard label="Page Pending" value={String(summary.pending)} />
      </div>

      {(batchMessage || summary.warnings > 0) && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{batchMessage ?? `${summary.warnings} payroll warning${summary.warnings === 1 ? '' : 's'} visible in the current page.`}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search employee locally..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300"
          />
        </div>

        <div className="relative">
          <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="month"
            value={toMonthInput(period)}
            onChange={(event) => setPeriod(fromMonthInput(event.target.value))}
            className="h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300"
          />
        </div>

        <SelectFilter value={employeeType} onChange={setEmployeeType} options={[
          ['', 'All employee types'],
          ['FULL_TIME', 'Full-time'],
          ['PART_TIME', 'Part-time'],
          ['CONTRACT', 'Contract'],
          ['INTERN', 'Intern'],
        ]} />
        <SelectFilter value={paymentMethod} onChange={setPaymentMethod} options={[
          ['','All payment types'],
          ['FIXED_MONTHLY','Fixed monthly'],
          ['HOURLY','Hourly'],
        ]} />
        <button onClick={applyFilters} className="h-10 px-7 bg-[#2B7FFF] hover:bg-blue-700 text-white text-sm font-bold rounded-xl">
          Apply
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#2B7FFF] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="text-xs font-semibold text-white uppercase tracking-wide" style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}>
                {['Employee Name', 'Type of Employee', 'Payment', 'Base Pay', 'Bonuses', 'Deductions', 'Gross Earnings', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-6 py-4 text-left font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employeesLoading && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="mx-auto w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  </td>
                </tr>
              )}
              {employeesError && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-red-600">Failed to load employees.</td>
                </tr>
              )}
              {!employeesLoading && !employeesError && visiblePeople.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">No employees found for these filters.</td>
                </tr>
              )}
              {visiblePeople.map((person) => {
                const details = detailByEmployeeId.get(person.id);
                const query = detailQueries[visiblePeople.findIndex((candidate) => candidate.id === person.id)];
                const name = details?.employeeName ?? person.fullName;
                const badge = statusBadge(details?.payrollStatus, details?.preview);
                return (
                  <tr key={person.id} className="border-b border-slate-100 hover:bg-blue-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)' }}>
                          {getInitials(name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{name}</p>
                          {query?.isError && <p className="text-xs text-red-500">Preview unavailable</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          person.platformRole === 'STAFF' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {person.displayRoleLabel}
                        </span>
                        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {person.employmentTypeLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{paymentLabel(details?.paymentMethod ?? person.raw.paymentMethod)}</td>
                    <td className="px-6 py-4 text-slate-600">{details ? formatBasePayDisplay(details, person, companyCurrency, companyLocale) : query?.isLoading ? 'Loading...' : '—'}</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">{details ? formatCurrency(payrollAdjustments(details).totalBonus, companyCurrency, companyLocale) : '—'}</td>
                    <td className="px-6 py-4 text-red-600 font-semibold">{details ? `-${formatCurrency(payrollTotals(details).totalDeductions, companyCurrency, companyLocale)}` : '—'}</td>
                    <td className={`px-6 py-4 font-semibold ${payrollTotals(details).negativeNetPay ? 'text-red-600' : 'text-slate-700'}`}>
                      {details ? formatCurrency(payrollTotals(details).grossEarnings, companyCurrency, companyLocale) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <IconAction label="View details" onClick={() => setModal({ kind: 'view', person, details })}>
                          <Eye size={15} />
                        </IconAction>
                        <IconAction label="Add bonus" tone="success" onClick={() => setModal({ kind: 'bonus', person, details })}>
                          <Plus size={15} />
                        </IconAction>
                        <IconAction label="Add deduction" tone="danger" onClick={() => setModal({ kind: 'deduction', person, details })}>
                          <Minus size={15} />
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-slate-100">
            <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {modal.kind === 'view' && (
        <ViewPayrollModal person={modal.person} initialDetails={modal.details} period={appliedPeriod} onClose={() => setModal({ kind: 'none' })} />
      )}
      {modal.kind === 'bonus' && (
        <AdjustmentModal kind="bonus" person={modal.person} initialDetails={modal.details} period={appliedPeriod} onClose={() => setModal({ kind: 'none' })} />
      )}
      {modal.kind === 'deduction' && (
        <AdjustmentModal kind="deduction" person={modal.person} initialDetails={modal.details} period={appliedPeriod} onClose={() => setModal({ kind: 'none' })} />
      )}
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none h-10 min-w-[170px] pl-4 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue || label} value={optionValue}>{label}</option>
        ))}
      </select>
      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

function IconAction({
  label,
  tone = 'neutral',
  onClick,
  children,
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'danger';
  onClick: () => void;
  children: React.ReactNode;
}) {
  const color = tone === 'success' ? 'text-emerald-600 hover:bg-emerald-50' : tone === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100';
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors ${color}`}
    >
      {children}
    </button>
  );
}
