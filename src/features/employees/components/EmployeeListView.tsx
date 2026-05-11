"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PageHeaderDecorativeCircles, TablePagination } from '@/common/ui';
import {
  Eye, Plus, Search, Trash2, Loader2, Send, Check, Power,
  UserCog, FileText, ChevronDown
} from 'lucide-react';
import { EmployeeStatus, EmployeeDTO, CompanyPersonRow } from '../types';
import { useCompanyPeople } from '../api/get-employees';
import { useResendInvitation } from '../api/resend-invitation';
import { useDeleteEmployee } from '../api/delete-employee';
import { useToggleEmployeeStatus } from '../api/toggle-employee-status';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeViewModal } from './EmployeeViewModal';
import { JobDetailsModal } from './JobDetailsModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { StatusActionModal } from './StatusActionModal';
import { StaffViewModal } from './StaffViewModal';
import { resolvePersonDetailTarget } from '../utils/people';

const TABLE_HEADERS = ['Name', 'Role', 'Employment Type', 'Email', 'Department', 'Location', 'Job Title', 'Status', 'Actions'];

function getInitials(name?: string | null) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  return name.charAt(0).toUpperCase() || '?';
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function EmployeeListView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useCompanyPeople({
    search: searchQuery || undefined,
    page: currentPage,
    size: pageSize,
  });

  // Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewPerson, setViewPerson] = useState<CompanyPersonRow | null>(null);
  const [editEmployee, setEditEmployee] = useState<EmployeeDTO | null>(null);
  const [jobDetailsEmployee, setJobDetailsEmployee] = useState<EmployeeDTO | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<EmployeeDTO | null>(null);
  const [statusActionEmployee, setStatusActionEmployee] = useState<EmployeeDTO | null>(null);

  const resendMutation = useResendInvitation();
  const deleteMutation = useDeleteEmployee();
  const toggleStatusMutation = useToggleEmployeeStatus();

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdownId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const clickedTrigger = target?.closest(`[data-employee-dropdown-trigger="${openDropdownId}"]`);
      if (!clickedTrigger && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdownId]);

  useEffect(() => {
    if (!openDropdownId) return;
    const handleViewportChange = () => {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    };
    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [openDropdownId]);

  const handleResend = async (employeeId: string) => {
    const companyId = localStorage.getItem('current_company_id');
    if (!companyId) return;
    try {
      await resendMutation.mutateAsync({ companyId, employeeId });
      alert('Invitation resent successfully!');
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to resend invitation'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteEmployee) return;
    const companyId = localStorage.getItem('current_company_id');
    if (!companyId) return;
    try {
      await deleteMutation.mutateAsync({ companyId, employeeId: deleteEmployee.id });
      setDeleteEmployee(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to delete employee'));
    }
  };

  const handleSaveEmployee = () => {
    setIsAddOpen(false);
    setEditEmployee(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDropdownToggle = (event: React.MouseEvent<HTMLButtonElement>, employeeId: string) => {
    if (openDropdownId === employeeId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setOpenDropdownId(employeeId);
    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.right - 224,
    });
  };

  const handleToggleStatus = async (employee: EmployeeDTO) => {
    const companyId = localStorage.getItem('current_company_id');
    if (!companyId) return;

    const action = employee.status === EmployeeStatus.ACTIVE ? 'terminate' : 'activate';

    try {
      await toggleStatusMutation.mutateAsync({
        companyId,
        employeeId: employee.id,
        action,
      });
    } catch (err: unknown) {
      alert(getErrorMessage(err, `Failed to ${action} employee`));
    }
  };

  const [supervisor, setSupervisor] = useState('All supervisors');
  const [department, setDepartment] = useState('All departments');

  const employeeStatusAction = statusActionEmployee?.status === EmployeeStatus.ACTIVE ? 'terminate' : 'activate';

  const employees = data?.data.items || [];
  const totalPages = Math.max(1, data?.data.totalPages ?? 1);
  const totalItems = data?.data.totalItems ?? employees.length;
  // Use pageSize from state

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">

      {/* ── Page Header Card ───────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between cursor-pointer group"
        onClick={() => setIsAddOpen(true)}
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <PageHeaderDecorativeCircles />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <UserCog size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Employee List</h1>
            <p className="text-white/80 text-sm mt-0.5">
              Manage all employees
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform">
          <Plus size={28} className="text-white" />
        </div>
        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
      </div>

      {/* ── Search / Filter Bar ────────────────────────────────────────── */}
      <div 
        className="bg-white rounded-xl border border-gray-100 px-4 py-1.5 flex flex-wrap gap-3 items-center min-h-[48px]"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="relative w-full max-w-[340px] md:max-w-[420px] lg:max-w-[500px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee locally..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <select
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              className="appearance-none h-8 pl-3 pr-8 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
            >
              <option>All supervisors</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="appearance-none h-8 pl-3 pr-8 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
            >
              <option>All departments</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={() => {}}
            className="h-8 px-6 bg-[#2B7FFF] text-white text-[13px] font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Apply
          </button>
        </div>
      </div>

      <div 
        className="bg-white rounded-2xl border border-[#2B7FFF] overflow-hidden mt-2"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr 
                className="text-xs font-semibold text-white uppercase tracking-wide"
                style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
              >
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="px-4 py-3.5 text-left font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white text-left">
              {isLoading ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#155DFC]" />
                      <p className="text-[14px] font-medium text-gray-500 font-[Inter,sans-serif]">Loading employees...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center text-red-500 font-[Inter,sans-serif]">
                    <p className="text-[14px] font-medium">Failed to load employees</p>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-16 text-center text-gray-400 font-medium font-[Inter,sans-serif]">No employees found</td>
                </tr>
              ) : (
                employees.map((person, index) => (
                  <tr
                    key={person.id}
                    onClick={() => setViewPerson(person)}
                    className={`border-b border-[#E5E7EB] group transition-colors hover:bg-blue-50/30 cursor-pointer ${
                      index % 2 === 1 ? 'bg-gray-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3 text-left">
                        <div 
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)' }}
                        >
                          {getInitials(person.fullName)}
                        </div>
                        <span className="text-[15px] font-medium text-gray-800 whitespace-nowrap">
                          {person.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${
                        person.platformRole === 'STAFF'
                          ? 'bg-[#FFF7ED] text-[#CA3500]'
                          : person.platformRole === 'EMPLOYEE'
                            ? 'bg-[#EFF6FF] text-[#1447E6]'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {person.displayRoleLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#374151]">
                        {person.employmentTypeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{person.email}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span 
                        className="text-[12px] font-medium px-2.5 py-1 rounded-full"
                        style={{ color: '#1447E6', backgroundColor: '#EFF6FF' }}
                      >
                        {person.departmentName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-[Inter,sans-serif]">
                      {person.companySiteName || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{person.jobTitle}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        person.status === EmployeeStatus.ACTIVE ? 'bg-[#00C95033] text-[#00C950]'
                        : person.status === EmployeeStatus.PENDING ? 'bg-[#FF690033] text-[#FF6900]'
                        : 'bg-[#EF444433] text-[#EF4444]'
                      }`}>
                        {person.status === EmployeeStatus.ACTIVE ? 'Active'
                          : person.status === EmployeeStatus.PENDING ? 'Pending'
                          : person.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {/* Resend invitation (pending only) */}
                        {person.platformRole === 'EMPLOYEE' && person.status === EmployeeStatus.PENDING && (
                          <button
                            onClick={() => handleResend(person.id)}
                            disabled={resendMutation.isPending}
                            title="Resend Invitation"
                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-orange-50 hover:text-[#B45309] disabled:opacity-50"
                          >
                            {resendMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                          </button>
                        )}

                        {/* View */}
                        <button
                          onClick={() => setViewPerson(person)}
                          title="View Details"
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                        >
                          <Eye size={17} />
                        </button>

                        {/* Update Dropdown */}
                        {person.platformRole === 'EMPLOYEE' && (
                        <div className="relative">
                          <button
                            data-employee-dropdown-trigger={person.id}
                            onClick={(event) => handleDropdownToggle(event, person.id)}
                            title="Update"
                            className={`rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC] flex items-center gap-0.5 ${openDropdownId === person.id ? 'bg-blue-50 text-[#155DFC]' : ''}`}
                          >
                            <ChevronDown size={17} />
                          </button>
                        </div>
                        )}

                        {/* Delete */}
                        {person.platformRole === 'EMPLOYEE' && (person.status === EmployeeStatus.ACTIVE || person.status === EmployeeStatus.INACTIVE || person.status === EmployeeStatus.TERMINATED) && (
                          <button
                            onClick={() => setStatusActionEmployee(person.raw)}
                            title={person.status === EmployeeStatus.ACTIVE ? 'Terminate Employee' : 'Activate Employee'}
                            className={`rounded-lg p-2 text-gray-400 transition-all ${
                              person.status === EmployeeStatus.ACTIVE
                                ? 'hover:bg-amber-50 hover:text-amber-500'
                                : 'hover:bg-emerald-50 hover:text-emerald-500'
                            }`}
                          >
                            {person.status === EmployeeStatus.ACTIVE ? <Power size={17} /> : <Check size={17} />}
                          </button>
                        )}

                        {person.platformRole === 'EMPLOYEE' && <button
                          onClick={() => setDeleteEmployee(person.raw)}
                          title="Delete Employee"
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        totalItems={totalItems}
      />

      {/* ── Modals ─────────────────────────────────────────────────────── */}

      {/* Add Modal */}
      <EmployeeFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveEmployee}
        mode="add"
      />

      {/* Edit Personal Info Modal */}
      {editEmployee && (
        <EmployeeFormModal
          isOpen={!!editEmployee}
          onClose={() => setEditEmployee(null)}
          onSave={handleSaveEmployee}
          mode="edit"
          initialData={editEmployee}
        />
      )}

      {/* View Modal */}
      <EmployeeViewModal
        isOpen={!!viewPerson && resolvePersonDetailTarget(viewPerson) === 'employee'}
        onClose={() => setViewPerson(null)}
        employeeId={viewPerson && resolvePersonDetailTarget(viewPerson) === 'employee' ? viewPerson.id : null}
      />
      <StaffViewModal
        isOpen={!!viewPerson && resolvePersonDetailTarget(viewPerson) === 'staff'}
        onClose={() => setViewPerson(null)}
        staffId={viewPerson && resolvePersonDetailTarget(viewPerson) === 'staff' ? viewPerson.id : null}
      />

      {/* Job & Contract Update Modal */}
      {jobDetailsEmployee && (
        <JobDetailsModal
          isOpen={!!jobDetailsEmployee}
          onClose={() => setJobDetailsEmployee(null)}
          onSave={() => setJobDetailsEmployee(null)}
          entityType="employee"
          entityId={jobDetailsEmployee.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteEmployee && (
        <DeleteConfirmationModal
          isOpen={!!deleteEmployee}
          onClose={() => setDeleteEmployee(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Employee"
          message="Are you sure you want to permanently delete"
          itemName={`${deleteEmployee.firstName} ${deleteEmployee.lastName}`}
        />
      )}

      {statusActionEmployee && (
        <StatusActionModal
          isOpen={!!statusActionEmployee}
          onClose={() => setStatusActionEmployee(null)}
          onConfirm={async () => {
            await handleToggleStatus(statusActionEmployee);
            setStatusActionEmployee(null);
          }}
          isLoading={toggleStatusMutation.isPending}
          action={employeeStatusAction}
          entityLabel="Employee"
          itemName={statusActionEmployee.name || `${statusActionEmployee.firstName || ''} ${statusActionEmployee.lastName || ''}`.trim()}
        />
      )}

      {openDropdownId && dropdownPosition && (() => {
        const activeEmployee = employees.find((person) => person.id === openDropdownId)?.raw;
        if (!activeEmployee) return null;

        return createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[260] w-56 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <button
              onClick={() => {
                setOpenDropdownId(null);
                setDropdownPosition(null);
                setEditEmployee(activeEmployee);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-[#F8FAFF] hover:text-[#155DFC] transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-[#E8F1FF] flex items-center justify-center text-[#155DFC] shrink-0">
                <UserCog size={16} />
              </div>
              <div className="text-left">
                <div className="font-bold">Personal Info</div>
                <div className="text-[11px] text-gray-400 font-normal">Name, email, dept, supervisor</div>
              </div>
            </button>
            <div className="h-px bg-gray-50 mx-3" />
            <button
              onClick={() => {
                setOpenDropdownId(null);
                setDropdownPosition(null);
                setJobDetailsEmployee(activeEmployee);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-[#F8FAFF] hover:text-[#155DFC] transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-[#E8F1FF] flex items-center justify-center text-[#155DFC] shrink-0">
                <FileText size={16} />
              </div>
              <div className="text-left">
                <div className="font-bold">Job & Contract</div>
                <div className="text-[11px] text-gray-400 font-normal">Employment, payment, leave</div>
              </div>
            </button>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
