"use client";

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, Check, X } from 'lucide-react';
import { Card, Input, Button } from '@/common/ui';
import { useSearchParams, useRouter } from 'next/navigation';
import { useResetPassword } from '../api/password-reset';

export function SetNewPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const resetPasswordMutation = useResetPassword();

  const RULES = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'At least one uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'At least one number', test: (p: string) => /[0-9]/.test(p) },
  ];

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!token) {
      setError('Invalid or missing reset token.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        await resetPasswordMutation.mutateAsync({
          token: token!,
          newPassword: password,
        });
        router.push('/password-reset-success');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
      }
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] font-sans p-4 relative overflow-hidden">

      {/* Background Glow - Lower Left Green Glow */}
      <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] bg-[#B9F8CF]/40 rounded-full blur-[130px] pointer-events-none" />

      {/* Card */}
      <Card className="relative w-full max-w-[480px] p-10 sm:p-12 z-10">

        <div className="mb-8">
          {/* Logo Text */}
          <div className="mb-6">
            <h1 className="font-sans font-bold text-[22px] leading-[28px] bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] bg-clip-text text-transparent inline-block">
              WorkTrezz
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-[#1a1c23] mb-3">Set New Password</h2>
          <p className="text-gray-500 text-[15px]">
            Your new password must be different from previously used passwords
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>

          <Input
            id="new-password"
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            icon={<Lock className="h-[18px] w-[18px]" />}
            iconRight={showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            onIconRightClick={() => setShowPassword(!showPassword)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            id="confirm-password"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            icon={<Lock className="h-[18px] w-[18px]" />}
            iconRight={showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            onIconRightClick={() => setShowConfirmPassword(!showConfirmPassword)}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={error}
          />

          {/* Password requirements */}
          <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-5 space-y-3">
            <p className="text-[13px] font-semibold text-gray-700">Password requirements</p>
            <div className="space-y-2.5">
              {RULES.map((rule) => {
                const passed = rule.test(password);
                const showRules = password.length > 0;
                return (
                  <div key={rule.label} className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      showRules && passed ? 'bg-emerald-500' : showRules ? 'bg-red-400' : 'bg-gray-200'
                    }`}>
                      {showRules && passed
                        ? <Check size={11} className="text-white" strokeWidth={3} />
                        : showRules
                        ? <X size={11} className="text-white" strokeWidth={3} />
                        : null}
                    </div>
                    <span className={`text-[12px] transition-colors ${
                      showRules && passed ? 'text-emerald-600 font-medium' : showRules ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            icon={resetPasswordMutation.isPending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <ArrowRight className="h-[18px] w-[18px]" />}
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

      </Card>
    </div>
  );
}
