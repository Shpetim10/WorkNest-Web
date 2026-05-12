export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'UNPAID' | 'MATERNITY' | 'PATERNITY' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface CreateLeaveRequestBody {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  note?: string | null;
  medicalReportDocumentId?: string | null;
}

export interface RejectLeaveRequestBody {
  reason: string;
}

export interface LeaveBalanceDto {
  leaveType: LeaveType;
  totalDays: number;
  usedDays: number;
  availableDays: number;
}

export interface LeaveRequestDto {
  id: string;
  employeeId: string;
  employeeName: string;
  siteName: string | null;
  departmentName: string | null;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: LeaveStatus;
  note: string | null;
  medicalReportDocumentId: string | null;
  rejectionReason: string | null;
  approvalNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}