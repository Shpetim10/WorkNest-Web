"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, Input, Button } from '@/common/ui';
import { useForgotPassword } from '@/features/auth/api/password-reset';

export function ForgotPasswordView({
  backHref = '/login',
  backLabel = 'Back to login',
  apiPath = '/auth/forgot-password',
}: {
  backHref?: string;
  backLabel?: string;
  apiPath?: string;
} = {}) {
  const router = useRouter();
  const forgotPasswordMutation = useForgotPassword(apiPath);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        await forgotPasswordMutation.mutateAsync({ email });
        router.push('/check-email');
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] font-sans p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#B9F8CF]/30 rounded-full blur-[120px] pointer-events-none" />

      <Card className="relative w-full max-w-[480px] p-10 sm:p-12 z-10">
        {/* Back Link */}
        <Link
          href={backHref}
          className="absolute top-8 left-8 flex items-center gap-2 text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </Link>

        <div className="mt-6 mb-8">
          {/* Logo Text */}
          <div className="mb-6">
            <h1 className="font-sans font-bold text-[22px] leading-[28px] bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] bg-clip-text text-transparent inline-block">
              WorkTrezz
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-[#1a1c23] mb-3">Forgot Password?</h2>
          <p className="text-gray-500 text-[15px]">
            No worries, we&apos;ll send you reset instructions
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            id="email"
            label="Email Address"
            type="text"
            placeholder="you@company.com"
            icon={<Mail className="h-[18px] w-[18px]" />}
            value={email}
            onChange={handleChange}
            error={error}
          />

          <Button
            type="submit"
            fullWidth
            icon={forgotPasswordMutation.isPending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ArrowRight className="h-[18px] w-[18px]" />}
            disabled={forgotPasswordMutation.isPending}
          >
            {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-8 text-center text-[13px] text-gray-400 font-medium">
          The reset link will be valid for 15 minutes
        </div>
      </Card>
    </div>
  );
}
