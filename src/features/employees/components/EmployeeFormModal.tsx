"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Briefcase, Building2, Calendar, Phone } from 'lucide-react';
import { EmployeeStatus, EmployeeDTO } from '../types';

// ─── Constants ─────────────────────────────────────────────────────────────────
const DEPARTMENT_OPTIONS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Operations', 'Finance'];
const STATUS_OPTIONS = [
  { value: EmployeeStatus.ACTIVE, label: 'Active' },
  { value: EmployeeStatus.ON_LEAVE, label: 'On Leave' },
  { value: EmployeeStatus.INACTIVE, label: 'Inactive' },
];

const LABEL_CLASS = 'block font-[Inter,sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#4A5565] mb-2';
const INPUT_CLASS = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const SELECT_CLASS = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 pr-10 text-[14px] font-medium text-gray-700 appearance-none outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentName: string;
  hireDate: string;
  status: EmployeeStatus;
  employeeId: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentName?: string;
  hireDate?: string;
  jobTitle?: string;
}

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: any) => void;
  mode: 'add' | 'edit';
  initialData?: EmployeeDTO | null;
}

const EMPTY_FORM: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  jobTitle: '',
  departmentName: '',
  hireDate: '', 
  status: EmployeeStatus.ACTIVE,
  employeeId: '',
};

// ─── Component ──────────────────────────────────────────────────────────────────
export function EmployeeFormModal({ isOpen, onClose, onSave, mode, initialData }: EmployeeFormModalProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Prefill data when in edit mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setValues({
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          email: initialData.email,
          jobTitle: initialData.jobTitle,
          departmentName: initialData.departmentName,
          hireDate: initialData.hireDate ? initialData.hireDate.split('T')[0] : '',
          status: initialData.status,
          employeeId: initialData.employeeId,
        });
      } else {
        setValues({
          ...EMPTY_FORM,
          employeeId: `WN-${Math.floor(Math.random() * 900 + 100)}`, // Auto-generate ID for new employees
        });
      }
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, mode, initialData]);

  // Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const set = (field: keyof FormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!values.firstName.trim()) e.firstName = 'First name is required';
    if (!values.lastName.trim())  e.lastName  = 'Last name is required';
    if (!values.email.trim())     e.email     = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'Enter a valid email address';
    if (!values.departmentName)       e.departmentName = 'Department is required';
    if (!values.jobTitle.trim())      e.jobTitle = 'Job title is required';
    if (mode === 'add' && !values.hireDate) e.hireDate = 'Hire date is required';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // Map back to a DTO-like structure for the parent handler
    const finalData = {
      ...initialData,
      ...values,
      id: initialData?.id || `new-${Date.now()}`,
    };

    onSave(finalData);
    onClose();
  }

  if (!isOpen) return null;

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
          <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-gray-50 shrink-0">
            <div className="space-y-1">
              <h2 className="text-[26px] font-bold text-[#1E2939] tracking-tight">
                {mode === 'add' ? 'Add Employee' : 'Edit Employee'}
              </h2>
              <p className="text-[14px] font-medium text-gray-400">
                {mode === 'add' 
                  ? 'Enter the basic details to register a new team member' 
                  : 'Update the professional profile of this employee'}
              </p>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">

              {/* Names Row */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="firstName" className={LABEL_CLASS}>
                    First Name <span className="text-[#155DFC]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="firstName"
                      ref={firstInputRef}
                      type="text"
                      placeholder="e.g. John"
                      value={values.firstName}
                      onChange={set('firstName')}
                      className={`${INPUT_CLASS} pl-11 ${errors.firstName ? 'border-red-300 bg-red-50/10' : ''}`}
                    />
                  </div>
                  {errors.firstName && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className={LABEL_CLASS}>
                    Last Name <span className="text-[#155DFC]">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="e.g. Doe"
                    value={values.lastName}
                    onChange={set('lastName')}
                    className={`${INPUT_CLASS} ${errors.lastName ? 'border-red-300 bg-red-50/10' : ''}`}
                  />
                  {errors.lastName && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email + Job Title */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="email" className={LABEL_CLASS}>
                    Work Email <span className="text-[#155DFC]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="email"
                      type="email"
                      placeholder="john.doe@worknest.com"
                      value={values.email}
                      onChange={set('email')}
                      className={`${INPUT_CLASS} pl-11 ${errors.email ? 'border-red-300 bg-red-50/10' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="jobTitle" className={LABEL_CLASS}>
                    Job Title <span className="text-[#155DFC]">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="jobTitle"
                      type="text"
                      placeholder="e.g. Senior Developer"
                      value={values.jobTitle}
                      onChange={set('jobTitle')}
                      className={`${INPUT_CLASS} pl-11 ${errors.jobTitle ? 'border-red-300 bg-red-50/10' : ''}`}
                    />
                  </div>
                  {errors.jobTitle && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.jobTitle}</p>}
                </div>
              </div>

              {/* Department + Start Date */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="department" className={LABEL_CLASS}>
                    Department <span className="text-[#155DFC]">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      id="department"
                      value={values.departmentName}
                      onChange={set('departmentName')}
                      className={`${SELECT_CLASS} pl-11 ${errors.departmentName ? 'border-red-300' : ''}`}
                    >
                      <option value="" disabled>Select Department</option>
                      {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 4.5L6 8L9.5 4.5"/></svg></div>
                  </div>
                  {errors.departmentName && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.departmentName}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="hireDate" className={LABEL_CLASS}>
                    {mode === 'add' ? 'Hire Date' : 'Employment Start'} <span className="text-[#155DFC]">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="hireDate"
                      type="date"
                      value={values.hireDate}
                      onChange={set('hireDate')}
                      className={`${INPUT_CLASS} pl-11 ${errors.hireDate ? 'border-red-300' : ''}`}
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                  {errors.hireDate && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.hireDate}</p>}
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-2">
                <label className={LABEL_CLASS}>Employment Status</label>
                <div className="flex gap-4 p-4 rounded-[18px] bg-[#F8FAFF] border border-[#155DFC]/10">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValues(p => ({ ...p, status: opt.value }))}
                      className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold transition-all ${
                        values.status === opt.value 
                          ? 'bg-white text-[#155DFC] shadow-sm border border-[#155DFC]/20 ring-4 ring-[#155DFC]/5' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${values.status === opt.value ? 'bg-[#155DFC]' : 'bg-current'}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-white rounded-b-[24px]">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-xl bg-gray-50 px-8 text-[14px] font-bold text-gray-500 transition-all hover:bg-gray-100 active:scale-95 font-[Inter,sans-serif]"
              >
                Discard
              </button>
              <button
                type="submit"
                className="h-12 rounded-xl bg-gradient-to-r from-[#155DFC] to-[#01c951] px-10 text-[14px] font-bold text-white shadow-lg shadow-[#155DFC]/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-[Inter,sans-serif]"
              >
                {mode === 'add' ? 'Create Account' : 'Confirm Updates'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
