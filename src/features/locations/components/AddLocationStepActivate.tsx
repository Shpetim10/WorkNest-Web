"use client";

import React from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useI18n } from '@/common/i18n';
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

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-[5px]">
      <span className="text-[13px] font-normal text-[#4A5565]">{label}</span>
      <span className={`text-[14px] font-medium text-[#101828] ${mono ? 'font-mono tracking-tight' : ''}`}>
        {value || '-'}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#364153]">{title}</p>
      <div className="space-y-0">{children}</div>
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
  const { t } = useI18n();
  const isEdit = mode === 'edit';

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[16px] border border-gray-50/50 bg-[#F9FAFB] p-6">
        <div className="absolute top-0 right-0 -z-1 h-32 w-32 bg-gradient-to-br from-blue-50/50 to-emerald-50/50 blur-3xl" />
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[16px] font-bold text-[#101828]">
            {isEdit ? t('locations.form.reviewChanges') : t('locations.form.summaryBeforeActivation')}
          </p>
          <div
            className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1 text-[12px] font-semibold ${
              readyToActivate ? 'bg-[#ECFDF5] text-[#008236]' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {isCheckingReadiness ? (
              <Loader2 size={14} className="animate-spin" />
            ) : readyToActivate ? (
              <Check size={14} strokeWidth={2.5} />
            ) : (
              <AlertTriangle size={14} strokeWidth={2.5} />
            )}
            {isCheckingReadiness ? t('locations.form.checking') : readyToActivate ? t('locations.form.ready') : t('locations.form.needsAttention')}
          </div>
        </div>

        <div className="space-y-4">
          <Section title={t('locations.modal.basicInformation')}>
            <SummaryRow label={`${t('locations.form.siteName')}:`} value={step1.siteName} />
            <SummaryRow label={`${t('locations.form.siteCode')}:`} value={step1.siteCode} mono />
            <SummaryRow label={`${t('locations.form.siteType')}:`} value={step1.siteType} />
            <SummaryRow label={`${t('locations.form.country')}:`} value={step1.country} />
            <SummaryRow label={`${t('locations.form.timezone')}:`} value={step1.timezone} />
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          <Section title={t('locations.form.locationConfiguration')}>
            <SummaryRow label={`${t('locations.form.addressLine1')}:`} value={step2.addressLine1} />
            <SummaryRow label={`${t('locations.form.city')}:`} value={step2.city} />
            <SummaryRow
              label={`${t('locations.form.latitude')} / ${t('locations.form.longitude')}:`}
              value={
                step2.latitude != null && step2.longitude != null
                  ? `${step2.latitude.toFixed(5)}, ${step2.longitude.toFixed(5)}`
                  : '-'
              }
            />
            <SummaryRow label={`${t('locations.form.geofenceRadius')}:`} value={step2.geofenceRadius ? `${step2.geofenceRadius}m` : '-'} />
          </Section>

          <div className="border-t border-[#E5E7EB]" />

          <Section title={t('locations.modal.networkConfiguration')}>
            <SummaryRow label={`${t('locations.form.networkName')}:`} value={step3.name} />
            <SummaryRow label={`${t('locations.form.cidrBlock')}:`} value={step3.cidrBlock} mono />
            <SummaryRow label={`${t('locations.form.detectedIpAddress')}:`} value={step3.detectedIp} mono />
            <SummaryRow label={`${t('locations.form.confidence')}:`} value={step3.confidence} />
          </Section>
        </div>
      </div>

      {blockingIssues.length > 0 && (
        <div className="space-y-2 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3">
          {blockingIssues.map((issue) => (
            <div key={issue.code} className="flex items-start gap-2 text-[13px] text-rose-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3">
          {warnings.map((warning) => (
            <div key={warning.code} className="flex items-start gap-2 text-[13px] text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
        <Check size={14} className="shrink-0 text-[#008236]" strokeWidth={2.5} />
        <span className="text-[13px] font-semibold text-[#008236]">
          {isEdit
            ? t('locations.form.savingConsistency')
            : t('locations.form.createPayloadOnce')}
        </span>
      </div>
    </div>
  );
}
