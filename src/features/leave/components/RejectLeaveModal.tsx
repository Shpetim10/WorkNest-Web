"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';
import { LeaveRequestDto } from '@/features/leave/types';

interface RejectLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRequest: LeaveRequestDto | null;
  reason: string;
  onReasonChange: (val: string) => void;
  onConfirm: (leaveId: string, reason: string) => void;
  isLoading?: boolean;
}

export function RejectLeaveModal({
  isOpen,
  onClose,
  leaveRequest,
  reason,
  onReasonChange,
  onConfirm,
  isLoading = false,
}: RejectLeaveModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !leaveRequest) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="relative bg-white flex flex-col p-8"
        style={{
          width: '685px',
          borderRadius: '10px',
          border: '1.26px solid rgba(0, 0, 0, 0.10)',
          boxShadow:
            '0px 4px 6px -4px rgba(0, 0, 0, 0.10), 0px 10px 15px -3px rgba(0, 0, 0, 0.10)',
        }}
      >
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Trash Icon Circle */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#FFD6D6] flex items-center justify-center">
            <Trash2 size={40} className="text-[#EF4444]" />
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-gray-900 text-center mb-2"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '24px', lineHeight: '32px' }}
        >
          Reject Request
        </h2>

        {/* Description */}
        <p
          className="text-[#64748B] text-center max-w-md mx-auto mb-8"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '20px' }}
        >
          Are you sure you want to reject the request from{' '}
          <span className="font-bold text-gray-900">{leaveRequest.employeeName}</span>? This action
          cannot be undone.
        </p>

        {/* Reason Field */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-[#64748B] mb-2">Give a reason</label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            maxLength={500}
            className="w-full h-32 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40 resize-none"
            placeholder="Write reason here..."
          />
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-[#E2E8F0] w-full mb-8" />

        {/* Footer Buttons */}
        <div className="flex items-center justify-between gap-4 px-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 max-w-[140px] py-3.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#475569] text-base font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={() => onConfirm(leaveRequest.id, reason)}
            disabled={isLoading || !reason.trim()}
            className="flex-1 max-w-[240px] py-3.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-base font-bold rounded-xl transition-colors shadow-[0_4px_12px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}