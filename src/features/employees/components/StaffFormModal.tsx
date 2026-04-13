"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { StaffMock } from './StaffListView';

// ─── Constants ──────────────────────────────────────────────────────────────────
const DEPARTMENT_OPTIONS = ['Engineering', 'Marketing', 'Sales', 'HR'];
const EMPLOYEE_OPTIONS   = ['Sarah Johnson', 'Michael Chen', 'Emily Davis', 'John Smith', 'Alice Brown'];

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

// ─── Shared styles ───────────────────────────────────────────────────────────────
const LABEL = 'block font-[Inter,sans-serif] text-[14px] font-medium leading-[20px] text-[#364153] mb-1.5';
const INPUT = 'w-full h-11 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[13.5px] font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#155dfc]/50 focus:ring-2 focus:ring-[#155dfc]/10 font-[Inter,sans-serif]';
const SELECT = 'w-full h-11 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 pr-10 text-[13.5px] font-medium text-gray-700 appearance-none outline-none transition-all focus:border-[#155dfc]/50 focus:ring-2 focus:ring-[#155dfc]/10 font-[Inter,sans-serif]';
const BTN_CANCEL  = 'h-11 rounded-[10px] px-6 text-[16px] font-medium leading-[24px] text-[#364153] font-[Inter,sans-serif] transition-all hover:opacity-90' ;
const BTN_BACK    = 'h-11 rounded-[10px] px-6 text-[16px] font-medium leading-[24px] text-[#364153] font-[Inter,sans-serif] transition-all hover:opacity-90';
const BTN_CANCEL_STYLE  = { background: 'rgba(215.16, 211.02, 211.02, 0.63)' } as React.CSSProperties;
const BTN_BACK_STYLE    = { background: 'rgba(215.16, 211.02, 211.02, 0.63)' } as React.CSSProperties;
const BTN_PRIMARY = 'h-11 rounded-[10px] bg-gradient-to-r from-[#155DFC] to-[#01c951] px-7 text-[14px] font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-[#155dfc]/20 font-[Inter,sans-serif]';
const CHEVRON_SVG = (
  <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ─── Types ───────────────────────────────────────────────────────────────────────
interface Step1Values {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  startDate: string;
  assignedEmployees: string[];
}
interface Step1Errors {
  firstName?: string; lastName?: string; email?: string;
  jobTitle?: string; department?: string; startDate?: string;
}

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: StaffMock) => void;
  mode: 'add' | 'edit';
  initialData?: StaffMock;
}

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function getInitials(f: string, l: string) { return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase(); }

const EMPTY_STEP1: Step1Values = {
  firstName: '', lastName: '', email: '', jobTitle: '',
  department: '', startDate: '', assignedEmployees: [],
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
  const [step, setStep] = useState(1);
  const [values, setValues]   = useState<Step1Values>(EMPTY_STEP1);
  const [errors, setErrors]   = useState<Step1Errors>({});
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const firstRef = useRef<HTMLInputElement>(null);

  // Reset/Prefill on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (mode === 'edit' && initialData) {
        const [first, ...rest] = initialData.name.split(' ');
        setValues({
          firstName: first || '',
          lastName: rest.join(' ') || '',
          email: initialData.email,
          jobTitle: initialData.jobTitle,
          department: '', // Not in mock
          startDate: '', // Not in mock
          assignedEmployees: Array(initialData.assignedCount).fill('Employee'), // Stubbing for mock
        });
        
        // Mocking permissions based on "Full Access"
        if (initialData.permissions === 'Full Access') {
          const all = new Set<string>();
          [...Object.entries(PERMISSIONS_STEP2), ...Object.entries(PERMISSIONS_STEP3)].forEach(([group, items]) => {
            items.forEach(it => all.add(`${group}::${it}`));
          });
          setPermissions(all);
        } else {
          setPermissions(new Set(['EMPLOYEE::View all employees', 'ATTENDANCE::View attendance']));
        }
      } else {
        setValues(EMPTY_STEP1);
        setPermissions(new Set());
      }
      setErrors({});
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [isOpen, mode, initialData]);

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

  function toggleEmployee(name: string) {
    setValues(prev => {
      const cur = prev.assignedEmployees;
      return {
        ...prev,
        assignedEmployees: cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name],
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

  function handleSubmit() {
    const allPerms = permissions.size;
    const totalAvailable =
      Object.values(PERMISSIONS_STEP2).flat().length +
      Object.values(PERMISSIONS_STEP3).flat().length;
    const isFullAccess = allPerms >= totalAvailable * 0.6;

    const staffData: StaffMock = {
      id: initialData?.id || `staff-${Date.now()}`,
      name: `${values.firstName.trim()} ${values.lastName.trim()}`,
      email: values.email.trim(),
      jobTitle: values.jobTitle.trim(),
      assignedCount: values.assignedEmployees.length,
      permissions: isFullAccess ? 'Full Access' : 'Limited Access',
      initials: getInitials(values.firstName.trim(), values.lastName.trim()),
    };

    onSave(staffData);
    onClose();
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
          className="relative flex flex-col w-full max-w-[969px] h-[683px] rounded-[10px] border-[1.26px] border-[#E5E7EB] bg-white shadow-[0_24px_48px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-gray-50 shrink-0">
            <div className="space-y-1">
              <h2 className="font-[Inter,sans-serif] font-semibold text-[#0A0A0A]" style={{ fontSize: '24px', lineHeight: '32px' }}>
                {headerContent.title}
              </h2>
              <p className="font-[Inter,sans-serif] font-normal text-[#717182] max-w-[480px]" style={{ fontSize: '14px', lineHeight: '20px' }}>
                {headerContent.sub}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {step === 1 && (
              <div className="mx-auto w-full max-w-[582px] space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>First Name <span className="text-red-500">*</span></label>
                    <input ref={firstRef} type="text" placeholder="John" value={values.firstName} onChange={set('firstName')} className={`${INPUT} ${errors.firstName ? 'border-red-400 focus:ring-red-100' : ''}`} />
                    {errors.firstName && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Last Name <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Doe" value={values.lastName} onChange={set('lastName')} className={`${INPUT} ${errors.lastName ? 'border-red-400 focus:ring-red-100' : ''}`} />
                    {errors.lastName && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Email <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="john.doe@company.com" value={values.email} onChange={set('email')} className={`${INPUT} ${errors.email ? 'border-red-400 focus:ring-red-100' : ''}`} />
                  {errors.email && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.email}</p>}
                </div>
                <div>
                  <label className={LABEL}>Job Title <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Manager" value={values.jobTitle} onChange={set('jobTitle')} className={`${INPUT} ${errors.jobTitle ? 'border-red-400 focus:ring-red-100' : ''}`} />
                  {errors.jobTitle && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.jobTitle}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Department <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select value={values.department} onChange={set('department')} className={`${SELECT} ${errors.department ? 'border-red-400' : ''}`}>
                        <option value="" disabled />
                        {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {CHEVRON_SVG}
                    </div>
                    {errors.department && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.department}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Start Date <span className="text-red-500">*</span></label>
                    <input type="date" value={values.startDate} onChange={set('startDate')} className={`${INPUT} ${errors.startDate ? 'border-red-400 focus:ring-red-100' : ''}`} style={{ colorScheme: 'light' }} />
                    {errors.startDate && <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.startDate}</p>}
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Assign Employees</label>
                  <div className="relative">
                    <div className="min-h-[44px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-[13.5px] font-medium text-gray-700">
                      <div className="flex flex-wrap gap-1.5">
                        {values.assignedEmployees.map((name, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-md bg-[#E8F1FF] px-2 py-0.5 text-[12px] font-semibold text-[#155DFC]">
                            {name} <button type="button" onClick={() => toggleEmployee(name)} className="text-[#155DFC]/60 hover:text-[#155DFC]">×</button>
                          </span>
                        ))}
                        {values.assignedEmployees.length === 0 && <span className="text-gray-400">Select employees..</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EMPLOYEE_OPTIONS.filter(n => !values.assignedEmployees.includes(n)).map(name => (
                      <button type="button" key={name} onClick={() => toggleEmployee(name)} className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[12px] font-medium text-gray-600 hover:border-[#155DFC]/40 hover:bg-[#E8F1FF] hover:text-[#155DFC] transition-all">+ {name}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mx-auto w-full max-w-[846px] min-h-[485px] rounded-[10px] border-[1.26px] border-[#E5E7EB] bg-[#F9FAFB] p-8">
                <div className="grid grid-cols-2 gap-6">
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
              <div className="mx-auto w-full max-w-[846px] space-y-4">
                <div className="rounded-[10px] border-[1.26px] border-[#E5E7EB] bg-[#F9FAFB] min-h-[485px] p-8">
                  <div className="grid grid-cols-2 gap-6">
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
          <div className="flex items-center justify-between px-8 py-5 border-t border-gray-50 shrink-0">
            {step === 1 ? (
              <button type="button" onClick={onClose} className={BTN_CANCEL} style={BTN_CANCEL_STYLE}>Cancel</button>
            ) : (
              <button type="button" onClick={handleBack} className={BTN_BACK} style={BTN_BACK_STYLE}>Back</button>
            )}
            {step < 3 ? (
              <button type="button" onClick={handleNext} className={BTN_PRIMARY}>Next</button>
            ) : (
              <button type="button" onClick={handleSubmit} className={BTN_PRIMARY}>
                {mode === 'add' ? 'Send Invitation' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
