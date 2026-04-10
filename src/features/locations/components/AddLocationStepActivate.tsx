"use client";

import React from 'react';
import { AlertTriangle, Check, Loader2, Info, ArrowRight, ShieldCheck, MapPin, Building2 } from 'lucide-react';
import { Issue, LocationFormData, LocationStep2Data, LocationStep3Data } from '../types';
import { LocationFormMode } from './LocationFormModal';

interface AddLocationStepActivateProps {
  step1: LocationFormData;
  step2: LocationStep2Data;
  step3: LocationStep3Data;
  mode?: LocationFormMode;
  warnings?: Issue[];
  blockingIssues?: Issue[];
  readyToActivate?: boolean;
  isCheckingReadiness?: boolean;
}

interface SummaryRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function SummaryRow({ label, value, mono = false }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F2F4F7] last:border-0">
      <span className="text-[13px] font-medium text-[#667085]">{label}</span>
      <span className={`text-[14px] font-bold text-[#101828] ${mono ? 'font-mono bg-[#F8FAFC] px-1.5 py-0.5 rounded text-[12px]' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8FAFC] text-[#667085] border border-[#EAECF0]">
          <Icon size={16} />
        </div>
        <p className="text-[14px] font-bold text-[#344054]">{title}</p>
      </div>
      <div className="rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-sm shadow-[#101828]/05">
        {children}
      </div>
    </div>
  );
}

export function AddLocationStepActivate({
  step1,
  step2,
  step3,
  mode = 'add',
  warnings = [],
  blockingIssues = [],
  readyToActivate = false,
  isCheckingReadiness = false,
}: AddLocationStepActivateProps) {
  const isEdit = mode === 'edit';

  return (
    <div className="animate-in zoom-in space-y-6 duration-500 fade-in">
      <div className="relative overflow-hidden rounded-[24px] bg-[#F9FAFB] p-6 lg:p-8 border border-[#EAECF0]">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gradient-to-br from-[#155DFC]/05 to-transparent blur-3xl" />
        
        <div className="relative z-10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-[24px] font-black tracking-tight text-[#101828]">
              {isEdit ? 'Review Site Changes' : 'Final Activation Review'}
            </h3>
            <p className="mt-1 text-[14px] font-medium text-[#667085]">
              Please verify all details before {isEdit ? 'saving' : 'activating'} the site.
            </p>
          </div>
          
          <div className={`flex items-center gap-2.5 self-start rounded-2xl border px-5 py-2.5 shadow-sm transition-all duration-500 ${
            readyToActivate
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-500/05'
              : 'border-amber-200 bg-amber-50 text-amber-800 shadow-amber-500/05'
          }`}>
            {isCheckingReadiness ? (
              <Loader2 size={18} className="animate-spin text-[#155DFC]" />
            ) : readyToActivate ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check size={14} strokeWidth={4} />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                <AlertTriangle size={14} strokeWidth={3} />
              </div>
            )}
            <span className="text-[13px] font-black uppercase tracking-widest">
              {isCheckingReadiness
                ? 'Validating...'
                : readyToActivate
                  ? isEdit
                    ? 'State Validated'
                    : 'Ready for Launch'
                  : 'Action Required'}
            </span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <Section title="Company Site Identity" icon={Building2}>
              <div className="space-y-1">
                <SummaryRow label="Site Name" value={step1.siteName} />
                <SummaryRow label="Internal Code" value={step1.siteCode} mono />
                <SummaryRow label="Classification" value={step1.siteType} />
                <SummaryRow label="Jurisdiction" value={step1.country} />
                <SummaryRow label="Operating Timezone" value={step1.timezone} />
              </div>
            </Section>

            {step1.notes && (
              <div className="rounded-2xl bg-[#155DFC]/05 p-6 border border-[#155DFC]/10">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-[#155DFC]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#155DFC]">Admin Notes</span>
                </div>
                <p className="text-[14px] leading-relaxed text-[#475467] font-medium italic">
                  &quot;{step1.notes}&quot;
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Section title="Geospatial Configuration" icon={MapPin}>
              <div className="space-y-1">
                <SummaryRow label="Primary Address" value={step2.addressLine1} />
                <SummaryRow label="Operational City" value={step2.city} />
                <SummaryRow label="Precise Coordinates" value={
                  step2.latitude != null && step2.longitude != null
                    ? `${step2.latitude.toFixed(6)}, ${step2.longitude.toFixed(6)}`
                    : '-'
                } mono />
                <SummaryRow label="Security Perimeter" value={step2.geofenceRadius ? `${step2.geofenceRadius}m` : '-'} />
              </div>
            </Section>

            <Section title="Restricted Network" icon={ShieldCheck}>
              <div className="space-y-1">
                <SummaryRow label="Identifier" value={step3.networkName} />
                <SummaryRow label="CIDR / Gateway" value={step3.cidrBlock} mono />
                <SummaryRow label="Setup Source IP" value={step3.detectedIp} mono />
                <SummaryRow label="Trust Confidence" value={step3.confidence} />
              </div>
            </Section>
          </div>
        </div>
      </div>

      {blockingIssues.length > 0 && (
        <div className="group animate-in slide-in-from-bottom-4 duration-500 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 shadow-lg shadow-rose-500/05">
          <div className="flex items-center gap-3 bg-rose-100/50 px-6 py-3 border-b border-rose-200/50">
            <AlertTriangle size={18} className="text-rose-600" />
            <p className="text-[13px] font-black uppercase tracking-wider text-rose-700">Critical Blocking Issues</p>
          </div>
          <div className="p-6 space-y-3">
            {blockingIssues.map((issue) => (
              <div key={issue.code} className="flex items-start gap-3 text-[14px] font-semibold text-rose-700">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="animate-in slide-in-from-bottom-4 duration-700 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 shadow-lg shadow-amber-500/05">
          <div className="flex items-center gap-3 bg-amber-100/50 px-6 py-3 border-b border-amber-200/50">
            <Info size={18} className="text-amber-600" />
            <p className="text-[13px] font-black uppercase tracking-wider text-amber-800">Operational Warnings</p>
          </div>
          <div className="p-6 space-y-3">
            {warnings.map((warning) => (
              <div key={warning.code} className="flex items-start gap-3 text-[14px] font-semibold text-amber-800">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!blockingIssues.length && (
        <div className="relative overflow-hidden flex items-center gap-5 rounded-[24px] border border-[#E9F0FF] bg-[#F5F8FF] p-8 shadow-sm">
          <div className="absolute right-0 h-full w-24 bg-gradient-to-l from-white/20 to-transparent" />
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md text-[#155DFC]">
            <ShieldCheck size={28} />
          </div>
          <div className="space-y-1">
            <p className="text-[15px] font-extrabold text-[#101828]">System Ready for {isEdit ? 'Finalization' : 'Activation'}</p>
            <p className="text-[14px] font-medium leading-relaxed text-[#155DFC]/80">
              {isEdit
                ? 'Site configuration is valid. Clicking finish will persist all changes and update active security policies.'
                : 'All integrity checks passed. Activation will establish the geofence and trusted network perimeter live.'}
            </p>
          </div>
          <div className="ml-auto hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-[#155DFC]/10 text-[#155DFC]">
            <ArrowRight size={20} />
          </div>
        </div>
      )}
    </div>
  );
}
