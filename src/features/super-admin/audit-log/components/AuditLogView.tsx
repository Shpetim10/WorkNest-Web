"use client";

import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Eye,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { PageHeaderDecorativeCircles, TablePagination } from '@/common/ui';
import type { AuditLogRow, AuditLogSeverity, AuditLogSummaryDto } from '../types';
import { useSuperAdminAuditLog } from '../api/use-super-admin-audit-log';
import { AuditLogDetailsModal } from './AuditLogDetailsModal';
import { useI18n } from '@/common/i18n';

const TABLE_HEADER_KEYS = [
  'superAdmin.auditLog.headers.event',
  'superAdmin.auditLog.headers.company',
  'superAdmin.auditLog.headers.description',
  'superAdmin.auditLog.headers.actor',
  'superAdmin.auditLog.headers.timestamp',
  'superAdmin.auditLog.headers.severity',
  'superAdmin.auditLog.headers.view',
];

interface AuditSummaryCard {
  id: string;
  label: string;
  valueKey: keyof AuditLogSummaryDto;
  icon: LucideIcon;
  iconClassName: string;
  iconBackground: string;
}

const SUMMARY_CARDS: AuditSummaryCard[] = [
  {
    id: 'info-events',
    label: 'superAdmin.auditLog.infoEvents',
    valueKey: 'infoEvents',
    icon: CheckCircle2,
    iconClassName: 'text-[#00A65A]',
    iconBackground: '#DCFCE7',
  },
  {
    id: 'warnings',
    label: 'superAdmin.auditLog.warnings',
    valueKey: 'warnings',
    icon: AlertTriangle,
    iconClassName: 'text-[#D97706]',
    iconBackground: '#FEF3C7',
  },
  {
    id: 'errors',
    label: 'superAdmin.auditLog.errors',
    valueKey: 'errors',
    icon: XCircle,
    iconClassName: 'text-[#DC2626]',
    iconBackground: '#FEE2E2',
  },
  {
    id: 'today',
    label: 'superAdmin.auditLog.today',
    valueKey: 'today',
    icon: CalendarDays,
    iconClassName: 'text-[#155DFC]',
    iconBackground: '#DBEAFE',
  },
];

function severityBadge(severity: AuditLogSeverity) {
  const styles: Record<AuditLogSeverity, string> = {
    info: 'bg-[#DBEAFE] text-[#155DFC]',
    warning: 'bg-[#FEF3C7] text-[#B45309]',
    error: 'bg-[#FEE2E2] text-[#DC2626]',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[severity]}`}>
      {severity}
    </span>
  );
}

function EventIcon({ severity }: { severity: AuditLogSeverity }) {
  const config: Record<AuditLogSeverity, { icon: LucideIcon; className: string; background: string }> = {
    info: {
      icon: CheckCircle2,
      className: 'text-[#00A65A]',
      background: '#DCFCE7',
    },
    warning: {
      icon: AlertTriangle,
      className: 'text-[#D97706]',
      background: '#FEF3C7',
    },
    error: {
      icon: XCircle,
      className: 'text-[#DC2626]',
      background: '#FEE2E2',
    },
  };
  const Icon = config[severity].icon;

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config[severity].className}`}
      style={{ backgroundColor: config[severity].background }}
    >
      <Icon size={15} strokeWidth={2.2} />
    </span>
  );
}

function formatMetric(value?: number | null): string {
  return typeof value === 'number' ? value.toLocaleString() : '0';
}

function SummaryCard({ card, value }: { card: AuditSummaryCard; value: string }) {
  const { t } = useI18n();
  return (
    <div
      className="flex min-h-[76px] items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3"
      style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconClassName}`}
        style={{ backgroundColor: card.iconBackground }}
      >
        <card.icon size={17} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-bold leading-none text-[#1a1c23]">{value}</p>
        <p className="mt-1 text-[11px] font-medium text-gray-500">{t(card.label)}</p>
      </div>
    </div>
  );
}

interface AuditLogViewProps {
  enableAuditLogQuery?: boolean;
}

export function AuditLogView({ enableAuditLogQuery = false }: AuditLogViewProps = {}) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [detailsAuditLog, setDetailsAuditLog] = useState<AuditLogRow | null>(null);
  const auditLogQuery = useSuperAdminAuditLog({
    page: currentPage - 1,
    size: pageSize,
    search: searchQuery,
  }, {
    enabled: enableAuditLogQuery,
  });
  const auditLogData = auditLogQuery.data;
  const visibleRows = auditLogData?.rows ?? [];
  const totalPages = Math.max(1, auditLogData?.page.totalPages ?? 1);
  const isInitialLoading = auditLogQuery.isLoading && !auditLogData;
  const isInitialError = auditLogQuery.isError && !auditLogData;
  const tableHeaders = TABLE_HEADER_KEYS.map((key) => t(key));

  const resetPage = () => setCurrentPage(1);
  const getSummaryValue = (key: keyof AuditLogSummaryDto) => {
    if (isInitialLoading) return '...';

    return formatMetric(auditLogData?.summary[key] ?? 0);
  };

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      <div
        className="group relative flex min-h-[120px] items-center justify-between overflow-hidden rounded-2xl px-8 py-8"
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <PageHeaderDecorativeCircles />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t('superAdmin.auditLog.title')}</h1>
            <p className="mt-0.5 text-sm text-white/80">{t('superAdmin.auditLog.monitorSubtitle')}</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/5" />
      </div>

      <div className="grid grid-cols-4 gap-5">
        {SUMMARY_CARDS.map((card) => (
          <SummaryCard key={card.id} card={card} value={getSummaryValue(card.valueKey)} />
        ))}
      </div>

      <div
        className="bg-white rounded-xl border border-gray-100 px-4 py-1.5 flex flex-wrap gap-3 items-center min-h-[48px]"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="relative w-full max-w-[340px] md:max-w-[420px] lg:max-w-[500px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('superAdmin.auditLog.searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              resetPage();
            }}
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

      </div>

      <div
        className="mt-2 overflow-hidden rounded-2xl border border-[#2B7FFF] bg-white"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs font-semibold uppercase tracking-wide text-white"
                style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
              >
                {tableHeaders.map((header) => (
                  <th key={header} className="px-4 py-3.5 text-left font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white text-left">
              {isInitialLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[14px] font-medium text-gray-400">
                    {t('superAdmin.auditLog.loading')}
                  </td>
                </tr>
              ) : isInitialError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[14px] font-medium text-gray-400">
                    {t('superAdmin.auditLog.unable')}
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[14px] font-medium text-gray-400">
                    {t('superAdmin.auditLog.empty')}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b border-[#E5E7EB] transition-colors hover:bg-blue-50/30 ${
                      index % 2 === 1 ? 'bg-gray-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <EventIcon severity={row.severity} />
                        <span className="whitespace-nowrap text-[14px] font-semibold text-gray-800">
                          {row.event}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">
                      {row.company}
                    </td>
                    <td className="max-w-[260px] px-4 py-3.5 text-[14px] font-normal leading-snug text-gray-600 font-[Inter,sans-serif]">
                      {row.description}
                    </td>
                    <td className="px-4 py-3.5 text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">
                      {row.actor}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[14px] font-normal tabular-nums text-gray-600 font-[Inter,sans-serif]">
                      {row.timestamp}
                    </td>
                    <td className="px-4 py-3.5">{severityBadge(row.severity)}</td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        title={t('superAdmin.auditLog.viewDetails')}
                        onClick={() => setDetailsAuditLog(row)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                      >
                        <Eye size={18} strokeWidth={2.1} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        totalItems={auditLogData?.page.totalElements}
      />

      <AuditLogDetailsModal
        isOpen={!!detailsAuditLog}
        auditLog={detailsAuditLog}
        onClose={() => setDetailsAuditLog(null)}
      />
    </div>
  );
}
