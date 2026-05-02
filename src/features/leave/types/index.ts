export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequestDTO {
  id: string;
  name: string;
  site: string;
  department: string;
  type: string;
  dateRange: string;
  days: number;
  status: LeaveStatus;
  notes?: string;
}
