"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, Trash2, X } from 'lucide-react';
import { useI18n } from '@/common/i18n';
import { ProfileAvatar } from './ProfileAvatar';

type ProfilePhotoUploaderProps = {
  imageUrl?: string;
  initial: string;
  displayName: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void> | void;
  title?: string;
  subtitle?: string;
  successMessage?: string;
  removeMessage?: string;
  errorMessage?: string;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfilePhotoUploader({
  imageUrl,
  initial,
  displayName,
  onUpload,
  onRemove,
  title,
  subtitle,
  successMessage,
  removeMessage,
  errorMessage,
}: ProfilePhotoUploaderProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl('');
    resetInput();
  };

  const validateFile = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return t('validation.imageTypes');
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return t('validation.imageSize');
    }

    return '';
  };

  const selectFile = (file: File) => {
    const validationError = validateFile(file);
    setMessage('');
    setError(validationError);

    if (validationError) {
      resetInput();
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setMessage('');
    setError('');
    setIsUploading(true);

    try {
      await onUpload(selectedFile);
      setMessage(successMessage ?? t('dashboard.profile.photoSaved'));
      clearPreview();
    } catch {
      setError(errorMessage ?? t('dashboard.profile.photoSaveFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;

    setMessage('');
    setError('');
    setIsUploading(true);

    try {
      await onRemove();
      clearPreview();
      setMessage(removeMessage ?? t('dashboard.profile.photoRemoved'));
    } catch {
      setError(errorMessage ?? t('dashboard.profile.photoSaveFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const displayedImageUrl = previewUrl || imageUrl;
  const hasPendingPhoto = Boolean(selectedFile);

  return (
    <div
      className={`rounded-2xl border px-4 py-4 transition-colors ${
        isDragging ? 'border-[#155DFC] bg-blue-50' : 'border-[#E6ECF5] bg-[#F8FBFF]'
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!isUploading) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label={t('dashboard.profile.choosePhoto')}
          className="group relative shrink-0 rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#155DFC]/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <ProfileAvatar
            imageUrl={displayedImageUrl}
            initial={initial}
            alt={displayName || t('auth.activateInvitation.previewAlt')}
            className="h-16 w-16"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#155DFC] text-white shadow-sm transition-colors group-hover:bg-[#0F4BD8]">
            {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} strokeWidth={2.5} />}
          </span>
        </button>

        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-[13px] font-bold leading-5 text-[#111827]">
            {title ?? t('dashboard.profile.photoTitle')}
          </h3>
          <p className="mt-0.5 text-[11px] font-medium leading-4 text-[#6B7280]">
            {subtitle ?? t('dashboard.profile.photoSubtitle')}
          </p>

          {selectedFile && (
            <p className="mt-2 max-w-full truncate rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#155DFC] ring-1 ring-blue-100">
              {t('dashboard.profile.selectedPhoto', { name: selectedFile.name })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!hasPendingPhoto && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-8 items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 text-[11.5px] font-bold text-[#155DFC] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Camera size={13} strokeWidth={2.4} />
            {t('dashboard.profile.choosePhoto')}
          </button>
        )}

        {hasPendingPhoto && (
          <>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#155DFC] px-3 text-[11.5px] font-bold text-white transition-colors hover:bg-[#0F4BD8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
              {isUploading ? t('common.actions.saving') : t('dashboard.profile.savePhoto')}
            </button>

            <button
              type="button"
              onClick={clearPreview}
              disabled={isUploading}
              className="flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-[11.5px] font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={13} strokeWidth={2.5} />
              {t('common.actions.cancel')}
            </button>
          </>
        )}

        {imageUrl && onRemove && !hasPendingPhoto && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading}
            className="flex h-8 items-center gap-1.5 rounded-full border border-red-100 bg-white px-3 text-[11.5px] font-bold text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={13} strokeWidth={2.3} />
            {t('auth.activateInvitation.removePhoto')}
          </button>
        )}
      </div>

      {(message || error) && (
        <p className={`mt-2 text-left text-[11.5px] font-semibold ${error ? 'text-red-500' : 'text-emerald-600'}`}>
          {error || message}
        </p>
      )}
    </div>
  );
}
