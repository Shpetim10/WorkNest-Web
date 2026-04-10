"use client";

import React, { useState } from 'react';
import { AlertTriangle, Check, ChevronDown, ShieldCheck, Globe, Wifi } from 'lucide-react';
import { Input, Textarea, Select, Button } from '@/common/ui';
import { Issue, IpVersion, LocationStep3Data, LocationStep3Errors } from '../types';

interface AddLocationStepNetworkProps {
  data: LocationStep3Data;
  errors: LocationStep3Errors;
  warnings: Issue[];
  isDetecting: boolean;
  onChange: (updates: Partial<LocationStep3Data>) => void;
  onDetect: () => void | Promise<void>;
}

const NETWORK_TYPE_OPTIONS = [
  { value: 'AUTO_DETECTED', label: 'Auto Detected' },
  { value: 'PUBLIC_IP', label: 'Public IP' },
  { value: 'CIDR_RANGE', label: 'CIDR Range' },
  { value: 'VPN', label: 'VPN' },
];

export function AddLocationStepNetwork({
  data,
  errors,
  warnings,
  isDetecting,
  onChange,
  onDetect,
}: AddLocationStepNetworkProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={() => void onDetect()}
          isLoading={isDetecting}
          variant="primary"
          className="h-10 px-6"
          icon={<ShieldCheck size={16} strokeWidth={3} />}
          iconPosition="left"
        >
          {isDetecting ? 'Detecting Network...' : 'Detect Current Network'}
        </Button>

        {data.confidence && (
          <div className={`flex items-center gap-2 rounded-full border px-4 py-1.5 shadow-sm transition-all duration-300 ${
            data.confidence === 'AUTO_HIGH'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
              : data.confidence === 'AUTO_LOW'
                ? 'border-amber-100 bg-amber-50 text-amber-700'
                : 'border-slate-100 bg-slate-50 text-slate-600'
          }`}>
            <div className={`h-2 w-2 rounded-full ${
              data.confidence === 'AUTO_HIGH' ? 'bg-emerald-500' : 'bg-amber-500'
            } ${data.confidence !== 'MANUAL' ? 'animate-pulse' : ''}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Confidence: {data.confidence.replace('AUTO_', '')}
            </span>
          </div>
        )}
      </div>

      {(errors.detection || errors.cidrBlock || errors.networkName) && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle size={16} />
          <span>{errors.detection ?? errors.networkName ?? errors.cidrBlock}</span>
        </div>
      )}

      {(warnings.length > 0 || data.vpnDetected || data.cgnatDetected || data.torExitNode) && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.1)]">
          {data.torExitNode && (
            <div className="flex items-start gap-3 text-[13px] font-semibold text-rose-700">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>Tor exit nodes are strictly blocked for trusted network security.</span>
            </div>
          )}
          {data.vpnDetected && !data.torExitNode && (
            <div className="flex items-start gap-3 text-[13px] font-medium text-amber-800">
              <Globe size={15} className="mt-0.5 shrink-0" />
              <span>VPN usage detected. Setup confidence is lower; please verify your office network.</span>
            </div>
          )}
          {data.cgnatDetected && !data.torExitNode && (
            <div className="flex items-start gap-3 text-[13px] font-medium text-amber-800">
              <Wifi size={15} className="mt-0.5 shrink-0" />
              <span>Carrier-grade NAT detected. Carefully confirm the suggested CIDR range.</span>
            </div>
          )}
          {warnings.map((warning) => (
            <div key={warning.code} className="flex items-start gap-3 text-[13px] font-medium text-amber-800">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Network Detection Status */}
      <div className="group relative flex items-center justify-between rounded-2xl border border-[#D1FAE5] bg-white p-6 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.08)] transition-all hover:shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 to-[#01c951]" />
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-inner">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#6A7282]">
              Detected Public IP Address
            </p>
            <p className="font-mono text-[18px] font-black tracking-tight text-[#101828]">
              {data.detectedIp || 'Await detection...'}
            </p>
          </div>
        </div>
        {data.detectedIp && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-white shadow-lg shadow-emerald-500/20">
            <Check size={14} strokeWidth={4} />
            <span className="text-[11px] font-bold uppercase">Verified</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-6 items-start">
        <Input
          id="networkName"
          label="Network Name"
          required
          placeholder="e.g Tirana HQ Office"
          value={data.networkName}
          onChange={(e) => onChange({ networkName: e.target.value })}
          error={errors.networkName}
          autoComplete="off"
        />
        <Input
          id="cidrBlock"
          label="CIDR Block"
          required
          placeholder="e.g 203.0.113.0/29"
          value={data.cidrBlock}
          onChange={(e) => onChange({ cidrBlock: e.target.value })}
          error={errors.cidrBlock}
          className="font-mono"
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-2 gap-x-6 items-start">
        <Select
          id="networkType"
          label="Network Type"
          value={data.networkType}
          onChange={(e) => onChange({ networkType: e.target.value })}
          options={NETWORK_TYPE_OPTIONS}
        />

        <div>
          <label className="mb-3 block text-[13px] font-semibold text-[#344054]">IP Version</label>
          <div className="flex h-11 items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E4E7EC]">
            {(['IPv4', 'IPv6'] as IpVersion[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ipVersion: value })}
                className={`flex-1 h-full rounded-lg text-[13px] font-bold transition-all ${
                  data.ipVersion === value
                    ? 'bg-white text-[#155DFC] shadow-sm ring-1 ring-[#EAECF0]'
                    : 'text-[#667085] hover:text-[#344054]'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#F8FAFC]/50 p-6 rounded-2xl border border-[#EAECF0]/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-[14px] font-bold text-[#364153]">Security Expiry</label>
            <div className={`h-2 w-2 rounded-full ${data.setExpiry ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
          </div>
          <button
            type="button"
            onClick={() => onChange({ setExpiry: !data.setExpiry })}
            className={`flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
              data.setExpiry ? 'bg-[#155DFC]' : 'bg-[#E2E8F0]'
            }`}
          >
            <div className={`h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
              data.setExpiry ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {data.setExpiry ? (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <Input
              id="expiryDate"
              label="Expiration Date"
              type="date"
              value={data.expiryDate}
              onChange={(e) => onChange({ expiryDate: e.target.value })}
              className="bg-white"
            />
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-blue-500" />
            <p className="text-[12px] font-medium leading-relaxed text-blue-700">
              Permanent access. Consider setting an expiration for temporary sites or external partners.
            </p>
          </div>
        )}
      </div>

      <Textarea
        id="networkNotes"
        label="Technical Notes"
        placeholder="Document any special routing, VPN requirements, or gateway information..."
        value={data.networkNotes}
        onChange={(e) => onChange({ networkNotes: e.target.value })}
        rows={3}
      />

      <div className="mt-4 border-t border-[#EAECF0] pt-6">
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="group mb-6 flex items-center gap-2 text-[13px] font-bold text-[#155DFC] transition-all hover:opacity-80"
        >
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-[#155DFC]/10 transition-transform duration-300 ${advancedOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} />
          </div>
          Advanced Network Settings
        </button>

        {advancedOpen && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <Input
              id="priorityOverride"
              label="Priority Override (1-100)"
              type="number"
              min={1}
              max={100}
              value={data.priorityOverride}
              onChange={(e) => onChange({ priorityOverride: e.target.value })}
              className="max-w-[200px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
