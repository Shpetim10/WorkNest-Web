export type PayrollStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'APPROVED'
  | 'FINALIZED'
  | 'PAID'
  | 'CANCELLED';

export type PaymentMethod = 'FIXED_MONTHLY' | 'HOURLY';

export interface PayrollPeriod {
  year: number;
  month: number;
}

export interface PayrollAdjustmentLine {
  id?: string;
  amount: number;
  reason?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

export interface PayrollCalculationResponse {
  employeeId: string;
  employeeName: string;
  year: number;
  month: number;
  currency: string;
  paymentMethod: PaymentMethod;
  calculationStatus: 'SUCCESS' | string;
  payrollStatus: PayrollStatus;
  preview: boolean;
  employmentPeriod?: {
    startDate?: string | null;
    endDate?: string | null;
    employmentStartDate?: string | null;
    employmentEndDate?: string | null;
    payableFrom?: string | null;
    payableTo?: string | null;
  } | null;
  workPeriod?: {
    calendarDaysInMonth?: number;
    workingDaysInMonth?: number;
    payableWorkingDays?: number;
    defaultDailyWorkingHours?: number;
    payableHours?: number;
    workHoursSource?: string;
  } | null;
  basePayCalculation?: {
    formula?: string;
    monthlySalary?: number;
    hourlyRate?: number;
    payableHours?: number;
    basePay: number;
  } | null;
  leaveCalculation?: {
    annualPaidLeaveAllowanceDays?: number;
    usedPaidLeaveBeforeThisMonth?: number;
    leaveTakenThisMonth?: number;
    paidLeaveDaysThisMonth?: number;
    unpaidLeaveDaysThisMonth?: number;
    unpaidLeaveDeduction?: number;
    leaveRecordsIncluded?: unknown[];
  } | null;
  sickLeaveCalculation?: {
    daysTakenThisMonth?: number;
    companyPaidDays?: number | null;
    companyPaidPercentage?: number | null;
    companyPaidAmount?: number | null;
    insuranceCoveredDays?: number | null;
    insuranceCoveredAmount?: number | null;
    status?: string | null;
  } | null;
  adjustments: {
    bonuses: PayrollAdjustmentLine[];
    deductions: PayrollAdjustmentLine[];
    totalBonus: number;
    totalManualDeduction: number;
  } | null;
  totals: {
    basePay: number;
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
    negativeNetPay: boolean;
  } | null;
  warnings: string[] | null;
}

export interface PayrollAdjustmentRequest {
  employeeId: string;
  year: number;
  month: number;
  amount: number;
  reason: string;
  notes?: string;
}

export interface PayrollPersistRequest {
  employeeId: string;
  year: number;
  month: number;
}

export interface PayrollBatchCalculateRequest {
  year: number;
  month: number;
  employeeIds?: string[] | null;
}

export interface PayrollBatchCalculateResponse {
  successCount?: number;
  failedCount?: number;
  skippedCount?: number;
  failures?: Array<{
    employeeId?: string;
    employeeName?: string;
    message: string;
  }>;
}
