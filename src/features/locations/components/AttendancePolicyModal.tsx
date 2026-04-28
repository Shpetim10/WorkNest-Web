"use client";

import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button, Checkbox, Input, Modal } from '@/common/ui';
import { useAttendancePolicy, useUpdateAttendancePolicy } from '../api';
import { AttendancePolicy, AttendancePolicyUpdateRequest } from '../types';
import { formatAttendanceFriendlyError } from '../utils/errors';

interface AttendancePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string | null;
  siteId: string | null;
  siteName?: string;
}

type PolicyFormErrors = Partial<Record<keyof AttendancePolicyUpdateRequest, string>>;

function toForm(policy: AttendancePolicy): AttendancePolicyUpdateRequest {
  return {
    requireQr: policy.requireQr,
    requireLocation: policy.requireLocation,
    checkInEnabled: policy.checkInEnabled,
    checkOutEnabled: policy.checkOutEnabled,
    useNetworkAsWarning: policy.useNetworkAsWarning,
    rejectOutsideGeofence: policy.rejectOutsideGeofence,
    rejectPoorAccuracy: policy.rejectPoorAccuracy,
    allowManualCorrection: policy.allowManualCorrection,
    allowManagerManualEntry: policy.allowManagerManualEntry,
    missingCheckoutAutoCloseEnabled: policy.missingCheckoutAutoCloseEnabled,
    autoCheckoutAfterMinutes: policy.autoCheckoutAfterMinutes,
    lateGraceMinutes: policy.lateGraceMinutes,
    earlyClockInWindowMinutes: policy.earlyClockInWindowMinutes,
  };
}

function toStringValue(value: number | null) {
  return value == null ? '' : String(value);
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validateForm(form: AttendancePolicyUpdateRequest): PolicyFormErrors {
  const errors: PolicyFormErrors = {};

  if (!Number.isInteger(form.lateGraceMinutes) || form.lateGraceMinutes < 0) {
    errors.lateGraceMinutes = 'Late grace minutes must be 0 or more.';
  }

  if (!Number.isInteger(form.earlyClockInWindowMinutes) || form.earlyClockInWindowMinutes < 0) {
    errors.earlyClockInWindowMinutes = 'Early clock-in window must be 0 or more.';
  }

  if (form.missingCheckoutAutoCloseEnabled) {
    if (
      form.autoCheckoutAfterMinutes == null ||
      !Number.isInteger(form.autoCheckoutAfterMinutes) ||
      form.autoCheckoutAfterMinutes <= 0
    ) {
      errors.autoCheckoutAfterMinutes = 'Enter auto-checkout minutes greater than 0.';
    }
  }

  return errors;
}

function PolicyToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Checkbox
      label={label}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}

function AttendancePolicyForm({
  companyId,
  siteId,
  policy,
  onClose,
}: {
  companyId: string;
  siteId: string;
  policy: AttendancePolicy;
  onClose: () => void;
}) {
  const updatePolicyMutation = useUpdateAttendancePolicy();
  const [form, setForm] = useState<AttendancePolicyUpdateRequest>(() => toForm(policy));
  const [errors, setErrors] = useState<PolicyFormErrors>({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [autoCheckoutInput, setAutoCheckoutInput] = useState(() => toStringValue(policy.autoCheckoutAfterMinutes));

  const helperText = useMemo(() => {
    if (policy.policySource === 'COMPANY_DEFAULT') {
      return 'This site is currently using the company default attendance policy.';
    }

    return 'This site has its own attendance policy override.';
  }, [policy.policySource]);

  const updateNumericField = (
    field: 'lateGraceMinutes' | 'earlyClockInWindowMinutes',
    value: string,
  ) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    const parsed = Number(value);
    setForm((prev) => ({
      ...prev,
      [field]: Number.isFinite(parsed) ? parsed : Number.NaN,
    }));
  };

  const handleSubmit = async () => {
    setFormError('');
    setSuccessMessage('');

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError('We could not save the attendance policy. Please review the fields and try again.');
      return;
    }

    try {
      await updatePolicyMutation.mutateAsync({
        companyId,
        siteId,
        data: form,
      });
      setSuccessMessage('Attendance policy updated successfully.');
    } catch (error) {
      setFormError(
        formatAttendanceFriendlyError(
          error,
          'We could not save the attendance policy. Please review the fields and try again.',
        ),
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#D6E4FF] bg-[#F8FBFF] px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#155DFC]">
            Policy Source
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#155DFC] shadow-sm">
            {policy.policySource}
          </span>
        </div>
        <p className="mt-3 text-[13px] font-medium text-[#4A5565]">{helperText}</p>
      </div>

      {formError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <PolicyToggle label="Require QR" checked={form.requireQr} onChange={(checked) => setForm((prev) => ({ ...prev, requireQr: checked }))} />
        <PolicyToggle label="Require location" checked={form.requireLocation} onChange={(checked) => setForm((prev) => ({ ...prev, requireLocation: checked }))} />
        <PolicyToggle label="Check-in enabled" checked={form.checkInEnabled} onChange={(checked) => setForm((prev) => ({ ...prev, checkInEnabled: checked }))} />
        <PolicyToggle label="Check-out enabled" checked={form.checkOutEnabled} onChange={(checked) => setForm((prev) => ({ ...prev, checkOutEnabled: checked }))} />
        <PolicyToggle label="Use network as warning" checked={form.useNetworkAsWarning} onChange={(checked) => setForm((prev) => ({ ...prev, useNetworkAsWarning: checked }))} />
        <PolicyToggle label="Reject outside geofence" checked={form.rejectOutsideGeofence} onChange={(checked) => setForm((prev) => ({ ...prev, rejectOutsideGeofence: checked }))} />
        <PolicyToggle label="Reject poor accuracy" checked={form.rejectPoorAccuracy} onChange={(checked) => setForm((prev) => ({ ...prev, rejectPoorAccuracy: checked }))} />
        <PolicyToggle label="Allow manual correction" checked={form.allowManualCorrection} onChange={(checked) => setForm((prev) => ({ ...prev, allowManualCorrection: checked }))} />
        <PolicyToggle label="Allow manager manual entry" checked={form.allowManagerManualEntry} onChange={(checked) => setForm((prev) => ({ ...prev, allowManagerManualEntry: checked }))} />
        <PolicyToggle label="Auto-close missing checkout" checked={form.missingCheckoutAutoCloseEnabled} onChange={(checked) => setForm((prev) => ({
          ...prev,
          missingCheckoutAutoCloseEnabled: checked,
          autoCheckoutAfterMinutes: checked ? prev.autoCheckoutAfterMinutes : null,
        }))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          id="lateGraceMinutes"
          label="Late Grace Minutes"
          type="number"
          min={0}
          value={Number.isNaN(form.lateGraceMinutes) ? '' : String(form.lateGraceMinutes)}
          onChange={(event) => updateNumericField('lateGraceMinutes', event.target.value)}
          error={errors.lateGraceMinutes}
        />
        <Input
          id="earlyClockInWindowMinutes"
          label="Early Clock-in Window"
          type="number"
          min={0}
          value={Number.isNaN(form.earlyClockInWindowMinutes) ? '' : String(form.earlyClockInWindowMinutes)}
          onChange={(event) => updateNumericField('earlyClockInWindowMinutes', event.target.value)}
          error={errors.earlyClockInWindowMinutes}
        />
        <Input
          id="autoCheckoutAfterMinutes"
          label="Auto-checkout Minutes"
          type="number"
          min={1}
          disabled={!form.missingCheckoutAutoCloseEnabled}
          value={autoCheckoutInput}
          onChange={(event) => {
            const nextValue = event.target.value;
            setAutoCheckoutInput(nextValue);
            setErrors((prev) => ({ ...prev, autoCheckoutAfterMinutes: undefined }));
            const parsed = parseOptionalNumber(nextValue);
            setForm((prev) => ({
              ...prev,
              autoCheckoutAfterMinutes: parsed,
            }));
          }}
          error={errors.autoCheckoutAfterMinutes}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] pt-4">
        <Button
          variant="secondary"
          onClick={onClose}
          className="bg-transparent text-[#4A5565] hover:bg-gray-100"
        >
          Close
        </Button>
        <Button onClick={() => void handleSubmit()} isLoading={updatePolicyMutation.isPending}>
          Save Policy
        </Button>
      </div>
    </div>
  );
}

export function AttendancePolicyModal({
  isOpen,
  onClose,
  companyId,
  siteId,
  siteName,
}: AttendancePolicyModalProps) {
  const { data, isLoading, isError } = useAttendancePolicy(companyId, isOpen ? siteId : null);
  const effectivePolicy = data?.policy;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-[720px]"
      containerClassName="p-0"
      showDefaultStyles={false}
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)]">
        <div className="border-b border-[#E5E7EB] bg-gradient-to-r from-[#F5FAFF] to-[#EEF8F1] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#155DFC] text-white shadow-lg shadow-blue-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-[#101828]">Edit Attendance Policy</h2>
              <p className="text-[13px] font-medium text-[#4A5565]">
                {siteName ? `Manage the effective policy for ${siteName}.` : 'Manage the effective site attendance policy.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-10 text-center text-[14px] font-medium text-[#4A5565]">
              Loading attendance policy...
            </div>
          ) : isError || !effectivePolicy || !companyId || !siteId ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
              We could not load the attendance policy right now.
            </div>
          ) : (
            <AttendancePolicyForm
              key={`${effectivePolicy.policyId}-${effectivePolicy.policySource}`}
              companyId={companyId}
              siteId={siteId}
              policy={effectivePolicy}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
