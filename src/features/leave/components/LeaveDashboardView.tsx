"use client";

import React, { useEffect, useState } from 'react';
import { Search, Clock, UserPlus, Eye, Check, X } from 'lucide-react';
import { TablePagination } from '@/common/ui';
import { LeaveRequestDto, LeaveStatus } from '@/features/leave/types';
import { ViewLeaveModal } from '@/features/leave/components/ViewLeaveModal';
import { RejectLeaveModal } from './RejectLeaveModal';
import { useLeaveRequests, useApproveLeave, useRejectLeave } from '../api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function statusBadgeStyles(status: LeaveStatus) {
  switch (status) {
    case 'PENDING':
      return { color: '#FF6900', backgroundColor: '#FF690033' };
    case 'APPROVED':
      return { color: '#00C950', backgroundColor: '#00C95033' };
    case 'REJECTED':
      return { color: '#EF4444', backgroundColor: '#EF444433' };
    default:
      return { color: '#6B7280', backgroundColor: '#F3F4F6' };
  }
}

function statusLabel(status: LeaveStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function capitalize(str: string): string {
  return str.charAt(0) + str.slice(1).toLowerCase();
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(month) - 1]} ${year}`;
}

function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

const PAGE_SIZE = 10;
const STATUS_OPTIONS = (['REJECTED', 'APPROVED', 'PENDING'] as LeaveStatus[]);

// ─── Main View ───────────────────────────────────────────────────────────────

export function LeaveDashboardView() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'All'>('All');
  const [page, setPage] = useState(1);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequestDto | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveError, setApproveError] = useState<string | null>(null);

  // Debounce search input (300 ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = {
    search: debouncedSearch || undefined,
    status: filterStatus !== 'All' ? filterStatus : undefined,
    page,
    size: PAGE_SIZE,
  };

  const { data, isLoading } = useLeaveRequests(queryParams);
  const approve = useApproveLeave();
  const reject = useRejectLeave();

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleApprove = (id: string) => {
    setApproveError(null);
    approve.mutate(id, {
      onError: (error: unknown) => {
        const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
        if (code === 'INSUFFICIENT_LEAVE_BALANCE') {
          setApproveError('Cannot approve: employee has insufficient leave balance.');
        } else if (code === 'LEAVE_NOT_PENDING') {
          setApproveError('This request is no longer pending.');
        } else {
          setApproveError('Failed to approve request. Please try again.');
        }
      },
    });
  };

  const handleOpenView = (row: LeaveRequestDto) => {
    setSelectedLeave(row);
    setIsViewModalOpen(true);
  };

  const handleOpenReject = (row: LeaveRequestDto) => {
    setSelectedLeave(row);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectConfirm = (id: string, reason: string) => {
    reject.mutate(
      { id, reason },
      { onSuccess: () => setIsRejectModalOpen(false) },
    );
  };

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      {/* Hero banner */}
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between"
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Clock size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Leave Request</h1>
            <p className="text-white/80 text-sm mt-0.5">Review and manage leave requests</p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
          <UserPlus size={28} className="text-white" />
        </div>
      </div>

      {/* Approve error banner */}
      {approveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
          <span className="text-sm">{approveError}</span>
          <button onClick={() => setApproveError(null)} className="text-red-500 ml-4 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div
        className="bg-white rounded-xl border border-gray-100 px-4 py-1.5 flex flex-wrap gap-3 items-center min-h-[48px]"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        {/* Search */}
        <div className="relative w-full max-w-[340px] md:max-w-[420px] lg:max-w-[500px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name..."
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus((prev) => (prev === status ? 'All' : status));
                setPage(1);
              }}
              className={`h-8 px-5 border rounded-xl text-[13px] font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {statusLabel(status)}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPage(1)}
          className="h-8 px-6 bg-blue-600 text-white text-[13px] font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-2xl border border-[#2B7FFF] overflow-hidden mt-2"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-xs font-semibold text-white uppercase tracking-wide"
              style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
            >
              {['Name', 'Site', 'Department', 'Type', 'Date Range', 'Days', 'Status', 'Actions'].map(
                (h) => (
                  <th key={h} className="px-4 py-3.5 text-left font-semibold">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                  No leave requests found.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#E5E7EB] hover:bg-blue-50/30 transition-colors cursor-pointer ${
                    idx % 2 === 1 ? 'bg-gray-50/40' : ''
                  }`}
                  onClick={() => handleOpenView(row)}
                >
                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)' }}
                      >
                        {getInitials(row.employeeName)}
                      </div>
                      <span className="font-medium text-gray-800 whitespace-nowrap">
                        {row.employeeName}
                      </span>
                    </div>
                  </td>

                  {/* Site */}
                  <td className="px-4 py-3.5 text-gray-600">{row.siteName ?? '—'}</td>

                  {/* Department */}
                  <td className="px-4 py-3.5">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ color: '#1447E6', backgroundColor: '#EFF6FF' }}
                    >
                      {row.departmentName ?? '—'}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3.5 text-gray-600">{capitalize(row.leaveType)}</td>

                  {/* Date Range */}
                  <td className="px-4 py-3.5 text-gray-600">
                    {formatDateRange(row.startDate, row.endDate)}
                  </td>

                  {/* Days */}
                  <td className="px-4 py-3.5 text-gray-600">{row.totalDays}</td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={statusBadgeStyles(row.status)}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenView(row);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      {row.status === 'PENDING' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(row.id);
                            }}
                            disabled={approve.isPending}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReject(row);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>

      <TablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="-mt-2"
      />

      <ViewLeaveModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        leaveRequest={selectedLeave}
      />

      <RejectLeaveModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        leaveRequest={selectedLeave}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleRejectConfirm}
        isLoading={reject.isPending}
      />
    </div>
  );
}
