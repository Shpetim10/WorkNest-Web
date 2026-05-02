"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, User, Mail, Briefcase, Building2, Users2,
  CheckCircle2, MapPin, CreditCard, FileText, Sun, Calendar
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/common/network/api-client';
import { PaymentMethod } from '../types';
import { useStaffDetails } from '../api/get-staff-details';
import { formatCurrencyAmount, getStoredCompanyCurrency, getStoredCompanyLocale } from '@/features/company-settings/storage';

interface StaffViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string | null;
}

type ActiveTab = 'profile' | 'employment';

const DETAIL_ROW = "flex flex-col gap-1.5 p-4 rounded-xl border border-gray-50 bg-gray-50/30 transition-colors hover:bg-gray-50/50";
const LABEL_CLS = "flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400";
const VALUE_CLS = "text-[15px] font-semibold text-[#1E2939]";

const PERMISSION_GROUPS = ['USER MANAGEMENT', 'ATTENDANCE', 'EMPLOYEE', 'ANNOUNCEMENTS', 'LEAVE', 'REPORTS', 'PAYROLL'];
const GROUP_PREFIX_MAP: Record<string, string> = {
  'USER MANAGEMENT': 'users', 'ATTENDANCE': 'attendance', 'EMPLOYEE': 'employees',
  'ANNOUNCEMENTS': 'announcements', 'LEAVE': 'leave', 'REPORTS': 'reports', 'PAYROLL': 'payroll',
};

function formatDate(dateString: string | undefined | null) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateString; }
}

function formatEmploymentType(type: string | null | undefined) {
  const map: Record<string, string> = {
    FULL_TIME: 'Full-Time', PART_TIME: 'Part-Time', CONTRACT: 'Fixed-Term Contract', INTERN: 'Internship',
  };
  return type ? (map[type] || type) : '—';
}

function formatPaymentMethod(method: string | null | undefined) {
  const map: Record<string, string> = { FIXED_MONTHLY: 'Fixed Monthly Salary', HOURLY: 'Hourly Rate' };
  return method ? (map[method] || method) : '—';
}

function resolveContractUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  if (!origin) return path;

  if (path.startsWith('/')) return `${origin}${path}`;
  return `${origin}/${path}`;
}

export function StaffViewModal({ isOpen, onClose, staffId }: StaffViewModalProps) {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') || '' : '';
  const currencyCode = getStoredCompanyCurrency();
  const currencyLocale = getStoredCompanyLocale();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [contractPreviewUrl, setContractPreviewUrl] = useState<string | null>(null);
  const [isContractPreviewLoading, setIsContractPreviewLoading] = useState(false);
  const [contractPreviewError, setContractPreviewError] = useState<string | null>(null);
  const { data: staff, isLoading, isError } = useStaffDetails(companyId, staffId);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('profile');
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const initials = staff
    ? (staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || '??')
        .split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()
    : '??';
  const fullName = staff ? (staff.name || `${staff.firstName} ${staff.lastName}`) : 'Loading...';
  const contractUrl = resolveContractUrl(staff?.contractDocumentPath);
  const hasPdfContract = Boolean(contractUrl && contractUrl.toLowerCase().endsWith('.pdf'));

  useEffect(() => {
    let isMounted = true;
    let objectUrlToRevoke: string | null = null;

    const loadPdfPreview = async () => {
      if (!isOpen || !hasPdfContract || !contractUrl) {
        setContractPreviewUrl(null);
        setContractPreviewError(null);
        setIsContractPreviewLoading(false);
        return;
      }

      setIsContractPreviewLoading(true);
      setContractPreviewError(null);
      setContractPreviewUrl(null);

      try {
        const response = await apiClient.get<Blob>(contractUrl, { responseType: 'blob' });
        if (!isMounted) return;
        objectUrlToRevoke = URL.createObjectURL(response.data);
        setContractPreviewUrl(objectUrlToRevoke);
      } catch {
        if (!isMounted) return;
        setContractPreviewError('Unable to load contract preview.');
      } finally {
        if (isMounted) setIsContractPreviewLoading(false);
      }
    };

    void loadPdfPreview();

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    };
  }, [isOpen, contractUrl, hasPdfContract]);

  if (!isOpen) return null;

  const tabClass = (tab: ActiveTab) =>
    `px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
      activeTab === tab
        ? 'bg-[#155DFC] text-white shadow-md shadow-[#155DFC]/20'
        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
    }`;

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
                {staff && (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      staff.status === 'ACTIVE' ? 'bg-[#E6FFFA] text-[#00C950]'
                      : staff.status === 'PENDING' ? 'bg-[#FFFBEB] text-[#B45309]'
                      : 'bg-[#FFF7ED] text-[#CA3500]'
                    }`}>
                      {staff.status === 'ACTIVE' ? 'Active' : staff.status === 'PENDING' ? 'Pending' : staff.status || 'Active'}
                    </span>
                    <span className="text-[13px] font-medium text-gray-400">• {staff.email}</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Tab Toggle */}
          {!isLoading && !isError && staff && (
            <div className="flex items-center gap-2 px-8 pt-5 pb-0 shrink-0">
              <button onClick={() => setActiveTab('profile')} className={tabClass('profile')}>
                Profile & Permissions
              </button>
              <button onClick={() => setActiveTab('employment')} className={tabClass('employment')}>
                Employment & Contract
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
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
            ) : activeTab === 'profile' ? (
              <>
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={DETAIL_ROW}>
                    <span className={LABEL_CLS}><User size={14} /> Full Name</span>
                    <span className={VALUE_CLS}>{fullName}</span>
                  </div>
                  <div className={DETAIL_ROW}>
                    <span className={LABEL_CLS}><Mail size={14} /> Email Address</span>
                    <span className={VALUE_CLS}>{staff.email}</span>
                  </div>
                  <div className={DETAIL_ROW}>
                    <span className={LABEL_CLS}><Briefcase size={14} /> Job Title</span>
                    <span className={VALUE_CLS}>{staff.jobTitle}</span>
                  </div>
                  <div className={DETAIL_ROW}>
                    <span className={LABEL_CLS}><Building2 size={14} /> Department</span>
                    <span className={VALUE_CLS}>{staff.departmentName ?? '—'}</span>
                  </div>
                  <div className={DETAIL_ROW}>
                    <span className={LABEL_CLS}><MapPin size={14} /> Location</span>
                    <span className={VALUE_CLS}>{staff.companySiteName ?? '—'}</span>
                  </div>
                  <div className={DETAIL_ROW}>
                    <span className={LABEL_CLS}><Calendar size={14} /> Hire Date</span>
                    <span className={VALUE_CLS}>{formatDate(staff.startDate)}</span>
                  </div>
                  <div className={DETAIL_ROW}>
                    <span className={LABEL_CLS}><Users2 size={14} /> Assigned Employees</span>
                    <span className={VALUE_CLS}>{staff.assignedEmployeesCount || 0} Employees</span>
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
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${
                            isEnabled ? 'border-[#E8F1FF] bg-[#E8F1FF]/30 text-[#155DFC]' : 'border-gray-100 bg-gray-50/50 text-gray-400 opacity-60'
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
            ) : (
              /* Employment & Contract Tab */
              <div className="grid grid-cols-2 gap-4">
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><Briefcase size={14} /> Employment Type</span>
                  <span className={VALUE_CLS}>{formatEmploymentType(staff.employmentType)}</span>
                </div>
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><Sun size={14} /> Paid Leave Days / Year</span>
                  <span className={VALUE_CLS}>
                    {staff.leaveDaysPerYear != null ? `${staff.leaveDaysPerYear} days` : '—'}
                  </span>
                </div>
                <div className={`${DETAIL_ROW} col-span-2`}>
                  <span className={LABEL_CLS}><Calendar size={14} /> Contract Expiry</span>
                  <span className={VALUE_CLS}>{formatDate(staff.contractExpiryDate)}</span>
                </div>
                {staff.contractDocumentKey && (
                  <div className={`${DETAIL_ROW} col-span-2`}>
                    <span className={LABEL_CLS}><FileText size={14} /> PDF Contract Preview</span>
                    {hasPdfContract && isContractPreviewLoading ? (
                      <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading contract preview...
                      </div>
                    ) : hasPdfContract && contractPreviewUrl ? (
                      <button
                        type="button"
                        onClick={() => window.open(contractPreviewUrl, '_blank', 'noopener,noreferrer')}
                        className="w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white text-left transition-all hover:border-[#155DFC]/40"
                        title="Open full PDF in a new page"
                      >
                        <iframe
                          src={contractPreviewUrl}
                          title="Staff Contract PDF"
                          className="h-[360px] w-full pointer-events-none"
                        />
                        <div className="px-3 py-2 text-[12px] font-semibold text-[#155DFC] bg-[#F8FAFF] border-t border-[#E5E7EB]">
                          Open full PDF in new page
                        </div>
                      </button>
                    ) : contractPreviewError ? (
                      <p className="text-[13px] font-medium text-red-500">{contractPreviewError}</p>
                    ) : (
                      <p className="text-[13px] font-medium text-gray-500">
                        Contract is on file, but no direct PDF URL is available to preview in-app yet.
                      </p>
                    )}
                  </div>
                )}
                <div className={`${DETAIL_ROW} col-span-2`}>
                  <span className={LABEL_CLS}><CreditCard size={14} /> Payment Method</span>
                  <div className="flex items-center justify-between">
                    <span className={VALUE_CLS}>{formatPaymentMethod(staff.paymentMethod)}</span>
                    {staff.paymentMethod === PaymentMethod.FIXED_MONTHLY && staff.monthlySalary != null && (
                      <span className="text-[18px] font-bold text-[#155DFC]">
                        {formatCurrencyAmount(staff.monthlySalary, currencyCode, currencyLocale)}
                        <span className="text-[12px] font-semibold text-gray-400 ml-1">/month</span>
                      </span>
                    )}
                    {staff.paymentMethod === PaymentMethod.HOURLY && staff.hourlyRate != null && (
                      <span className="text-[18px] font-bold text-[#155DFC]">
                        {formatCurrencyAmount(staff.hourlyRate, currencyCode, currencyLocale)}
                        <span className="text-[12px] font-semibold text-gray-400 ml-1">/hour</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-8 py-5 border-t border-gray-50 shrink-0">
            <button
              onClick={onClose}
              className="h-11 rounded-xl bg-gray-900 px-8 text-[14px] font-bold text-white shadow-md transition-all hover:bg-black hover:scale-[1.02]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
