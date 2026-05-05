"use client";

import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Input, Select, Textarea } from '@/common/ui';
import { Issue, IpVersion, LocationStep3Data, LocationStep3Errors } from '../types';

interface AddLocationStepNetworkProps {
  data: LocationStep3Data;
  errors: LocationStep3Errors;
  warnings: Issue[];
  isDetecting: boolean;
  onChange: (updates: Partial<LocationStep3Data>) => void;
  onBlurField: (path: string) => void;
  onDetect: () => void | Promise<void>;
  onClear: () => void;
}

const NETWORK_TYPE_OPTIONS = [
  { value: 'OFFICE_NETWORK', label: 'Office Network' },
  { value: 'DEDICATED_HOST', label: 'Dedicated Host' },
  { value: 'VPN_GATEWAY', label: 'VPN Gateway' },
  { value: 'MOBILE_CARRIER', label: 'Mobile Carrier' },
  { value: 'MANUAL_CIDR', label: 'Manual CIDR' },
];

export function AddLocationStepNetwork({
  data,
  errors,
  warnings,
  isDetecting,
  onChange,
  onBlurField,
  onDetect,
  onClear,
}: AddLocationStepNetworkProps) {
  const inputBase =
    'h-[40px] rounded-[10px] bg-[#F9FAFB] border-[#E5E7EB] text-[14px] placeholder:text-[rgba(10,10,10,0.5)]';
  const labelBase = 'text-[13px] font-semibold text-[#364153] leading-[20px] mb-1';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void onDetect()}
            disabled={isDetecting}
            className="flex h-[40px] items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#155DFC] to-[#1447E6] px-5 text-sm font-medium text-white shadow-md shadow-blue-200 transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ShieldCheck size={16} className="text-white" strokeWidth={2.5} />
            {isDetecting ? 'Detecting...' : 'Detect Network'}
          </button>

          <button
            type="button"
            onClick={onClear}
            className="text-[12px] font-semibold text-[#667085] transition-colors hover:text-[#101828]"
          >
            Remove suggestion
          </button>
        </div>

        <span className="rounded-[8px] bg-[#EEF4FF] px-3 py-1 text-[12px] font-semibold text-[#155DFC]">
          {data.confidence || 'MANUAL'}
        </span>
      </div>

      {(errors.detection || data.torExitNode || warnings.length > 0 || data.vpnDetected || data.cgnatDetected) && (
        <div className="space-y-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3">
          {errors.detection && (
            <div className="flex items-start gap-2 text-[13px] text-rose-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{errors.detection}</span>
            </div>
          )}
          {data.torExitNode && (
            <div className="flex items-start gap-2 text-[13px] text-rose-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>Tor exit nodes are blocked for trusted network setup.</span>
            </div>
          )}
          {data.vpnDetected && (
            <div className="flex items-start gap-2 text-[13px] text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>VPN activity was detected. Confidence may be lower until you are on the office network.</span>
            </div>
          )}
          {data.cgnatDetected && (
            <div className="flex items-start gap-2 text-[13px] text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>CGNAT was detected. Review the suggested CIDR carefully before saving.</span>
            </div>
          )}
          {warnings.map((warning) => (
            <div key={warning.code} className="flex items-start gap-2 text-[13px] text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-[10px] border border-[#D1FAE5] bg-gradient-to-r from-[#F0FDF4] to-[#F0F9FF] px-4 py-3">
        <div>
          <p className="mb-0.5 text-[13px] font-semibold leading-[20px] text-[#364153]">Detected IP Address</p>
          <p className="font-mono text-[17px] font-bold leading-[24px] tracking-tight text-[#101828]">
            {data.detectedIp || 'Not detected yet'}
          </p>
        </div>
      </div>

      <Input
        id="networkName"
        label="Network Name"
        placeholder="Office Network"
        value={data.name}
        onChange={(e) => onChange({ name: e.target.value })}
        onBlur={() => onBlurField('trustedNetworks[0].name')}
        error={errors.networkName}
        className={inputBase}
      />

      <div>
        <label className={`block ${labelBase}`}>
          CIDR Block <span className="text-red-500">*</span>
        </label>
        <input
          id="cidrBlock"
          type="text"
          placeholder="192.168.1.0/24"
          value={data.cidrBlock}
          onChange={(e) => onChange({ cidrBlock: e.target.value })}
          onBlur={() => onBlurField('trustedNetworks[0].cidrBlock')}
          className={`h-[40px] w-full rounded-[10px] border bg-[#F9FAFB] px-3 font-mono text-[14px] placeholder:text-[rgba(10,10,10,0.5)] transition-all focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 ${
            errors.cidrBlock ? 'border-red-500 focus:ring-red-200' : 'border-[#E5E7EB]'
          }`}
        />
        {errors.cidrBlock && <p className="mt-1 text-[12px] text-red-500">{errors.cidrBlock}</p>}
      </div>

      <Select
        id="networkType"
        label="Network Type"
        value={data.networkType}
        onChange={(e) => onChange({ networkType: e.target.value })}
        onBlur={() => onBlurField('trustedNetworks[0].networkType')}
        error={errors.networkType}
        className={labelBase}
        style={{ height: '40px', borderRadius: '10px', backgroundColor: '#F9FAFB' }}
        options={NETWORK_TYPE_OPTIONS}
      />

      <div>
        <label className={`block ${labelBase}`}>IP Version</label>
        <div className="mt-1 flex items-center gap-6">
          {(['IPV4', 'IPV6'] as IpVersion[]).map((version) => (
            <label key={version} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="ipVersion"
                value={version}
                checked={data.ipVersion === version}
                onChange={() => onChange({ ipVersion: version })}
                onBlur={() => onBlurField('trustedNetworks[0].ipVersion')}
                className="h-4 w-4 cursor-pointer accent-[#155DFC]"
              />
              <span className="text-[13px] font-medium text-[#364153]">{version}</span>
            </label>
          ))}
        </div>
        {errors.ipVersion && <p className="mt-1 text-[12px] text-red-500">{errors.ipVersion}</p>}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className={labelBase}>Expiry Date</label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={data.setExpiry}
              onChange={(e) => onChange({ setExpiry: e.target.checked })}
              className="h-4 w-4 cursor-pointer rounded accent-[#155DFC]"
            />
            <span className="text-[12px] font-medium text-[#155DFC]">Set expiry</span>
          </label>
        </div>

        {data.setExpiry ? (
          <>
            <input
              type="date"
              value={data.expiryDate}
              onChange={(e) => onChange({ expiryDate: e.target.value })}
              onBlur={() => onBlurField('trustedNetworks[0].expiryDate')}
              className="h-[40px] w-full rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[14px] text-[#101828] transition-all focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20"
            />
            {errors.expiryDate && <p className="mt-1 text-[12px] text-red-500">{errors.expiryDate}</p>}
          </>
        ) : (
          <div className="flex items-start gap-2.5 rounded-[8px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#D97706]" />
            <p className="text-[13px] leading-[20px] text-[#BB4D00]">
              Network configuration will not expire. Consider setting an expiry date for security.
            </p>
          </div>
        )}
      </div>

      <Textarea
        id="networkNotes"
        label="Notes"
        placeholder="Additional network information..."
        value={data.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        className="!min-h-[80px] resize-none rounded-[10px] border-[#E5E7EB] bg-[#F9FAFB] py-2 text-[14px]"
      />

      <div className="border-t border-[#E5E7EB] pt-3" />
    </div>
  );
}
