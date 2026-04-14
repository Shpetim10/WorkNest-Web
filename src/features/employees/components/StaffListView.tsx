"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, TablePagination } from '@/common/ui';
import { Edit3, Eye, Plus, Search, Trash2, Loader2, Send, Users2 } from 'lucide-react';
import { EmployeeStatus, StaffDTO } from '../types';
import { useStaff } from '../api/get-staff';
import { useResendInvitation } from '../api/resend-invitation';
import { StaffFormModal } from './StaffFormModal';
import { StaffViewModal } from './StaffViewModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

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

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * Staff Data Transfer Object
 */
export interface StaffDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  departmentName: string;
  jobTitle: string;
  companySiteName: string;
  role: string;
  startDate: string;
  status: EmployeeStatus;
  assignedEmployeesCount?: number;
  permissionCodes?: string[];
}

const TABLE_HEADERS = ['Name', 'Email', 'Department', 'Location', 'Job Title', 'Employees', 'Status', 'Actions'];
const ITEMS_PER_PAGE = 10;

// ─── Component ─────────────────────────────────────────────────────────────────
export function StaffListView() {
  const { data, isLoading, isError } = useStaff();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewStaffId, setViewStaffId] = useState<string | null>(null);
  const [editStaff, setEditStaff] = useState<StaffDTO | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffDTO | null>(null);

  const resendMutation = useResendInvitation();

  const handleResend = async (employeeId: string) => {
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;
    if (!companyId) return;

    try {
      await resendMutation.mutateAsync({ companyId, employeeId });
      alert('Invitation resent successfully!');
    } catch (err: any) {
      console.error('Failed to resend invitation:', err);
      alert(err.response?.data?.message || 'Failed to resend invitation');
    }
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

  const handleSaveStaff = (updatedMember: any) => {
    // Mutation placeholder
    setEditStaff(null);
    setIsAddOpen(false);
  };

  const handleDeleteConfirm = () => {
    // Mutation placeholder
    setDeleteStaff(null);
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-4 text-[13.5px] font-medium text-gray-700 transition-all placeholder:text-gray-400 focus:border-[#155dfc]/40 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10"
          />
        </div>
      </Card>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-[24px] border border-[#155DFC]/30 p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
                      <div className="flex items-center gap-2">
                        {member.status === EmployeeStatus.PENDING && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleResend(member.id); }}
                            disabled={resendMutation.isPending}
                            title="Resend Invitation"
                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-orange-50 hover:text-[#B45309] disabled:opacity-50"
                          >
                            {resendMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewStaffId(member.id); }}
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditStaff(member); }}
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteStaff(member); }}
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

    </div>
  );
}
