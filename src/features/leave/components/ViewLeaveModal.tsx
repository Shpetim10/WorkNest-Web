"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LeaveRequestDto } from '@/features/leave/types';

interface ViewLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRequest: LeaveRequestDto | null;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[parseInt(month) - 1]} ${year}`;
}

function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDate(startDate);
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function capitalize(str: string): string {
  return str.charAt(0) + str.slice(1).toLowerCase();
}

export function ViewLeaveModal({ isOpen, onClose, leaveRequest }: ViewLeaveModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !leaveRequest) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="relative bg-white flex flex-col"
        style={{
          width: '589px',
          borderRadius: '10px',
          border: '1.26px solid rgba(0, 0, 0, 0.10)',
          boxShadow:
            '0px 4px 6px -4px rgba(0, 0, 0, 0.10), 0px 10px 15px -3px rgba(0, 0, 0, 0.10)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 shrink-0 flex items-start justify-between relative"
          style={{
            background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)',
            borderTopLeftRadius: '9px',
            borderTopRightRadius: '9px',
          }}
        >
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">View Details</h2>
            <p className="text-white/90 text-sm font-medium">View the Employee details</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-500 font-medium">Name</span>
            <span className="text-[15px] text-slate-800 font-medium">{leaveRequest.employeeName}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-500 font-medium">Site</span>
            <span className="text-[15px] text-slate-800 font-medium">{leaveRequest.siteName ?? '—'}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-500 font-medium">Department</span>
            <span className="text-[15px] text-slate-800 font-medium">{leaveRequest.departmentName ?? '—'}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-500 font-medium">Type</span>
            <span className="text-[15px] text-slate-800 font-medium">{capitalize(leaveRequest.leaveType)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500 font-medium">Date Range</span>
              <span className="text-[15px] text-slate-800 font-medium">
                {formatDateRange(leaveRequest.startDate, leaveRequest.endDate)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-slate-500 font-medium">Days</span>
              <span className="text-[15px] text-slate-800 font-medium">{leaveRequest.totalDays}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-slate-500 font-medium">Notes</span>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-[15px] text-slate-700 font-medium min-h-[100px]">
              {leaveRequest.note || 'No notes provided.'}
            </div>
          </div>

          {leaveRequest.status === 'REJECTED' && leaveRequest.rejectionReason && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-red-500 font-medium">Rejection Reason</span>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-[15px] text-red-700 font-medium min-h-[60px]">
                {leaveRequest.rejectionReason}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 shrink-0 flex justify-start border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}