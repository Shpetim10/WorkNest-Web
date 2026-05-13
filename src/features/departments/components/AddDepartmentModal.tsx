"use client";

import React, { useState } from 'react';
import { GradientModalHeader, Modal, Input, Select, Textarea, Button } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { useCreateDepartment } from '../api';
import { DepartmentStatus } from '../types';

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDepartmentModal({ isOpen, onClose }: AddDepartmentModalProps) {
  const { t } = useI18n();
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
      console.error(t('departments.modal.createFailed'), error);
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
        title={t('departments.modal.addTitle')}
        subtitle={t('departments.modal.addSubtitle')}
        onClose={handleModalClose}
      />

      <div className="space-y-8 p-6">
        {/* Row 1: Name and Status */}
        <div className="grid grid-cols-2 gap-x-10 items-start">
          <Input
            id="dept-name"
            label={t('tables.headers.name')}
            required
            placeholder={t('departments.modal.namePlaceholder')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete="off"
          />
          <Select
            id="dept-status"
            label={t('tables.headers.status')}
            value={formData.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value === 'Active' ? 'ACTIVE' : 'INACTIVE' })}
            options={[
              { value: 'Active', label: t('common.statuses.active') },
              { value: 'Inactive', label: t('common.statuses.inactive') }
            ]}
          />
        </div>

        {/* Row 2: Description */}
        <div className="w-full">
          <Textarea
            id="dept-description"
            label={t('tables.headers.description')}
            placeholder={t('departments.modal.descriptionPlaceholder')}
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
            {t('common.actions.back')}
          </button>
          <Button
            onClick={handleAdd}
            isLoading={createMutation.isPending}
            disabled={!formData.name.trim()}
            className="h-11 rounded-xl px-12 font-bold min-w-[140px]"
          >
            {t('departments.modal.add')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
