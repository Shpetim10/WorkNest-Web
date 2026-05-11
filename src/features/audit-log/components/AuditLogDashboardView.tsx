"use client";

import React, { useState } from 'react';
import { Eye, Loader2, SquareCheck } from 'lucide-react';
import { PageHeaderDecorativeCircles, TablePagination } from '@/common/ui';
import { AuditLogEntry } from '../types';
import { AuditLogDetailsModal } from './AuditLogDetailsModal';
import { useAuditLogs } from '../api';


const TABLE_HEADERS = ['User', 'Role', 'Action', 'Details', 'Timestamp', 'View'];

function roleBadgeClass(role: string): string {
  return role.toLowerCase().includes('admin')
    ? 'bg-[#E8F1FF] text-[#155DFC]'
    : 'bg-[#EEF2FF] text-[#4F46E5]';
}

export function AuditLogDashboardView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);

  const { data, isLoading, isError } = useAuditLogs({
    page: currentPage,
    size: pageSize,
  });

  const rows = data?.content ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4 pb-10">
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between"
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))',
              border: '1px solid rgba(255, 255, 255, 0.46)',
              boxShadow: [
                'inset 0 1px 0 rgba(255,255,255,0.38)',
                'inset 0 -10px 18px rgba(21,93,252,0.10)',
                '0 8px 18px rgba(10,72,160,0.16)',
              ].join(', '),
              backdropFilter: 'blur(10px)',
            }}
          >
            <SquareCheck size={25} strokeWidth={1.55} className="text-white/95" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Audit Log</h1>
            <p className="text-white/80 text-sm mt-0.5">
              Track all system activities and changes
            </p>
          </div>
        </div>

        <PageHeaderDecorativeCircles />
      </div>

      <div
        className="bg-white rounded-2xl border border-[#2B7FFF] overflow-hidden mt-2"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-xs font-semibold text-white uppercase tracking-wide"
                style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
              >
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="px-4 py-3.5 text-left font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white text-left">
              {isLoading ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#155DFC] animate-spin" />
                      <p className="text-[14px] font-medium text-gray-500 font-[Inter,sans-serif]">
                        Loading audit logs...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center text-red-500 font-[Inter,sans-serif]">
                    <p className="text-[14px] font-medium">Failed to load audit logs</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40 font-[Inter,sans-serif]">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <SquareCheck size={22} strokeWidth={1.5} />
                      </div>
                      <p className="text-[14px] font-medium text-gray-500">No audit logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b border-[#E5E7EB] hover:bg-blue-50/30 transition-colors ${
                      index % 2 === 1 ? 'bg-gray-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-[15px] font-semibold text-gray-800 font-[Inter,sans-serif] whitespace-nowrap">
                        {row.user}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${roleBadgeClass(row.role)}`}>
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-700 font-[Inter,sans-serif] whitespace-nowrap">
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-500 font-[Inter,sans-serif] whitespace-nowrap">
                        {row.details}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-500 font-[Inter,sans-serif] whitespace-nowrap">
                        {row.timestamp}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedAuditLog(row)}
                        className="p-2 hover:bg-blue-50 text-gray-400 hover:text-[#155DFC] rounded-lg transition-all"
                        title="View audit log"
                      >
                        <Eye size={18} />
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
        totalItems={data?.totalElements}
      />

      <AuditLogDetailsModal
        auditLog={selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
      />
    </div>
  );
}
