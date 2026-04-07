"use client";

import React, { useState } from 'react';
import { Card, Button } from '@/common/ui';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { AddDepartmentModal } from './AddDepartmentModal';

export function DepartmentsView() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const TABLE_HEADERS = [
    'NAME',
    'STATUS',
    'DESCRIPTION',
    'EMPLOYEES',
    'CREATED AT',
    'UPDATED AT',
    'ACTIONS'
  ];

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
            placeholder="Search employees..."
            className="w-full h-11 pl-11 pr-4 bg-white border border-gray-100 rounded-xl text-[13.5px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40 transition-all shadow-sm"
          />
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} strokeWidth={2.5} />}
          iconPosition="left"
          onClick={() => setIsModalOpen(true)}
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
              {/* Table body left empty as requested */}
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
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Department Modal */}
      <AddDepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
}
