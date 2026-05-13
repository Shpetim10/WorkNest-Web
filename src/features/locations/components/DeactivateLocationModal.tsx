"use client";

import React from 'react';
import { Power } from 'lucide-react';
import { Modal, Button } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { useDisableSite } from '../api';

interface DeactivateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string | null;
  companyId: string | null;
  locationName: string;
}

export function DeactivateLocationModal({
  isOpen,
  onClose,
  siteId,
  companyId,
  locationName,
}: DeactivateLocationModalProps) {
  const { t } = useI18n();
  const disableMutation = useDisableSite();

  const handleDisable = async () => {
    if (!siteId || !companyId) return;

    try {
      await disableMutation.mutateAsync({ companyId, siteId });
      onClose();
    } catch (error) {
      console.error(t('locations.modal.disableFailed'), error);
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
        {/* Icon Area */}
        <div className="w-[80px] h-[80px] bg-[#FFF1F2] rounded-[24px] flex items-center justify-center mb-6">
          <Power size={40} className="text-[#E11D48]" strokeWidth={2.5} />
        </div>

        {/* Title */}
        <h2 className="text-[24px] font-bold text-[#101828] leading-[32px] mb-2 font-sans">
          {t('locations.modal.disableTitle')}
        </h2>

        {/* Description */}
        <p className="text-[16px] font-normal text-[#4A5565] leading-[24px] mb-8 font-sans">
          {t('locations.modal.disablePrefix')} <span className="font-semibold">{locationName}</span>? {t('locations.modal.disableSuffix')}
        </p>

        {/* Footer Actions */}
        <div className="flex gap-4 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={disableMutation.isPending}
            className="flex-1 h-12 border-none bg-transparent hover:bg-gray-100 text-[#364153] text-[16px] font-medium rounded-[14px] transition-all"
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            onClick={() => void handleDisable()}
            isLoading={disableMutation.isPending}
            className="flex-1 h-12 bg-gradient-to-r from-[#E7000B] to-[#C10007] hover:from-[#C10007] hover:to-[#A10006] text-white text-[16px] font-medium rounded-[14px] shadow-lg shadow-red-200 transition-all border-none"
          >
            {t('locations.disableSite')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
