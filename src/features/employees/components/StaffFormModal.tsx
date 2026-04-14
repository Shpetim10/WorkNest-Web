"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Briefcase, Building2, Calendar, MapPin } from 'lucide-react';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { EmployeeStatus, StaffDTO } from '../types';
import { useProvisionStaff } from '../api/provision-staff';
import { useUpdateStaff } from '../api/update-staff';
import { useStaffDetails } from '../api/get-staff-details';

// ─── Constants ──────────────────────────────────────────────────────────────────

const PERMISSIONS_STEP2: Record<string, string[]> = {
  'USER MANAGEMENT': ['Invite users', 'Assign job title', 'Deactivate users'],
  'ATTENDANCE':      ['Mark attendance', 'Self check-in/out', 'Edit attendance', 'View attendance', 'Export reports'],
  'EMPLOYEE':        ['Create / edit employees', 'View team profiles', 'View all employees', 'Upload documents', 'View contracts'],
  'ANNOUNCEMENTS':   ['Create announcements', 'View announcements'],
};

const PERMISSIONS_STEP3: Record<string, string[]> = {
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

// ─── Shared styles ───────────────────────────────────────────────────────────────
const LABEL = 'block font-[Inter,sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#4A5565] mb-2';
const INPUT = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const SELECT = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 pr-10 text-[14px] font-medium text-gray-700 appearance-none outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const BTN_CANCEL  = 'h-12 rounded-xl bg-gray-50 px-8 text-[14px] font-bold text-gray-500 transition-all hover:bg-gray-100 active:scale-95 font-[Inter,sans-serif]';
const BTN_BACK    = 'h-12 rounded-xl bg-gray-50 px-8 text-[14px] font-bold text-gray-500 transition-all hover:bg-gray-100 active:scale-95 font-[Inter,sans-serif]';
const BTN_PRIMARY = 'h-12 rounded-xl bg-gradient-to-r from-[#155DFC] to-[#01c951] px-10 text-[14px] font-bold text-white shadow-lg shadow-[#155DFC]/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-[Inter,sans-serif]';
const CHEVRON_SVG = (
  <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

interface DepartmentLookup {
  id: string;
  name: string;
}

interface SiteLookup {
  id: string;
  code: string;
  name: string;
}

interface UnassignedEmployee {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────────
interface Step1Values {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  location: string;
  startDate: string;
  assignedEmployees: string[];
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
function getInitials(f: string, l: string) { return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase(); }
function normalizeAssignedEmployeeId(employee: any) {
  return employee?.employeeId || employee?.id || employee?.userId || '';
}

const EMPTY_STEP1: Step1Values = {
  firstName: '', lastName: '', email: '', jobTitle: '',
  department: '', location: '', startDate: '', assignedEmployees: [],
};

// ─── Permission grid helper ──────────────────────────────────────────────────────
function PermissionGroup({
  groupName, items, toggled, onChange,
}: {
  groupName: string;
  items: string[];
  toggled: Set<string>;
  onChange: (key: string) => void;
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
            <label
              key={key}
              className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 transition-colors hover:bg-gray-50/70"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(key)}
                className="h-4 w-4 shrink-0 rounded-[4px] border border-gray-300 bg-[#F3F3F5] accent-[#155DFC]"
              />
              <span className="font-[Inter,sans-serif] text-[14px] font-medium leading-[20px] text-[#364153]">
                {item}
              </span>
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
  const [step, setStep] = useState(1);
  const [values, setValues]   = useState<Step1Values>(EMPTY_STEP1);
  const [errors, setErrors]   = useState<Step1Errors>({});
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [locations, setLocations] = useState<SiteLookup[]>([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState<UnassignedEmployee[]>([]);
  // Employees that were already assigned to this staff in the DB (needed for name resolution
  // since they won't appear in the /unassigned endpoint).
  const [alreadyAssignedEmployees, setAlreadyAssignedEmployees] = useState<UnassignedEmployee[]>([]);
  const firstRef = useRef<HTMLInputElement>(null);
  const provisionMutation = useProvisionStaff();
  const updateMutation = useUpdateStaff();
  const { data: staffDetails, isLoading: isLoadingStaffDetails } = useStaffDetails(
    companyId,
    isOpen && mode === 'edit' ? initialData?.id || null : null
  );
  const editData = mode === 'edit' ? (staffDetails || undefined) : undefined;

  // Fetch lookups when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (!companyId) {
      console.warn('StaffFormModal: No companyId found in localStorage');
      return;
    }

    const fetchLookups = async () => {
      try {
        console.log(`StaffFormModal: Fetching lookups for company ${companyId}`);
        const [deptRes, siteRes] = await Promise.all([
          apiClient.get<ApiResponse<DepartmentLookup[]>>(`/companies/${companyId}/departments/lookup`),
          apiClient.get<ApiResponse<SiteLookup[]>>(`/companies/${companyId}/sites/lookup`)
        ]);
        
        console.log('StaffFormModal: Lookups received:', { 
          depts: deptRes.data.data?.length, 
          sites: siteRes.data.data?.length 
        });

        setDepartments(deptRes.data.data || []);
        setLocations(siteRes.data.data || []);
      } catch (err) {
        console.error('StaffFormModal: Failed to fetch staff modal lookups:', err);
      }
    };

    fetchLookups();
  }, [isOpen]);

  // 1. Initial Data Load & Reset
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (mode === 'edit' && !editData) {
        setAlreadyAssignedEmployees([]);
        setValues(EMPTY_STEP1);
        setPermissions(new Set());
        setErrors({});
        return;
      }

      if (mode === 'edit' && editData) {
        const firstName = editData.firstName || (editData.name ? editData.name.split(' ')[0] : '');
        const lastName = editData.lastName || (editData.name ? editData.name.split(' ').slice(1).join(' ') : '');

        // Extract IDs from the assignedEmployees array (EmployeeSummaryDTO[]).
        // `assignedCount` does NOT exist — use `assignedEmployees` directly.
        const preAssignedIds: string[] = (editData.assignedEmployees || [])
          .map(normalizeAssignedEmployeeId)
          .filter(Boolean);

        // Build a lookup for already-assigned employees so their names render in chips.
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
          firstName,
          lastName,
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
        setValues({
          ...EMPTY_STEP1,
          startDate: new Date().toISOString().split('T')[0],
        });
        setPermissions(new Set());
      }
      setErrors({});
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [isOpen, mode, editData]);

  // 2. Department/Location Matching (Asynchronous)
  useEffect(() => {
    if (isOpen && mode === 'edit' && editData) {
      if (editData.departmentId || editData.companySiteId) {
        setValues(v => ({
          ...v,
          department: editData.departmentId || v.department,
          location: editData.companySiteId || v.location
        }));
      }
    }
  }, [departments, locations, isOpen, mode, editData]);

  // 3. Fetch Unassigned Employees when department changes
  useEffect(() => {
    // UUID regex to ensure we don't send garbage to the backend
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidDept = values.department && uuidRegex.test(values.department);

    if (!companyId || !isValidDept) {
      if (values.department && !isValidDept) {
        console.warn('StaffFormModal: Invalid department UUID format:', values.department);
      }
      setUnassignedEmployees([]);
      return;
    }

    const fetchUnassigned = async () => {
      try {
        console.log(`StaffFormModal: Fetching unassigned employees for dept ${values.department}`);
        const res = await apiClient.get<ApiResponse<UnassignedEmployee[]>>(
          `/companies/${companyId}/employees/unassigned?departmentId=${values.department}`
        );
        setUnassignedEmployees(res.data.data || []);
      } catch (err: any) {
        console.error('StaffFormModal: Failed to fetch unassigned employees:', err);
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

  function toggleEmployee(id: string) {
    setValues(prev => {
      const cur = prev.assignedEmployees;
      return {
        ...prev,
        assignedEmployees: cur.includes(id) ? cur.filter(i => i !== id) : [...cur, id],
      };
    });
  }

  function togglePerm(key: string) {
    setPermissions(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ── Step 1 validation ────────────────────────────────────────────────────────
  function validateStep1(): Step1Errors {
    const e: Step1Errors = {};
    if (!values.firstName.trim()) e.firstName = 'Required';
    if (!values.lastName.trim())  e.lastName  = 'Required';
    if (!values.email.trim())     e.email = 'Required';
    else if (!isValidEmail(values.email)) e.email = 'Enter a valid email';
    if (!values.jobTitle.trim())  e.jobTitle  = 'Required';
    if (mode === 'add' && !values.department) e.department = 'Required';
    if (mode === 'add' && !values.startDate)  e.startDate  = 'Required';
    return e;
  }

  function handleNext() {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }
    setStep(s => s + 1);
  }

  function handleBack() { setStep(s => s - 1); }

  async function handleSubmit() {
    if (mode === 'add') {
      const companyId = localStorage.getItem('current_company_id');
      if (!companyId) return;

      // Extract permission codes from the "Group::Permission" keys
      const permissionCodes = Array.from(permissions)
        .map(p => PERMISSION_CODE_MAP[p] || p.split('::')[1]);

      provisionMutation.mutate({
        companyId,
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
      }, {
        onSuccess: () => {
          onSave({} as any); // The list will be invalidated by the hook
          onClose();
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || 'Failed to provision staff';
          alert(msg);
        }
      });
      return;
    }

    try {
      const companyId = localStorage.getItem('current_company_id');
      if (!companyId) throw new Error('Company ID missing');
      if (!initialData?.id) throw new Error('Staff ID missing');

      // Extract permission codes
      const permissionCodes = Array.from(permissions)
        .map(p => PERMISSION_CODE_MAP[p] || (p.includes('::') ? p.split('::')[1] : p));

      await updateMutation.mutateAsync({
        staffId: initialData.id,
        data: {
          companyId,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          jobTitle: values.jobTitle.trim(),
          departmentId: values.department || undefined,
          companySiteId: values.location || undefined,
          startDate: values.startDate || undefined,
          assignedEmployeeIds: values.assignedEmployees.length > 0 ? values.assignedEmployees : [],
          permissionCodes,
        },
      });

      onSave({}); // triggers list invalidation, closes modal
      onClose();
    } catch (err: any) {
      console.error('Failed to update staff:', err);
      const msg = err.response?.data?.message || 'Failed to update staff member';
      alert(msg);
    }
  }

  // ── Headers ─────────────────────────────────────────────────────────────
  const headerContent = step === 1
    ? { 
        title: mode === 'add' ? 'Add New Staff Member' : 'Edit Staff Member', 
        sub: mode === 'add' 
          ? 'Send an invitation and configure permissions for the new staff member' 
          : 'Update basic information and team assignments for this staff member' 
      }
    : { title: 'Permissions', sub: 'Select which actions this staff member can perform. Staff can only act on assigned employees.' };

  // ── Step 2 Columns (Restored Order) ──────────────────────────────────────────
  const step2Left  = ['USER MANAGEMENT', 'ATTENDANCE'];
  const step2Right = ['EMPLOYEE', 'ANNOUNCEMENTS'];
  // ── Step 3 Columns (Restored Order) ──────────────────────────────────────────
  const step3Left  = ['LEAVE', 'REPORTS'];
  const step3Right = ['PAYROLL'];

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
            <div className="space-y-1">
              <h2 className="text-[26px] font-bold text-[#1E2939] tracking-tight">
                {headerContent.title}
              </h2>
              <p className="text-[14px] font-medium text-gray-400">
                {headerContent.sub}
              </p>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
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
                          <input ref={firstRef} type="text" placeholder="John" value={values.firstName} onChange={set('firstName')} className={`${INPUT} pl-10 ${errors.firstName ? 'border-red-400 focus:ring-red-100' : ''}`} />
                        </div>
                        {errors.firstName && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Last Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input type="text" placeholder="Doe" value={values.lastName} onChange={set('lastName')} className={`${INPUT} pl-10 ${errors.lastName ? 'border-red-400 focus:ring-red-100' : ''}`} />
                        </div>
                        {errors.lastName && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL}>Email <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input type="email" placeholder="john.doe@company.com" value={values.email} onChange={set('email')} className={`${INPUT} pl-10 ${errors.email ? 'border-red-400 focus:ring-red-100' : ''}`} />
                        </div>
                        {errors.email && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.email}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Job Title <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input type="text" placeholder="Manager" value={values.jobTitle} onChange={set('jobTitle')} className={`${INPUT} pl-10 ${errors.jobTitle ? 'border-red-400 focus:ring-red-100' : ''}`} />
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
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                          {CHEVRON_SVG}
                        </div>
                        {errors.department && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.department}</p>}
                      </div>
                      <div>
                        <label className={LABEL}>Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <select value={values.location} onChange={set('location')} className={`${SELECT} pl-10 ${errors.location ? 'border-red-400' : ''}`}>
                            <option value="">Select Location</option>
                            {locations.map(l => (
                              <option key={l.id} value={l.id}>
                                {l.code} – {l.name}
                              </option>
                            ))}
                          </select>
                          {CHEVRON_SVG}
                        </div>
                        {errors.location && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.location}</p>}
                      </div>
                    </div>
                    <div>
                      <label className={LABEL}>Start Date <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="date" value={values.startDate} onChange={set('startDate')} className={`${INPUT} pl-10 ${errors.startDate ? 'border-red-400 focus:ring-red-100' : ''}`} style={{ colorScheme: 'light' }} />
                      </div>
                      {errors.startDate && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.startDate}</p>}
                    </div>
                    <div>
                      <label className={LABEL}>Assign Employees</label>
                      <div className="relative">
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
                              <span className="text-gray-400">
                                {!values.department ? 'Select a department first' : 'No employees selected'}
                              </span>
                            )}
                          </div>
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
                              <button 
                                type="button" 
                                key={emp.id} 
                                onClick={() => toggleEmployee(emp.id)} 
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:border-[#155DFC]/40 hover:bg-[#E8F1FF] hover:text-[#155DFC] transition-all shadow-sm active:scale-95 flex flex-col items-start"
                              >
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

            {step === 2 && (
              <div className="mx-auto w-full rounded-[18px] border border-[#155DFC]/10 bg-[#F8FAFF] p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {step2Left.map(g => <PermissionGroup key={g} groupName={g} items={PERMISSIONS_STEP2[g]} toggled={permissions} onChange={togglePerm} />)}
                  </div>
                  <div className="space-y-6">
                    {step2Right.map(g => <PermissionGroup key={g} groupName={g} items={PERMISSIONS_STEP2[g]} toggled={permissions} onChange={togglePerm} />)}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mx-auto w-full space-y-4">
                <div className="rounded-[18px] border border-[#155DFC]/10 bg-[#F8FAFF] p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {step3Left.map(g => <PermissionGroup key={g} groupName={g} items={PERMISSIONS_STEP3[g]} toggled={permissions} onChange={togglePerm} />)}
                    </div>
                    <div className="space-y-6">
                      {step3Right.map(g => <PermissionGroup key={g} groupName={g} items={PERMISSIONS_STEP3[g]} toggled={permissions} onChange={togglePerm} />)}
                    </div>
                  </div>
                </div>

                {/* Important Rules Box (Restored) */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                  <p className="mb-2 font-[Inter,sans-serif] text-[13px] font-bold text-amber-700">
                    ⚠ Important Rules
                  </p>
                  <ul className="space-y-1 font-[Inter,sans-serif] text-[13px] font-medium text-amber-700">
                    <li>• Permissions are assigned per staff user</li>
                    <li>• Staff can act ONLY on assigned employees</li>
                    <li>• Staff cannot approve their own leave requests</li>
                  </ul>
                </div>
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
            {step < 3 ? (
              <button type="button" onClick={handleNext} className={BTN_PRIMARY} disabled={provisionMutation.isPending}>
                Next
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} className={BTN_PRIMARY} disabled={provisionMutation.isPending || updateMutation.isPending}>
                {provisionMutation.isPending || updateMutation.isPending ? 'Processing...' : (mode === 'add' ? 'Create Account' : 'Confirm Updates')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
