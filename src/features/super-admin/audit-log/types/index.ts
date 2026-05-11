export type AuditLogSeverity = 'info' | 'warning' | 'error';

export interface AuditLogRow {
  id: string;
  event: string;
  company: string;
  description: string;
  actor: string;
  timestamp: string;
  severity: AuditLogSeverity;
}

export interface AuditLogSummaryDto {
  infoEvents: number;
  warnings: number;
  errors: number;
  today: number;
}

export interface AuditLogPageMeta {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface SuperAdminAuditLogQuery {
  page: number;
  size: number;
  search?: string;
}

export interface SuperAdminAuditLogDto {
  rows: AuditLogRow[];
  summary: AuditLogSummaryDto;
  page: AuditLogPageMeta;
}
