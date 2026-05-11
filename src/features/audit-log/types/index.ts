export interface AuditLogEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
  referenceId?: string;
}

export interface AuditLogPage {
  content: AuditLogEntry[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface AuditLogParams {
  page?: number;
  size?: number;
}
