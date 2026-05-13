"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Textarea } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { useDismissWarnings } from '../api/dismiss-warnings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dayRecordId: string;
  warningFlags: string[];
}

function readableFlag(flag: string): string {
  return flag
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function DismissWarningsModal({ isOpen, onClose, dayRecordId, warningFlags }: Props) {
  const { t } = useI18n();
  const [note, setNote] = useState('');
  const mutation = useDismissWarnings();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    await mutation.mutateAsync({ recordId: dayRecordId, data: { note: note || undefined } });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Gradient header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)' }}
        >
          <h2 className="text-base font-bold text-white">{t('attendance.actions.dismissWarnings')}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {warningFlags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500">{t('attendance.modal.warningFlags')}</p>
              <div className="flex flex-wrap gap-2">
                {warningFlags.map((flag) => (
                  <span
                    key={flag}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"
                  >
                    {readableFlag(flag)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Textarea
            id="dismiss-note"
            label={t('attendance.modal.auditNote')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('attendance.modal.auditNotePlaceholder')}
            rows={3}
          />
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            {t('common.actions.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
          >
            {mutation.isPending ? t('attendance.modal.dismissing') : t('attendance.modal.dismiss')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
