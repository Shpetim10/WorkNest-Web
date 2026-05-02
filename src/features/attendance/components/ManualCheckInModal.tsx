"use client";

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Input, Textarea } from '@/common/ui';
import { useManualCheckIn } from '../api/manual-check-in';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  timezone: string;
  isAdmin?: boolean;
}

/** Format a Date as "YYYY-MM-DDTHH:mm" in the given timezone for datetime-local inputs. */
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

/**
 * Convert a "YYYY-MM-DDTHH:mm" string that represents time in `timezone`
 * to a UTC ISO string.
 *
 * Uses sv-SE format ("YYYY-MM-DD HH:MM") to avoid the en-US hour12:false
 * midnight ambiguity where some environments return "24" for 00:xx, which
 * would cause Date.UTC to roll over to the next day and produce a 24-hour
 * offset error in the result.
 */
function localDatetimeToUTC(localDatetime: string, timezone: string): string {
  const [datePart, timePart] = localDatetime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // sv-SE always outputs "YYYY-MM-DD HH:MM" with hours 0-23, no ambiguity.
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

export function ManualCheckInModal({ isOpen, onClose, employeeId, employeeName, timezone, isAdmin = false }: Props) {
  const [eventAt, setEventAt] = useState(() => toLocalDatetimeValue(new Date(), timezone));
  const [reason, setReason] = useState('');
  const mutation = useManualCheckIn();

  if (!isOpen) return null;

  const todayDate = toLocalDatetimeValue(new Date(), timezone).slice(0, 10);
  const isValidDate = isAdmin || eventAt.slice(0, 10) === todayDate;

  const handleSubmit = async () => {
    if (!isValidDate) return;
    await mutation.mutateAsync({
      employeeId,
      data: {
        eventAt: eventAt ? localDatetimeToUTC(eventAt, timezone) : undefined,
        reason: reason || undefined,
      },
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 60%, #10B981 100%)' }}
        >
          <div>
            <h2 className="text-base font-bold text-white">Manual Check-In</h2>
            <p className="text-xs text-white/70 mt-0.5">{timezone}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-5 pb-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Employee</p>
            <div className="h-11 px-4 flex items-center bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700">
              {employeeName}
            </div>
          </div>

          <Input
            id="event-at-in"
            label={`Event time (${timezone})`}
            type="datetime-local"
            value={eventAt}
            {...(!isAdmin && { min: `${todayDate}T00:00`, max: `${todayDate}T23:59` })}
            onChange={(e) => setEventAt(e.target.value)}
          />

          <Textarea
            id="reason-in"
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Employee forgot to check in on arrival."
            rows={3}
          />
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending || !isValidDate}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : 'Save Check-In'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
