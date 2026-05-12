"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Briefcase, Calendar, CreditCard, Upload, FileText, Clock, Sun
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useEmployee } from '../api/get-employee-details';
import { useStaffDetails } from '../api/get-staff-details';
import { useUpdateEmployeeJobDetails } from '../api/update-employee-job-details';
import { useUpdateStaffJobDetails } from '../api/update-staff-job-details';
import { uploadContractDocument } from '../api/upload-media';
import { getCurrencySymbol, getStoredCompanyCurrency, getStoredCompanyLocale } from '@/features/company-settings/storage';

// ─── Styles ──────────────────────────────────────────────────────────────────
const LABEL = 'block font-[Inter,sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#4A5565] mb-2';
const INPUT = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const SELECT = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 pr-10 text-[14px] font-medium text-gray-700 appearance-none outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const CHEVRON = (
  <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  CONTRACT: 'Fixed-Term Contract',
  INTERN: 'Internship',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  FIXED_MONTHLY: 'Fixed Monthly Salary',
  HOURLY: 'Hourly Rate',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  entityType: 'employee' | 'staff';
  entityId: string;
}

interface FormValues {
  employmentType: string;
  contractExpiryDate: string;
  paymentMethod: string;
  monthlySalary: string;
  hourlyRate: string;
  dailyWorkingHours: string;
  leaveDaysPerYear: string;
  contractFile: File | null;
  contractDocumentKey: string;
  contractDocumentPath: string;
  contractFileName: string;
}

const EMPTY: FormValues = {
  employmentType: '',
  contractExpiryDate: '',
  paymentMethod: '',
  monthlySalary: '',
  hourlyRate: '',
  dailyWorkingHours: '',
  leaveDaysPerYear: '',
  contractFile: null,
  contractDocumentKey: '',
  contractDocumentPath: '',
  contractFileName: '',
};

// ─── Component ───────────────────────────────────────────────────────────────
export function JobDetailsModal({ isOpen, onClose, onSave, entityType, entityId }: JobDetailsModalProps) {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') || '' : '';
  const currencyCode = getStoredCompanyCurrency();
  const currencySymbol = getCurrencySymbol(currencyCode, getStoredCompanyLocale());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const employeeQuery = useEmployee(
    companyId,
    isOpen && entityType === 'employee' ? entityId : null
  );
  const staffQuery = useStaffDetails(
    companyId,
    isOpen && entityType === 'staff' ? entityId : null
  );

  const isLoading = entityType === 'employee' ? employeeQuery.isLoading : staffQuery.isLoading;
  const isError = entityType === 'employee' ? employeeQuery.isError : staffQuery.isError;
  const entityData = entityType === 'employee' ? employeeQuery.data : staffQuery.data;

  const updateEmployeeJobDetails = useUpdateEmployeeJobDetails();
  const updateStaffJobDetails = useUpdateStaffJobDetails();
  const isSaving = updateEmployeeJobDetails.isPending || updateStaffJobDetails.isPending;

  // Prefill from fetched data
  useEffect(() => {
    if (!isOpen) return;
    if (!entityData) {
      setValues(EMPTY);
      return;
    }

    const contractFileName = entityData.contractDocumentKey
      ? entityData.contractDocumentKey.split('/').pop() || 'contract'
      : '';

    setValues({
      employmentType: entityData.employmentType || '',
      contractExpiryDate: entityData.contractExpiryDate
        ? entityData.contractExpiryDate.split('T')[0]
        : '',
      paymentMethod: entityData.paymentMethod || '',
      monthlySalary: entityData.monthlySalary != null ? String(entityData.monthlySalary) : '',
      hourlyRate: entityData.hourlyRate != null ? String(entityData.hourlyRate) : '',
      dailyWorkingHours: entityData.dailyWorkingHours != null ? String(entityData.dailyWorkingHours) : '',
      leaveDaysPerYear: entityData.leaveDaysPerYear != null ? String(entityData.leaveDaysPerYear) : '',
      contractFile: null,
      contractDocumentKey: entityData.contractDocumentKey || '',
      contractDocumentPath: '',
      contractFileName,
    });
    setSubmitError('');
  }, [isOpen, entityData]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function set(field: keyof Omit<FormValues, 'contractFile'>) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setValues(prev => {
        const next = { ...prev, [field]: val };
        if (field === 'paymentMethod') {
          if (val === 'FIXED_MONTHLY') next.hourlyRate = '';
          if (val === 'HOURLY') next.monthlySalary = '';
        }
        return next;
      });
    };
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setValues(prev => ({
      ...prev,
      contractFile: file,
      contractFileName: file.name,
    }));
  }

  async function handleSubmit() {
    setSubmitError('');
    let contractDocumentKey = values.contractDocumentKey || undefined;
    let contractDocumentPath = values.contractDocumentPath || undefined;

    if (values.contractFile) {
      setIsUploadingFile(true);
      try {
        const uploaded = await uploadContractDocument(values.contractFile);
        contractDocumentKey = uploaded.storageKey;
        contractDocumentPath = uploaded.storagePath;
      } catch (err: any) {
        setIsUploadingFile(false);
        setSubmitError(err?.response?.data?.message || 'Failed to upload contract document');
        return;
      }
      setIsUploadingFile(false);
    }

    const payload = {
      companyId,
      employmentType: values.employmentType || null,
      contractDocumentKey: contractDocumentKey || null,
      contractDocumentPath: contractDocumentPath || null,
      contractExpiryDate: values.contractExpiryDate || null,
      leaveDaysPerYear: values.leaveDaysPerYear ? Number(values.leaveDaysPerYear) : null,
      paymentMethod: values.paymentMethod || null,
      monthlySalary: values.paymentMethod === 'FIXED_MONTHLY' && values.monthlySalary
        ? Number(values.monthlySalary) : null,
      hourlyRate: values.paymentMethod === 'HOURLY' && values.hourlyRate
        ? Number(values.hourlyRate) : null,
      dailyWorkingHours: values.dailyWorkingHours ? Number(values.dailyWorkingHours) : null,
    };

    try {
      if (entityType === 'employee') {
        await updateEmployeeJobDetails.mutateAsync({ employeeId: entityId, data: payload });
      } else {
        await updateStaffJobDetails.mutateAsync({ staffId: entityId, data: payload });
      }
      onSave();
      onClose();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Failed to update job details');
    }
  }

  const title = entityType === 'employee' ? 'Update Job & Contract' : 'Update Employment & Contract';

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[200] bg-[#1E293B]/40 backdrop-blur-[4px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className="relative flex flex-col w-full max-w-[600px] max-h-[90vh] rounded-[24px] border border-gray-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-300"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-gray-50 shrink-0">
            <div className="space-y-1">
              <h2 className="text-[24px] font-bold text-[#1E2939] tracking-tight">{title}</h2>
              <p className="text-[14px] font-medium text-gray-400">
                Configure employment type, contract details, and compensation
              </p>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#155DFC]" />
                <p className="text-gray-400 font-medium text-[14px]">Loading current details...</p>
              </div>
            ) : isError ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 text-[14px] font-medium">
                Failed to load current job details. You can still update below.
              </div>
            ) : (
              <>
                {/* Employment Type */}
                <div className="space-y-2">
                  <label className={LABEL}>
                    <Briefcase size={14} className="inline mr-1.5 -mt-0.5" />
                    Employment Type
                  </label>
                  <div className="relative">
                    <select value={values.employmentType} onChange={set('employmentType')} className={SELECT}>
                      <option value="">Select Employment Type</option>
                      {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    {CHEVRON}
                  </div>
                </div>

                {/* Contract Document */}
                <div className="space-y-2">
                  <label className={LABEL}>
                    <FileText size={14} className="inline mr-1.5 -mt-0.5" />
                    Contract Document
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex-1 h-12 rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-4 flex items-center text-[14px] font-medium ${values.contractFileName ? 'text-[#155DFC]' : 'text-gray-400'}`}
                    >
                      {values.contractFileName || 'No contract uploaded'}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-12 px-5 rounded-xl border border-[#155DFC]/30 bg-[#E8F1FF] text-[#155DFC] text-[13px] font-bold flex items-center gap-2 hover:bg-[#155DFC] hover:text-white transition-all active:scale-95"
                    >
                      <Upload size={16} />
                      {values.contractFileName ? 'Replace' : 'Upload'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium">PDF or DOCX only</p>
                </div>

                {/* Contract Expiry Date */}
                <div className="space-y-2">
                  <label className={LABEL}>
                    <Calendar size={14} className="inline mr-1.5 -mt-0.5" />
                    Contract Expiry Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      value={values.contractExpiryDate}
                      onChange={set('contractExpiryDate')}
                      className={`${INPUT} pl-11`}
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                </div>

                {/* Paid Leave Days */}
                <div className="space-y-2">
                  <label className={LABEL}>
                    <Sun size={14} className="inline mr-1.5 -mt-0.5" />
                    Paid Leave Days / Year
                  </label>
                  <div className="relative">
                    <Sun className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      min="0"
                      max="365"
                      placeholder="e.g. 30"
                      value={values.leaveDaysPerYear}
                      onChange={set('leaveDaysPerYear')}
                      className={`${INPUT} pl-11`}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className={LABEL}>
                    <CreditCard size={14} className="inline mr-1.5 -mt-0.5" />
                    Payment Method
                  </label>
                  <div className="relative">
                    <select value={values.paymentMethod} onChange={set('paymentMethod')} className={SELECT}>
                      <option value="">Select Payment Method</option>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    {CHEVRON}
                  </div>
                </div>

                {/* Conditional salary / rate */}
                {values.paymentMethod === 'FIXED_MONTHLY' && (
                  <div className="space-y-2">
                    <label className={LABEL}>
                      <CreditCard size={14} className="inline mr-1.5 -mt-0.5" />
                      Monthly Salary
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-bold">{currencySymbol}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 3500.00"
                        value={values.monthlySalary}
                        onChange={set('monthlySalary')}
                        className={`${INPUT} pl-8`}
                      />
                    </div>
                  </div>
                )}

                {values.paymentMethod === 'HOURLY' && (
                  <div className="space-y-2">
                    <label className={LABEL}>
                      <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                      Hourly Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-bold">{currencySymbol}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 22.50"
                        value={values.hourlyRate}
                        onChange={set('hourlyRate')}
                        className={`${INPUT} pl-8`}
                      />
                    </div>
                    <p className="text-[12px] text-gray-400 font-medium">Rate per hour worked</p>
                  </div>
                )}

                {!!values.paymentMethod && (
                  <div className="space-y-2">
                    <label className={LABEL}>
                      <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                      Daily Working Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      placeholder="e.g. 8"
                      value={values.dailyWorkingHours}
                      onChange={set('dailyWorkingHours')}
                      className={INPUT}
                    />
                    <p className="text-[12px] text-gray-400 font-medium">Used to calculate sick leave pay.</p>
                  </div>
                )}

                {submitError && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold">
                    {submitError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-white rounded-b-[24px] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl bg-gray-50 px-8 text-[14px] font-bold text-gray-500 transition-all hover:bg-gray-100 active:scale-95 font-[Inter,sans-serif]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || isUploadingFile || isLoading}
              className="h-12 rounded-xl bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] px-10 text-[14px] font-bold text-white shadow-lg shadow-[#2B7FFF]/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-[Inter,sans-serif] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUploadingFile ? 'Uploading...' : isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
