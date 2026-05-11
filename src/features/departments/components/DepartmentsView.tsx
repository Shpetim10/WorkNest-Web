"use client";

import React, { useState, useMemo } from 'react';
import { Card, Button, PageHeaderDecorativeCircles, TablePagination } from '@/common/ui';
import { Plus, Search, Edit2, Trash2, Eye, Loader2, Building2 } from 'lucide-react';
import { useDepartments } from '../api';
import { AddDepartmentModal } from './AddDepartmentModal';
import { EditDepartmentModal } from './EditDepartmentModal';
import { DeleteDepartmentModal } from './DeleteDepartmentModal';
import { DepartmentDetailsModal } from './DepartmentDetailsModal';


export function DepartmentsView() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data: departments, isLoading, isError } = useDepartments({
    page: currentPage,
    size: pageSize,
  });

  const filteredDepartments = useMemo(() => {
    const items = departments?.items ?? [];
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(dept => 
      dept.name.toLowerCase().includes(query) || 
      dept.description?.toLowerCase().includes(query)
    );
  }, [departments, searchQuery]);

  const totalPages = Math.max(1, departments?.totalPages ?? 1);
  const totalItems = departments?.totalItems ?? filteredDepartments.length;
  // Use pageSize from state

  const selectedDepartment = useMemo(() => {
    return departments?.items.find(d => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  const TABLE_HEADERS = ['NAME', 'STATUS', 'DESCRIPTION', 'EMPLOYEES', 'CREATED AT', 'ACTIONS'];

  const handleAction = (id: string, action: 'view' | 'edit' | 'delete') => {
    setSelectedDeptId(id);
    if (action === 'view') setIsDetailsModalOpen(true);
    if (action === 'edit') setIsEditModalOpen(true);
    if (action === 'delete') setIsDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">

      {/* ── Page Header Card ───────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between cursor-pointer group"
        onClick={() => setIsAddModalOpen(true)}
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <PageHeaderDecorativeCircles />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Departments</h1>
            <p className="text-white/80 text-sm mt-0.5">
              Manage all departments of your company
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
        className="bg-white rounded-xl border border-gray-100 px-4 py-1.5 flex items-center min-h-[48px]"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <div className="relative w-full max-w-[340px] md:max-w-[420px] lg:max-w-[500px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-[13px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40"
          />
        </div>
      </div>

      {/* ── Table Container ────────────────────────────────────────────── */}
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
                  <th
                    key={header}
                    className="px-4 py-3.5 text-left font-semibold"
                  >
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
                      <Loader2 className="w-8 h-8 text-[#155DFC] animate-spin" />
                      <p className="text-[14px] font-medium text-gray-500 font-[Inter,sans-serif]">Loading departments...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 text-red-500 font-[Inter,sans-serif]">
                      <p className="text-[14px] font-medium">Failed to load departments</p>
                    </div>
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40 font-[Inter,sans-serif]">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Search size={22} strokeWidth={1.5} />
                      </div>
                      <p className="text-[14px] font-medium text-gray-500">No departments found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept, index) => (
                  <tr 
                    key={dept.id} 
                    className={`border-b border-[#E5E7EB] hover:bg-blue-50/30 transition-colors group cursor-pointer ${
                      index % 2 === 1 ? 'bg-gray-50/40' : ''
                    }`} 
                    onClick={() => handleAction(dept.id, 'view')}
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-[15px] font-medium text-gray-800 font-[Inter,sans-serif]">{dept.name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium font-[Inter,sans-serif] flex items-center w-fit ${
                        dept.status === 'ACTIVE' 
                          ? 'bg-[#00C95033] text-[#00C950]' 
                          : 'bg-[#EF444433] text-[#EF4444]'
                      }`}>
                        {dept.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-500 font-[Inter,sans-serif] line-clamp-1">{dept.description || '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[14px] font-normal text-gray-600 font-[Inter,sans-serif]">
                        {dept.employeeCount} employees
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-gray-500 font-normal font-[Inter,sans-serif] whitespace-nowrap">
                      {formatDate(dept.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAction(dept.id, 'view'); }}
                          className="p-2 hover:bg-blue-50 text-gray-400 hover:text-[#155DFC] rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAction(dept.id, 'edit'); }}
                          className="p-2 hover:bg-blue-50 text-gray-400 hover:text-[#155DFC] rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAction(dept.id, 'delete'); }}
                          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                          title="Delete"
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

      <AddDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditDepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDeptId(null);
        }}
        department={selectedDepartment}
      />

      <DeleteDepartmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDeptId(null);
        }}
        department={selectedDepartment}
      />

      <DepartmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedDeptId(null);
        }}
        departmentId={selectedDeptId}
        initialData={selectedDepartment}
      />

    </div>
  );
}
