"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { AuditLogRow, AuditLogSeverity } from '../types';

interface AuditLogDetailsModalProps {
  auditLog: AuditLogRow | null;
  isOpen: boolean;
  onClose: () => void;
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium leading-none text-[#6B7280]">{label}</p>
      <div className="text-[14px] font-medium leading-5 text-[#111827]">{value}</div>
    </div>
  );
}

function SeverityPill({ severity }: { severity: AuditLogSeverity }) {
  const styles: Record<AuditLogSeverity, string> = {
    info: 'bg-[#DBEAFE] text-[#155DFC]',
    warning: 'bg-[#FEF3C7] text-[#B45309]',
    error: 'bg-[#FEE2E2] text-[#DC2626]',
  };

  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-medium ${styles[severity]}`}>
      {severity}
    </span>
  );
}

export function AuditLogDetailsModal({ auditLog, isOpen, onClose }: AuditLogDetailsModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !auditLog) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[250] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-[251] flex items-center justify-center p-4 sm:p-6">
        <section
          role="dialog"
          aria-modal="true"
          className="relative flex max-h-[86vh] w-full max-w-[500px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
          onClick={(event) => event.stopPropagation()}
        >
          <header
            className="flex min-h-[78px] shrink-0 items-start justify-between px-5 py-4"
            style={{ background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)' }}
          >
            <div>
              <h2 className="text-[20px] font-bold leading-7 text-white">Audit Log Details</h2>
              <p className="mt-1 text-[13px] font-medium text-white/85">View the audit event details</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative z-10 rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} strokeWidth={2.2} />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <section className="space-y-3">
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#667085]">Table Details</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <DetailField label="Event" value={auditLog.event} />
                <DetailField label="Company" value={auditLog.company} />
                <DetailField label="Actor" value={auditLog.actor} />
                <DetailField label="Timestamp" value={auditLog.timestamp} />
                <DetailField label="Severity" value={<SeverityPill severity={auditLog.severity} />} />
                <div className="col-span-2">
                  <DetailField label="Description" value={auditLog.description} />
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </>,
    document.body,
  );
}
