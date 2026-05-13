"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PageHeaderDecorativeCircles, TablePagination } from '@/common/ui';
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
import { useI18n } from '@/common/i18n';

// ─── Helpers ───────────────────────────────────────────────────────────────────
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

const TABLE_HEADER_KEYS = [
  'tables.headers.name',
  'tables.headers.email',
  'tables.headers.department',
  'tables.headers.location',
  'tables.headers.jobTitle',
  'tables.headers.employees',
  'tables.headers.status',
  'tables.headers.actions',
];

// ─── Component ─────────────────────────────────────────────────────────────────
export function StaffListView() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useStaff({
    page: currentPage,
    size: pageSize,
  });

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
      alert(t('employees.invitationResent'));
    } catch (err: unknown) {
      console.error(t('employees.resendFailed'), err);
      alert(getErrorMessage(err, t('employees.resendFailed')));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const staffList = data?.data.items || [];

  const filteredStaff = staffList.filter(
    (s) => {
      const fullName = s.name || `${s.firstName} ${s.lastName}`;
      return (fullName.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
             (s.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    }
  );

  // Pagination Logic
  const totalPages = Math.max(1, data?.data.totalPages ?? 1);
  const totalItems = data?.data.totalItems ?? filteredStaff.length;
  // Use pageSize from state

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
      console.error(t('staff.deleteFailed'), err);
      alert(getErrorMessage(err, t('staff.deleteFailed')));
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
      console.error(t('staff.statusFailed', { action }), err);
      alert(getErrorMessage(err, t('staff.statusFailed', { action })));
    }
  };

  const [date, setDate] = useState('2026-05-01');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');

  const staffStatusAction = statusActionStaff?.status === EmployeeStatus.ACTIVE ? 'terminate' : 'activate';
  const tableHeaders = TABLE_HEADER_KEYS.map((key) => t(key));

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
            <Users2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{t('staff.title')}</h1>
            <p className="text-white/80 text-sm mt-0.5">
              {t('staff.subtitle')}
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
            placeholder={t('employees.searchPlaceholder')}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 px-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />

          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none h-8 pl-3 pr-8 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
            >
              <option value="all">{t('locations.allStatuses')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="appearance-none h-8 pl-3 pr-8 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
            >
              <option value="all">{t('employees.allDepartments')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={() => {}}
            className="h-8 px-6 bg-[#2B7FFF] text-white text-[13px] font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {t('common.actions.apply')}
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
                {tableHeaders.map((header) => (
                  <th key={header} className="px-4 py-3.5 text-left font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white text-left">
              {isLoading ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#155DFC]" />
                      <p className="text-[14px] font-medium text-gray-500 font-[Inter,sans-serif]">{t('staff.loading')}</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-6 py-20 text-center text-red-500 font-[Inter,sans-serif]">
                    <p className="text-[14px] font-medium">{t('staff.failed')}</p>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={tableHeaders.length} className="px-6 py-16 text-center text-gray-400 font-medium">{t('staff.empty')}</td>
                </tr>
              ) : (
                filteredStaff.map((member, index) => (
                  <tr 
                    key={member.id} 
                    onClick={() => setViewStaffId(member.id)}
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
                          {getInitials(member.name || `${member.firstName} ${member.lastName}`)}
                        </div>
                        <span className="text-[15px] font-medium text-gray-800 whitespace-nowrap">
                          {member.name || `${member.firstName} ${member.lastName}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{member.email}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span 
                        className="text-[12px] font-medium px-2.5 py-1 rounded-full"
                        style={{ color: '#1447E6', backgroundColor: '#EFF6FF' }}
                      >
                        {member.departmentName || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-[Inter,sans-serif]">
                      {member.companySiteName || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">{member.jobTitle}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F1FF] text-[#155DFC]">
                        <Users2 size={16} strokeWidth={2.5} />
                        <span className="text-[14px] font-bold">{member.assignedEmployeesCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span 
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          member.status === EmployeeStatus.ACTIVE 
                            ? 'bg-[#00C95033] text-[#00C950]' 
                            : member.status === EmployeeStatus.PENDING
                            ? 'bg-[#FF690033] text-[#FF6900]'
                            : 'bg-[#EF444433] text-[#EF4444]'
                        }`}
                      >
                        {member.status === EmployeeStatus.ACTIVE ? t('common.statuses.active') :
                         member.status === EmployeeStatus.PENDING ? t('common.statuses.pending') :
                         member.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {member.status === EmployeeStatus.PENDING && (
                          <button 
                            onClick={() => handleResend(member.id)}
                            disabled={resendMutation.isPending}
                            title={t('employees.resendInvitation')}
                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-orange-50 hover:text-[#B45309] disabled:opacity-50"
                          >
                            {resendMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                          </button>
                        )}
                        <button 
                          onClick={() => setViewStaffId(member.id)}
                          title={t('common.actions.viewDetails')}
                          className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC]"
                        >
                          <Eye size={18} />
                        </button>

                        <div className="relative">
                          <button
                            data-staff-dropdown-trigger={member.id}
                            onClick={(event) => handleDropdownToggle(event, member.id)}
                            title={t('common.actions.update')}
                            className={`rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-[#155DFC] flex items-center gap-0.5 ${openDropdownId === member.id ? 'bg-blue-50 text-[#155DFC]' : ''}`}
                          >
                            <ChevronDown size={18} />
                          </button>
                        </div>

                        {(member.status === EmployeeStatus.ACTIVE || member.status === EmployeeStatus.INACTIVE || member.status === EmployeeStatus.TERMINATED) && (
                          <button
                            onClick={() => setStatusActionStaff(member)}
                            title={member.status === EmployeeStatus.ACTIVE ? t('staff.terminate') : t('staff.activate')}
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
                          title={t('staff.delete')}
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
      </div>

      {/* Pagination Footer */}
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
          title={t('staff.deleteTitle')}
          message={t('staff.deleteMessage')}
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
          entityLabel={t('staff.entity')}
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
                <div className="font-bold">{t('employees.personalInfo')}</div>
                <div className="text-[11px] text-gray-400 font-normal">{t('staff.assignmentDescription')}</div>
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
                <div className="font-bold">{t('employees.jobContract')}</div>
                <div className="text-[11px] text-gray-400 font-normal">{t('employees.jobContractDescription')}</div>
              </div>
            </button>
          </div>,
          document.body
        );
      })()}

    </div>
  );
}
