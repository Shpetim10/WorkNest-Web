"use client";

import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, MonitorSmartphone } from 'lucide-react';
import { Button, Input, Modal } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { useCreateQrTerminal } from '../api';
import { CreateQrTerminalRequest } from '../types';
import { formatAttendanceFriendlyError } from '../utils/errors';

interface CreateQrTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string | null;
  siteId: string | null;
  siteName?: string;
}

type TerminalErrors = Partial<Record<keyof CreateQrTerminalRequest, string>>;

export function CreateQrTerminalModal({
  isOpen,
  onClose,
  companyId,
  siteId,
  siteName,
}: CreateQrTerminalModalProps) {
  const { t } = useI18n();
  const createQrTerminalMutation = useCreateQrTerminal();
  const [name, setName] = useState('');
  const [rotationSeconds, setRotationSeconds] = useState('60');
  const [errors, setErrors] = useState<TerminalErrors>({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const payload = useMemo(() => {
    const parsedRotation = Number(rotationSeconds);
    return {
      name: name.trim(),
      rotationSeconds: parsedRotation,
    };
  }, [name, rotationSeconds]);

  const validate = () => {
    const nextErrors: TerminalErrors = {};

    if (!payload.name) {
      nextErrors.name = t('locations.modal.terminalNameRequired');
    }

    if (!Number.isInteger(payload.rotationSeconds) || payload.rotationSeconds < 20 || payload.rotationSeconds > 300) {
      nextErrors.rotationSeconds = t('locations.modal.rotationRange');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetState = () => {
    setName('');
    setRotationSeconds('60');
    setErrors({});
    setFormError('');
    setSuccessMessage('');
  };

  const handleClose = () => {
    if (createQrTerminalMutation.isPending) {
      return;
    }

    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    setFormError('');
    setSuccessMessage('');

    if (!companyId || !siteId) {
      setFormError(t('locations.modal.missingContext'));
      return;
    }

    if (!validate()) {
      setFormError(t('locations.modal.createQrFailed'));
      return;
    }

    try {
      await createQrTerminalMutation.mutateAsync({
        companyId,
        siteId,
        data: payload,
      });
      setSuccessMessage(t('locations.modal.createQrSuccess'));
      setName('');
      setRotationSeconds('60');
      setErrors({});
    } catch (error) {
      setFormError(
        formatAttendanceFriendlyError(
          error,
          t('locations.modal.createQrFailed'),
        ),
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      width="max-w-[560px]"
      containerClassName="p-0"
      showDefaultStyles={false}
    >
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)]">
        <div className="border-b border-[#E5E7EB] bg-gradient-to-r from-[#F8FBFF] to-[#F7FFF8] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#155DFC] text-white shadow-lg shadow-blue-100">
              <MonitorSmartphone size={20} />
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-[#101828]">{t('locations.modal.createQrTitle')}</h2>
              <p className="text-[13px] font-medium text-[#4A5565]">
                {siteName
                  ? t('locations.modal.createQrSubtitleNamed', { siteName })
                  : t('locations.modal.createQrSubtitleGeneric')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
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

          <Input
            id="terminalName"
            label={t('locations.modal.terminalName')}
            placeholder={t('locations.modal.terminalPlaceholder')}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={errors.name}
          />

          <Input
            id="rotationSeconds"
            label={t('locations.modal.rotationSeconds')}
            type="number"
            min={20}
            max={300}
            value={rotationSeconds}
            onChange={(event) => {
              setRotationSeconds(event.target.value);
              setErrors((prev) => ({ ...prev, rotationSeconds: undefined }));
            }}
            error={errors.rotationSeconds}
          />

          <p className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[12px] font-medium text-[#4A5565]">
            {t('locations.modal.tokenPrivacyNote')}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] bg-[#FCFCFD] px-6 py-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="bg-transparent text-[#4A5565] hover:bg-gray-100"
          >
            {t('common.actions.close')}
          </Button>
          <Button onClick={() => void handleSubmit()} isLoading={createQrTerminalMutation.isPending}>
            {t('locations.modal.createTerminal')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
