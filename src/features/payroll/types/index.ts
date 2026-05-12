export type PayrollStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'APPROVED'
  | 'FINALIZED'
  | 'PAID'
  | 'CANCELLED';

export type PaymentMethod = 'FIXED_MONTHLY' | 'HOURLY';
export type PayrollAdjustmentType = 'BONUS' | 'DEDUCTION';
export type PayrollCalculationStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';

export interface PayrollPeriod {
  year: number;
  month: number;
}

export interface PayrollAdjustmentLine {
  id?: string;
  amount: number;
  reason?: string | null;
  notes?: string | null;
}

export interface PayrollCalculationResponse {
  employeeId: string;
  employeeName: string;
  year: number;
  month: number;
  currency: string;
  paymentMethod: PaymentMethod;
  calculationStatus: PayrollCalculationStatus;
  payrollStatus: PayrollStatus;
  preview: boolean;
  employmentPeriod?: {
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
    payableWorkingDays?: number;
    workingDaysInMonth?: number;
    payableHours?: number;
    basePay: number;
    prorationMethod?: string;
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
  } | null;
  warnings: string[] | null;
}

export interface PayrollAdjustmentResponse {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  type: PayrollAdjustmentType;
  amount: number;
  reason: string;
  notes: string | null;
  createdByUserId: string;
  createdAt: string;
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

export interface SickLeavePolicyResponse {
  companyPaidPercentage: number;
  maxCompanyPaidDays: number;
  isDefault: boolean;
}

export interface UpsertSickLeavePolicyRequest {
  companyPaidPercentage: number;
  maxCompanyPaidDays: number;
}

export interface PayrollBatchCalculateResponse {
  year: number;
  month: number;
  totalEmployees: number;
  successfulCalculations: number;
  failedCalculations: number;
  skippedCalculations: number;
  results: Array<{
    employeeId: string;
    status: PayrollCalculationStatus;
    grossEarnings: number;
    errorCode: string | null;
    message: string | null;
  }>;
}
