"use client";

import React, { useState } from 'react';
import { GradientModalHeader, Modal, Input, Select, Textarea, Button } from '@/common/ui';
import { useCreateDepartment } from '../api';
import { DepartmentStatus } from '../types';

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDepartmentModal({ isOpen, onClose }: AddDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    status: 'ACTIVE' as DepartmentStatus,
    description: ''
  });

  const createMutation = useCreateDepartment();

  const handleModalClose = () => {
    onClose();
    setFormData({ name: '', status: 'ACTIVE', description: '' });
  };

  const handleAdd = async () => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        status: formData.status,
        description: formData.description
      });
      onClose();
      setFormData({ name: '', status: 'ACTIVE', description: '' });
    } catch (error) {
      console.error('Failed to create department:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      width="max-w-[794px]"
      showDefaultStyles={false}
      containerClassName="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      <GradientModalHeader
        title="Add Department"
        subtitle="Add new department for your company"
        onClose={handleModalClose}
      />

      <div className="space-y-8 p-6">
        {/* Row 1: Name and Status */}
        <div className="grid grid-cols-2 gap-x-10 items-start">
          <Input
            id="dept-name"
            label="Name"
            required
            placeholder="e.g Economy"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete="off"
          />
          <Select
            id="dept-status"
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
            id="dept-description"
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
            disabled={createMutation.isPending}
            className="px-10 py-2.5 text-[14px] font-bold text-gray-500 bg-gray-100/60 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition-all disabled:opacity-50"
          >
            Back
          </button>
          <Button
            onClick={handleAdd}
            isLoading={createMutation.isPending}
            disabled={!formData.name.trim()}
            className="h-11 rounded-xl px-12 font-bold min-w-[140px]"
          >
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}
