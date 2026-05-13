"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Input } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { useAdjustDayRecord } from '../api/adjust-day-record';
import { AttendanceDayStatus } from '../types';
import { formatAttendanceFriendlyError } from '@/features/locations/utils/errors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dayRecordId: string;
  firstCheckInAt: string | null;
  lastCheckOutAt: string | null;
  workedMinutes: number;
  dayStatus: AttendanceDayStatus;
  workDate: string;
  timezone: string;
  isAdmin?: boolean;
}

const DAY_STATUS_LABEL_KEYS: Record<AttendanceDayStatus, string> = {
  [AttendanceDayStatus.PRESENT]: 'common.statuses.present',
  [AttendanceDayStatus.ABSENT]: 'common.statuses.absent',
  [AttendanceDayStatus.LATE]: 'attendance.dayStatuses.late',
  [AttendanceDayStatus.HALF_DAY]: 'attendance.dayStatuses.halfDay',
  [AttendanceDayStatus.ON_LEAVE]: 'attendance.dayStatuses.onLeave',
  [AttendanceDayStatus.HOLIDAY]: 'attendance.dayStatuses.holiday',
  [AttendanceDayStatus.MISSING_CHECKOUT]: 'attendance.states.missingCheckout',
  [AttendanceDayStatus.FLAGGED]: 'attendance.dayStatuses.flagged',
  [AttendanceDayStatus.PENDING_REVIEW]: 'common.statuses.pendingReview',
};

function toLocalDatetimeValue(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replace(' ', 'T');
}

function toLocal(utc: string | null, timezone: string): string {
  if (!utc) return '';
  return toLocalDatetimeValue(new Date(utc), timezone);
}

// sv-SE avoids the en-US hour12:false midnight bug where "24" can be returned
// for 00:xx, causing a 24-hour rollover error in the UTC offset calculation.
function localDatetimeToUTC(localDatetime: string, timezone: string): string {
  const [datePart, timePart] = localDatetime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute));

  const localStr = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(probe);

  const [gotDate, gotTime] = localStr.split(' ');
  const [gy, gm, gd] = gotDate.split('-').map(Number);
  const [gh, gmin] = gotTime.split(':').map(Number);

  const gotMs = Date.UTC(gy, gm - 1, gd, gh, gmin);
  const wantMs = Date.UTC(year, month - 1, day, hour, minute);

  return new Date(probe.getTime() + (wantMs - gotMs)).toISOString();
}

/** Returns the date string for one calendar day after `dateStr` (YYYY-MM-DD). */
function addOneDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

function todayDateInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function AdjustDayRecordModal({
  isOpen,
  onClose,
  dayRecordId,
  firstCheckInAt,
  lastCheckOutAt,
  workedMinutes,
  dayStatus,
  workDate,
  timezone,
  isAdmin = false,
}: Props) {
  const { t } = useI18n();
  const [checkIn, setCheckIn] = useState(toLocal(firstCheckInAt, timezone));
  const [checkOut, setCheckOut] = useState(toLocal(lastCheckOutAt, timezone));
  const [worked, setWorked] = useState<string>(workedMinutes ? String(workedMinutes) : '');
  const [status, setStatus] = useState<AttendanceDayStatus>(dayStatus);
  const [formError, setFormError] = useState('');
  const mutation = useAdjustDayRecord();

  if (!isOpen) return null;

  const isToday = isAdmin || workDate === todayDateInTimezone(timezone);

  const handleSubmit = async () => {
    if (!isToday) return;
    setFormError('');
    try {
      await mutation.mutateAsync({
        recordId: dayRecordId,
        data: {
          firstCheckInAt: checkIn ? localDatetimeToUTC(checkIn, timezone) : undefined,
          lastCheckOutAt: checkOut ? localDatetimeToUTC(checkOut, timezone) : undefined,
          workedMinutes: worked ? parseInt(worked, 10) : null,
          dayStatus: status,
        },
      });
      onClose();
    } catch (error) {
      setFormError(
        formatAttendanceFriendlyError(
          error,
          t('attendance.modal.adjustFailed'),
        ),
      );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[440px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Gradient header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2B7FFF 0%, #00BBA7 100%)' }}
        >
          <h2 className="text-base font-bold text-white">{t('attendance.actions.adjustDayRecord')}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {formError && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {formError}
            </p>
          )}
          {!isToday && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {t('attendance.modal.todayOnly')}
            </p>
          )}

          <Input
            id="adj-check-in"
            label={t('attendance.modal.checkInTime', { timezone })}
            type="datetime-local"
            value={checkIn}
            {...(!isAdmin && { min: `${workDate}T00:00`, max: `${workDate}T23:59` })}
            disabled={!isToday}
            onChange={(e) => setCheckIn(e.target.value)}
          />

          <Input
            id="adj-check-out"
            label={t('attendance.modal.checkOutTime', { timezone })}
            type="datetime-local"
            value={checkOut}
            {...(!isAdmin && { min: `${workDate}T00:00`, max: `${addOneDay(workDate)}T12:00` })}
            disabled={!isToday}
            onChange={(e) => setCheckOut(e.target.value)}
          />

          <Input
            id="adj-worked"
            label={t('attendance.modal.workedMinutes')}
            type="number"
            value={worked}
            onChange={(e) => setWorked(e.target.value)}
            placeholder={t('attendance.modal.workedPlaceholder')}
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-gray-700">{t('attendance.headers.dayStatus')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceDayStatus)}
              className="w-full h-11 pl-4 pr-10 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400/40 appearance-none"
            >
              {Object.entries(DAY_STATUS_LABEL_KEYS).map(([value, labelKey]) => (
                <option key={value} value={value}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </div>
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
            disabled={mutation.isPending || !isToday}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? t('common.actions.saving') : t('attendance.modal.saveAdjustment')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
