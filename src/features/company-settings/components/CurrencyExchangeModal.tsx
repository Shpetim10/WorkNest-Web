"use client";

import React, { useState } from 'react';
import { Modal } from '@/common/ui/Modal';
import { GradientModalHeader } from '@/common/ui/GradientModalHeader';
import { Button } from '@/common/ui';
import { AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { useUpdateCurrency } from '../api/use-update-currency';

const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'ALL – Albanian Lek' },
  { value: 'EUR', label: 'EUR – Euro' },
  { value: 'USD', label: 'USD – US Dollar' },
  { value: 'GBP', label: 'GBP – British Pound' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  currentCurrency: string;
}

export function CurrencyExchangeModal({ isOpen, onClose, companyId, currentCurrency }: Props) {
  const availableOptions = CURRENCY_OPTIONS.filter((o) => o.value !== currentCurrency);
  const [newCurrency, setNewCurrency] = useState(availableOptions[0]?.value ?? '');
  const [exchangeRate, setExchangeRate] = useState('');
  const [rateError, setRateError] = useState('');
  const [error, setError] = useState('');

  const updateCurrency = useUpdateCurrency(companyId);

  function handleRateChange(v: string) {
    setExchangeRate(v);
    setRateError('');
    setError('');
  }

  function validate() {
    const rate = parseFloat(exchangeRate);
    if (!exchangeRate.trim() || isNaN(rate) || rate <= 0) {
      setRateError('Enter a valid exchange rate greater than 0.');
      return false;
    }
    return true;
  }

  async function handleConfirm() {
    if (!validate()) return;
    setError('');
    try {
      await updateCurrency.mutateAsync({
        newCurrency,
        exchangeRate: parseFloat(exchangeRate),
      });
      onClose();
    } catch {
      setError('Failed to update currency. Please try again.');
    }
  }

  const currentLabel = CURRENCY_OPTIONS.find((o) => o.value === currentCurrency)?.label ?? currentCurrency;
  const newLabel = CURRENCY_OPTIONS.find((o) => o.value === newCurrency)?.label ?? newCurrency;

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-[480px]" showDefaultStyles={false}>
      <div className="overflow-hidden rounded-xl">
        <GradientModalHeader
          title="Change Currency"
          subtitle="Convert all monetary values to a new currency"
          onClose={onClose}
        />

        <div className="p-6 space-y-5 bg-white">
          {/* Current → New currency preview */}
          <div className="flex items-center gap-3 justify-center py-2">
            <span className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700">
              {currentLabel}
            </span>
            <ArrowRight size={18} className="text-gray-400 shrink-0" />
            <span className="px-4 py-2 rounded-lg bg-blue-50 text-sm font-semibold text-blue-700">
              {newLabel}
            </span>
          </div>

          {/* New currency picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">New Currency</label>
            <div className="relative">
              <select
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                className="w-full h-11 pl-4 pr-10 appearance-none cursor-pointer bg-[#f8fafc] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40 transition-all"
              >
                {availableOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Exchange rate input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              Exchange Rate
              <span className="ml-1.5 text-gray-400 font-normal">
                (1 {currentCurrency} = X {newCurrency})
              </span>
            </label>
            <input
              type="number"
              min="0.0001"
              step="any"
              value={exchangeRate}
              onChange={(e) => handleRateChange(e.target.value)}
              placeholder="e.g. 0.0099"
              className={`w-full h-11 px-4 bg-[#f8fafc] border ${
                rateError
                  ? 'border-red-400 focus:ring-red-500/10 focus:border-red-400'
                  : 'border-gray-200 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40'
              } rounded-xl text-sm text-gray-800 outline-none focus:ring-2 transition-all`}
            />
            {rateError && (
              <p className="text-[12px] text-red-500 font-medium pl-1">{rateError}</p>
            )}
          </div>

          {/* Warning banner */}
          <div className="flex gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-700 leading-relaxed">
              This will permanently convert all employee salaries, payroll results, and adjustments
              in the database. This action cannot be undone.
            </p>
          </div>

          {error && (
            <p className="text-[13px] text-red-500 font-medium text-center">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={updateCurrency.isPending}
              className="flex-1 bg-linear-to-r from-[#0ea5e9] to-[#10b981] hover:shadow-lg hover:shadow-teal-500/20 text-white"
            >
              {updateCurrency.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> Converting...
                </span>
              ) : 'Confirm Change'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}