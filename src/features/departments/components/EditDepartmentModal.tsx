"use client";

import React, { useState } from 'react';
import { GradientModalHeader, Modal, Input, Select, Textarea, Button } from '@/common/ui';
import { useUpdateDepartment } from '../api';
import { DepartmentListItem } from '../types';

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentListItem | null;
}

export function EditDepartmentModal({ isOpen, onClose, department }: EditDepartmentModalProps) {
  if (!department) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-[794px]"
      showDefaultStyles={false}
      containerClassName="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      <GradientModalHeader
        title="Edit Department"
        subtitle="Edit the department details below."
        onClose={onClose}
      />

      <EditDepartmentForm key={department.id} department={department} onClose={onClose} />
    </Modal>
  );
}

function EditDepartmentForm({
  department,
  onClose,
}: {
  department: DepartmentListItem;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: department.name,
    status: department.status,
    description: department.description || '',
  });

  const updateMutation = useUpdateDepartment(department?.id || '');

  const handleSave = async () => {
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
    <div className="space-y-8 p-6">
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
            className="h-11 rounded-xl px-12 font-bold min-w-[140px]"
          >
            Update
          </Button>
        </div>
      </div>
  );
}
