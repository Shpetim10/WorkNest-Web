"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Briefcase, Building2, Calendar, Phone, MapPin } from 'lucide-react';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { EmployeeStatus, EmployeeDTO } from '../types';
import { useProvisionEmployee } from '../api/provision-employee';
import { useUpdateEmployee } from '../api/update-employee';
import { useEmployee } from '../api/get-employee-details';

// ─── Constants ─────────────────────────────────────────────────────────────────

const LABEL_CLASS = 'block font-[Inter,sans-serif] text-[13px] font-bold uppercase tracking-wider text-[#4A5565] mb-2';
const INPUT_CLASS = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';
const SELECT_CLASS = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 pr-10 text-[14px] font-medium text-gray-700 appearance-none outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 font-[Inter,sans-serif] hover:border-gray-300';

interface DepartmentLookup {
  id: string;
  name: string;
}

interface SiteLookup {
  id: string;
  code: string;
  name: string;
}

interface StaffLookup {
  id?: string;
  roleAssignmentId?: string;
  supervisorRoleAssignmentId?: string;
  fullName?: string;
  name?: string;
}

function getSupervisorOptionValue(supervisor: StaffLookup) {
  return supervisor.roleAssignmentId || supervisor.supervisorRoleAssignmentId || supervisor.id || '';
}

function getSupervisorOptionLabel(supervisor: StaffLookup) {
  return supervisor.fullName || supervisor.name || 'Unnamed Supervisor';
}

function matchesSupervisorId(supervisor: StaffLookup, supervisorId: string) {
  if (!supervisorId) return false;

  const normalizedTarget = supervisorId.toLowerCase();
  const possibleIds = [
    supervisor.roleAssignmentId,
    supervisor.supervisorRoleAssignmentId,
    supervisor.id,
  ].filter(Boolean) as string[];

  return possibleIds.some((value) => value.toLowerCase() === normalizedTarget);
}

function findMatchingSupervisor(supervisors: StaffLookup[], supervisorId: string) {
  return supervisors.find((supervisor) => matchesSupervisorId(supervisor, supervisorId));
}

// ─── Types ──────────────────────────────────────────────────────────────────────
interface FormValues {
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

const EMPTY_FORM: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  jobTitle: '',
  departmentName: '',
  location: '',
  supervisorId: '',
  hireDate: '',
  employeeId: '',
};

// ─── Component ──────────────────────────────────────────────────────────────────
export function EmployeeFormModal({ isOpen, onClose, onSave, mode, initialData }: EmployeeFormModalProps) {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') || '' : '';
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [departments, setDepartments] = useState<DepartmentLookup[]>([]);
  const [locations, setLocations] = useState<SiteLookup[]>([]);
  const [supervisors, setSupervisors] = useState<StaffLookup[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const isInitialLoad = useRef(true);
  const firstInputRef = useRef<HTMLInputElement>(null);
  // Holds the supervisor ID to apply once the supervisor list finishes loading
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
    if (!isOpen) return;

    if (!companyId) return;

    const fetchLookups = async () => {
      try {
        const [deptRes, siteRes] = await Promise.all([
          apiClient.get<ApiResponse<DepartmentLookup[]>>(`/companies/${companyId}/departments/lookup`),
          apiClient.get<ApiResponse<SiteLookup[]>>(`/companies/${companyId}/sites/lookup`)
        ]);
        setDepartments(deptRes.data.data || []);
        setLocations(siteRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch modal lookups:', err);
      }
    };

    fetchLookups();
  }, [isOpen]);

  // Fetch supervisors when department changes; once loaded, apply any pending supervisor selection
  useEffect(() => {
    if (!companyId || !values.departmentName) {
      setSupervisors([]);
      return;
    }

    const fetchStaff = async () => {
      setIsLoadingStaff(true);
      try {
        const res = await apiClient.get<ApiResponse<StaffLookup[]>>(
          `/companies/${companyId}/staff/lookup`,
          { params: { departmentId: values.departmentName } }
        );
        const list = res.data.data || [];
        setSupervisors(list);

        // If we have a pending supervisor ID (from edit mode prefill), apply it now
        // that the options are available in the list.
        if (pendingSupervisorId.current) {
          const matchedSupervisor = findMatchingSupervisor(list, pendingSupervisorId.current);
          if (matchedSupervisor) {
            const resolvedSupervisorId = getSupervisorOptionValue(matchedSupervisor) || pendingSupervisorId.current;
            setValues((prev) => ({ ...prev, supervisorId: resolvedSupervisorId }));
            pendingSupervisorId.current = '';
          }
          // If not found, the fallback option keeps it selected; clear pending anyway.
          else {
            pendingSupervisorId.current = '';
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff lookup:', err);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [values.departmentName, isOpen]);

  // Prefill data when in edit mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && !editData) {
        pendingSupervisorId.current = '';
        setSupervisors([]);
        setValues(EMPTY_FORM);
        setErrors({});
        return;
      }

      if (mode === 'edit' && editData) {
        isInitialLoad.current = true;
        const supervisorId = editData.supervisorRoleAssignmentId || '';

        // Store the intended supervisor so we can apply it after the supervisor
        // list loads (avoids race condition between prefill and async fetch).
        pendingSupervisorId.current = supervisorId;

        setValues({
          firstName: editData.firstName || '',
          lastName: editData.lastName || '',
          email: editData.email || '',
          jobTitle: editData.jobTitle || '',
          departmentName: editData.departmentId || '',
          location: editData.companySiteId || '',
          supervisorId, // set immediately so it shows in the fallback option
          hireDate: editData.hireDate ? editData.hireDate.split('T')[0] : '',
          employeeId: editData.employeeId || '',
        });
      } else {
        isInitialLoad.current = false;
        pendingSupervisorId.current = '';
        setSupervisors([]);
        setValues({
          ...EMPTY_FORM,
          employeeId: `WN-${Math.floor(Math.random() * 900 + 100)}`,
        });
      }
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, mode, editData]);

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
    const val = e.target.value;
    
    if (field === 'departmentName') {
      const isManualChange = val !== (mode === 'edit' ? editData?.departmentId : '');
      setValues(prev => ({ 
        ...prev, 
        departmentName: val,
        supervisorId: isManualChange ? '' : prev.supervisorId
      }));
    } else {
      setValues(prev => ({ ...prev, [field]: val }));
    }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (mode === 'add') {
      try {
        const companyId = localStorage.getItem('current_company_id');
        if (!companyId) throw new Error('Company ID missing');

        await provisionMutation.mutateAsync({
          companyId,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          jobTitle: values.jobTitle.trim(),
          departmentId: values.departmentName, // The select stores the ID here
          companySiteId: values.location || undefined,
          supervisorRoleAssignmentId: values.supervisorId || undefined,
          startDate: values.hireDate,
        });

        onSave({}); // triggers list invalidation, closes modal
      } catch (err: any) {
        console.error('Failed to provision employee:', err);
        const msg = err.response?.data?.message || 'Failed to create employee';
        alert(msg); // simple error display for now
      }
    } else {
      try {
        const companyId = localStorage.getItem('current_company_id');
        if (!companyId) throw new Error('Company ID missing');
        if (!initialData?.id) throw new Error('Employee ID missing');

        await updateMutation.mutateAsync({
          employeeId: initialData.id,
          data: {
            companyId,
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            jobTitle: values.jobTitle.trim(),
            departmentId: values.departmentName || undefined,
            companySiteId: values.location || undefined,
            supervisorRoleAssignmentId: values.supervisorId || undefined,
            startDate: values.hireDate,
          },
        });

        onSave({}); // triggers list invalidation, closes modal
      } catch (err: any) {
        console.error('Failed to update employee:', err);
        const msg = err.response?.data?.message || 'Failed to update employee';
        alert(msg);
      }
    }
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

              {/* Department + Location */}
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
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 4.5L6 8L9.5 4.5"/></svg></div>
                  </div>
                  {errors.departmentName && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.departmentName}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className={LABEL_CLASS}>
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      id="location"
                      value={values.location}
                      onChange={set('location')}
                      className={`${SELECT_CLASS} pl-11 ${errors.location ? 'border-red-300' : ''}`}
                    >
                      <option value="">Select Location</option>
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.code} – {l.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 4.5L6 8L9.5 4.5"/></svg></div>
                  </div>
                  {errors.location && <p className="text-[12px] font-semibold text-red-500 ml-1">{errors.location}</p>}
                </div>
              </div>

              {/* Supervisor */}
              <div className="space-y-2">
                <label htmlFor="supervisor" className={LABEL_CLASS}>
                  Direct Supervisor
                </label>
                {mode === 'edit' && isLoadingEmployeeDetails ? (
                  <div className="h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-400 flex items-center">
                    Loading employee details...
                  </div>
                ) : (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      id="supervisor"
                      value={values.supervisorId || ''}
                      onChange={set('supervisorId')}
                      disabled={!values.departmentName}
                      className={`${SELECT_CLASS} pl-11 ${(!values.departmentName) ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                    >
                      {!values.departmentName ? (
                        <option value="">Please select a department first...</option>
                      ) : (
                        <>
                          <option value="">No Supervisor Assigned</option>
                          
                          {/* 1. If we are in edit mode, ensure the initial supervisor is always an option even if not in the fetched list */}
                          {mode === 'edit' && editData?.supervisorRoleAssignmentId && !findMatchingSupervisor(supervisors, editData.supervisorRoleAssignmentId || '') && (
                            <option value={editData.supervisorRoleAssignmentId}>
                              {editData.supervisorName || 'Current Supervisor'} (Current)
                            </option>
                          )}

                          {/* 2. Show the fetched supervisors */}
                          {supervisors.map(s => (
                            <option key={getSupervisorOptionValue(s)} value={getSupervisorOptionValue(s)}>
                              {getSupervisorOptionLabel(s)}
                            </option>
                          ))}

                          {/* 3. Loading state indicator if the list is empty */}
                          {isLoadingStaff && supervisors.length === 0 && (
                            <option value="" disabled>Loading team...</option>
                          )}
                        </>
                      )}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.5 4.5L6 8L9.5 4.5"/></svg></div>
                  </div>
                )}
              </div>

              {/* Start Date */}
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
                disabled={provisionMutation.isPending || updateMutation.isPending}
                className={`h-12 rounded-xl bg-gradient-to-r from-[#155DFC] to-[#01c951] px-10 text-[14px] font-bold text-white shadow-lg shadow-[#155DFC]/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-[Inter,sans-serif] ${provisionMutation.isPending || updateMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {provisionMutation.isPending || updateMutation.isPending ? 'Processing...' : (mode === 'add' ? 'Create Account' : 'Confirm Updates')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
