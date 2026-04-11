"use client";

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Modal, Button } from '@/common/ui';
import { useDeleteSite } from '../api';

interface DeleteLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | null;
  companyId: string | null;
  locationName: string;
}

export function DeleteLocationModal({
  isOpen,
  onClose,
  siteId,
  companyId,
  locationName,
}: DeleteLocationModalProps) {
  const deleteMutation = useDeleteSite();

  const handleDelete = async () => {
    if (!siteId || !companyId) return;

    try {
      await deleteMutation.mutateAsync({ companyId, siteId });
      onClose();
    } catch (error) {
      console.error('Failed to delete site:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-[448px]"
      containerClassName="p-0"
      showDefaultStyles={false}
    >
      <div className="bg-white rounded-[24px] p-8 flex flex-col items-center text-center shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] border border-gray-100">
        <div className="w-[80px] h-[80px] bg-[#FFF1F2] rounded-[24px] flex items-center justify-center mb-6">
          <Trash2 size={40} className="text-[#E11D48]" strokeWidth={2.5} />
        </div>

        <h2 className="text-[24px] font-bold text-[#101828] leading-[32px] mb-2 font-sans">
          Delete Location?
        </h2>

        <p className="text-[16px] font-normal text-[#4A5565] leading-[24px] mb-8 font-sans">
          Are you sure you want to delete <span className="font-semibold">{locationName}</span>? This action is permanent and will remove all site configuration and historical data association.
        </p>

        <div className="flex gap-4 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="flex-1 h-12 border-none bg-transparent hover:bg-gray-100 text-[#364153] text-[16px] font-medium rounded-[14px] transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleDelete()}
            isLoading={deleteMutation.isPending}
            className="flex-1 h-12 bg-gradient-to-r from-[#E7000B] to-[#C10007] hover:from-[#C10007] hover:to-[#A10006] text-white text-[16px] font-medium rounded-[14px] shadow-lg shadow-red-200 transition-all border-none"
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
