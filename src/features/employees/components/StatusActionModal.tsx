"use client";

import React from 'react';
import { Check, Power } from 'lucide-react';
import { Modal, Button } from '@/common/ui';

interface StatusActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading: boolean;
  action: 'activate' | 'terminate';
  entityLabel: string;
  itemName: string;
}

export function StatusActionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  action,
  entityLabel,
  itemName,
}: StatusActionModalProps) {
  const isActivate = action === 'activate';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-[448px]"
      containerClassName="p-0"
      showDefaultStyles={false}
    >
      <div className="bg-white rounded-[24px] p-8 flex flex-col items-center text-center shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] border border-gray-100">
        <div className={`w-[80px] h-[80px] rounded-[24px] flex items-center justify-center mb-6 ${isActivate ? 'bg-[#ECFDF5]' : 'bg-[#FFF1F2]'}`}>
          {isActivate ? (
            <Check size={40} className="text-[#059669]" strokeWidth={2.5} />
          ) : (
            <Power size={40} className="text-[#E11D48]" strokeWidth={2.5} />
          )}
        </div>

        <h2 className="text-[24px] font-bold text-[#101828] leading-[32px] mb-2 font-sans">
          {isActivate ? `Activate ${entityLabel}?` : `Terminate ${entityLabel}?`}
        </h2>

        <p className="text-[16px] font-normal text-[#4A5565] leading-[24px] mb-8 font-sans">
          {isActivate ? (
            <>Are you sure you want to activate <span className="font-semibold">{itemName}</span>? Access will be restored immediately.</>
          ) : (
            <>Are you sure you want to terminate <span className="font-semibold">{itemName}</span>? They will remain unavailable until reactivated.</>
          )}
        </p>

        <div className="flex gap-4 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-12 border-none bg-transparent hover:bg-gray-100 text-[#364153] text-[16px] font-medium rounded-[14px] transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void onConfirm()}
            isLoading={isLoading}
            className={`flex-1 h-12 text-white text-[16px] font-medium rounded-[14px] transition-all border-none ${
              isActivate
                ? 'bg-gradient-to-r from-[#12B76A] to-[#01c951] hover:from-[#01c951] hover:to-[#00A63E] shadow-lg shadow-emerald-200'
                : 'bg-gradient-to-r from-[#E7000B] to-[#C10007] hover:from-[#C10007] hover:to-[#A10006] shadow-lg shadow-red-200'
            }`}
          >
            {isActivate ? 'Activate' : 'Terminate'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
