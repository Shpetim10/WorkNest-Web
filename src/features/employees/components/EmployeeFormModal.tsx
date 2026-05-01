"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, User, Mail, Briefcase, Building2, Calendar, MapPin,
  FileText, CreditCard, Upload, Sun, Clock
} from 'lucide-react';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { EmployeeDTO } from '../types';
import { useProvisionEmployee } from '../api/provision-employee';
import { useUpdateEmployee } from '../api/update-employee';
import { useEmployee } from '../api/get-employee-details';
import { uploadContractDocument } from '../api/upload-media';

// ─── Constants ─────────────────────────────────────────────────────────────────
const LABEL_CLASS = 'block font-[Inter,sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#4A5565] mb-2';
const INPUT_CLASS = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const SELECT_CLASS = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 pr-10 text-[14px] font-medium text-gray-700 appearance-none outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const CHEVRON_SVG = (
  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2.5 4.5L6 8L9.5 4.5" />
    </svg>
  </div>
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

interface DepartmentLookup { id: string; name: string; }
interface SiteLookup { id: string; code: string; name: string; }
interface StaffLookup {
  id?: string;
  roleAssignmentId?: string;
  supervisorRoleAssignmentId?: string;
  fullName?: string;
  name?: string;
}

function getSupervisorOptionValue(s: StaffLookup) {
  return s.roleAssignmentId || s.supervisorRoleAssignmentId || s.id || '';
}
function getSupervisorOptionLabel(s: StaffLookup) {
  return s.fullName || s.name || 'Unnamed Supervisor';
}
function matchesSupervisorId(s: StaffLookup, supervisorId: string) {
  if (!supervisorId) return false;
  const t = supervisorId.toLowerCase();
  return [s.roleAssignmentId, s.supervisorRoleAssignmentId, s.id]
    .filter(Boolean)
    .some(v => v!.toLowerCase() === t);
}
function findMatchingSupervisor(supervisors: StaffLookup[], supervisorId: string) {
  return supervisors.find(s => matchesSupervisorId(s, supervisorId));
}

// ─── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`h-2 w-2 rounded-full transition-colors ${i + 1 <= current ? 'bg-[#155DFC]' : 'bg-gray-200'}`} />
          {i < total - 1 && (
            <div className={`h-0.5 w-6 transition-colors ${i + 1 < current ? 'bg-[#155DFC]' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
      <span className="ml-2 text-[12px] font-semibold text-gray-400 font-[Inter,sans-serif]">
        Step {current} of {total}
      </span>
    </div>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Step1Values {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentName: string;
  location: string;
  supervisorId: string;
  hireDate: string;
  employeeId: string;
}

interface Step2Values {
  employmentType: string;
  contractFile: File | null;
  contractDocumentKey: string;
  contractDocumentPath: string;
  contractFileName: string;
  contractExpiryDate: string;
  paymentMethod: string;
  monthlySalary: string;
  hourlyRate: string;
  leaveDaysPerYear: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentName?: string;
  location?: string;
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

const EMPTY_STEP1: Step1Values = {
  firstName: '', lastName: '', email: '', jobTitle: '',
  departmentName: '', location: '', supervisorId: '', hireDate: '', employeeId: '',
};

const EMPTY_STEP2: Step2Values = {
  employmentType: '', contractFile: null, contractDocumentKey: '',
  contractDocumentPath: '', contractFileName: '', contractExpiryDate: '',
  paymentMethod: '', monthlySalary: '', hourlyRate: '', leaveDaysPerYear: '',
};

// ─── Component ──────────────────────────────────────────────────────────────────
export function EmployeeFormModal({ isOpen, onClose, onSave, mode, initialData }: EmployeeFormModalProps) {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') || '' : '';

  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState<Step1Values>(EMPTY_STEP1);
  const [step2, setStep2] = useState<Step2Values>(EMPTY_STEP2);
  const [errors, setErrors] = useState<FormErrors>({});
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [locations, setLocations] = useState<SiteLookup[]>([]);
  const [supervisors, setSupervisors] = useState<StaffLookup[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isInitialLoad = useRef(true);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSupervisorId = useRef<string>('');

  const provisionMutation = useProvisionEmployee();
  const updateMutation = useUpdateEmployee();

  const { data: employeeDetails, isLoading: isLoadingEmployeeDetails } = useEmployee(
    companyId,
    isOpen && mode === 'edit' ? initialData?.id || null : null
  );
  const editData = mode === 'edit' ? (employeeDetails || null) : null;

  // Fetch lookups when modal opens
  useEffect(() => {
    if (!isOpen || !companyId) return;
    const fetchLookups = async () => {
      try {
        const [deptRes, siteRes] = await Promise.all([
          apiClient.get<ApiResponse<DepartmentLookup[]>>(`/companies/${companyId}/departments/lookup`),
          apiClient.get<ApiResponse<SiteLookup[]>>(`/companies/${companyId}/sites/lookup`),
        ]);
        setDepartments(deptRes.data.data || []);
        setLocations(siteRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch modal lookups:', err);
      }
    };
    fetchLookups();
  }, [isOpen]);

  // Fetch supervisors when department changes
  useEffect(() => {
    if (!companyId || !step1.departmentName) { setSupervisors([]); return; }
    const fetchStaff = async () => {
      setIsLoadingStaff(true);
      try {
        const res = await apiClient.get<ApiResponse<StaffLookup[]>>(
          `/companies/${companyId}/staff/lookup`,
          { params: { departmentId: step1.departmentName } }
        );
        const list = res.data.data || [];
        setSupervisors(list);
        if (pendingSupervisorId.current) {
          const matched = findMatchingSupervisor(list, pendingSupervisorId.current);
          if (matched) {
            const resolved = getSupervisorOptionValue(matched) || pendingSupervisorId.current;
            setStep1(prev => ({ ...prev, supervisorId: resolved }));
          }
          pendingSupervisorId.current = '';
        }
      } catch (err) {
        console.error('Failed to fetch staff lookup:', err);
      } finally {
        setIsLoadingStaff(false);
      }
    };
    fetchStaff();
  }, [step1.departmentName, isOpen]);

  // Prefill data when modal opens / edit data loads
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSubmitError('');
      if (mode === 'edit' && !editData) {
        pendingSupervisorId.current = '';
        setSupervisors([]);
        setStep1(EMPTY_STEP1);
        setStep2(EMPTY_STEP2);
        setErrors({});
        return;
      }
      if (mode === 'edit' && editData) {
        isInitialLoad.current = true;
        const supervisorId = editData.supervisorRoleAssignmentId || '';
        pendingSupervisorId.current = supervisorId;
        setStep1({
          firstName: editData.firstName || '',
          lastName: editData.lastName || '',
          email: editData.email || '',
          jobTitle: editData.jobTitle || '',
          departmentName: editData.departmentId || '',
          location: editData.companySiteId || '',
          supervisorId,
          hireDate: editData.hireDate ? editData.hireDate.split('T')[0] : '',
          employeeId: editData.employeeId || '',
        });
      } else {
        isInitialLoad.current = false;
        pendingSupervisorId.current = '';
        setSupervisors([]);
        setStep1({ ...EMPTY_STEP1, employeeId: `WN-${Math.floor(Math.random() * 900 + 100)}` });
        setStep2(EMPTY_STEP2);
      }
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, mode, editData]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Total steps: 2 for add, 1 for edit
  const totalSteps = mode === 'add' ? 2 : 1;

  function setS1(field: keyof Step1Values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value;
      if (field === 'departmentName') {
        const isManualChange = val !== (mode === 'edit' ? editData?.departmentId : '');
        setStep1(prev => ({ ...prev, departmentName: val, supervisorId: isManualChange ? '' : prev.supervisorId }));
      } else {
        setStep1(prev => ({ ...prev, [field]: val }));
      }
      if (errors[field as keyof FormErrors]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };
  }

  function setS2(field: keyof Omit<Step2Values, 'contractFile'>) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setStep2(prev => {
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
    setStep2(prev => ({ ...prev, contractFile: file, contractFileName: file.name }));
  }

  function validateStep1(): FormErrors {
    const e: FormErrors = {};
    if (!step1.firstName.trim()) e.firstName = 'First name is required';
    if (!step1.lastName.trim()) e.lastName = 'Last name is required';
    if (!step1.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email)) e.email = 'Enter a valid email address';
    if (!step1.departmentName) e.departmentName = 'Department is required';
    if (!step1.jobTitle.trim()) e.jobTitle = 'Job title is required';
    if (mode === 'add' && !step1.hireDate) e.hireDate = 'Hire date is required';
    return e;
  }

  function handleNext() {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === 'add' && step < totalSteps) { handleNext(); return; }

    // Validate step 1 first (in edit mode)
    if (mode === 'edit') {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    }

    setSubmitError('');

    // Upload contract document if provided (add mode step 2)
    let contractDocumentKey: string | null = null;
    let contractDocumentPath: string | null = null;

    if (mode === 'add' && step2.contractFile) {
      setIsUploadingFile(true);
      try {
        const uploaded = await uploadContractDocument(step2.contractFile);
        contractDocumentKey = uploaded.storageKey;
        contractDocumentPath = uploaded.storagePath;
      } catch (err: any) {
        setIsUploadingFile(false);
        setSubmitError(err?.response?.data?.message || 'Failed to upload contract document');
        return;
      }
      setIsUploadingFile(false);
    }

    if (mode === 'add') {
      try {
        const cId = localStorage.getItem('current_company_id');
        if (!cId) throw new Error('Company ID missing');

        const payload: any = {
          companyId: cId,
          firstName: step1.firstName.trim(),
          lastName: step1.lastName.trim(),
          email: step1.email.trim(),
          jobTitle: step1.jobTitle.trim(),
          departmentId: step1.departmentName,
          companySiteId: step1.location || undefined,
          supervisorRoleAssignmentId: step1.supervisorId || undefined,
          startDate: step1.hireDate,
        };

        // Add contract/employment fields from step 2
        if (step2.employmentType) payload.employmentType = step2.employmentType;
        if (contractDocumentKey) {
          payload.contractDocumentKey = contractDocumentKey;
          payload.contractDocumentPath = contractDocumentPath;
        }
        if (step2.contractExpiryDate) payload.contractExpiryDate = step2.contractExpiryDate;
        if (step2.leaveDaysPerYear) payload.leaveDaysPerYear = Number(step2.leaveDaysPerYear);
        if (step2.paymentMethod) {
          payload.paymentMethod = step2.paymentMethod;
          if (step2.paymentMethod === 'FIXED_MONTHLY' && step2.monthlySalary) {
            payload.monthlySalary = Number(step2.monthlySalary);
          }
          if (step2.paymentMethod === 'HOURLY' && step2.hourlyRate) {
            payload.hourlyRate = Number(step2.hourlyRate);
          }
        }

        await provisionMutation.mutateAsync(payload);
        onSave({});
      } catch (err: any) {
        console.error('Failed to provision employee:', err);
        setSubmitError(err.response?.data?.message || 'Failed to create employee');
      }
    } else {
      try {
        const cId = localStorage.getItem('current_company_id');
        if (!cId) throw new Error('Company ID missing');
        if (!initialData?.id) throw new Error('Employee ID missing');

        await updateMutation.mutateAsync({
          employeeId: initialData.id,
          data: {
            companyId: cId,
            firstName: step1.firstName.trim(),
            lastName: step1.lastName.trim(),
            email: step1.email.trim(),
            jobTitle: step1.jobTitle.trim(),
            departmentId: step1.departmentName || undefined,
            companySiteId: step1.location || undefined,
            supervisorRoleAssignmentId: step1.supervisorId || undefined,
            startDate: step1.hireDate,
          },
        });
        onSave({});
      } catch (err: any) {
        console.error('Failed to update employee:', err);
        setSubmitError(err.response?.data?.message || 'Failed to update employee');
      }
    }
  }

  const isBusy = provisionMutation.isPending || updateMutation.isPending || isUploadingFile;

  const headerTitle = mode === 'add'
    ? (step === 1 ? 'Add Employee' : 'Employment & Contract')
    : 'Edit Employee';

  const headerSub = mode === 'add'
    ? (step === 1
      ? 'Enter basic details to register a new team member'
      : 'Set employment type, contract, and compensation details')
    : 'Update the professional profile of this employee';

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
            <div className="space-y-2">
              {mode === 'add' && <StepIndicator current={step} total={totalSteps} />}
              <h2 className="text-[26px] font-bold text-[#1E2939] tracking-tight">{headerTitle}</h2>
              <p className="text-[14px] font-medium text-gray-400">{headerSub}</p>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">

              {/* ─── Step 1: Basic Info ─────────────────────────────────────── */}
              {(step === 1) && (
                <>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className={LABEL_CLASS}>First Name <span className="text-[#155DFC]">*</span></label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input id="firstName" ref={firstInputRef} type="text" placeholder="e.g. John" value={step1.firstName} onChange={setS1('firstName')} className={`${INPUT_CLASS} pl-11 ${errors.firstName ? 'border-red-300 bg-red-50/10' : ''}`} />
                      </div>
                      {errors.firstName && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className={LABEL_CLASS}>Last Name <span className="text-[#155DFC]">*</span></label>
                      <input id="lastName" type="text" placeholder="e.g. Doe" value={step1.lastName} onChange={setS1('lastName')} className={`${INPUT_CLASS} ${errors.lastName ? 'border-red-300 bg-red-50/10' : ''}`} />
                      {errors.lastName && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="email" className={LABEL_CLASS}>Work Email <span className="text-[#155DFC]">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input id="email" type="email" placeholder="john.doe@worknest.com" value={step1.email} onChange={setS1('email')} className={`${INPUT_CLASS} pl-11 ${errors.email ? 'border-red-300 bg-red-50/10' : ''}`} />
                      </div>
                      {errors.email && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="jobTitle" className={LABEL_CLASS}>Job Title <span className="text-[#155DFC]">*</span></label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input id="jobTitle" type="text" placeholder="e.g. Senior Developer" value={step1.jobTitle} onChange={setS1('jobTitle')} className={`${INPUT_CLASS} pl-11 ${errors.jobTitle ? 'border-red-300 bg-red-50/10' : ''}`} />
                      </div>
                      {errors.jobTitle && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.jobTitle}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="department" className={LABEL_CLASS}>Department <span className="text-[#155DFC]">*</span></label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select id="department" value={step1.departmentName} onChange={setS1('departmentName')} className={`${SELECT_CLASS} pl-11 ${errors.departmentName ? 'border-red-300' : ''}`}>
                          <option value="" disabled>Select Department</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        {CHEVRON_SVG}
                      </div>
                      {errors.departmentName && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.departmentName}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="location" className={LABEL_CLASS}>Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select id="location" value={step1.location} onChange={setS1('location')} className={`${SELECT_CLASS} pl-11`}>
                          <option value="">Select Location</option>
                          {locations.map(l => <option key={l.id} value={l.id}>{l.code} – {l.name}</option>)}
                        </select>
                        {CHEVRON_SVG}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="supervisor" className={LABEL_CLASS}>Direct Supervisor</label>
                    {mode === 'edit' && isLoadingEmployeeDetails ? (
                      <div className="h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-400 flex items-center">
                        Loading employee details...
                      </div>
                    ) : (
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          id="supervisor"
                          value={step1.supervisorId || ''}
                          onChange={setS1('supervisorId')}
                          disabled={!step1.departmentName}
                          className={`${SELECT_CLASS} pl-11 ${!step1.departmentName ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                        >
                          {!step1.departmentName ? (
                            <option value="">Please select a department first...</option>
                          ) : (
                            <>
                              <option value="">No Supervisor Assigned</option>
                              {mode === 'edit' && editData?.supervisorRoleAssignmentId && !findMatchingSupervisor(supervisors, editData.supervisorRoleAssignmentId || '') && (
                                <option value={editData.supervisorRoleAssignmentId}>
                                  {editData.supervisorName || 'Current Supervisor'} (Current)
                                </option>
                              )}
                              {supervisors.map(s => (
                                <option key={getSupervisorOptionValue(s)} value={getSupervisorOptionValue(s)}>
                                  {getSupervisorOptionLabel(s)}
                                </option>
                              ))}
                              {isLoadingStaff && supervisors.length === 0 && (
                                <option value="" disabled>Loading team...</option>
                              )}
                            </>
                          )}
                        </select>
                        {CHEVRON_SVG}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="hireDate" className={LABEL_CLASS}>
                      {mode === 'add' ? 'Hire Date' : 'Employment Start'} <span className="text-[#155DFC]">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input id="hireDate" type="date" value={step1.hireDate} onChange={setS1('hireDate')} className={`${INPUT_CLASS} pl-11 ${errors.hireDate ? 'border-red-300' : ''}`} style={{ colorScheme: 'light' }} />
                    </div>
                    {errors.hireDate && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.hireDate}</p>}
                  </div>
                </>
              )}

              {/* ─── Step 2: Employment & Contract (add mode only) ──────────── */}
              {step === 2 && mode === 'add' && (
                <>
                  {/* Employment Type */}
                  <div className="space-y-2">
                    <label className={LABEL_CLASS}>Employment Type</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select value={step2.employmentType} onChange={setS2('employmentType')} className={`${SELECT_CLASS} pl-11`}>
                        <option value="">Select Employment Type</option>
                        {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                      {CHEVRON_SVG}
                    </div>
                  </div>

                  {/* Contract Document */}
                  <div className="space-y-2">
                    <label className={LABEL_CLASS}>
                      <FileText size={14} className="inline mr-1.5 -mt-0.5" />
                      Contract Document
                    </label>
                    <div className="flex items-center gap-3">
                      <div className={`flex-1 h-12 rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-4 flex items-center text-[14px] font-medium ${step2.contractFileName ? 'text-[#155DFC]' : 'text-gray-400'}`}>
                        {step2.contractFileName || 'No contract uploaded (optional)'}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-12 px-5 rounded-xl border border-[#155DFC]/30 bg-[#E8F1FF] text-[#155DFC] text-[13px] font-bold flex items-center gap-2 hover:bg-[#155DFC] hover:text-white transition-all active:scale-95"
                      >
                        <Upload size={16} />
                        Upload
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-[12px] text-gray-400 font-medium">PDF or DOCX format only</p>
                  </div>

                  {/* Contract Expiry Date */}
                  <div className="space-y-2">
                    <label className={LABEL_CLASS}>Contract Expiry Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="date"
                        value={step2.contractExpiryDate}
                        onChange={setS2('contractExpiryDate')}
                        className={`${INPUT_CLASS} pl-11`}
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                  </div>

                  {/* Paid Leave Days */}
                  <div className="space-y-2">
                    <label className={LABEL_CLASS}>
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
                        value={step2.leaveDaysPerYear}
                        onChange={setS2('leaveDaysPerYear')}
                        className={`${INPUT_CLASS} pl-11`}
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className={LABEL_CLASS}>Payment Method</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select value={step2.paymentMethod} onChange={setS2('paymentMethod')} className={`${SELECT_CLASS} pl-11`}>
                        <option value="">Select Payment Method</option>
                        {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                      {CHEVRON_SVG}
                    </div>
                  </div>

                  {step2.paymentMethod === 'FIXED_MONTHLY' && (
                    <div className="space-y-2">
                      <label className={LABEL_CLASS}>Monthly Salary</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-bold">€</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 3500.00"
                          value={step2.monthlySalary}
                          onChange={setS2('monthlySalary')}
                          className={`${INPUT_CLASS} pl-8`}
                        />
                      </div>
                    </div>
                  )}

                  {step2.paymentMethod === 'HOURLY' && (
                    <div className="space-y-2">
                      <label className={LABEL_CLASS}>
                        <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                        Hourly Rate
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-bold">€</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 22.50"
                          value={step2.hourlyRate}
                          onChange={setS2('hourlyRate')}
                          className={`${INPUT_CLASS} pl-8`}
                        />
                      </div>
                      <p className="text-[12px] text-gray-400 font-medium">Rate per hour worked</p>
                    </div>
                  )}
                </>
              )}

              {submitError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold">
                  {submitError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-white rounded-b-[24px]">
              {step === 1 ? (
                <button type="button" onClick={onClose} className="h-12 rounded-xl bg-gray-50 px-8 text-[14px] font-bold text-gray-500 transition-all hover:bg-gray-100 active:scale-95 font-[Inter,sans-serif]">
                  Discard
                </button>
              ) : (
                <button type="button" onClick={() => setStep(1)} className="h-12 rounded-xl bg-gray-50 px-8 text-[14px] font-bold text-gray-500 transition-all hover:bg-gray-100 active:scale-95 font-[Inter,sans-serif]">
                  Back
                </button>
              )}

              {mode === 'add' && step < totalSteps ? (
                <button type="button" onClick={handleNext} className="h-12 rounded-xl bg-gradient-to-r from-[#155DFC] to-[#01c951] px-10 text-[14px] font-bold text-white shadow-lg shadow-[#155DFC]/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-[Inter,sans-serif]">
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isBusy}
                  className="h-12 rounded-xl bg-gradient-to-r from-[#155DFC] to-[#01c951] px-10 text-[14px] font-bold text-white shadow-lg shadow-[#155DFC]/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-[Inter,sans-serif] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUploadingFile ? 'Uploading...' : isBusy ? 'Processing...' : (mode === 'add' ? 'Create Account' : 'Confirm Updates')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
