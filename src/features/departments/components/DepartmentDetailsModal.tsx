"use client";

import React from 'react';
import { Modal } from '@/common/ui';
import { useDepartment } from '../api';
import { DepartmentListItem } from '../types';
import { Loader2 } from 'lucide-react';

interface DepartmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string | null;
  initialData?: DepartmentListItem | null;
}

export function DepartmentDetailsModal({ isOpen, onClose, departmentId, initialData }: DepartmentDetailsModalProps) {
  const { data: department, isLoading } = useDepartment(departmentId);
  
  // Use either the fetched detail or the initial list item data
  const displayData = department || initialData;

  if (!displayData && isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Department Details" width="max-w-[700px]">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#155DFC] animate-spin mb-2" />
          <p className="text-sm text-gray-500">Loading details...</p>
        </div>
      </Modal>
    );
  }

  if (!displayData) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Department Details"
      width="max-w-[700px]"
    >
      <div className="space-y-8 pt-4">
        {/* Section Label */}
        <div className="text-[14px] font-semibold text-[#6A7282] uppercase leading-[20px] tracking-[0px] font-sans">
          BASIC INFORMATION
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-8 gap-x-12">
          {/* Name */}
          <div className="space-y-1.5">
            <p className="text-[14px] font-medium text-gray-400">Name</p>
            <p className="text-[16px] font-bold text-[#1E2939] leading-tight">{displayData.name}</p>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <p className="text-[14px] font-medium text-gray-400">Status</p>
            <div className="flex">
              <span className={`px-4 py-1.5 rounded-full text-[13px] font-bold ${
                displayData.status === 'ACTIVE' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {displayData.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Created At */}
          <div className="space-y-1.5">
            <p className="text-[14px] font-medium text-gray-400">Created At</p>
            <p className="text-[16px] font-bold text-[#1E2939] leading-tight">{formatDate(displayData.createdAt)}</p>
          </div>

          {/* Updated At */}
          <div className="space-y-1.5">
            <p className="text-[14px] font-medium text-gray-400">Updated At</p>
            <p className="text-[16px] font-bold text-[#1E2939] leading-tight">{formatDate(displayData.updatedAt)}</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5 pt-2">
          <p className="text-[14px] font-medium text-gray-400">Description</p>
          <p className="text-[16px] font-medium text-gray-700 leading-relaxed max-w-[580px]">
            {displayData.description || 'No description provided.'}
          </p>
        </div>

        {/* Footer - Close Button */}
        <div className="flex justify-end pt-8 mt-4 border-t border-gray-50/50">
          <button
            onClick={onClose}
            className="px-10 py-3 bg-[#f8fafc] text-[14px] font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-2xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
