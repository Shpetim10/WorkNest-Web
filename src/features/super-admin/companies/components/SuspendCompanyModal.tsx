"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { CompanyManagementRow } from '../types';

interface SuspendCompanyModalProps {
  company: CompanyManagementRow | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (reason: string) => void;
}

export function SuspendCompanyModal({ company, isOpen, onClose, onConfirm }: SuspendCompanyModalProps) {
  const [reason, setReason] = useState('');
  const isSuspended = company?.status === 'suspended';
  const title = isSuspended ? 'Unsuspend Company' : 'Suspend Company';
  const actionLabel = isSuspended ? 'Unsuspend Company' : 'Suspend Company';
  const closeModal = useCallback(() => {
    setReason('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [closeModal, isOpen]);

  if (!isOpen || !company) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-[2px]" onClick={closeModal} />
      <div className="fixed inset-0 z-[251] flex items-center justify-center p-4">
        <section
          role="dialog"
          aria-modal="true"
          className="w-full max-w-[470px] rounded-xl bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="text-[22px] font-bold leading-7 text-[#111827]">{title}</h2>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg p-1 text-[#111827] transition-colors hover:bg-gray-100"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>

          <div className="space-y-5">
            <div className="text-[14px] leading-6 text-[#4B5563]">
              <p>
                You are about to {isSuspended ? 'unsuspend' : 'suspend'}{' '}
                <span className="font-bold text-[#374151]">{company.companyName}</span>.
              </p>
              {!isSuspended && (
                <>
                  <p>This will:</p>
                  <ul className="mt-2 space-y-1.5 pl-4 text-[13px]">
                    <li className="marker:text-[#EF4444]">Block all user logins</li>
                    <li className="marker:text-[#EF4444]">Disable API access</li>
                    <li className="marker:text-[#EF4444]">Prevent all operations</li>
                  </ul>
                </>
              )}
              {isSuspended && (
                <p className="mt-2 text-[13px]">This will restore user logins, API access, and company operations.</p>
              )}
            </div>

            <label className="block">
              <span className="text-[13px] font-medium text-[#374151]">
                Reason for {isSuspended ? 'unsuspension' : 'suspension'} *
              </span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Enter the reason..."
                className="mt-2 h-[104px] w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[14px] text-[#374151] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#9DBBEA] focus:ring-2 focus:ring-[#2B7FFF]/10"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={closeModal}
                className="h-11 rounded-xl bg-[#F3F4F6] text-[14px] font-medium text-[#374151] transition-colors hover:bg-[#E5E7EB]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm?.(reason);
                  closeModal();
                }}
                className="h-11 rounded-xl bg-[#FB7185] text-[14px] font-semibold text-white transition-colors hover:bg-[#F43F5E]"
              >
                {actionLabel}
              </button>
            </div>
          </div>
        </section>
      </div>
    </>,
    document.body,
  );
}
