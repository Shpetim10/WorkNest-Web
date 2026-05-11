"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { CompanyManagementRow } from '../types';

interface CompanyDetailsModalProps {
  company: CompanyManagementRow | null;
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

function StatusPill({ status }: { status: CompanyManagementRow['status'] }) {
  const isActive = status === 'active';

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-medium ${
        isActive ? 'bg-[#DCFCE7] text-[#008F45]' : 'bg-[#FEE2E2] text-[#DC2626]'
      }`}
    >
      {isActive ? 'active' : 'suspended'}
    </span>
  );
}

function AccountStatusPill({ status }: { status: CompanyManagementRow['status'] }) {
  const isActive = status === 'active';

  return (
    <span
      className={`inline-flex rounded-full px-3 py-2 text-[12px] font-bold uppercase ${
        isActive ? 'bg-[#DCFCE7] text-[#008F45]' : 'bg-[#FEE2E2] text-[#DC2626]'
      }`}
    >
      {isActive ? 'Active' : 'Suspended'}
    </span>
  );
}

export function CompanyDetailsModal({ company, isOpen, onClose }: CompanyDetailsModalProps) {
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

  if (!isOpen || !company) return null;

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
              <h2 className="text-[20px] font-bold leading-7 text-white">Company Details</h2>
              <p className="mt-1 text-[13px] font-medium text-white/85">View the Company details</p>
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
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#667085]">Basic Information</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <DetailField label="Company Name" value={company.companyName} />
                <DetailField label="Legal Name" value={company.legalName} />
                <DetailField label="NIPT" value={company.nipt} />
                <DetailField label="Registration Number" value={company.registrationNumber} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#667085]">Contact Information</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <DetailField label="Primary Email" value={company.email} />
                <DetailField label="Country" value={company.countryCode} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#667085]">Subscription</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <DetailField label="Plan" value={company.plan} />
                <DetailField label="Status" value={<StatusPill status={company.status} />} />
                <DetailField label="Created At" value={company.createdAt} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#667085]">Account Status</h3>
              <AccountStatusPill status={company.status} />
            </section>

            <div className="flex gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-[#B45309]">
              <AlertTriangle size={17} strokeWidth={2.2} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold">Platform-Level View Only</p>
                <p className="mt-1 text-[11px] leading-4">
                  You are viewing company metadata only. Employee data, payroll, attendance, and other internal HR
                  information are not accessible at the platform level.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>,
    document.body,
  );
}
