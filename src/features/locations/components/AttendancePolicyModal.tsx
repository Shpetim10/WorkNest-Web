"use client";

import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button, Checkbox, Modal } from '@/common/ui';
import { useI18n } from '@/common/i18n';
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
  };
}

function validateForm(): PolicyFormErrors {
  return {};
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
  const { t } = useI18n();
  const updatePolicyMutation = useUpdateAttendancePolicy();
  const [form, setForm] = useState<AttendancePolicyUpdateRequest>(() => toForm(policy));
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const helperText = useMemo(() => {
    if (policy.policySource === 'COMPANY_DEFAULT') {
      return t('locations.modal.companyDefaultPolicy');
    }

    return t('locations.modal.sitePolicyOverride');
  }, [policy.policySource, t]);

  const handleSubmit = async () => {
    setFormError('');
    setSuccessMessage('');

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFormError(t('locations.modal.savePolicyFailed'));
      return;
    }

    try {
      await updatePolicyMutation.mutateAsync({
        companyId,
        siteId,
        data: form,
      });
      setSuccessMessage(t('locations.modal.policyUpdated'));
    } catch (error) {
      setFormError(
        formatAttendanceFriendlyError(
          error,
          t('locations.modal.savePolicyFailed'),
        ),
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#D6E4FF] bg-[#F8FBFF] px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#155DFC]">
            {t('locations.modal.policySource')}
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
        <PolicyToggle label={t('locations.modal.requireQr')} checked={form.requireQr} onChange={(checked) => setForm((prev) => ({ ...prev, requireQr: checked }))} />
        <PolicyToggle label={t('locations.modal.requireLocation')} checked={form.requireLocation} onChange={(checked) => setForm((prev) => ({ ...prev, requireLocation: checked }))} />
        <PolicyToggle label={t('locations.modal.checkInEnabled')} checked={form.checkInEnabled} onChange={(checked) => setForm((prev) => ({ ...prev, checkInEnabled: checked }))} />
        <PolicyToggle label={t('locations.modal.checkOutEnabled')} checked={form.checkOutEnabled} onChange={(checked) => setForm((prev) => ({ ...prev, checkOutEnabled: checked }))} />
        <PolicyToggle label={t('locations.modal.useNetworkAsWarning')} checked={form.useNetworkAsWarning} onChange={(checked) => setForm((prev) => ({ ...prev, useNetworkAsWarning: checked }))} />
        <PolicyToggle label={t('locations.modal.rejectOutsideGeofence')} checked={form.rejectOutsideGeofence} onChange={(checked) => setForm((prev) => ({ ...prev, rejectOutsideGeofence: checked }))} />
        <PolicyToggle label={t('locations.modal.rejectPoorAccuracy')} checked={form.rejectPoorAccuracy} onChange={(checked) => setForm((prev) => ({ ...prev, rejectPoorAccuracy: checked }))} />
        <PolicyToggle label={t('locations.modal.allowManualCorrection')} checked={form.allowManualCorrection} onChange={(checked) => setForm((prev) => ({ ...prev, allowManualCorrection: checked }))} />
        <PolicyToggle label={t('locations.modal.allowManagerManualEntry')} checked={form.allowManagerManualEntry} onChange={(checked) => setForm((prev) => ({ ...prev, allowManagerManualEntry: checked }))} />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] pt-4">
        <Button
          variant="secondary"
          onClick={onClose}
          className="bg-transparent text-[#4A5565] hover:bg-gray-100"
        >
          {t('common.actions.close')}
        </Button>
        <Button onClick={() => void handleSubmit()} isLoading={updatePolicyMutation.isPending}>
          {t('locations.modal.savePolicy')}
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
  const { t } = useI18n();
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
              <h2 className="text-[22px] font-bold text-[#101828]">{t('locations.modal.policyTitle')}</h2>
              <p className="text-[13px] font-medium text-[#4A5565]">
                {siteName
                  ? t('locations.modal.policySubtitleNamed', { siteName })
                  : t('locations.modal.policySubtitleGeneric')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-10 text-center text-[14px] font-medium text-[#4A5565]">
              {t('locations.modal.loadingPolicy')}
            </div>
          ) : isError || !effectivePolicy || !companyId || !siteId ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
              {t('locations.modal.policyLoadFailed')}
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
