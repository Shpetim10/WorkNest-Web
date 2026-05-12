"use client";

import React, { useState } from 'react';
import { Settings, Info } from 'lucide-react';
import { PageHeaderDecorativeCircles } from '@/common/ui';
import { useSickLeavePolicy, useUpsertSickLeavePolicy } from '../api';

const LABEL = 'block text-[13px] font-bold uppercase tracking-wider text-[#4A5565] mb-2';
const INPUT = 'w-full h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[14px] font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#155DFC]/50 focus:ring-4 focus:ring-[#155DFC]/5 hover:border-gray-300';

export function SickLeavePolicyView() {
  const { data, isLoading } = useSickLeavePolicy();
  const upsert = useUpsertSickLeavePolicy();

  const [localPercentage, setLocalPercentage] = useState<string | null>(null);
  const [localMaxDays, setLocalMaxDays] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const percentage = localPercentage ?? (data ? String(data.companyPaidPercentage) : '');
  const maxDays = localMaxDays ?? (data ? String(data.maxCompanyPaidDays) : '');

  function handleSave() {
    setSuccessMsg('');
    setErrorMsg('');
    const pct = parseFloat(percentage);
    const days = parseInt(maxDays, 10);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setErrorMsg('Company paid percentage must be between 0 and 100.');
      return;
    }
    if (isNaN(days) || days < 0 || days > 365) {
      setErrorMsg('Maximum sick days must be between 0 and 365.');
      return;
    }
    upsert.mutate(
      { companyPaidPercentage: pct, maxCompanyPaidDays: days },
      {
        onSuccess: () => {
          setSuccessMsg('Sick leave policy saved successfully.');
          setLocalPercentage(null);
          setLocalMaxDays(null);
        },
        onError: () => setErrorMsg('Failed to save policy. Please try again.'),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between"
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <PageHeaderDecorativeCircles />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Settings size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Sick Leave Policy</h1>
            <p className="text-white/80 text-sm mt-0.5">Configure company-paid sick leave rules</p>
          </div>
        </div>
      </div>

      <div
        className="bg-white rounded-2xl border border-gray-100 p-8 max-w-xl"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }}
      >
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading policy...</p>
        ) : (
          <>
            {data?.isDefault && (
              <div className="flex items-start gap-3 mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 font-medium">
                  These are system default values. No custom policy has been saved yet.
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className={LABEL}>Company paid percentage</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g. 80"
                    value={percentage}
                    onChange={(e) => setLocalPercentage(e.target.value)}
                    className={INPUT}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className={LABEL}>Maximum company-paid sick days per year</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  step="1"
                  placeholder="e.g. 14"
                  value={maxDays}
                  onChange={(e) => setLocalMaxDays(e.target.value)}
                  className={INPUT}
                />
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm font-semibold text-green-700">
                  {successMsg}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={upsert.isPending}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] px-10 text-[14px] font-bold text-white shadow-lg shadow-[#2B7FFF]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {upsert.isPending ? 'Saving...' : 'Save Policy'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
