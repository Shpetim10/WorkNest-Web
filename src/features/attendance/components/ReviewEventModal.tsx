"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useReviewEvent } from '../api/review-event';
import { AttendanceEvent } from '../types';
import { Textarea } from '@/common/ui';
import { useI18n } from '@/common/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: AttendanceEvent;
  timezone: string;
}

function formatTime(utcString: string, timezone: string): string {
  try {
    return new Date(utcString).toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '—';
  }
}

function readableEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function ReviewEventModal({ isOpen, onClose, event, timezone }: Props) {
  const { t } = useI18n();
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [note, setNote] = useState('');
  const mutation = useReviewEvent();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    await mutation.mutateAsync({ eventId: event.eventId, data: { reviewStatus, note: note || undefined } });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Gradient header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 60%, #10B981 100%)' }}
        >
          <div>
            <h2 className="text-base font-bold text-white">{t('attendance.modal.reviewRecord')}</h2>
            <p className="text-xs text-white/70 mt-0.5">
              {formatTime(event.serverRecordedAt, timezone)} · {readableEnum(event.eventType)}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">{t('attendance.modal.decision')}</p>
            <div className="flex gap-3">
              {(['APPROVED', 'REJECTED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewStatus(s)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    reviewStatus === s
                      ? s === 'APPROVED'
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'bg-red-50 border-red-400 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {s === 'APPROVED' ? t('leave.approve') : t('leave.reject')}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            id="review-note"
            label={t('attendance.modal.noteOptional')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('attendance.modal.reviewPlaceholder')}
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
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? t('common.actions.saving') : t('attendance.modal.saveReview')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
