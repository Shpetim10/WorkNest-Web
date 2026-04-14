"use client";

import React, { useState } from 'react';
import { Modal, Input, Select, Textarea, Button } from '@/common/ui';
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
      onClose={() => {
        onClose();
        setFormData({ name: '', status: 'ACTIVE', description: '' });
      }}
      title="Add Department"
      subtitle="Add new department for your company"
      width="max-w-[794px]"
    >
      <div className="space-y-8 pt-2">
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
        <div className="w-full space-y-2">
          <Textarea
            id="dept-description"
            label="Description"
            placeholder="Department description.."
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            maxLength={255}
          />
          <div className="flex justify-end pr-1">
            <span className={`text-[12px] font-medium transition-colors ${
              formData.description.length >= 255 ? 'text-red-500' : 'text-gray-400'
            }`}>
              {formData.description.length} / 255
            </span>
          </div>
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
