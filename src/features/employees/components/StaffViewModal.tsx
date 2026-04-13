"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Briefcase, Building2, Users2, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface StaffViewData {
  initials: string;
  name: string;
  email: string;
  jobTitle: string;
  assignedCount: number;
  permissions: string;
  departmentName?: string;
}

interface StaffViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffViewData | null;
}

const DETAIL_ROW_CLASS = "flex flex-col gap-1.5 p-4 rounded-xl border border-gray-50 bg-gray-50/30 transition-colors hover:bg-gray-50/50";
const LABEL_CLASS = "flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400";
const VALUE_CLASS = "text-[15px] font-semibold text-[#1E2939]";

const PERMISSION_GROUPS = [
  'User Management', 'Attendance', 'Employee', 'Announcements', 'Leave', 'Reports', 'Payroll'
];

export function StaffViewModal({ isOpen, onClose, staff }: StaffViewModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !staff) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className="relative flex flex-col w-full max-w-[750px] max-h-[90vh] rounded-2xl border border-gray-100 bg-white shadow-[0_24px_48px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-300"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#155DFC] to-[#155DFC] flex items-center justify-center text-white text-[20px] font-bold shadow-lg">
                {staff.initials}
              </div>
              <div className="space-y-0.5">
                <h2 className="text-[22px] font-bold text-[#0A0A0A]">{staff.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#E6FFFA] px-2.5 py-0.5 text-[11px] font-bold text-[#00C950]">
                    Staff Member
                  </span>
                  <span className="text-[13px] font-medium text-gray-400">• {staff.email}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><User size={14} /> Full Name</span>
                <span className={VALUE_CLASS}>{staff.name}</span>
              </div>
              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><Mail size={14} /> Email Address</span>
                <span className={VALUE_CLASS}>{staff.email}</span>
              </div>
              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><Briefcase size={14} /> Job Title</span>
                <span className={VALUE_CLASS}>{staff.jobTitle}</span>
              </div>
              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><Building2 size={14} /> Department</span>
                <span className={VALUE_CLASS}>{staff.departmentName ?? '-'}</span>
              </div>
              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><Users2 size={14} /> Assigned Employees</span>
                <span className={VALUE_CLASS}>{staff.assignedCount} employees</span>
              </div>
              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><ShieldCheck size={14} /> Access Level</span>
                <span className={`text-[15px] font-bold ${staff.permissions === 'Full Access' ? 'text-[#00C950]' : 'text-[#155DFC]'}`}>
                  {staff.permissions}
                </span>
              </div>
            </div>

            {/* Permissions Summary */}
            <div className="space-y-4">
              <p className="text-[13px] font-bold text-[#4A5565] uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#00C950]" /> Permissions Summary
              </p>
              <div className="grid grid-cols-3 gap-3">
                {PERMISSION_GROUPS.map(group => {
                  const isEnabled = staff.permissions === 'Full Access' || ['Attendance', 'Employee'].includes(group);
                  return (
                    <div
                      key={group}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${isEnabled ? 'border-[#E8F1FF] bg-[#E8F1FF]/30 text-[#155DFC]' : 'border-gray-100 bg-gray-50/50 text-gray-400 opacity-60'
                        }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${isEnabled ? 'bg-[#155DFC]' : 'bg-gray-200'}`} />
                      <span className="text-[13px] font-bold uppercase tracking-tight">{group}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-8 py-5 border-t border-gray-50 shrink-0">
            <button
              onClick={onClose}
              className="h-11 rounded-xl bg-gray-900 px-8 text-[14px] font-bold text-white shadow-md transition-all hover:bg-black hover:scale-[1.02]"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}