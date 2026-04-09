"use client";

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { Input, Textarea, Select } from '@/common/ui';
import { IpVersion, LocationStep3Data, LocationStep3Errors } from '../types';

interface AddLocationStepNetworkProps {
  data: LocationStep3Data;
  errors: LocationStep3Errors;
  onChange: (updates: Partial<LocationStep3Data>) => void;
}

const NETWORK_TYPE_OPTIONS = [
  { value: '', label: 'Select network type' },
  { value: 'LAN', label: 'LAN' },
  { value: 'WAN', label: 'WAN' },
  { value: 'VPN', label: 'VPN' },
  { value: 'WLAN', label: 'WLAN' },
];

export function AddLocationStepNetwork({
  data,
  errors,
  onChange,
}: AddLocationStepNetworkProps) {
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const inputBase = 'h-[40px] rounded-[10px] bg-[#F9FAFB] border-[#E5E7EB] text-[14px] placeholder:text-[rgba(10,10,10,0.5)]';
  const labelBase = 'text-[13px] font-semibold text-[#364153] leading-[20px] mb-1';

  return (
    <div className="space-y-3">
      {/* Detected IP Address Card */}
      <div className="flex items-center justify-between px-4 py-3 rounded-[10px] border border-[#D1FAE5] bg-gradient-to-r from-[#F0FDF4] to-[#F0F9FF]">
        <div>
          <p className="text-[13px] font-semibold text-[#364153] leading-[20px] mb-0.5">
            Detected IP Address
          </p>
          <p className="text-[17px] font-bold font-mono text-[#101828] leading-[24px] tracking-tight">
            {data.detectedIp}
          </p>
        </div>
        <span className="px-3 py-1 rounded-[6px] bg-[#DCFCE7] text-[#008236] text-[12px] font-semibold tracking-wide">
          {data.networkName ? 'CONFIGURED' : 'AUTO_HIGH'}
        </span>
      </div>

      {/* Network Name */}
      <Input
        id="networkName"
        label="Network Name"
        required
        placeholder="Office Network"
        value={data.networkName}
        onChange={(e) => onChange({ networkName: e.target.value })}
        error={errors.networkName}
        className={inputBase}
      />

      {/* CIDR Block */}
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
          className={`w-full h-[40px] px-3 rounded-[10px] border font-mono text-[14px] bg-[#F9FAFB] placeholder:font-mono placeholder:text-[rgba(10,10,10,0.5)] transition-all focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 ${
            errors.cidrBlock
              ? 'border-red-500 focus:ring-red-200'
              : 'border-[#E5E7EB]'
          }`}
        />
        {errors.cidrBlock && (
          <p className="mt-1 text-[12px] text-red-500">{errors.cidrBlock}</p>
        )}
      </div>

      {/* Network Type */}
      <Select
        id="networkType"
        label="Network Type"
        value={data.networkType}
        onChange={(e) => onChange({ networkType: e.target.value })}
        className={labelBase}
        style={{ height: '40px', borderRadius: '10px', backgroundColor: '#F9FAFB' }}
        options={NETWORK_TYPE_OPTIONS}
      />

      {/* IP Version */}
      <div>
        <label className={`block ${labelBase}`}>IP Version</label>
        <div className="flex items-center gap-6 mt-1">
          {(['IPv4', 'IPv6'] as IpVersion[]).map((v) => (
            <label
              key={v}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="ipVersion"
                value={v}
                checked={data.ipVersion === v}
                onChange={() => onChange({ ipVersion: v })}
                className="w-4 h-4 accent-[#155DFC] cursor-pointer"
              />
              <span className="text-[13px] font-medium text-[#364153]">{v}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Expiry Date */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelBase}>Expiry Date</label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.setExpiry}
              onChange={(e) => onChange({ setExpiry: e.target.checked })}
              className="w-4 h-4 accent-[#155DFC] cursor-pointer rounded"
            />
            <span className="text-[12px] font-medium text-[#155DFC]">Set expiry</span>
          </label>
        </div>

        {data.setExpiry ? (
          <input
            type="date"
            value={data.expiryDate}
            onChange={(e) => onChange({ expiryDate: e.target.value })}
            className="w-full h-[40px] px-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 transition-all"
          />
        ) : (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A]">
            <AlertTriangle size={14} className="text-[#D97706] mt-0.5 shrink-0" />
            <p className="text-[13px] font-normal text-[#BB4D00] leading-[20px]">
              Network configuration will not expire. Consider setting an expiry date for security.
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      <Textarea
        id="networkNotes"
        label="Notes"
        placeholder="Additional network information..."
        value={data.networkNotes}
        onChange={(e) => onChange({ networkNotes: e.target.value })}
        className="rounded-[10px] bg-[#F9FAFB] border-[#E5E7EB] text-[14px] !min-h-[80px] resize-none py-2"
      />

      {/* Advanced Settings – flat expandable, no card */}
      <div className="border-t border-[#E5E7EB] pt-3">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[#155DFC] text-[13px] font-semibold mb-3 hover:opacity-80 transition-opacity"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`}
          />
          Advanced Settings
        </button>

        {advancedOpen && (
          <div>
            <label className={`block ${labelBase}`}>Priority Override</label>
            <input
              type="number"
              min={1}
              value={data.priorityOverride}
              onChange={(e) => onChange({ priorityOverride: e.target.value })}
              className="w-full h-[40px] px-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] text-[14px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
}
