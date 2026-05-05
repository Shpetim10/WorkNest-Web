"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { Modal, Button } from '@/common/ui';
import { useActivateSite } from '../api';

interface ActivateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | null;
  companyId: string | null;
  locationName: string;
}

export function ActivateLocationModal({
  isOpen,
  onClose,
  siteId,
  companyId,
  locationName,
}: ActivateLocationModalProps) {
  const activateMutation = useActivateSite();

  const handleActivate = async () => {
    if (!siteId || !companyId) return;

    try {
      await activateMutation.mutateAsync({ companyId, siteId });
      onClose();
    } catch (error) {
      console.error('Failed to activate site:', error);
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
        <div className="w-[80px] h-[80px] bg-[#ECFDF5] rounded-[24px] flex items-center justify-center mb-6">
          <Check size={40} className="text-[#059669]" strokeWidth={2.5} />
        </div>

        <h2 className="text-[24px] font-bold text-[#101828] leading-[32px] mb-2 font-sans">
          Activate Location?
        </h2>

        <p className="text-[16px] font-normal text-[#4A5565] leading-[24px] mb-8 font-sans">
          Are you sure you want to activate <span className="font-semibold">{locationName}</span>? It will immediately become available for tracking and attendance.
        </p>

        <div className="flex gap-4 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={activateMutation.isPending}
            className="flex-1 h-12 border-none bg-transparent hover:bg-gray-100 text-[#364153] text-[16px] font-medium rounded-[14px] transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleActivate()}
            isLoading={activateMutation.isPending}
            className="flex-1 h-12 bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] hover:opacity-90 text-white text-[16px] font-medium rounded-[14px] shadow-lg shadow-emerald-200 transition-all border-none"
          >
            Activate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
