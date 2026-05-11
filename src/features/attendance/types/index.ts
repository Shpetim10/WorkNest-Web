import type { OffsetPaginatedCollection, PaginationParams } from '@/common/types/api';

export enum AttendanceState {
  NOT_CHECKED_IN = 'NOT_CHECKED_IN',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  MISSING_CHECKOUT = 'MISSING_CHECKOUT',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

export enum AttendanceDayStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
  HOLIDAY = 'HOLIDAY',
  MISSING_CHECKOUT = 'MISSING_CHECKOUT',
  FLAGGED = 'FLAGGED',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

export enum AttendanceReviewStatus {
  NONE = 'NONE',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CORRECTED = 'CORRECTED',
}

export enum AttendanceCaptureMethod {
  QR_CODE = 'QR_CODE',
  GEOFENCE = 'GEOFENCE',
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
}

export enum AttendanceEventType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
  MANUAL_CHECK_IN = 'MANUAL_CHECK_IN',
  MANUAL_CHECK_OUT = 'MANUAL_CHECK_OUT',
  AUTO_CHECK_OUT = 'AUTO_CHECK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  withWarnings: number;
}

export interface AttendanceEmployeeRow {
  dayRecordId: string | null;
  employeeId: string;
  userId: string;
  employeeName: string;
  departmentId: string | null;
  departmentName: string | null;
  siteId: string | null;
  siteName: string | null;
  attendanceState: AttendanceState;
  dayStatus: AttendanceDayStatus;
  firstCheckInAt: string | null;
  lastCheckOutAt: string | null;
  workedMinutes: number;
  lateMinutes: number;
  hasWarnings: boolean;
  reviewStatus: AttendanceReviewStatus;
  payrollLocked: boolean;
}

export interface AttendanceDashboardData {
  workDate: string;
  timezone: string;
  summary: AttendanceSummary;
  employees: AttendanceEmployeeRow[];
  pagination: OffsetPaginatedCollection<never>;
}

export interface AttendanceDashboardResponse {
  status: string;
  message: string;
  data: AttendanceDashboardData;
}

export interface AttendanceEvent {
  eventId: string;
  eventType: AttendanceEventType;
  captureMethod: AttendanceCaptureMethod;
  serverRecordedAt: string;
  attendanceDecision: string;
  warningFlags: string[];
  geofenceDecision: string | null;
  networkDecision: string | null;
  reviewStatus: AttendanceReviewStatus;
  employeeNote: string | null;
  reviewNote: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
}

export interface AttendanceDetailData {
  dayRecordId: string | null;
  employeeId: string;
  userId: string;
  employeeName: string;
  departmentName: string | null;
  siteName: string | null;
  workDate: string;
  timezone: string;
  dayStatus: AttendanceDayStatus;
  attendanceState: AttendanceState;
  firstCheckInAt: string | null;
  lastCheckOutAt: string | null;
  workedMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  breakMinutes: number;
  hasWarnings: boolean;
  warningFlags: string[];
  reviewStatus: AttendanceReviewStatus;
  payrollLocked: boolean;
  events: AttendanceEvent[];
}

export interface AttendanceDetailResponse {
  status: string;
  message: string;
  data: AttendanceDetailData;
}

export interface AttendanceDashboardFilters extends PaginationParams {
  date?: string;
  siteId?: string;
  departmentId?: string;
}

export interface ManualCheckInRequest {
  eventAt?: string;
  reason?: string;
}

export interface ManualCheckOutRequest {
  eventAt?: string;
  reason?: string;
}

export interface DismissWarningsRequest {
  note?: string;
}

export interface ReviewEventRequest {
  reviewStatus: 'APPROVED' | 'REJECTED';
  note?: string;
}

export interface AdjustDayRecordRequest {
  firstCheckInAt?: string;
  lastCheckOutAt?: string;
  workedMinutes?: number | null;
  dayStatus?: AttendanceDayStatus;
}
