"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, TablePagination } from '@/common/ui';
import { Edit3, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { StaffFormModal } from './StaffFormModal';
import { StaffViewModal } from './StaffViewModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface StaffMock {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  assignedCount: number;
  permissions: 'Full Access' | 'Limited Access';
  initials: string;
}

const TABLE_HEADERS = ['Name', 'Job Title', 'Assigned Employees', 'Permissions', 'Actions'];
const ITEMS_PER_PAGE = 10;

// ─── Component ─────────────────────────────────────────────────────────────────
export function StaffListView() {
  const [staff, setStaff] = useState<StaffMock[]>([]); // Mocks removed, starting with empty array
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewStaff, setViewStaff] = useState<StaffMock | null>(null);
  const [editStaff, setEditStaff] = useState<StaffMock | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffMock | null>(null);

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSaveStaff = (updatedMember: StaffMock) => {
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
            className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-4 text-[16px] font-normal leading-[24px] text-gray-700 transition-all placeholder:text-gray-400 focus:border-[#155dfc]/40 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10 font-[Inter,sans-serif]"
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
              {paginatedStaff.map((member) => (
                <tr 
                  key={member.id} 
                  onClick={() => setViewStaff(member)}
                  className="group transition-colors hover:bg-gray-50/50 cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#155DFC] to-[#01c951] text-[14px] font-bold text-white shadow-sm">
                        {member.initials}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-[#1E2939]">{member.name}</p>
                        <p className="text-[12px] font-medium text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-[13.5px] font-medium text-gray-600">{member.jobTitle}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center rounded-lg bg-[#E8F1FF] px-3 py-1.5 text-[12px] font-bold text-[#155DFC]">
                      {member.assignedCount} employees
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[13.5px] font-medium ${member.permissions === 'Full Access' ? 'text-[#00C950]' : 'text-gray-500'}`}>
                      {member.permissions}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setViewStaff(member); }}
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
              ))}
              {paginatedStaff.length === 0 && (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-16 text-center text-gray-400 font-medium">No staff members found</td>
                </tr>
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
      {viewStaff && (
        <StaffViewModal
          isOpen={!!viewStaff}
          onClose={() => setViewStaff(null)}
          staff={viewStaff}
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

    </div>
  );
}
