"use client";

import React from 'react';
import { Modal, Button } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { Trash2 } from 'lucide-react';
import { useDeleteDepartment } from '../api';
import { DepartmentListItem } from '../types';

interface DeleteDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentListItem | null;
}

export function DeleteDepartmentModal({ isOpen, onClose, department }: DeleteDepartmentModalProps) {
  const { t } = useI18n();
  const deleteMutation = useDeleteDepartment();

  if (!department) return null;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(department.id);
      onClose();
    } catch (error) {
      console.error(t('departments.modal.deleteFailed'), error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      width="max-w-[500px]"
    >
      <div className="flex flex-col items-center text-center space-y-6 pt-2 pb-4">
        {/* Warning Icon */}
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 animate-in zoom-in-75 duration-300">
          <Trash2 size={40} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h2 className="text-[24px] font-bold text-[#1E2939] tracking-tight">{t('departments.modal.deleteTitle')}</h2>
          <p className="text-[14.5px] text-gray-500 font-medium max-w-[340px] mx-auto leading-relaxed">
            {t('departments.modal.deleteQuestion')}{' '}
            <span className="font-bold text-gray-700">&quot;{department.name}&quot;</span>?{' '}
            {t('departments.modal.cannotUndo')}
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center gap-4 w-full pt-6">
          <button
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="flex-1 py-3 text-[14px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 rounded-2xl transition-all disabled:opacity-50"
          >
            {t('common.actions.back')}
          </button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            isLoading={deleteMutation.isPending}
            className="flex-1 h-12 rounded-2xl font-bold"
          >
            {t('common.actions.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
