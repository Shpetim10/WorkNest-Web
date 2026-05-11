"use client";

import React from 'react';
import { GradientModalHeader, Modal } from '@/common/ui';
import { AuditLogEntry } from '../types';

interface AuditLogDetailsModalProps {
  auditLog: AuditLogEntry | null;
  onClose: () => void;
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[13px] font-medium text-gray-400">{label}</p>
      <div className="text-[15px] font-semibold text-[#1E2939] leading-snug">{value}</div>
    </div>
  );
}

export function AuditLogDetailsModal({ auditLog, onClose }: AuditLogDetailsModalProps) {
  if (!auditLog) return null;

  return (
    <Modal
      isOpen={!!auditLog}
      onClose={onClose}
      width="max-w-[680px]"
      showDefaultStyles={false}
      containerClassName="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      <GradientModalHeader
        title="Audit Log Details"
        subtitle="View full details for this activity"
        onClose={onClose}
      />

      <div className="space-y-7 p-6">
        <div className="text-[13px] font-semibold text-[#6A7282] uppercase leading-5 tracking-[0px]">
          Activity Information
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-7 gap-x-10">
          <DetailItem label="User" value={auditLog.user} />
          <DetailItem
            label="Role"
            value={
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  auditLog.role.toLowerCase().includes('admin')
                    ? 'bg-[#E8F1FF] text-[#155DFC]'
                    : 'bg-[#EEF2FF] text-[#4F46E5]'
                }`}
              >
                {auditLog.role}
              </span>
            }
          />
          <DetailItem label="Action" value={auditLog.action} />
          <DetailItem label="Timestamp" value={auditLog.timestamp} />
          {auditLog.referenceId && (
            <DetailItem label="Reference ID" value={auditLog.referenceId} />
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-gray-400">Details</p>
          <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[15px] font-medium leading-relaxed text-gray-700">
            {auditLog.details}
          </p>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-2.5 bg-[#F8FAFC] text-[14px] font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
