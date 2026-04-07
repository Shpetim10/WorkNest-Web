"use client";

import React, { useState, useMemo } from 'react';
import { Card, Button } from '@/common/ui';
import { Plus, Search, Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import { useDepartments } from '../api';
import { DepartmentListItem } from '../types';
import { AddDepartmentModal } from './AddDepartmentModal';
import { EditDepartmentModal } from './EditDepartmentModal';
import { DeleteDepartmentModal } from './DeleteDepartmentModal';
import { DepartmentDetailsModal } from './DepartmentDetailsModal';

export function DepartmentsView() {
  const { data: departments, isLoading, isError, error } = useDepartments();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!searchQuery.trim()) return departments;
    
    const query = searchQuery.toLowerCase();
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(query) || 
      dept.description?.toLowerCase().includes(query)
    );
  }, [departments, searchQuery]);

  const selectedDepartment = useMemo(() => {
    return departments?.find(d => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  const TABLE_HEADERS = [
    'NAME',
    'STATUS',
    'DESCRIPTION',
    'EMPLOYEES',
    'CREATED AT',
    'UPDATED AT',
    'ACTIONS'
  ];

  const handleAction = (id: string, action: 'view' | 'edit' | 'delete') => {
    setSelectedDeptId(id);
    if (action === 'view') setIsDetailsModalOpen(true);
    if (action === 'edit') setIsEditModalOpen(true);
    if (action === 'delete') setIsDeleteModalOpen(true);
  };

  const formatDate = (dateString: string) => {
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
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-[30px] font-bold text-[#1E2939] leading-[36px] font-sans">Departments</h1>
        <p className="text-[16px] font-normal text-[#4A5565] leading-[24px] font-sans">
          Manage all departments of your company
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-[640px]">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-white border border-gray-100 rounded-xl text-[13.5px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40 transition-all shadow-sm"
          />
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} strokeWidth={2.5} />}
          iconPosition="left"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-[#155DFC] to-[#01c951] hover:shadow-lg hover:shadow-[#155dfc]/20 shadow-md h-11 rounded-xl px-6 min-w-[180px]"
        >
          Add Department
        </Button>
      </div>

      {/* Table Container */}
      <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-[24px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                {TABLE_HEADERS.map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-[12px] font-semibold text-[#4A5565] leading-[16px] tracking-normal uppercase whitespace-nowrap font-sans"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#155DFC] animate-spin" />
                      <p className="text-[14px] font-medium text-gray-500">Loading departments...</p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 text-red-500">
                      <p className="text-[14px] font-medium">Failed to load departments</p>
                      <p className="text-[12px] opacity-70">{(error as any)?.message || 'Unknown error'}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td colSpan={TABLE_HEADERS.length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Search size={22} strokeWidth={1.5} />
                      </div>
                      <p className="text-[14px] font-medium text-gray-500">No departments found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-bold text-[#1E2939]">{dept.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        dept.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {dept.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <span className="text-[13px] text-gray-500 line-clamp-1">{dept.description || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-gray-600 group-hover:text-[#155DFC] transition-colors">
                        {dept.employeeCount} employees
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-400 font-medium whitespace-nowrap">
                      {formatDate(dept.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-400 font-medium whitespace-nowrap">
                      {formatDate(dept.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleAction(dept.id, 'view')}
                          className="p-2 hover:bg-blue-50 text-gray-400 hover:text-[#155DFC] rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleAction(dept.id, 'edit')}
                          className="p-2 hover:bg-blue-50 text-gray-400 hover:text-[#155DFC] rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleAction(dept.id, 'delete')}
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
