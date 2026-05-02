"use client";

import React, { useState } from 'react';
import { Search, Clock, UserPlus, Eye, Check, X } from 'lucide-react';
import { TablePagination } from '@/common/ui';
import { LeaveRequestDTO, LeaveStatus } from '@/features/leave/types';
import { ViewLeaveModal } from '@/features/leave/components/ViewLeaveModal';
import { RejectLeaveModal } from './RejectLeaveModal';

const ITEMS_PER_PAGE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-[#4F46E5]',
  'bg-[#0EA5E9]',
  'bg-[#10B981]',
  'bg-[#F59E0B]',
  'bg-[#EF4444]',
  'bg-[#8B5CF6]',
  'bg-[#EC4899]',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function statusBadgeStyles(status: LeaveStatus) {
  switch (status) {
    case 'Pending':
      return { color: '#FF6900', backgroundColor: '#FF690033' };
    case 'Approved':
      return { color: '#00C950', backgroundColor: '#00C95033' };
    case 'Rejected':
      return { color: '#EF4444', backgroundColor: '#EF444433' }; // Using a standard red for Rejected if needed
    default:
      return { color: '#6B7280', backgroundColor: '#F3F4F6' };
  }
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function LeaveDashboardView() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'All'>('All');
  const [page, setPage] = useState(1);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequestDTO | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Client-side filtering
  const leaveRequests: LeaveRequestDTO[] = [];
  const filtered = leaveRequests.filter((req) => {
    const matchesSearch = req.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const applyFilters = () => {
    // In a real app, this might trigger a refetch. Here, filtering is reactive.
    setPage(1);
  };

  const handleAction = (action: string, id: string) => {
    const leave = leaveRequests.find((req) => req.id === id);
    if (!leave) return;

    if (action === 'row_click' || action === 'view') {
      setSelectedLeave(leave);
      setIsViewModalOpen(true);
    } else if (action === 'reject') {
      setSelectedLeave(leave);
      setRejectReason(''); // Reset reason when opening
      setIsRejectModalOpen(true);
    } else {
      console.log(`Action ${action} triggered for request ${id}`);
    }
  };

  const handleRejectConfirm = (id: string, reason: string) => {
    console.log(`Rejecting leave ${id} with reason: ${reason}`);
    // Update logic would go here
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
            <p className="text-white/80 text-sm mt-0.5">
              Review and manage leave request
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
          <UserPlus size={28} className="text-white" />
        </div>
      </div>

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
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search employee locally..."
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {(['Rejected', 'Approved', 'Pending'] as LeaveStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus((prev: LeaveStatus | 'All') => (prev === status ? 'All' : status));
                setPage(1);
              }}
              className={`h-8 px-5 border rounded-xl text-[13px] font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={applyFilters}
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
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                  No leave requests found.
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#E5E7EB] hover:bg-blue-50/30 transition-colors cursor-pointer ${
                    idx % 2 === 1 ? 'bg-gray-50/40' : ''
                  }`}
                  onClick={() => handleAction('row_click', row.id)}
                >
                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00C950 100%)' }}
                      >
                        {getInitials(row.name)}
                      </div>
                      <span className="font-medium text-gray-800 whitespace-nowrap">
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Site */}
                  <td className="px-4 py-3.5 text-gray-600">{row.site}</td>

                  {/* Department */}
                  <td className="px-4 py-3.5">
                    <span 
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ color: '#1447E6', backgroundColor: '#EFF6FF' }}
                    >
                      {row.department}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3.5 text-gray-600">{row.type}</td>

                  {/* Date Range */}
                  <td className="px-4 py-3.5 text-gray-600">{row.dateRange}</td>

                  {/* Days */}
                  <td className="px-4 py-3.5 text-gray-600">{row.days}</td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={statusBadgeStyles(row.status)}
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('view', row.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('approve', row.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 hover:text-green-600 transition-colors"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('reject', row.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-50">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

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
      />
    </div>
  );
}
