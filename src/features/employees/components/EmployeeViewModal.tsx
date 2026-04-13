"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Phone, Building2, Calendar, ShieldCheck, UserCog } from 'lucide-react';
import { EmployeeStatus, EmployeeDTO } from '../types';

interface EmployeeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeDTO | null;
}

const DETAIL_ROW_CLASS = "flex flex-col gap-1.5 p-4 rounded-xl border border-gray-100 bg-gray-50/30 transition-colors hover:bg-[#F8FAFF] hover:border-[#155DFC]/20";
const LABEL_CLASS = "flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400";
const VALUE_CLASS = "text-[15px] font-semibold text-[#1E2939]";

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function EmployeeViewModal({ isOpen, onClose, employee }: EmployeeViewModalProps) {
  
  // Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const initials = getInitials(employee.firstName, employee.lastName);
  const fullName = `${employee.firstName} ${employee.lastName}`;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[200] bg-[#1E293B]/40 backdrop-blur-[4px] animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className="relative flex flex-col w-full max-w-[650px] max-h-[90vh] rounded-[24px] border border-gray-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-300"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-7 border-b border-gray-50 shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-[20px] bg-gradient-to-br from-[#155DFC] to-[#01c951] flex items-center justify-center text-white text-[22px] font-bold shadow-lg shadow-[#155DFC]/20">
                {initials}
              </div>
              <div className="space-y-1">
                <h2 className="text-[24px] font-bold text-[#1E2939] tracking-tight">{fullName}</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    employee.status === EmployeeStatus.ACTIVE ? 'bg-[#F0FDF4] text-[#008236]' : 'bg-[#FFF7ED] text-[#CA3500]'
                  }`}>
                    <div className="mr-1 h-1 w-1 rounded-full bg-current" />
                    {employee.status === EmployeeStatus.ACTIVE ? 'Active' : 'On Leave'}
                  </span>
                  <span className="text-[13px] font-medium text-gray-400 font-[Inter,sans-serif]">Employee ID: {employee.employeeId}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Details Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              
              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><User size={14} strokeWidth={2.5} /> Full Name</span>
                <span className={VALUE_CLASS}>{fullName}</span>
              </div>

              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><Mail size={14} strokeWidth={2.5} /> Email Address</span>
                <span className={VALUE_CLASS}>{employee.email}</span>
              </div>

              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><Building2 size={14} strokeWidth={2.5} /> Department</span>
                <span className={VALUE_CLASS}>{employee.departmentName}</span>
              </div>

              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><UserCog size={14} strokeWidth={2.5} /> Job Title</span>
                <span className={VALUE_CLASS}>{employee.jobTitle}</span>
              </div>

              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><Calendar size={14} strokeWidth={2.5} /> Hire Date</span>
                <span className={VALUE_CLASS}>{formatDate(employee.hireDate)}</span>
              </div>

              <div className={DETAIL_ROW_CLASS}>
                <span className={LABEL_CLASS}><ShieldCheck size={14} strokeWidth={2.5} /> Permissions</span>
                <span className={VALUE_CLASS}>Standard Employee</span>
              </div>

              <div className={`${DETAIL_ROW_CLASS} col-span-2 mt-2 bg-[#F8FAFF]/50 border-[#155DFC]/10`}>
                <span className={LABEL_CLASS}><ShieldCheck size={14} strokeWidth={2.5} className="text-[#155DFC]" /> Profile Summary</span>
                <p className="text-[14px] font-medium text-gray-500 mt-2 leading-relaxed">
                  This employee is currently <span className="text-[#155DFC] font-bold">{employee.status.toLowerCase().replace('_', ' ')}</span>. 
                  They work as a <span className="font-bold text-[#1E2939]">{employee.jobTitle}</span> within the <span className="font-bold text-[#1E2939]">{employee.departmentName}</span> department, having joined on <span className="font-bold text-[#1E2939]">{formatDate(employee.hireDate)}</span>.
                </p>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-8 py-6 border-t border-gray-50 shrink-0">
            <button
              onClick={onClose}
              className="h-11 rounded-xl bg-[#1E2939] px-8 text-[14px] font-bold text-white shadow-lg shadow-gray-200 transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.98] font-[Inter,sans-serif]"
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
