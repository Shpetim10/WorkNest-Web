"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, Button, TablePagination } from '@/common/ui';
import {
  ChevronDown, Eye, Plus, Search, Trash2, Loader2, Send, Users2, UserCog, FileText, Check, Power,
} from 'lucide-react';
import { EmployeeStatus, StaffDTO } from '../types';
import { useStaff } from '../api/get-staff';
import { useResendInvitation } from '../api/resend-invitation';
import { useDeleteStaff } from '../api/delete-staff';
import { useToggleStaffStatus } from '../api/toggle-staff-status';
import { StaffFormModal } from './StaffFormModal';
import { StaffViewModal } from './StaffViewModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { JobDetailsModal } from './JobDetailsModal';
import { StatusActionModal } from './StatusActionModal';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getDepartmentBadge(dept: string) {
  const map: Record<string, string> = {
    Engineering: 'bg-[#E8F1FF] text-[#155DFC]',
    Marketing:   'bg-[#FFF3E0] text-[#E65100]',
    Sales:       'bg-[#E8F5E9] text-[#2E7D32]',
    HR:          'bg-[#F3E5F5] text-[#7B1FA2]',
  };
  return map[dept] ?? 'bg-gray-100 text-gray-600';
}

function getInitials(name: string | undefined | null) {
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

const TABLE_HEADERS = ['Name', 'Email', 'Department', 'Location', 'Job Title', 'Employees', 'Status', 'Actions'];
const ITEMS_PER_PAGE = 10;

// ─── Component ─────────────────────────────────────────────────────────────────
export function StaffListView() {
  const { data, isLoading, isError } = useStaff();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewStaffId, setViewStaffId] = useState<string | null>(null);
  const [editStaff, setEditStaff] = useState<StaffDTO | null>(null);
  const [jobDetailsStaff, setJobDetailsStaff] = useState<StaffDTO | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffDTO | null>(null);
  const [statusActionStaff, setStatusActionStaff] = useState<StaffDTO | null>(null);

  const resendMutation = useResendInvitation();
  const deleteMutation = useDeleteStaff();
  const toggleStatusMutation = useToggleStaffStatus();

  useEffect(() => {
    if (!openDropdownId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const clickedTrigger = target?.closest(`[data-staff-dropdown-trigger="${openDropdownId}"]`);
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
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;
    if (!companyId) return;

    try {
      await resendMutation.mutateAsync({ companyId, employeeId });
      alert('Invitation resent successfully!');
    } catch (err: unknown) {
      console.error('Failed to resend invitation:', err);
      alert(getErrorMessage(err, 'Failed to resend invitation'));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const staffList = data?.data ?? [];

  const filteredStaff = staffList.filter(
    (s) => {
      const fullName = s.name || `${s.firstName} ${s.lastName}`;
      return (fullName.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
             (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    }
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSaveStaff = () => {
    setEditStaff(null);
    setJobDetailsStaff(null);
    setIsAddOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteStaff) return;
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;
    if (!companyId) return;

    try {
      await deleteMutation.mutateAsync({ companyId, staffId: deleteStaff.id });
      setDeleteStaff(null);
    } catch (err: unknown) {
      console.error('Failed to delete staff member:', err);
      alert(getErrorMessage(err, 'Failed to delete staff member'));
    }
  };

  const handleToggleStatus = async (staffMember: StaffDTO) => {
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;
    if (!companyId) return;

    const action = staffMember.status === EmployeeStatus.ACTIVE ? 'terminate' : 'activate';

    try {
      await toggleStatusMutation.mutateAsync({
        companyId,
        staffId: staffMember.id,
        action,
      });
    } catch (err: unknown) {
      console.error(`Failed to ${action} staff member:`, err);
      alert(getErrorMessage(err, `Failed to ${action} staff member`));
    }
  };

  const staffStatusAction = statusActionStaff?.status === EmployeeStatus.ACTIVE ? 'terminate' : 'activate';

  const handleDropdownToggle = (event: React.MouseEvent<HTMLButtonElement>, staffId: string) => {
    if (openDropdownId === staffId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setOpenDropdownId(staffId);
    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.right - 224,
    });
  };

  return (
    <div className="animate-in slide-in-from-bottom-2 w-full space-y-8 duration-500 fade-in pb-10">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="font-[Inter,sans-serif] font-semibold text-[#1E2939]" style={{ fontSize: '35px', lineHeight: '36px' }}>
            Staff Management
          </h1>
          <p className="font-[Inter,sans-serif] font-normal text-[#4A5565]" style={{ fontSize: '16px', lineHeight: '24px' }}>
            Manage staff members and their permissions
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} strokeWidth={2.5} />}
          iconPosition="left"
          onClick={() => setIsAddOpen(true)}
          className="h-11 min-w-[160px] rounded-xl bg-gradient-to-r from-[#155DFC] to-[#01c951] px-6 shadow-md hover:shadow-lg hover:shadow-[#155dfc]/20"
        >
          Add Staff
        </Button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <Card className="rounded-[24px] border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} strokeWidth={2} />
          </div>
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-4 text-[13.5px] font-medium text-gray-700 transition-all placeholder:text-gray-400 focus:border-[#155dfc]/40 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10"
            />
        </div>
      </Card>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card className="rounded-[24px] border border-[#155DFC]/30 p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#155DFC]/10 bg-[#E8F1FF]/50">
                {TABLE_HEADERS.map((header) => (
                  <th key={header} className="whitespace-nowrap px-6 py-4 font-[Inter,sans-serif] text-[12px] font-semibold uppercase text-[#4A5565]" style={{ lineHeight: '16px', letterSpacing: '0.06em' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#155DFC]" />
                      <p className="text-[14px] font-medium text-gray-500 font-[Inter,sans-serif]">Loading staff members...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center text-red-500 font-[Inter,sans-serif]">
                    <p className="text-[14px] font-medium">Failed to load staff members</p>
                  </td>
                </tr>
              ) : paginatedStaff.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-16 text-center text-gray-400 font-medium">No staff members found</td>
                </tr>
              ) : (
                paginatedStaff.map((member) => (
                  <tr 
                    key={member.id} 
                    onClick={() => setViewStaffId(member.id)}
                    className="group transition-colors hover:bg-gray-50/50 cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#155DFC] to-[#01c951] text-[14px] font-bold text-white shadow-sm">
                          {getInitials(member.name || `${member.firstName} ${member.lastName}`)}
                        </div>
                        <span className="text-[16px] font-semibold text-[#1E2939] font-[Inter,sans-serif] whitespace-nowrap">
                          {member.name || `${member.firstName} ${member.lastName}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-normal text-[#4A5565] font-[Inter,sans-serif]">{member.email}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[12px] font-bold ${getDepartmentBadge(member.departmentName || '')} font-[Inter,sans-serif]`}>
                        {member.departmentName || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-medium text-[#1E2939] font-[Inter,sans-serif]">
                        {member.companySiteName || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-left">
                      <span className="text-[14px] font-normal text-[#4A5565] font-[Inter,sans-serif]">{member.jobTitle}</span>
                    </td>
                    <td className="px-6 py-5 text-left">
                      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#E8F1FF] text-[#155DFC] transition-all hover:bg-[#155DFC]/10">
                        <Users2 size={18} strokeWidth={2.5} />
                        <span className="text-[16px] font-bold">{member.assignedEmployeesCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span 
                        className={`inline-flex items-center rounded-full px-3.5 py-1 text-[11px] font-bold font-[Inter,sans-serif] ${
                          member.status === EmployeeStatus.ACTIVE 
                            ? 'bg-[#F0FDF4] text-[#008236]' 
                            : member.status === EmployeeStatus.PENDING
                            ? 'bg-[#FFFBEB] text-[#B45309]'
                            : 'bg-[#FFF7ED] text-[#CA3500]'
                        }`}
                      >
                        <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {member.status === EmployeeStatus.ACTIVE ? 'Active' : 
                         member.status === EmployeeStatus.PENDING ? 'Pending' : 
                         member.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {member.status === EmployeeStatus.PENDING && (
                          <button 
                            onClick={() => handleResend(member.id)}
                            disabled={resendMutation.isPending}
                            title="Resend Invitation"
                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-orange-50 hover:text-[#B45309] disabled:opacity-50"
                          >
                            {resendMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                          </button>
                        )}
                        <button 
                          onClick={() => setViewStaffId(member.id)}
                          title="View Details"
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                        >
                          <Eye size={18} />
                        </button>

                        <div className="relative">
                          <button
                            data-staff-dropdown-trigger={member.id}
                            onClick={(event) => handleDropdownToggle(event, member.id)}
                            title="Update"
                            className={`rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC] flex items-center gap-0.5 ${openDropdownId === member.id ? 'bg-blue-50 text-[#155DFC]' : ''}`}
                          >
                            <ChevronDown size={18} />
                          </button>
                        </div>

                        {(member.status === EmployeeStatus.ACTIVE || member.status === EmployeeStatus.INACTIVE || member.status === EmployeeStatus.TERMINATED) && (
                          <button
                            onClick={() => setStatusActionStaff(member)}
                            title={member.status === EmployeeStatus.ACTIVE ? 'Terminate Staff Member' : 'Activate Staff Member'}
                            className={`rounded-lg p-2 text-gray-400 transition-all ${
                              member.status === EmployeeStatus.ACTIVE
                                ? 'hover:bg-amber-50 hover:text-amber-500'
                                : 'hover:bg-emerald-50 hover:text-emerald-500'
                            }`}
                          >
                            {member.status === EmployeeStatus.ACTIVE ? <Power size={18} /> : <Check size={18} />}
                          </button>
                        )}

                        <button 
                          onClick={() => setDeleteStaff(member)}
                          title="Delete Staff Member"
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={18} />
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

      {/* Pagination Footer */}
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      
      {/* Add/Edit Modal */}
      {(isAddOpen || editStaff) && (
        <StaffFormModal
          isOpen={isAddOpen || !!editStaff}
          onClose={() => { setIsAddOpen(false); setEditStaff(null); }}
          onSave={handleSaveStaff}
          mode={editStaff ? 'edit' : 'add'}
          initialData={editStaff || undefined}
        />
      )}

      {/* View Modal */}
      <StaffViewModal
        isOpen={!!viewStaffId}
        onClose={() => setViewStaffId(null)}
        staffId={viewStaffId}
      />

      {jobDetailsStaff && (
        <JobDetailsModal
          isOpen={!!jobDetailsStaff}
          onClose={() => setJobDetailsStaff(null)}
          onSave={() => setJobDetailsStaff(null)}
          entityType="staff"
          entityId={jobDetailsStaff.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteStaff && (
        <DeleteConfirmationModal
          isOpen={!!deleteStaff}
          onClose={() => setDeleteStaff(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Staff Member"
          message="Are you sure you want to delete staff member"
          itemName={deleteStaff?.name}
        />
      )}

      {statusActionStaff && (
        <StatusActionModal
          isOpen={!!statusActionStaff}
          onClose={() => setStatusActionStaff(null)}
          onConfirm={async () => {
            await handleToggleStatus(statusActionStaff);
            setStatusActionStaff(null);
          }}
          isLoading={toggleStatusMutation.isPending}
          action={staffStatusAction}
          entityLabel="Staff Member"
          itemName={statusActionStaff.name || `${statusActionStaff.firstName} ${statusActionStaff.lastName}`}
        />
      )}

      {openDropdownId && dropdownPosition && (() => {
        const activeStaff = staffList.find((staffMember) => staffMember.id === openDropdownId);
        if (!activeStaff) return null;

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
                setEditStaff(activeStaff);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-[#F8FAFF] hover:text-[#155DFC] transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-[#E8F1FF] flex items-center justify-center text-[#155DFC] shrink-0">
                <UserCog size={16} />
              </div>
              <div className="text-left">
                <div className="font-bold">Personal Info</div>
                <div className="text-[11px] text-gray-400 font-normal">Name, email, dept, assignments</div>
              </div>
            </button>
            <div className="h-px bg-gray-50 mx-3" />
            <button
              onClick={() => {
                setOpenDropdownId(null);
                setDropdownPosition(null);
                setJobDetailsStaff(activeStaff);
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
