"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, TablePagination } from '@/common/ui';
import { Plus, Search, Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import { useDepartments } from '../api';
import { AddDepartmentModal } from './AddDepartmentModal';
import { EditDepartmentModal } from './EditDepartmentModal';
import { DeleteDepartmentModal } from './DeleteDepartmentModal';
import { DepartmentDetailsModal } from './DepartmentDetailsModal';

const ITEMS_PER_PAGE = 10;

export function DepartmentsView() {
  const { data: departments, isLoading, isError, error } = useDepartments();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!searchQuery.trim()) return departments;
    const query = searchQuery.toLowerCase();
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(query) || 
      dept.description?.toLowerCase().includes(query)
    );
  }, [departments, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE);
  const paginatedDepartments = useMemo(() => {
    return filteredDepartments.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredDepartments, currentPage]);

  const selectedDepartment = useMemo(() => {
    return departments?.find(d => d.id === selectedDeptId) || null;
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
    <div className="animate-in slide-in-from-bottom-2 w-full space-y-8 duration-500 fade-in pb-10">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="font-[Inter,sans-serif] text-[35px] font-semibold leading-[36px] text-[#1E2939]">Departments</h1>
          <p className="font-[Inter,sans-serif] text-[16px] font-normal leading-[24px] text-[#4A5565]">
            Manage all departments of your company
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} strokeWidth={2.5} />}
          iconPosition="left"
          onClick={() => setIsAddModalOpen(true)}
          className="h-11 min-w-[180px] rounded-xl bg-gradient-to-r from-[#155DFC] to-[#01c951] px-6 shadow-md hover:shadow-lg hover:shadow-[#155dfc]/20"
        >
          Add Department
        </Button>
      </div>

      {/* Filters/Search section */}
      <Card className="rounded-[24px] border-0 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="relative w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-gray-50/50 border border-gray-100 rounded-xl text-[13.5px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40 transition-all font-[Inter,sans-serif]"
          />
        </div>
      </Card>

      {/* Table Container */}
      <Card className="overflow-hidden rounded-[24px] border border-[#155DFC]/30 p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#E8F1FF]/50 text-left">
                {TABLE_HEADERS.map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-[12px] font-semibold text-[#4A5565] leading-[16px] tracking-[0.06em] uppercase whitespace-nowrap font-[Inter,sans-serif]"
                  >
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
              ) : paginatedDepartments.length === 0 ? (
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
                paginatedDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleAction(dept.id, 'view')}>
                    <td className="px-6 py-5">
                      <span className="text-[16px] font-semibold text-[#1E2939] font-[Inter,sans-serif]">{dept.name}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3.5 py-1 rounded-full text-[11px] font-bold font-[Inter,sans-serif] flex items-center w-fit ${
                        dept.status === 'ACTIVE' 
                          ? 'bg-[#F0FDF4] text-[#008236]' 
                          : 'bg-[#FFF7ED] text-[#CA3500]'
                      }`}>
                        <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {dept.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-normal text-[#4A5565] font-[Inter,sans-serif] line-clamp-1">{dept.description || '—'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-normal text-[#364153] font-[Inter,sans-serif]">
                        {dept.employeeCount} employees
                      </span>
                    </td>
                    <td className="px-6 py-5 text-[14px] text-[#4A5565] font-normal font-[Inter,sans-serif] whitespace-nowrap">
                      {formatDate(dept.createdAt)}
                    </td>
                    <td className="px-6 py-5">
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
      </Card>

      {/* Pagination Footer */}
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
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
