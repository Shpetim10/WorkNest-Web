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
      return new Date(dateString).toISOString().split('T')[0];
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
            <p className="font-[Inter,sans-serif] text-[14px] font-semibold leading-[24px] text-[#1E2939] break-words">{displayData.name}</p>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <p className="text-[14px] font-medium text-gray-400">Status</p>
            <div className="flex">
              <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium leading-[16px] break-words font-[Inter,sans-serif] flex items-center w-fit ${
                displayData.status === 'ACTIVE' 
                  ? 'bg-[#F0FDF4] text-[#008236]' 
                  : 'bg-[#FFF7ED] text-[#CA3500]'
              }`}>
                <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                {displayData.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Created At */}
          <div className="space-y-1.5">
            <p className="text-[14px] font-medium text-gray-400">Created At</p>
            <p className="font-[Inter,sans-serif] text-[14px] font-normal leading-[20px] text-[#6A7282] break-words">{formatDate(displayData.createdAt)}</p>
          </div>

          {/* Updated At */}
          <div className="space-y-1.5">
            <p className="text-[14px] font-medium text-gray-400">Updated At</p>
            <p className="font-[Inter,sans-serif] text-[14px] font-normal leading-[20px] text-[#6A7282] break-words">{formatDate(displayData.updatedAt)}</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 pt-2">
          <p className="text-[14px] font-medium text-gray-400">Description</p>
          <div className="max-h-[240px] overflow-y-auto pr-2">
            <p className="font-[Inter,sans-serif] text-[14px] font-normal leading-[20px] text-[#1E2939] break-words whitespace-pre-wrap">
              {displayData.description || 'No description provided.'}
            </p>
          </div>
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
