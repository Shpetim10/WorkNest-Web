"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Input, Button } from '@/common/ui';
import { LanguageSwitcher, useI18n } from '@/common/i18n';
import { useLogin } from '../api/login';
import { PlatformAccess } from '../types';
import { useRouter } from 'next/navigation';

export function LoginView() {
  const { t } = useI18n();
  const router = useRouter();
  const loginMutation = useLogin();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.validEmail');
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        const response = await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
          platformAccess: PlatformAccess.WEB,
        });

        if (response.roleSelectionRequired) {
          router.push('/select-role');
        } else {
          router.push('/dashboard');
        }
      } catch (error: unknown) {
        // Errors are handled by the mutation and typically displayed via global toast
        // but we can also set local errors if preferred
        console.error(t('auth.login.failedLog'), error);
      }
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* Left Panel - Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 md:w-1/2 lg:px-24 xl:px-32 relative">
        <div className="absolute right-8 top-6 z-20">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-[400px] mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <h1 className="font-sans font-bold text-[30px] leading-[36px] bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] bg-clip-text text-transparent inline-block">
              WorkTrezz
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1a1c23] mb-2">{t('auth.login.title')}</h2>
            <p className="text-gray-500 text-sm">{t('auth.login.subtitle')}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              id="email"
              label={t('common.fields.emailAddress')}
              type="text" // Use text so html5 validation doesn't block custom validation
              placeholder={t('auth.login.emailPlaceholder')}
              icon={<Mail className="h-[18px] w-[18px]" />}
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
            />

            <Input
              id="password"
              label={t('common.fields.password')}
              type="password"
              placeholder={t('auth.login.passwordPlaceholder')}
              icon={<Lock className="h-[18px] w-[18px]" />}
              value={formData.password}
              onChange={handleChange('password')}
              error={errors.password}
            />

            <div className="flex justify-end pt-1">
              <Link
                href="/forgot-password"
                className="text-[13px] font-bold text-[#0066FF] hover:text-blue-700 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                icon={loginMutation.isPending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ArrowRight className="h-[18px] w-[18px]" />}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            {t('auth.login.noAccount')}{' '}
            <Link href="/register/pricing" className="font-bold text-[#0066FF] hover:text-blue-700 transition-colors">
              {t('auth.login.signUp')}
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Branding/Gradient */}
      <div className="hidden md:flex w-1/2 flex-col justify-center items-center bg-gradient-to-br from-[#2B7FFF] to-[#00BBA7] text-white p-12 relative overflow-hidden">
        {/* Very subtle subtle radial background element to enhance the gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-[440px]">
          {/* WorkTrezz Logo */}
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt={t('auth.shared.brandAlt')}
              width={430}
              height={307}
              className="w-[430px] h-auto object-contain drop-shadow-lg"
              priority
            />
          </div>

          <p className="font-sans font-normal text-[20px] leading-[28px] tracking-normal text-center text-white/90 max-w-[438px]">
            {t('auth.shared.tagline')}
          </p>
        </div>
      </div>
    </div>
  );
}
