"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Briefcase, Building2, Users2, ShieldCheck, CheckCircle2, MapPin } from 'lucide-react';

import { useStaffDetails } from '../api/get-staff-details';
import { Loader2 } from 'lucide-react';

interface StaffViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
}

const DETAIL_ROW_CLASS = "flex flex-col gap-1.5 p-4 rounded-xl border border-gray-50 bg-gray-50/30 transition-colors hover:bg-gray-50/50";
const LABEL_CLASS = "flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400";
const VALUE_CLASS = "text-[15px] font-semibold text-[#1E2939]";

const PERMISSION_GROUPS = [
  'USER MANAGEMENT', 'ATTENDANCE', 'EMPLOYEE', 'ANNOUNCEMENTS', 'LEAVE', 'REPORTS', 'PAYROLL'
];

const GROUP_PREFIX_MAP: Record<string, string> = {
  'USER MANAGEMENT': 'users',
  'ATTENDANCE':      'attendance',
  'EMPLOYEE':        'employees',
  'ANNOUNCEMENTS':   'announcements',
  'LEAVE':           'leave',
  'REPORTS':         'reports',
  'PAYROLL':         'payroll',
};

export function StaffViewModal({ isOpen, onClose, staffId }: StaffViewModalProps) {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') || '' : '';
  const { data: staff, isLoading, isError } = useStaffDetails(companyId, staffId);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials = staff ? (staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || '??').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() : '??';
  const fullName = staff ? (staff.name || `${staff.firstName} ${staff.lastName}`) : 'Loading...';

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
                {initials}
              </div>
              <div className="space-y-0.5">
                <h2 className="text-[22px] font-bold text-[#0A0A0A]">{fullName}</h2>
                <div className="flex items-center gap-2">
                  {staff && (
                    <>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        staff.status === 'ACTIVE' 
                        ? 'bg-[#E6FFFA] text-[#00C950]' 
                        : staff.status === 'PENDING'
                        ? 'bg-[#FFFBEB] text-[#B45309]'
                        : 'bg-[#FFF7ED] text-[#CA3500]'
                      }`}>
                        {staff.status === 'ACTIVE' ? 'Active' : 
                         staff.status === 'PENDING' ? 'Pending' : staff.status || 'Active'}
                      </span>
                      <span className="text-[13px] font-medium text-gray-400">• {staff.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#155DFC]" />
                <p className="text-gray-400 font-medium font-[Inter,sans-serif]">Fetching staff details...</p>
              </div>
            ) : isError || !staff ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <X size={24} />
                </div>
                <p className="text-gray-500 font-medium font-[Inter,sans-serif]">Failed to load staff details</p>
              </div>
            ) : (
              <>
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={DETAIL_ROW_CLASS}>
                    <span className={LABEL_CLASS}><User size={14} /> Full Name</span>
                    <span className={VALUE_CLASS}>{fullName}</span>
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
                    <span className={LABEL_CLASS}><MapPin size={14} /> Location</span>
                    <span className={VALUE_CLASS}>{staff.companySiteName ?? '-'}</span>
                  </div>
                  <div className={DETAIL_ROW_CLASS}>
                    <span className={LABEL_CLASS}><Users2 size={14} /> Role</span>
                    <span className={VALUE_CLASS}>{staff.role}</span>
                  </div>
                  <div className={DETAIL_ROW_CLASS}>
                    <span className={LABEL_CLASS}><ShieldCheck size={14} /> Employment Status</span>
                    <span className={`text-[15px] font-bold text-[#155DFC] font-[Inter,sans-serif]`}>
                      {staff.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={DETAIL_ROW_CLASS}>
                    <span className={LABEL_CLASS}><Users2 size={14} /> Assigned Employees</span>
                    <span className={VALUE_CLASS}>{staff.assignedEmployeesCount || 0} Employees</span>
                  </div>
                </div>

                {/* Assigned Employees List */}
                {staff.assignedEmployees && staff.assignedEmployees.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[13px] font-bold text-[#4A5565] uppercase tracking-wider flex items-center gap-2 font-[Inter,sans-serif]">
                      <Users2 size={16} className="text-[#155DFC]" /> Assigned Employees
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {staff.assignedEmployees.map(emp => (
                        <div key={emp.employeeId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 bg-gray-50/30">
                          <div className="h-10 w-10 rounded-full bg-[#E8F1FF] flex items-center justify-center text-[#155DFC] font-bold">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-[#1E2939]">{emp.firstName} {emp.lastName}</span>
                            <span className="text-[12px] text-gray-400">{emp.jobTitle || 'Employee'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permissions Summary */}
                <div className="space-y-4">
                  <p className="text-[13px] font-bold text-[#4A5565] uppercase tracking-wider flex items-center gap-2 font-[Inter,sans-serif]">
                    <CheckCircle2 size={16} className="text-[#00C950]" /> Permissions Summary
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {PERMISSION_GROUPS.map(group => {
                      const prefix = GROUP_PREFIX_MAP[group];
                      const isEnabled = staff.role === 'ADMIN' || staff.role === 'SUPERADMIN' || 
                        (staff.permissionCodes && staff.permissionCodes.some(code => code.startsWith(prefix + '.')));

                      return (
                        <div
                          key={group}
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${isEnabled ? 'border-[#E8F1FF] bg-[#E8F1FF]/30 text-[#155DFC]' : 'border-gray-100 bg-gray-50/50 text-gray-400 opacity-60'
                            }`}
                        >
                          <div className={`h-2 w-2 rounded-full ${isEnabled ? 'bg-[#155DFC]' : 'bg-gray-200'}`} />
                          <span className="text-[11px] font-bold uppercase tracking-tight font-[Inter,sans-serif]">{group}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
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