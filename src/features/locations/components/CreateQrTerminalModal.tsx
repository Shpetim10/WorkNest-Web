"use client";

import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, MonitorSmartphone } from 'lucide-react';
import { Button, Input, Modal } from '@/common/ui';
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
      nextErrors.name = 'Terminal name is required.';
    }

    if (!Number.isInteger(payload.rotationSeconds) || payload.rotationSeconds < 20 || payload.rotationSeconds > 300) {
      nextErrors.rotationSeconds = 'Rotation seconds must be between 20 and 300.';
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
      setFormError('This site is missing required context. Please close this window and try again.');
      return;
    }

    if (!validate()) {
      setFormError("We couldn't create the QR terminal. Please try again.");
      return;
    }

    try {
      await createQrTerminalMutation.mutateAsync({
        companyId,
        siteId,
        data: payload,
      });
      setSuccessMessage('QR terminal created successfully.');
      setName('');
      setRotationSeconds('60');
      setErrors({});
    } catch (error) {
      setFormError(
        formatAttendanceFriendlyError(
          error,
          "We couldn't create the QR terminal. Please try again.",
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
              <h2 className="text-[22px] font-bold text-[#101828]">Create QR Terminal</h2>
              <p className="text-[13px] font-medium text-[#4A5565]">
                {siteName ? `Add another display terminal for ${siteName}.` : 'Add another QR display terminal for this site.'}
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
            label="Terminal Name"
            placeholder="Reception Tablet"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={errors.name}
          />

          <Input
            id="rotationSeconds"
            label="Rotation Seconds"
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
            The display page will render only the backend token inside the QR code. No business data is encoded on the frontend.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E5E7EB] bg-[#FCFCFD] px-6 py-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="bg-transparent text-[#4A5565] hover:bg-gray-100"
          >
            Close
          </Button>
          <Button onClick={() => void handleSubmit()} isLoading={createQrTerminalMutation.isPending}>
            Create Terminal
          </Button>
        </div>
      </div>
    </Modal>
  );
}
