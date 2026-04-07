"use client";

import React, { useState } from 'react';
import { Modal, Input, Select, Textarea, Button } from '@/common/ui';

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDepartmentModal({ isOpen, onClose }: AddDepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    status: 'Active',
    description: ''
  });

  const handleAdd = () => {
    // UI-only logic
    console.log('Adding Department:', formData);
    onClose();
    // Reset form after closing
    setFormData({ name: '', status: 'Active', description: '' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setFormData({ name: '', status: 'Active', description: '' });
      }}
      title="Add Department"
      subtitle="Add new department for your company"
      width="max-w-[794px]"
    >
      <div className="space-y-8 pt-2">
        {/* Row 1: Name and Status - Perfectly aligned using standardized components */}
        <div className="grid grid-cols-2 gap-x-10 items-start">
          <Input
            id="dept-name"
            label="Name"
            required
            placeholder="e.g Economy"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select
            id="dept-status"
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
          />
        </div>

        {/* Row 2: Description - Full width centered composition */}
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

        {/* Footer Buttons - Split left/right */}
        <div className="flex items-center justify-between mt-10 pt-4 border-t border-gray-50/50">
          <button
            onClick={onClose}
            className="px-10 py-2.5 text-[14px] font-bold text-gray-500 bg-gray-100/60 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition-all"
          >
            Back
          </button>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-[#155DFC] to-[#01c951] hover:shadow-lg hover:shadow-[#155dfc]/20 shadow-md h-11 rounded-xl px-12 font-bold min-w-[140px]"
          >
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}
