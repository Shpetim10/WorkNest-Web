"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, User, Mail, Briefcase, Building2, Calendar, MapPin,
  FileText, CreditCard, Upload, Sun, Clock
} from 'lucide-react';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { StaffDTO } from '../types';
import { useProvisionStaff } from '../api/provision-staff';
import { useUpdateStaff } from '../api/update-staff';
import { useStaffDetails } from '../api/get-staff-details';
import { uploadContractDocument } from '../api/upload-media';
import { getCurrencySymbol, getStoredCompanyCurrency, getStoredCompanyLocale } from '@/features/company-settings/storage';

// ─── Constants ──────────────────────────────────────────────────────────────────

const PERMISSIONS_STEP3: Record<string, string[]> = {
  'USER MANAGEMENT': ['Invite users', 'Assign job title', 'Deactivate users'],
  'ATTENDANCE':      ['Mark attendance', 'Self check-in/out', 'Edit attendance', 'View attendance', 'Export reports'],
  'EMPLOYEE':        ['Create / edit employees', 'View team profiles', 'View all employees', 'Upload documents', 'View contracts'],
  'ANNOUNCEMENTS':   ['Create announcements', 'View announcements'],
};

const PERMISSIONS_STEP4: Record<string, string[]> = {
  'LEAVE':   ['Approve/reject leave', 'View leave balance', 'View leave calendar'],
  'REPORTS': ['View reports', 'Export reports'],
  'PAYROLL': ['Configure Pay', 'Add bonuses/deductions', 'Preview payroll', 'View payslip', 'Export payroll'],
};

const PERMISSION_CODE_MAP: Record<string, string> = {
  'USER MANAGEMENT::Invite users': 'users.invite',
  'USER MANAGEMENT::Assign job title': 'users.assign_job_title',
  'USER MANAGEMENT::Deactivate users': 'users.deactivate',
  'ATTENDANCE::Mark attendance': 'attendance.mark',
  'ATTENDANCE::Self check-in/out': 'attendance.self_checkin',
  'ATTENDANCE::Edit attendance': 'attendance.edit',
  'ATTENDANCE::View attendance': 'attendance.view',
  'ATTENDANCE::Export reports': 'attendance.export',
  'EMPLOYEE::Create / edit employees': 'employees.create_edit',
  'EMPLOYEE::View team profiles': 'employees.view_team',
  'EMPLOYEE::View all employees': 'employees.view_all',
  'EMPLOYEE::Upload documents': 'employees.upload_documents',
  'EMPLOYEE::View contracts': 'employees.view_contracts',
  'ANNOUNCEMENTS::Create announcements': 'announcements.create',
  'ANNOUNCEMENTS::View announcements': 'announcements.view',
  'LEAVE::Approve/reject leave': 'leave.approve',
  'LEAVE::View leave balance': 'leave.view_balance',
  'LEAVE::View leave calendar': 'leave.view_calendar',
  'REPORTS::View reports': 'reports.view',
  'REPORTS::Export reports': 'reports.export',
  'PAYROLL::Configure Pay': 'payroll.configure',
  'PAYROLL::Add bonuses/deductions': 'payroll.add_modifiers',
  'PAYROLL::Preview payroll': 'payroll.preview',
  'PAYROLL::View payslip': 'payroll.view_payslips',
  'PAYROLL::Export payroll': 'payroll.export',
};

const REVERSE_PERMISSION_CODE_MAP: Record<string, string> = Object.entries(PERMISSION_CODE_MAP).reduce((acc, [key, val]) => {
  acc[val] = key;
  return acc;
}, {} as Record<string, string>);

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

// ─── Shared styles ───────────────────────────────────────────────────────────────
const LABEL = 'block font-[Inter,sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#4A5565] mb-2';
const INPUT = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const SELECT = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 pr-10 text-[14px] font-medium text-gray-700 appearance-none outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const BTN_CANCEL = 'h-12 rounded-xl bg-gray-50 px-8 text-[14px] font-bold text-gray-500 transition-all hover:bg-gray-100 active:scale-95 font-[Inter,sans-serif]';
const BTN_BACK = 'h-12 rounded-xl bg-gray-50 px-8 text-[14px] font-bold text-gray-500 transition-all hover:bg-gray-100 active:scale-95 font-[Inter,sans-serif]';
const BTN_PRIMARY = 'h-12 rounded-xl bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] px-10 text-[14px] font-bold text-white shadow-lg shadow-[#2B7FFF]/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-[Inter,sans-serif]';
const CHEVRON_SVG = (
  <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ─── Step Indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`h-2 w-2 rounded-full transition-colors ${i + 1 <= current ? 'bg-[#155DFC]' : 'bg-gray-200'}`} />
          {i < total - 1 && <div className={`h-0.5 w-5 transition-colors ${i + 1 < current ? 'bg-[#155DFC]' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
      <span className="ml-2 text-[12px] font-semibold text-gray-400 font-[Inter,sans-serif]">
        Step {current} of {total}
      </span>
    </div>
  );
}

interface DepartmentLookup { id: string; name: string; }
interface SiteLookup { id: string; code: string; name: string; }
interface UnassignedEmployee { id: string; name: string; email: string; jobTitle: string; }

// ─── Types ───────────────────────────────────────────────────────────────────────
interface Step1Values {
  firstName: string; lastName: string; email: string; jobTitle: string;
  department: string; location: string; startDate: string; assignedEmployees: string[];
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

interface Step1Errors {
  firstName?: string; lastName?: string; email?: string;
  jobTitle?: string; department?: string; location?: string; startDate?: string;
}

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: any) => void;
  mode: 'add' | 'edit';
  initialData?: StaffDTO;
}

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function normalizeAssignedEmployeeId(employee: any) {
  return employee?.employeeId || employee?.id || employee?.userId || '';
}

const EMPTY_STEP1: Step1Values = {
  firstName: '', lastName: '', email: '', jobTitle: '',
  department: '', location: '', startDate: '', assignedEmployees: [],
};

const EMPTY_STEP2: Step2Values = {
  employmentType: '', contractFile: null, contractDocumentKey: '',
  contractDocumentPath: '', contractFileName: '', contractExpiryDate: '',
  paymentMethod: '', monthlySalary: '', hourlyRate: '', leaveDaysPerYear: '',
};

// ─── Permission grid helper ──────────────────────────────────────────────────────
function PermissionGroup({ groupName, items, toggled, onChange }: {
  groupName: string; items: string[]; toggled: Set<string>; onChange: (key: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-[Inter,sans-serif] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#4A5565]">
        {groupName}
      </p>
      <div className="space-y-2">
        {items.map((item) => {
          const key = `${groupName}::${item}`;
          const checked = toggled.has(key);
          return (
            <label key={key} className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 transition-colors hover:bg-gray-50/70">
              <input type="checkbox" checked={checked} onChange={() => onChange(key)} className="h-4 w-4 shrink-0 rounded-[4px] border border-gray-300 bg-[#F3F3F5] accent-[#155DFC]" />
              <span className="font-[Inter,sans-serif] text-[14px] font-medium leading-[20px] text-[#364153]">{item}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────────
export function StaffFormModal({ isOpen, onClose, onSave, mode, initialData }: StaffFormModalProps) {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') || '' : '';
  const currencyCode = getStoredCompanyCurrency();
  const currencySymbol = getCurrencySymbol(currencyCode, getStoredCompanyLocale());
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Step1Values>(EMPTY_STEP1);
  const [step2, setStep2] = useState<Step2Values>(EMPTY_STEP2);
  const [errors, setErrors] = useState<Step1Errors>({});
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [locations, setLocations] = useState<SiteLookup[]>([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState<UnassignedEmployee[]>([]);
  const [alreadyAssignedEmployees, setAlreadyAssignedEmployees] = useState<UnassignedEmployee[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const firstRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const provisionMutation = useProvisionStaff();
  const updateMutation = useUpdateStaff();

  const { data: staffDetails, isLoading: isLoadingStaffDetails } = useStaffDetails(
    companyId,
    isOpen && mode === 'edit' ? initialData?.id || null : null
  );
  const editData = mode === 'edit' ? (staffDetails || undefined) : undefined;

  // Total steps: 4 for add mode (basic, contract, perms1, perms2), 3 for edit (basic, perms1, perms2)
  const totalSteps = mode === 'add' ? 4 : 3;

  // Fetch lookups when modal opens
  useEffect(() => {
    if (!isOpen || !companyId) return;
    const fetchLookups = async () => {
      try {
        const [deptRes, siteRes] = await Promise.all([
          apiClient.get<ApiResponse<DepartmentLookup[]>>(`/companies/${companyId}/departments/lookup`),
          apiClient.get<ApiResponse<SiteLookup[]>>(`/companies/${companyId}/sites/lookup`)
        ]);
        setDepartments(deptRes.data.data || []);
        setLocations(siteRes.data.data || []);
      } catch (err) {
        console.error('StaffFormModal: Failed to fetch lookups:', err);
      }
    };
    fetchLookups();
  }, [isOpen]);

  // 1. Initial Data Load & Reset
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSubmitError('');
      if (mode === 'edit' && !editData) {
        setAlreadyAssignedEmployees([]);
        setValues(EMPTY_STEP1);
        setStep2(EMPTY_STEP2);
        setPermissions(new Set());
        setErrors({});
        return;
      }

      if (mode === 'edit' && editData) {
        const firstName = editData.firstName || (editData.name ? editData.name.split(' ')[0] : '');
        const lastName = editData.lastName || (editData.name ? editData.name.split(' ').slice(1).join(' ') : '');

        const preAssignedIds: string[] = (editData.assignedEmployees || [])
          .map(normalizeAssignedEmployeeId)
          .filter(Boolean);

        const preAssignedLookup: UnassignedEmployee[] = (editData.assignedEmployees || []).map(
          (e) => ({
            id: normalizeAssignedEmployeeId(e),
            name: [e.firstName, e.lastName].filter(Boolean).join(' ').trim() || (e as any).name || e.email || 'Assigned Employee',
            email: e.email || '',
            jobTitle: e.jobTitle || '',
          })
        ).filter((employee) => Boolean(employee.id));
        setAlreadyAssignedEmployees(preAssignedLookup);

        setValues({
          firstName, lastName,
          email: editData.email,
          jobTitle: editData.jobTitle,
          department: editData.departmentId || '',
          location: editData.companySiteId || '',
          startDate: editData.startDate ? editData.startDate.split('T')[0] : '',
          assignedEmployees: preAssignedIds,
        });

        if (editData.permissionCodes && editData.permissionCodes.length > 0) {
          const mapped = new Set<string>();
          editData.permissionCodes.forEach(code => {
            const uiKey = REVERSE_PERMISSION_CODE_MAP[code];
            if (uiKey) mapped.add(uiKey);
          });
          setPermissions(mapped);
        } else {
          setPermissions(new Set());
        }
      } else {
        setAlreadyAssignedEmployees([]);
        setValues({ ...EMPTY_STEP1, startDate: new Date().toISOString().split('T')[0] });
        setStep2(EMPTY_STEP2);
        setPermissions(new Set());
      }
      setErrors({});
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [isOpen, mode, editData]);

  // 2. Department/Location Matching
  useEffect(() => {
    if (isOpen && mode === 'edit' && editData) {
      if (editData.departmentId || editData.companySiteId) {
        setValues(v => ({
          ...v,
          department: editData.departmentId || v.department,
          location: editData.companySiteId || v.location,
        }));
      }
    }
  }, [departments, locations, isOpen, mode, editData]);

  // 3. Fetch Unassigned Employees when department changes
  useEffect(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidDept = values.department && uuidRegex.test(values.department);

    if (!companyId || !isValidDept) { setUnassignedEmployees([]); return; }

    const fetchUnassigned = async () => {
      try {
        const items: UnassignedEmployee[] = [];
        let page = 0;
        let totalPages = 1;

        do {
          const res = await apiClient.get<ApiResponse<{
            items: UnassignedEmployee[];
            totalPages: number;
          }>>(`/companies/${companyId}/employees/unassigned`, {
            params: {
              departmentId: values.department,
              page,
              size: 100,
            },
          });

          items.push(...(res.data.data.items || []));
          totalPages = Math.max(1, res.data.data.totalPages || 1);
          page += 1;
        } while (page < totalPages);

        setUnassignedEmployees(items);
      } catch (err: any) {
        setUnassignedEmployees([]);
      }
    };
    fetchUnassigned();
  }, [values.department, isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ── Field helpers ────────────────────────────────────────────────────────────
  function set(field: keyof Step1Values) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues(prev => ({ ...prev, [field]: e.target.value }));
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

  function toggleEmployee(id: string) {
    setValues(prev => {
      const cur = prev.assignedEmployees;
      return { ...prev, assignedEmployees: cur.includes(id) ? cur.filter(i => i !== id) : [...cur, id] };
    });
  }

  function togglePerm(key: string) {
    setPermissions(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  function validateStep1(): Step1Errors {
    const e: Step1Errors = {};
    if (!values.firstName.trim()) e.firstName = 'Required';
    if (!values.lastName.trim()) e.lastName = 'Required';
    if (!values.email.trim()) e.email = 'Required';
    else if (!isValidEmail(values.email)) e.email = 'Enter a valid email';
    if (!values.jobTitle.trim()) e.jobTitle = 'Required';
    if (mode === 'add' && !values.department) e.department = 'Required';
    if (mode === 'add' && !values.startDate) e.startDate = 'Required';
    return e;
  }

  // Map step numbers between add mode (4 steps) and edit mode (3 steps)
  // Add mode: 1=basic, 2=contract, 3=perms1, 4=perms2
  // Edit mode: 1=basic, 2=perms1, 3=perms2
  function permStep1(): number { return mode === 'add' ? 3 : 2; }
  function permStep2(): number { return mode === 'add' ? 4 : 3; }

  function handleNext() {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }
    setStep(s => s + 1);
  }

  function handleBack() { setStep(s => s - 1); }

  async function handleSubmit() {
    setSubmitError('');

    // Upload contract document if provided (add mode only)
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

    const permissionCodes = Array.from(permissions)
      .map(p => PERMISSION_CODE_MAP[p] || (p.includes('::') ? p.split('::')[1] : p));

    if (mode === 'add') {
      const cId = localStorage.getItem('current_company_id');
      if (!cId) return;

      const payload: any = {
        companyId: cId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        jobTitle: values.jobTitle.trim(),
        departmentId: values.department || undefined,
        companySiteId: values.location || undefined,
        startDate: values.startDate || undefined,
        assignedEmployeeIds: values.assignedEmployees.length > 0 ? values.assignedEmployees : undefined,
        permissionCodes,
        preferredLanguage: 'en',
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

      provisionMutation.mutate(payload, {
        onSuccess: () => { onSave({} as any); onClose(); },
        onError: (err: any) => {
          setSubmitError(err.response?.data?.message || 'Failed to provision staff');
        },
      });
      return;
    }

    try {
      const cId = localStorage.getItem('current_company_id');
      if (!cId) throw new Error('Company ID missing');
      if (!initialData?.id) throw new Error('Staff ID missing');

      await updateMutation.mutateAsync({
        staffId: initialData.id,
        data: {
          companyId: cId,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          jobTitle: values.jobTitle.trim(),
          departmentId: values.department || undefined,
          companySiteId: values.location || undefined,
          startDate: values.startDate || undefined,
          assignedEmployeeIds: values.assignedEmployees.length > 0 ? values.assignedEmployees : [],
          permissionCodes,
        },
      });
      onSave({});
      onClose();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to update staff member');
    }
  }

  const isBusy = provisionMutation.isPending || updateMutation.isPending || isUploadingFile;

  // Header content based on step
  const headerContent: { title: string; sub: string } =
    step === 1
      ? {
          title: mode === 'add' ? 'Add New Staff Member' : 'Edit Staff Member',
          sub: mode === 'add'
            ? 'Send an invitation and configure the new staff member'
            : 'Update basic information and team assignments',
        }
      : step === 2 && mode === 'add'
      ? { title: 'Employment & Contract', sub: 'Set employment type, contract, and compensation details' }
      : { title: 'Permissions', sub: 'Select which actions this staff member can perform.' };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className="relative flex flex-col w-full max-w-[650px] max-h-[90vh] rounded-[24px] border border-gray-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-300"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-gray-50 shrink-0">
            <div className="space-y-2">
              <StepIndicator current={step} total={totalSteps} />
              <h2 className="text-[26px] font-bold text-[#1E2939] tracking-tight">{headerContent.title}</h2>
              <p className="text-[14px] font-medium text-gray-400">{headerContent.sub}</p>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">

            {/* ─── Step 1: Basic Info ──────────────────────────────────────── */}
            {step === 1 && (
              <div className="w-full space-y-6">
                {mode === 'edit' && isLoadingStaffDetails ? (
                  <div className="h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-400 flex items-center">
                    Loading staff details...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>First Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input ref={firstRef} type="text" placeholder="John" value={values.firstName} onChange={set('firstName')} className={`${INPUT} pl-10 ${errors.firstName ? 'border-red-400' : ''}`} />
                        </div>
                        {errors.firstName && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Last Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input type="text" placeholder="Doe" value={values.lastName} onChange={set('lastName')} className={`${INPUT} pl-10 ${errors.lastName ? 'border-red-400' : ''}`} />
                        </div>
                        {errors.lastName && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>Email <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input type="email" placeholder="john.doe@company.com" value={values.email} onChange={set('email')} className={`${INPUT} pl-10 ${errors.email ? 'border-red-400' : ''}`} />
                        </div>
                        {errors.email && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.email}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Job Title <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input type="text" placeholder="Manager" value={values.jobTitle} onChange={set('jobTitle')} className={`${INPUT} pl-10 ${errors.jobTitle ? 'border-red-400' : ''}`} />
                        </div>
                        {errors.jobTitle && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.jobTitle}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>Department <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <select value={values.department} onChange={set('department')} className={`${SELECT} pl-10 ${errors.department ? 'border-red-400' : ''}`}>
                            <option value="" disabled>Select Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                          {CHEVRON_SVG}
                        </div>
                        {errors.department && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.department}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <select value={values.location} onChange={set('location')} className={`${SELECT} pl-10`}>
                            <option value="">Select Location</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.code} – {l.name}</option>)}
                          </select>
                          {CHEVRON_SVG}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={LABEL}>Start Date <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="date" value={values.startDate} onChange={set('startDate')} className={`${INPUT} pl-10 ${errors.startDate ? 'border-red-400' : ''}`} style={{ colorScheme: 'light' }} />
                      </div>
                      {errors.startDate && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.startDate}</p>}
                    </div>
                    <div>
                      <label className={LABEL}>Assign Employees</label>
                      <div className="min-h-[44px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-[13.5px] font-medium text-gray-700">
                        <div className="flex flex-wrap gap-1.5">
                          {values.assignedEmployees.map((id) => {
                            const allKnown = [...alreadyAssignedEmployees, ...unassignedEmployees];
                            const emp = allKnown.find(e => e.id === id);
                            return (
                              <span key={id} className="inline-flex items-center gap-1 rounded-md bg-[#E8F1FF] px-2 py-0.5 text-[12px] font-semibold text-[#155DFC]">
                                {emp?.name || id}
                                <button type="button" onClick={() => toggleEmployee(id)} className="text-[#155DFC]/60 hover:text-[#155DFC]">×</button>
                              </span>
                            );
                          })}
                          {values.assignedEmployees.length === 0 && (
                            <span className="text-gray-400">{!values.department ? 'Select a department first' : 'No employees selected'}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        {!values.department ? (
                          <p className="text-[12px] font-medium text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 italic">
                            Select a department to view available employees
                          </p>
                        ) : unassignedEmployees.length === 0 ? (
                          <p className="text-[12px] font-medium text-gray-400 italic">No unassigned employees found in this department</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {unassignedEmployees.filter(e => !values.assignedEmployees.includes(e.id)).map(emp => (
                              <button type="button" key={emp.id} onClick={() => toggleEmployee(emp.id)}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:border-[#155DFC]/40 hover:bg-[#E8F1FF] hover:text-[#155DFC] transition-all shadow-sm active:scale-95 flex flex-col items-start">
                                <span className="font-bold">{emp.name}</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-tight">{emp.jobTitle}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── Step 2: Employment & Contract (add mode only) ───────────── */}
            {step === 2 && mode === 'add' && (
              <div className="w-full space-y-6">
                {/* Employment Type */}
                <div className="space-y-2">
                  <label className={LABEL}>Employment Type</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select value={step2.employmentType} onChange={setS2('employmentType')} className={`${SELECT} pl-10`}>
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
                  <label className={LABEL}>
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
                  <label className={LABEL}>Contract Expiry Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="date" value={step2.contractExpiryDate} onChange={setS2('contractExpiryDate')} className={`${INPUT} pl-10`} style={{ colorScheme: 'light' }} />
                  </div>
                </div>

                {/* Paid Leave Days */}
                <div className="space-y-2">
                  <label className={LABEL}>
                    <Sun size={14} className="inline mr-1.5 -mt-0.5" />
                    Paid Leave Days / Year
                  </label>
                  <div className="relative">
                    <Sun className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="number" min="0" max="365" placeholder="e.g. 30" value={step2.leaveDaysPerYear} onChange={setS2('leaveDaysPerYear')} className={`${INPUT} pl-10`} />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className={LABEL}>Payment Method</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select value={step2.paymentMethod} onChange={setS2('paymentMethod')} className={`${SELECT} pl-10`}>
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
                    <label className={LABEL}>Monthly Salary</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-bold">{currencySymbol}</span>
                      <input type="number" min="0" step="0.01" placeholder="e.g. 5000.00" value={step2.monthlySalary} onChange={setS2('monthlySalary')} className={`${INPUT} pl-8`} />
                    </div>
                  </div>
                )}

                {step2.paymentMethod === 'HOURLY' && (
                  <div className="space-y-2">
                    <label className={LABEL}>
                      <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                      Hourly Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-bold">{currencySymbol}</span>
                      <input type="number" min="0" step="0.01" placeholder="e.g. 25.00" value={step2.hourlyRate} onChange={setS2('hourlyRate')} className={`${INPUT} pl-8`} />
                    </div>
                    <p className="text-[12px] text-gray-400 font-medium">Rate per hour worked</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Permissions Step 1 ─────────────────────────────────────── */}
            {step === permStep1() && (
              <div className="mx-auto w-full rounded-[18px] border border-[#155DFC]/10 bg-[#F8FAFF] p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {['USER MANAGEMENT', 'ATTENDANCE'].map(g => (
                      <PermissionGroup key={g} groupName={g} items={PERMISSIONS_STEP3[g]} toggled={permissions} onChange={togglePerm} />
                    ))}
                  </div>
                  <div className="space-y-6">
                    {['EMPLOYEE', 'ANNOUNCEMENTS'].map(g => (
                      <PermissionGroup key={g} groupName={g} items={PERMISSIONS_STEP3[g]} toggled={permissions} onChange={togglePerm} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Permissions Step 2 ─────────────────────────────────────── */}
            {step === permStep2() && (
              <div className="mx-auto w-full space-y-4">
                <div className="rounded-[18px] border border-[#155DFC]/10 bg-[#F8FAFF] p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {['LEAVE', 'REPORTS'].map(g => (
                        <PermissionGroup key={g} groupName={g} items={PERMISSIONS_STEP4[g]} toggled={permissions} onChange={togglePerm} />
                      ))}
                    </div>
                    <div className="space-y-6">
                      {['PAYROLL'].map(g => (
                        <PermissionGroup key={g} groupName={g} items={PERMISSIONS_STEP4[g]} toggled={permissions} onChange={togglePerm} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                  <p className="mb-2 font-[Inter,sans-serif] text-[13px] font-bold text-amber-700">⚠ Important Rules</p>
                  <ul className="space-y-1 font-[Inter,sans-serif] text-[13px] font-medium text-amber-700">
                    <li>• Permissions are assigned per staff user</li>
                    <li>• Staff can act ONLY on assigned employees</li>
                    <li>• Staff cannot approve their own leave requests</li>
                  </ul>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold">
                {submitError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 bg-white rounded-b-[24px] shrink-0">
            {step === 1 ? (
              <button type="button" onClick={onClose} className={BTN_CANCEL}>Discard</button>
            ) : (
              <button type="button" onClick={handleBack} className={BTN_BACK}>Back</button>
            )}
            {step < totalSteps ? (
              <button type="button" onClick={handleNext} className={BTN_PRIMARY} disabled={isBusy}>
                Next
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} className={BTN_PRIMARY} disabled={isBusy}>
                {isUploadingFile ? 'Uploading...' : isBusy ? 'Processing...' : (mode === 'add' ? 'Create Account' : 'Confirm Updates')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
