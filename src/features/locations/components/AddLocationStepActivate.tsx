"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { LocationFormData, LocationStep2Data, LocationStep3Data } from '../types';
import { LocationFormMode } from './LocationFormModal';

interface AddLocationStepActivateProps {
  step1: LocationFormData;
  step2: LocationStep2Data;
  step3: LocationStep3Data;
  mode?: LocationFormMode;
}

interface SummaryRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function SummaryRow({ label, value, mono = false }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between py-[5px]">
      <span className="text-[13px] font-normal text-[#4A5565]">{label}</span>
      <span
        className={`text-[14px] font-medium text-[#101828] ${
          mono ? 'font-mono tracking-tight' : ''
        }`}
      >
        {value || '—'}
      </span>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-[#364153] mb-2">{title}</p>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

export function AddLocationStepActivate({
  step1,
  step2,
  step3,
  mode = 'add',
}: AddLocationStepActivateProps) {
  const isEdit = mode === 'edit';
  return (
    <div className="space-y-3">
      {/* Summary card */}
      <div className="rounded-[12px] border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFF] to-[#F0FDF4] p-5">
        <p className="text-[16px] font-bold text-[#101828] mb-4">
          {isEdit ? 'Review Changes – Ready to Update' : 'Summary – Ready to Activate'}
        </p>

        <div className="space-y-4">
          {/* Basic Information */}
          <Section title="Basic Information">
            <SummaryRow label="Site Name:" value={step1.siteName} />
            <SummaryRow label="Site Code:" value={step1.siteCode} mono />
            <SummaryRow label="Site Type:" value={step1.siteType} />
            <SummaryRow label="Country:" value={step1.country} />
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Location Configuration */}
          <Section title="Location Configuration">
            <SummaryRow label="Address:" value={step2.addressLine1} />
            <SummaryRow label="City:" value={step2.city} />
            <SummaryRow
              label="Geofence Radius:"
              value={step2.geofenceRadius ? `${step2.geofenceRadius}m` : '—'}
            />
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          {/* Network Configuration */}
          <Section title="Network Configuration">
            <SummaryRow label="Network Name:" value={step3.networkName} />
            <SummaryRow label="CIDR Block:" value={step3.cidrBlock} mono />
            <SummaryRow label="IP Version:" value={step3.ipVersion} />
          </Section>
        </div>
      </div>

      {/* Validation success banner */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[#F0FDF4] border border-[#BBF7D0]">
        <Check size={14} className="text-[#008236] shrink-0" strokeWidth={2.5} />
        <span className="text-[13px] font-semibold text-[#008236]">
          {isEdit
            ? 'All changes validated. Ready to update.'
            : 'All validations passed! Ready to activate.'}
        </span>
      </div>
    </div>
  );
}
