"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Textarea, Button } from '@/common/ui';
import { useUpdateDepartment } from '../api';
import { DepartmentListItem, DepartmentStatus } from '../types';

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentListItem | null;
}

export function EditDepartmentModal({ isOpen, onClose, department }: EditDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    status: 'ACTIVE' as DepartmentStatus,
    description: ''
  });

  const updateMutation = useUpdateDepartment(department?.id || '');

  useEffect(() => {
    if (department && isOpen) {
      setFormData({
        name: department.name,
        status: department.status,
        description: department.description || ''
      });
    }
  }, [department, isOpen]);

  const handleSave = async () => {
    if (!department) return;
    try {
      await updateMutation.mutateAsync({
        name: formData.name,
        status: formData.status,
        description: formData.description
      });
      onClose();
    } catch (error) {
      console.error('Failed to update department:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Department"
      subtitle="Edit the department details below."
      width="max-w-[794px]"
    >
      <div className="space-y-8 pt-2">
        {/* Row 1: Name and Status */}
        <div className="grid grid-cols-2 gap-x-10 items-start">
          <Input
            id="edit-dept-name"
            label="Name"
            required
            placeholder="e.g Economy"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete="off"
          />
          <Select
            id="edit-dept-status"
            label="Status"
            value={formData.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value === 'Active' ? 'ACTIVE' : 'INACTIVE' })}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
          />
        </div>

        {/* Row 2: Description */}
        <div className="w-full">
          <Textarea
            id="edit-dept-description"
            label="Description"
            placeholder="Department description.."
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between mt-10 pt-4 border-t border-gray-50/50">
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-10 py-2.5 text-[14px] font-bold text-gray-500 bg-gray-100/60 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition-all disabled:opacity-50"
          >
            Back
          </button>
          <Button
            onClick={handleSave}
            isLoading={updateMutation.isPending}
            disabled={!formData.name.trim()}
            className="bg-gradient-to-r from-[#155DFC] to-[#01c951] hover:shadow-lg hover:shadow-[#155dfc]/20 shadow-md h-11 rounded-xl px-12 font-bold min-w-[140px]"
          >
            Update
          </Button>
        </div>
      </div>
    </Modal>
  );
}
