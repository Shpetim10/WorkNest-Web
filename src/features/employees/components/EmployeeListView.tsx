"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, Button, TablePagination } from '@/common/ui';
import {
  Eye, Plus, Search, Trash2, Loader2, Send, Check, Power,
  UserCog, FileText, ChevronDown
} from 'lucide-react';
import { EmployeeStatus, EmployeeDTO } from '../types';
import { useEmployees } from '../api/get-employees';
import { useResendInvitation } from '../api/resend-invitation';
import { useDeleteEmployee } from '../api/delete-employee';
import { useToggleEmployeeStatus } from '../api/toggle-employee-status';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeViewModal } from './EmployeeViewModal';
import { JobDetailsModal } from './JobDetailsModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { StatusActionModal } from './StatusActionModal';

const TABLE_HEADERS = ['Name', 'Email', 'Department', 'Location', 'Job Title', 'Status', 'Actions'];
const ITEMS_PER_PAGE = 10;

function getDepartmentBadge(dept: string) {
  const map: Record<string, string> = {
    Engineering: 'bg-[#E8F1FF] text-[#155DFC]',
    Marketing: 'bg-[#FFF3E0] text-[#E65100]',
    Sales: 'bg-[#E8F5E9] text-[#2E7D32]',
    HR: 'bg-[#F3E5F5] text-[#7B1FA2]',
  };
  return map[dept] ?? 'bg-gray-100 text-gray-600';
}

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useEmployees({ page: currentPage, size: ITEMS_PER_PAGE, search: searchQuery });

  // Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewEmployeeId, setViewEmployeeId] = useState<string | null>(null);
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

  const employeeStatusAction = statusActionEmployee?.status === EmployeeStatus.ACTIVE ? 'terminate' : 'activate';

  const employees = data?.data ?? [];
  const totalPages = 1;

  return (
    <div className="animate-in slide-in-from-bottom-2 w-full space-y-8 duration-500 fade-in pb-10">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="font-[Inter,sans-serif] font-semibold text-[#1E2939]" style={{ fontSize: '35px', lineHeight: '36px' }}>
            Employee List
          </h1>
          <p className="font-[Inter,sans-serif] font-normal text-[#4A5565]" style={{ fontSize: '16px', lineHeight: '24px' }}>
            Manage all employees
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} strokeWidth={2.5} />}
          iconPosition="left"
          onClick={() => setIsAddOpen(true)}
          className="h-11 min-w-[180px] rounded-xl bg-gradient-to-r from-[#155DFC] to-[#01c951] px-6 shadow-md hover:shadow-lg hover:shadow-[#155dfc]/20"
        >
          Add Employee
        </Button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <Card className="rounded-[24px] border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} strokeWidth={2} />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-4 text-[13.5px] font-medium text-gray-700 transition-all placeholder:text-gray-400 focus:border-[#155dfc]/40 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10 font-[Inter,sans-serif]"
            />
          </div>
        </div>
      </Card>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card className="rounded-[24px] border border-[#155DFC]/30 p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#E8F1FF]/50">
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="whitespace-nowrap px-6 py-4 font-[Inter,sans-serif] text-[12px] font-semibold uppercase text-[#4A5565]" style={{ lineHeight: '16px', letterSpacing: '0.06em' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] bg-white text-left">
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
                employees.map((employee) => (
                  <tr
                    key={employee.id}
                    onClick={() => setViewEmployeeId(employee.id)}
                    className="group transition-colors hover:bg-gray-50/50 cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#155DFC] to-[#01c951] text-[14px] font-bold text-white shadow-sm">
                          {getInitials(employee.name || `${employee.firstName} ${employee.lastName}`)}
                        </div>
                        <span className="text-[16px] font-semibold text-[#1E2939] font-[Inter,sans-serif] whitespace-nowrap">
                          {employee.name || `${employee.firstName} ${employee.lastName}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-normal text-[#4A5565] font-[Inter,sans-serif]">{employee.email}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[12px] font-bold ${getDepartmentBadge(employee.departmentName)} font-[Inter,sans-serif]`}>
                        {employee.departmentName}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-medium text-[#1E2939] font-[Inter,sans-serif]">
                        {employee.companySiteName || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-left">
                      <span className="text-[14px] font-normal text-[#4A5565] font-[Inter,sans-serif]">{employee.jobTitle}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center rounded-full px-3.5 py-1 text-[11px] font-bold font-[Inter,sans-serif] ${
                        employee.status === EmployeeStatus.ACTIVE ? 'bg-[#F0FDF4] text-[#008236]'
                        : employee.status === EmployeeStatus.PENDING ? 'bg-[#FFFBEB] text-[#B45309]'
                        : 'bg-[#FFF7ED] text-[#CA3500]'
                      }`}>
                        <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {employee.status === EmployeeStatus.ACTIVE ? 'Active'
                          : employee.status === EmployeeStatus.PENDING ? 'Pending'
                          : employee.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {/* Resend invitation (pending only) */}
                        {employee.status === EmployeeStatus.PENDING && (
                          <button
                            onClick={() => handleResend(employee.id)}
                            disabled={resendMutation.isPending}
                            title="Resend Invitation"
                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-orange-50 hover:text-[#B45309] disabled:opacity-50"
                          >
                            {resendMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                          </button>
                        )}

                        {/* View */}
                        <button
                          onClick={() => setViewEmployeeId(employee.id)}
                          title="View Details"
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                        >
                          <Eye size={17} />
                        </button>

                        {/* Update Dropdown */}
                        <div className="relative">
                          <button
                            data-employee-dropdown-trigger={employee.id}
                            onClick={(event) => handleDropdownToggle(event, employee.id)}
                            title="Update"
                            className={`rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC] flex items-center gap-0.5 ${openDropdownId === employee.id ? 'bg-blue-50 text-[#155DFC]' : ''}`}
                          >
                            <ChevronDown size={17} />
                          </button>
                        </div>

                        {/* Delete */}
                        {(employee.status === EmployeeStatus.ACTIVE || employee.status === EmployeeStatus.INACTIVE || employee.status === EmployeeStatus.TERMINATED) && (
                          <button
                            onClick={() => setStatusActionEmployee(employee)}
                            title={employee.status === EmployeeStatus.ACTIVE ? 'Terminate Employee' : 'Activate Employee'}
                            className={`rounded-lg p-2 text-gray-400 transition-all ${
                              employee.status === EmployeeStatus.ACTIVE
                                ? 'hover:bg-amber-50 hover:text-amber-500'
                                : 'hover:bg-emerald-50 hover:text-emerald-500'
                            }`}
                          >
                            {employee.status === EmployeeStatus.ACTIVE ? <Power size={17} /> : <Check size={17} />}
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteEmployee(employee)}
                          title="Delete Employee"
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

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
        isOpen={!!viewEmployeeId}
        onClose={() => setViewEmployeeId(null)}
        employeeId={viewEmployeeId}
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
        const activeEmployee = employees.find((employee) => employee.id === openDropdownId);
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
