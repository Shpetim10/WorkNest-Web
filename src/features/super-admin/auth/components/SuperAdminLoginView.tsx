"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { Button, Input } from '@/common/ui';
import { PlatformAccess } from '@/features/auth/types';
import { useSuperAdminLogin } from '../api/use-super-admin-login';

export function SuperAdminLoginView() {
  const router = useRouter();
  const loginMutation = useSuperAdminLogin();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      const response = await loginMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        platformAccess: PlatformAccess.WEB,
      });

      if (response.roleSelectionRequired) {
        router.push('/select-role');
      } else {
        router.push('/superadmin_dashboard');
      }
    } catch (error: unknown) {
      console.error('Super admin login failed:', error);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      <div className="relative flex w-full flex-col justify-center px-8 sm:px-12 md:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-10">
            <h1 className="inline-block bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] bg-clip-text font-sans text-[30px] font-bold leading-[36px] text-transparent">
              WorkTrezz
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-bold text-[#1a1c23]">Welcome Back !</h2>
            <p className="text-sm text-gray-500">Sign in to continue to your account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              id="superadmin-email"
              label="Email Address"
              type="text"
              placeholder="you@company.com"
              icon={<Mail className="h-[18px] w-[18px]" />}
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
            />

            <Input
              id="superadmin-password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<Lock className="h-[18px] w-[18px]" />}
              value={formData.password}
              onChange={handleChange('password')}
              error={errors.password}
            />

            <div className="flex justify-end pt-1">
              <Link
                href="/forgot-password"
                className="text-[13px] font-bold text-[#0066FF] transition-colors hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                icon={
                  loginMutation.isPending ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  ) : (
                    <ArrowRight className="h-[18px] w-[18px]" />
                  )
                }
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#2B7FFF] to-[#00BBA7] p-12 text-white md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50" />

        <div className="relative z-10 flex max-w-[440px] flex-col items-center text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="WorkNest Brand"
              width={430}
              height={307}
              className="h-auto w-[430px] object-contain drop-shadow-lg"
              priority
            />
          </div>

          <p className="max-w-[438px] text-center font-sans text-[20px] font-normal leading-[28px] tracking-normal text-white/90">
            Step into a better HR experience - where managing your team is easier, collaboration feels natural, and growth happens every day.
          </p>
        </div>
      </div>
    </div>
  );
}
