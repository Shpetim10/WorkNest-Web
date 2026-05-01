"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, User, Mail, Building2, Calendar, UserCog, MapPin,
  Briefcase, CreditCard, FileText, Sun, Clock
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/common/network/api-client';
import { EmployeeStatus, EmploymentType, PaymentMethod } from '../types';
import { useEmployee } from '../api/get-employee-details';

interface EmployeeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
}

type ActiveTab = 'profile' | 'employment';

const DETAIL_ROW = "flex flex-col gap-1.5 p-4 rounded-xl border border-gray-100 bg-gray-50/30 transition-colors hover:bg-[#F8FAFF] hover:border-[#155DFC]/20";
const LABEL_CLS = "flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400";
const VALUE_CLS = "text-[15px] font-semibold text-[#1E2939]";

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '??';
}

function formatDate(dateString: string | undefined | null) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateString;
  }
}

function formatEmploymentType(type: string | null | undefined) {
  const map: Record<string, string> = {
    FULL_TIME: 'Full-Time',
    PART_TIME: 'Part-Time',
    CONTRACT: 'Fixed-Term Contract',
    INTERN: 'Internship',
  };
  return type ? (map[type] || type) : '—';
}

function formatPaymentMethod(method: string | null | undefined) {
  const map: Record<string, string> = {
    FIXED_MONTHLY: 'Fixed Monthly Salary',
    HOURLY: 'Hourly Rate',
  };
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

export function EmployeeViewModal({ isOpen, onClose, employeeId }: EmployeeViewModalProps) {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') || '' : '';
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [contractPreviewUrl, setContractPreviewUrl] = useState<string | null>(null);
  const [isContractPreviewLoading, setIsContractPreviewLoading] = useState(false);
  const [contractPreviewError, setContractPreviewError] = useState<string | null>(null);
  const { data: employee, isLoading, isError } = useEmployee(companyId, employeeId);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('profile');
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const initials = employee ? getInitials(employee.firstName, employee.lastName) : '??';
  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : 'Loading...';
  const contractUrl = resolveContractUrl(employee?.contractDocumentPath);
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
      <div
        className="fixed inset-0 z-[200] bg-[#1E293B]/40 backdrop-blur-[4px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className="relative flex flex-col w-full max-w-[680px] max-h-[90vh] rounded-[24px] border border-gray-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-300"
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
                {employee && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    employee.status === EmployeeStatus.ACTIVE ? 'bg-[#F0FDF4] text-[#008236]'
                    : employee.status === EmployeeStatus.PENDING ? 'bg-[#FFFBEB] text-[#B45309]'
                    : 'bg-[#FFF7ED] text-[#CA3500]'
                  }`}>
                    <div className="mr-1.5 h-1 w-1 rounded-full bg-current" />
                    {employee.status === EmployeeStatus.ACTIVE ? 'Active'
                      : employee.status === EmployeeStatus.PENDING ? 'Pending'
                      : employee.status.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Tab Toggle */}
          {!isLoading && !isError && employee && (
            <div className="flex items-center gap-2 px-8 pt-5 pb-0 shrink-0">
              <button onClick={() => setActiveTab('profile')} className={tabClass('profile')}>
                Profile & Organization
              </button>
              <button onClick={() => setActiveTab('employment')} className={tabClass('employment')}>
                Employment & Contract
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#155DFC]" />
                <p className="text-gray-400 font-medium">Fetching employee details...</p>
              </div>
            ) : isError || !employee ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <X size={24} />
                </div>
                <p className="text-gray-500 font-medium">Failed to load employee details</p>
              </div>
            ) : activeTab === 'profile' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><User size={14} strokeWidth={2.5} /> Full Name</span>
                  <span className={VALUE_CLS}>{fullName}</span>
                </div>
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><Mail size={14} strokeWidth={2.5} /> Email Address</span>
                  <span className={VALUE_CLS}>{employee.email}</span>
                </div>
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><Building2 size={14} strokeWidth={2.5} /> Department</span>
                  <span className={VALUE_CLS}>{employee.departmentName || '—'}</span>
                </div>
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><UserCog size={14} strokeWidth={2.5} /> Job Title</span>
                  <span className={VALUE_CLS}>{employee.jobTitle}</span>
                </div>
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><MapPin size={14} strokeWidth={2.5} /> Location</span>
                  <span className={VALUE_CLS}>{employee.companySiteName || '—'}</span>
                </div>
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><Calendar size={14} strokeWidth={2.5} /> Hire Date</span>
                  <span className={VALUE_CLS}>{formatDate(employee.hireDate)}</span>
                </div>
                <div className={`${DETAIL_ROW} col-span-2`}>
                  <span className={LABEL_CLS}><UserCog size={14} strokeWidth={2.5} /> Assigned Supervisor</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#E8F1FF] flex items-center justify-center text-[#155DFC]">
                        <User size={16} strokeWidth={2.5} />
                      </div>
                      <span className={VALUE_CLS}>{employee.supervisorName || 'No supervisor assigned'}</span>
                    </div>
                    {employee.supervisorJobTitle && (
                      <span className="text-[12px] font-bold text-[#155DFC] bg-[#E8F1FF] px-3 py-1 rounded-lg border border-[#155DFC]/10 uppercase tracking-tighter">
                        {employee.supervisorJobTitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Employment & Contract Tab */
              <div className="grid grid-cols-2 gap-4">
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><Briefcase size={14} strokeWidth={2.5} /> Employment Type</span>
                  <span className={VALUE_CLS}>{formatEmploymentType(employee.employmentType)}</span>
                </div>
                <div className={DETAIL_ROW}>
                  <span className={LABEL_CLS}><Sun size={14} strokeWidth={2.5} /> Paid Leave Days / Year</span>
                  <span className={VALUE_CLS}>
                    {employee.leaveDaysPerYear != null ? `${employee.leaveDaysPerYear} days` : '—'}
                  </span>
                </div>
                <div className={`${DETAIL_ROW} col-span-2`}>
                  <span className={LABEL_CLS}><Calendar size={14} strokeWidth={2.5} /> Contract Expiry</span>
                  <span className={VALUE_CLS}>{formatDate(employee.contractExpiryDate)}</span>
                </div>
                {employee.contractDocumentKey && (
                  <div className={`${DETAIL_ROW} col-span-2`}>
                    <span className={LABEL_CLS}><FileText size={14} strokeWidth={2.5} /> PDF Contract Preview</span>
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
                          title="Employee Contract PDF"
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
                  <span className={LABEL_CLS}><CreditCard size={14} strokeWidth={2.5} /> Payment Method</span>
                  <div className="flex items-center justify-between">
                    <span className={VALUE_CLS}>{formatPaymentMethod(employee.paymentMethod)}</span>
                    {employee.paymentMethod === PaymentMethod.FIXED_MONTHLY && employee.monthlySalary != null && (
                      <span className="text-[18px] font-bold text-[#155DFC]">
                        €{employee.monthlySalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-[12px] font-semibold text-gray-400 ml-1">/month</span>
                      </span>
                    )}
                    {employee.paymentMethod === PaymentMethod.HOURLY && employee.hourlyRate != null && (
                      <span className="text-[18px] font-bold text-[#155DFC]">
                        €{employee.hourlyRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-[12px] font-semibold text-gray-400 ml-1">/hour</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-8 py-6 border-t border-gray-50 shrink-0">
            <button
              onClick={onClose}
              className="h-11 rounded-xl bg-[#1E2939] px-8 text-[14px] font-bold text-white shadow-lg shadow-gray-200 transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.98] font-[Inter,sans-serif]"
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
