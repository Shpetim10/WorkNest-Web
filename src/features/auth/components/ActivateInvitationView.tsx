"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  X,
} from 'lucide-react';
import { Button, Card, Checkbox, Input } from '@/common/ui';
import { useActivateInvitation } from '../api/activate-invitation';
import { usePublicMediaUpload } from '../api/register-company';
import { MediaCategory } from '../types/registration';

type ActivateInvitationViewProps = {
  initialToken?: string;
};

type FormState = {
  password: string;
  confirmPassword: string;
  gdprConsent: boolean;
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function readBrowserToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URLSearchParams(window.location.search).get('token')?.trim() ?? '';
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof AxiosError)) {
    return '';
  }

  const data = error.response?.data as
    | { message?: string; error?: string | { message?: string } }
    | undefined;

  if (typeof data?.error === 'string') {
    return data.error;
  }

  if (typeof data?.error === 'object' && typeof data.error?.message === 'string') {
    return data.error.message;
  }

  return data?.message ?? '';
}

function ActivateInvitationContent({ initialToken = '' }: ActivateInvitationViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activateMutation = useActivateInvitation();
  const uploadMutation = usePublicMediaUpload();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState<FormState>({
    password: '',
    confirmPassword: '',
    gdprConsent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resolvedToken = useMemo(() => {
    const searchToken = searchParams.get('token')?.trim() ?? '';
    return searchToken || initialToken.trim() || readBrowserToken();
  }, [initialToken, searchParams]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const passwordChecks = useMemo(
    () => [
      { key: 'length', label: 'At least 8 characters', passed: formData.password.length >= 8 },
      { key: 'uppercase', label: 'One uppercase letter', passed: /[A-Z]/.test(formData.password) },
      { key: 'number', label: 'One number', passed: /\d/.test(formData.password) },
    ],
    [formData.password]
  );

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const clearError = (key: string) => {
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleFieldChange =
    (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === 'checkbox' ? event.target.checked : event.target.value;

      setFormData((current) => ({ ...current, [field]: value }));
      clearError(field);
      clearError('submit');

      if (field === 'password' || field === 'confirmPassword') {
        clearError('password');
        clearError('confirmPassword');
      }
    };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((current) => ({
        ...current,
        profileImage: 'Image must be smaller than 2MB.',
      }));
      event.target.value = '';
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    clearError('profileImage');
    clearError('submit');
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl('');
    clearError('profileImage');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (token: string) => {
    const nextErrors: Record<string, string> = {};

    if (!token) {
      nextErrors.submit =
        'Activation token is missing. Please reopen the original invitation link.';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(formData.password)) {
      nextErrors.password = 'Password must include an uppercase letter.';
    } else if (!/\d/.test(formData.password)) {
      nextErrors.password = 'Password must include a number.';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.gdprConsent) {
      nextErrors.gdprConsent = 'You must accept the terms to continue.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const tokenToSubmit = resolvedToken || readBrowserToken();

    if (!validateForm(tokenToSubmit)) {
      return;
    }

    try {
      let profileImageStorageKey: string | undefined;
      let profileImageStoragePath: string | undefined;

      if (selectedFile) {
        const uploadResponse = await uploadMutation.mutateAsync({
          file: selectedFile,
          category: MediaCategory.USER_PROFILE,
        });

        profileImageStorageKey = uploadResponse.storageKey;
        profileImageStoragePath = uploadResponse.storagePath;
      }

      await activateMutation.mutateAsync({
        token: tokenToSubmit,
        password: formData.password,
        gdprConsent: formData.gdprConsent,
        preferredLanguage: 'sq',
        profileImageStorageKey,
        profileImageStoragePath,
      });

      setIsSuccess(true);
      setErrors({});
    } catch (error) {
      setErrors({
        submit:
          getErrorMessage(error) ||
          'Activation failed. Please verify the invitation link and try again.',
      });
    }
  };

  if (!resolvedToken) {
    return (
      <Card className="relative w-full max-w-[480px] p-10 sm:p-12 z-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <AlertTriangle className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1c23] mb-3">Invalid Link</h2>
        <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
          The activation link is missing its security token. Please check your e-mail and use the full link provided.
        </p>
        <Button
          type="button"
          fullWidth
          onClick={() => router.push('/login')}
          variant="secondary"
          icon={<LogIn className="w-4 h-4" />}
        >
          Return to Login
        </Button>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="relative w-full max-w-[480px] p-10 sm:p-12 z-10 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1c23] mb-3">Account Activated!</h2>
        <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
          Your workspace is now ready. You can now log in with your new password.
        </p>
        <Button type="button" fullWidth onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </Card>
    );
  }

  return (
    <Card className="relative w-full max-w-[480px] p-8 sm:p-10 z-10 transition-all duration-300 shadow-xl border-white/40">
      <div className="mb-8 text-center">
        <div className="mb-6">
          <h1 className="font-sans font-bold text-[22px] leading-[28px] bg-gradient-to-r from-[#0066FF] to-[#00C853] bg-clip-text text-transparent inline-block">
            WorkNest
          </h1>
        </div>
        <h2 className="text-2xl font-bold text-[#1a1c23] mb-2 tracking-tight">Complete Setup</h2>
        <p className="text-gray-500 text-[14px] leading-relaxed">
          Set your password and upload a profile photo.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[13px] font-medium">
            {errors.submit}
          </div>
        )}

        <div className="flex flex-col items-center mb-4">
          <div className="relative group">
            <label
              htmlFor="profile-image-upload"
              className={`relative flex w-24 h-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-all duration-300 ${
                previewUrl
                  ? 'border-[#0066FF] border-solid ring-4 ring-[#0066FF]/10'
                  : 'border-gray-200 bg-gray-50 hover:border-[#0066FF]'
              }`}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-[11px] font-bold text-white">Change</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera size={24} className="text-gray-300 transition-colors group-hover:text-[#0066FF]" />
                </div>
              )}
            </label>

            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute -top-1 -right-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-all duration-200 hover:bg-red-600"
                title="Remove photo"
              >
                <X size={14} />
              </button>
            )}

            {!previewUrl && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0066FF] text-white rounded-full flex items-center justify-center shadow-md pointer-events-none">
                <Camera size={14} />
              </div>
            )}
          </div>

          {/* Hidden file input — OUTSIDE the relative container so it never overlaps other elements */}
          <input
            id="profile-image-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {errors.profileImage && (
            <p className="mt-2 text-xs font-medium text-red-500">{errors.profileImage}</p>
          )}
          <p className="mt-2 text-[12px] text-gray-400 font-medium">Upload profile photo (max 2MB)</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Input
              id="activation-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 chars, 1 uppercase, 1 digit"
              icon={<Lock className="h-[18px] w-[18px]" />}
              iconRight={
                showPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )
              }
              onIconRightClick={() => setShowPassword((current) => !current)}
              value={formData.password}
              onChange={handleFieldChange('password')}
              error={errors.password}
              required
            />

            <div className="grid gap-1.5 rounded-xl border border-gray-100 bg-[#f8fafc] p-3">
              {passwordChecks.map((check) => (
                <div
                  key={check.key}
                  className={`flex items-center gap-2 text-[12px] font-medium ${
                    check.passed ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      check.passed ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {check.passed ? (
                      <Check className="h-2.5 w-2.5 stroke-[3px]" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </div>
                  <span>{check.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Input
              id="activation-confirm-password"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              icon={<Lock className="h-[18px] w-[18px]" />}
              iconRight={
                showConfirmPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )
              }
              onIconRightClick={() => setShowConfirmPassword((current) => !current)}
              value={formData.confirmPassword}
              onChange={handleFieldChange('confirmPassword')}
              error={errors.confirmPassword}
              required
            />

            {formData.confirmPassword.length > 0 && (
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold ${
                  passwordsMatch ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    passwordsMatch ? 'bg-green-100' : 'bg-amber-100'
                  }`}
                >
                  {passwordsMatch ? (
                    <Check className="h-3 w-3 stroke-[3px]" />
                  ) : (
                    <X className="h-3 w-3 stroke-[3px]" />
                  )}
                </div>
                <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match yet'}</span>
              </div>
            )}
          </div>
        </div>

        <Checkbox
          id="gdprConsent"
          label="I accept the Terms of Service and GDPR Privacy Policy"
          checked={formData.gdprConsent}
          onChange={handleFieldChange('gdprConsent')}
          error={errors.gdprConsent}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={activateMutation.isPending || uploadMutation.isPending}
          icon={<ArrowRight className="h-[18px] w-[18px]" />}
        >
          Activate Account
        </Button>
      </form>
    </Card>
  );
}

export function ActivateInvitationView({ initialToken = '' }: ActivateInvitationViewProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] font-sans p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[#0066FF]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00C853]/5 rounded-full blur-[120px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066FF]" />
            <p className="text-gray-400 font-medium">Loading activation...</p>
          </div>
        }
      >
        <ActivateInvitationContent initialToken={initialToken} />
      </Suspense>
    </div>
  );
}
