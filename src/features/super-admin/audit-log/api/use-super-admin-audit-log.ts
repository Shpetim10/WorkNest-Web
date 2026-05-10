import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import type { ApiResponse, PaginatedResponse } from '@/common/types/api';
import type {
  AuditLogPageMeta,
  AuditLogRow,
  AuditLogSeverity,
  AuditLogSummaryDto,
  SuperAdminAuditLogDto,
  SuperAdminAuditLogQuery,
} from '../types';

export const SUPER_ADMIN_AUDIT_LOG_ENDPOINT = '/super-admin/audit-log';

export const superAdminAuditLogKeys = {
  all: ['super-admin-audit-log'] as const,
  list: (params: SuperAdminAuditLogQuery) => [...superAdminAuditLogKeys.all, 'list', params] as const,
};

type AuditLogApiItem = Record<string, unknown>;
type AuditLogApiPage = PaginatedResponse<AuditLogApiItem>;
type AuditLogCollection = AuditLogApiPage | AuditLogApiItem[];
type AuditLogApiPayload =
  | AuditLogCollection
  | {
      summary?: unknown;
      logs?: unknown;
      auditLogs?: unknown;
      items?: unknown;
      content?: unknown;
      pageNumber?: unknown;
      pageSize?: unknown;
      totalElements?: unknown;
      totalPages?: unknown;
      first?: unknown;
      last?: unknown;
    };

const EMPTY_SUMMARY: AuditLogSummaryDto = {
  infoEvents: 0,
  warnings: 0,
  errors: 0,
  today: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPaginatedResponse(value: unknown): value is AuditLogApiPage {
  return isRecord(value) && Array.isArray(value.content);
}

function unwrapAuditLogResponse(
  body: ApiResponse<AuditLogApiPayload> | AuditLogApiPayload,
): AuditLogApiPayload {
  if (isRecord(body) && 'data' in body) {
    return body.data as AuditLogApiPayload;
  }

  return body as AuditLogApiPayload;
}

function getString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  return fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function getBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeSeverity(value: unknown): AuditLogSeverity {
  const severity = getString(value, 'info').trim().toLowerCase();

  if (severity === 'warning' || severity === 'warn') return 'warning';
  if (severity === 'error' || severity === 'failed' || severity === 'failure' || severity === 'critical') {
    return 'error';
  }

  return 'info';
}

function getNestedName(value: unknown): unknown {
  if (!isRecord(value)) return value;

  return value.name ?? value.companyName ?? value.displayName ?? value.email;
}

function mapAuditLogItem(item: AuditLogApiItem, index: number): AuditLogRow {
  const companyValue = item.companyName ?? item.company ?? item.tenantName ?? item.organizationName;
  const actorValue = item.actorName ?? item.actor ?? item.performedBy ?? item.userName;

  return {
    id: getString(item.id ?? item.auditLogId ?? item.eventId, `audit-log-${index}`),
    event: getString(item.event ?? item.eventName ?? item.action ?? item.type, 'Unknown event'),
    company: getString(getNestedName(companyValue), 'Unknown company'),
    description: getString(item.description ?? item.message ?? item.details, ''),
    actor: getString(getNestedName(actorValue), 'System'),
    timestamp: getString(item.timestamp ?? item.occurredAt ?? item.createdAt ?? item.dateTime, ''),
    severity: normalizeSeverity(item.severity ?? item.level ?? item.status),
  };
}

function computeSummary(rows: AuditLogRow[]): AuditLogSummaryDto {
  const todayDate = new Date().toISOString().slice(0, 10);

  return rows.reduce<AuditLogSummaryDto>(
    (summary, row) => {
      if (row.severity === 'info') summary.infoEvents += 1;
      if (row.severity === 'warning') summary.warnings += 1;
      if (row.severity === 'error') summary.errors += 1;
      if (row.timestamp.slice(0, 10) === todayDate) summary.today += 1;

      return summary;
    },
    { ...EMPTY_SUMMARY },
  );
}

function normalizeSummary(summary: unknown, rows: AuditLogRow[]): AuditLogSummaryDto {
  if (!isRecord(summary)) return computeSummary(rows);

  return {
    infoEvents: getNumber(summary.infoEvents ?? summary.info ?? summary.infoCount, 0),
    warnings: getNumber(summary.warnings ?? summary.warning ?? summary.warningCount, 0),
    errors: getNumber(summary.errors ?? summary.error ?? summary.errorCount, 0),
    today: getNumber(summary.today ?? summary.todayCount ?? summary.eventsToday, 0),
  };
}

function resolveCollection(payload: AuditLogApiPayload): {
  rows: AuditLogRow[];
  collection?: AuditLogApiPage;
  summary?: unknown;
  payloadRecord?: Record<string, unknown>;
} {
  if (Array.isArray(payload)) {
    return { rows: payload.map(mapAuditLogItem) };
  }

  if (isPaginatedResponse(payload)) {
    return {
      rows: payload.content.map(mapAuditLogItem),
      collection: payload,
      payloadRecord: payload as unknown as Record<string, unknown>,
    };
  }

  if (!isRecord(payload)) {
    return { rows: [] };
  }

  const collectionCandidate = payload.logs ?? payload.auditLogs ?? payload.items ?? payload.content;

  if (Array.isArray(collectionCandidate)) {
    return {
      rows: collectionCandidate.map((item, index) => mapAuditLogItem(item as AuditLogApiItem, index)),
      summary: payload.summary,
      payloadRecord: payload,
    };
  }

  if (isPaginatedResponse(collectionCandidate)) {
    return {
      rows: collectionCandidate.content.map(mapAuditLogItem),
      collection: collectionCandidate,
      summary: payload.summary,
      payloadRecord: payload,
    };
  }

  return { rows: [], summary: payload.summary, payloadRecord: payload };
}

function buildPageMeta(
  params: SuperAdminAuditLogQuery,
  rows: AuditLogRow[],
  collection?: AuditLogApiPage,
  payload?: Record<string, unknown>,
): AuditLogPageMeta {
  const totalElements = getNumber(
    collection?.totalElements ?? payload?.totalElements,
    rows.length,
  );
  const totalPages = getNumber(
    collection?.totalPages ?? payload?.totalPages,
    Math.max(1, Math.ceil(totalElements / params.size)),
  );
  const pageNumber = getNumber(collection?.pageNumber ?? payload?.pageNumber, params.page);
  const pageSize = getNumber(collection?.pageSize ?? payload?.pageSize, params.size);

  return {
    pageNumber,
    pageSize,
    totalElements,
    totalPages: Math.max(1, totalPages),
    first: getBoolean(collection?.first ?? payload?.first, pageNumber <= 0),
    last: getBoolean(collection?.last ?? payload?.last, pageNumber + 1 >= Math.max(1, totalPages)),
  };
}

function normalizeAuditLogPayload(
  payload: AuditLogApiPayload,
  params: SuperAdminAuditLogQuery,
): SuperAdminAuditLogDto {
  const resolved = resolveCollection(payload);

  return {
    rows: resolved.rows,
    summary: normalizeSummary(resolved.summary, resolved.rows),
    page: buildPageMeta(params, resolved.rows, resolved.collection, resolved.payloadRecord),
  };
}

export async function fetchSuperAdminAuditLog(
  params: SuperAdminAuditLogQuery,
): Promise<SuperAdminAuditLogDto> {
  const search = params.search?.trim();
  const response = await apiClient.get<ApiResponse<AuditLogApiPayload> | AuditLogApiPayload>(
    SUPER_ADMIN_AUDIT_LOG_ENDPOINT,
    {
      params: {
        page: params.page,
        size: params.size,
        ...(search ? { search } : {}),
      },
    },
  );

  return normalizeAuditLogPayload(unwrapAuditLogResponse(response.data), params);
}

export function useSuperAdminAuditLog(
  params: SuperAdminAuditLogQuery,
  options?: { enabled?: boolean },
) {
  return useQuery<SuperAdminAuditLogDto>({
    queryKey: superAdminAuditLogKeys.list(params),
    queryFn: () => fetchSuperAdminAuditLog(params),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}
