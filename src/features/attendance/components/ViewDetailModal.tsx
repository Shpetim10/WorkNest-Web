"use client";

import React, { useState } from 'react';
import { X, LogIn, LogOut, Wrench, Clock } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAttendanceEmployeeDetail } from '../api/get-employee-detail';
import { ReviewEventModal } from './ReviewEventModal';
import { AttendanceEvent, AttendanceEventType, AttendanceReviewStatus } from '../types';
import { getStoredCompanyTimezone } from '@/features/company-settings/storage';
import { useI18n } from '@/common/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  date: string;
}

function formatTime(utcString: string | null, timezone: string): string {
  if (!utcString) return 'â€”';
  try {
    return new Date(utcString).toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return 'â€”';
  }
}

function formatDateTime(utcString: string | null, timezone: string): string {
  if (!utcString) return 'â€”';
  try {
    return new Date(utcString).toLocaleString('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return 'â€”';
  }
}

const EVENT_TYPE_LABEL_KEYS: Record<AttendanceEventType, string> = {
  [AttendanceEventType.CHECK_IN]: 'attendance.headers.checkIn',
  [AttendanceEventType.CHECK_OUT]: 'attendance.headers.checkOut',
  [AttendanceEventType.MANUAL_CHECK_IN]: 'attendance.actions.manualCheckIn',
  [AttendanceEventType.MANUAL_CHECK_OUT]: 'attendance.actions.manualCheckOut',
  [AttendanceEventType.AUTO_CHECK_OUT]: 'attendance.modal.autoCheckOut',
  [AttendanceEventType.ADJUSTMENT]: 'attendance.modal.adjustment',
};

function isCheckInType(type: AttendanceEventType): boolean {
  return type === AttendanceEventType.CHECK_IN || type === AttendanceEventType.MANUAL_CHECK_IN;
}

function isCheckOutType(type: AttendanceEventType): boolean {
  return (
    type === AttendanceEventType.CHECK_OUT ||
    type === AttendanceEventType.MANUAL_CHECK_OUT ||
    type === AttendanceEventType.AUTO_CHECK_OUT
  );
}

function eventIcon(type: AttendanceEventType) {
  if (isCheckInType(type)) return <LogIn size={13} className="text-green-600" />;
  if (isCheckOutType(type)) return <LogOut size={13} className="text-blue-600" />;
  return <Wrench size={13} className="text-amber-600" />;
}

function eventRowCls(type: AttendanceEventType): string {
  if (isCheckInType(type)) return 'border-l-2 border-green-400 bg-green-50/60';
  if (isCheckOutType(type)) return 'border-l-2 border-blue-400 bg-blue-50/60';
  return 'border-l-2 border-amber-400 bg-amber-50/60';
}

function reviewBadge(
  status: AttendanceReviewStatus,
  t: (key: string) => string,
): { label: string; cls: string } | null {
  if (status === AttendanceReviewStatus.APPROVED)
    return { label: t('common.statuses.approved'), cls: 'bg-green-100 text-green-700' };
  if (status === AttendanceReviewStatus.REJECTED)
    return { label: t('common.statuses.rejected'), cls: 'bg-red-100 text-red-700' };
  if (status === AttendanceReviewStatus.CORRECTED)
    return { label: t('attendance.modal.corrected'), cls: 'bg-purple-100 text-purple-700' };
  return null;
}

function deduplicateEvents(events: AttendanceEvent[]): AttendanceEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.eventId)) return false;
    seen.add(e.eventId);
    return true;
  });
}

export function ViewDetailModal({ isOpen, onClose, employeeId, date }: Props) {
  const { t } = useI18n();
  const [reviewEvent, setReviewEvent] = useState<AttendanceEvent | null>(null);
  const { data, isLoading } = useAttendanceEmployeeDetail(isOpen ? employeeId : null, date);

  if (!isOpen) return null;

  const timezone = getStoredCompanyTimezone() || data?.timezone || 'UTC';

  // Deduplicate and sort chronologically by serverRecordedAt
  const events = deduplicateEvents(data?.events ?? []).sort(
    (a, b) => new Date(a.serverRecordedAt).getTime() - new Date(b.serverRecordedAt).getTime(),
  );

  const pendingCount = events.filter(
    (e) => e.reviewStatus === AttendanceReviewStatus.PENDING_REVIEW,
  ).length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 50%, #10B981 100%)' }}
        >
          <div>
            <h2 className="text-base font-bold text-white">{t('attendance.modal.detailTitle')}</h2>
            {data && (
              <p className="text-xs text-white/70 mt-0.5">
                {data.employeeName} Â· {data.workDate} Â· {timezone}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {data && (
            <>
              {/* Summary row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                  <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-0.5">
                    {t('attendance.modal.effectiveCheckIn')}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatTime(data.firstCheckInAt, timezone)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-0.5">
                    {t('attendance.modal.effectiveCheckOut')}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatTime(data.lastCheckOutAt, timezone)}
                  </p>
                </div>
              </div>

              {/* Detail rows */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2.5">
                {[
                  { label: t('tables.headers.department'), value: data.departmentName ?? '-' },
                  { label: t('attendance.headers.site'), value: data.siteName ?? '-' },
                  { label: t('attendance.modal.attendanceState'), value: data.attendanceState.replace(/_/g, ' ') },
                  { label: t('attendance.headers.dayStatus'), value: data.dayStatus.replace(/_/g, ' ') },
                  {
                    label: t('attendance.modal.workedLateBreak'),
                    value: `${data.workedMinutes}m / ${data.lateMinutes}m / ${data.breakMinutes}m`,
                  },
                  { label: t('attendance.payrollLocked'), value: data.payrollLocked ? t('common.yes') : t('common.no') },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>

              {/* Events */}
              {events.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {t('attendance.modal.events')} ({events.length})
                    </p>
                    {pendingCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {t('attendance.modal.pendingReviewCount', { count: pendingCount })}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {events.map((event) => {
                      const badge = reviewBadge(event.reviewStatus, t);
                      return (
                        <div
                          key={event.eventId}
                          className={`rounded-xl px-3 py-2.5 ${eventRowCls(event.eventType)}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {eventIcon(event.eventType)}
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 leading-tight">
                                  {formatDateTime(event.serverRecordedAt, timezone)}
                                  {' Â· '}
                                  <span className="font-semibold">
                                    {t(EVENT_TYPE_LABEL_KEYS[event.eventType] ?? event.eventType)}
                                  </span>
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  {event.captureMethod.replace(/_/g, ' ')}
                                  {' Â· '}
                                  {event.attendanceDecision.toLowerCase().replace(/_/g, ' ')}
                                  {event.warningFlags.length > 0 && (
                                    <> Â· <span className="text-red-500">{event.warningFlags.join(', ')}</span></>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              {badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              )}
                              {event.reviewStatus === AttendanceReviewStatus.PENDING_REVIEW && (
                                <button
                                  onClick={() => setReviewEvent(event)}
                                  className="text-blue-600 text-xs font-semibold hover:underline"
                                >
                                  {t('attendance.modal.review')}
                                </button>
                              )}
                            </div>
                          </div>
                          {event.reviewNote && (
                            <p className="text-[11px] text-gray-500 mt-1.5 pt-1.5 border-t border-white/60">
                              {t('attendance.modal.note')}: {event.reviewNote}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {events.length === 0 && !isLoading && (
                <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
                  <Clock size={28} className="text-gray-300" />
                  <p className="text-sm">{t('attendance.modal.noEvents')}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-28 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            {t('common.actions.close')}
          </button>
        </div>
      </div>

      {reviewEvent && (
        <ReviewEventModal
          isOpen
          onClose={() => setReviewEvent(null)}
          event={reviewEvent}
          timezone={timezone}
        />
      )}
    </div>,
    document.body,
  );
}
