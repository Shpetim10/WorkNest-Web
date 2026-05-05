"use client";

import React, { useState } from 'react';
import { Card, Button } from '@/common/ui';
import { Lock, Eye, EyeOff, KeyRound, Loader2, Check, X, ShieldCheck } from 'lucide-react';
import { useChangePassword } from '@/features/auth/api/change-password';

type PasswordKey = 'current' | 'next' | 'confirm';

const LABELS: Record<PasswordKey, string> = {
  current: 'Current Password',
  next: 'New Password',
  confirm: 'Confirm New Password',
};

const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'At least one uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one number', test: (p: string) => /[0-9]/.test(p) },
];

export function ChangePasswordView() {
  const changePassword = useChangePassword();

  const [passwordData, setPasswordData] = useState<Record<PasswordKey, string>>({
    current: '',
    next: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState<Record<PasswordKey, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setSuccess(false);
    setError('');
    if (!passwordData.current || !passwordData.next || !passwordData.confirm) {
      setError('All fields are required.');
      return;
    }
    if (passwordData.next !== passwordData.confirm) {
      setError('New passwords do not match.');
      return;
    }
    try {
      await changePassword.mutateAsync({
        currentPassword: passwordData.current,
        newPassword: passwordData.next,
      });
      setSuccess(true);
      setPasswordData({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg ?? 'Failed to change password. Please try again.');
    }
  }

  const newPassword = passwordData.next;
  const showRules = newPassword.length > 0;
  const passedCount = RULES.filter(r => r.test(newPassword)).length;
  const strength = passedCount === 0 ? null : passedCount === 1 ? 'weak' : passedCount === 2 ? 'fair' : 'strong';
  const strengthLabel = { weak: 'Weak', fair: 'Fair', strong: 'Strong' };
  const strengthColor = { weak: 'bg-red-400', fair: 'bg-amber-400', strong: 'bg-emerald-500' };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* Header banner */}
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 50%, #10B981 100%)',
          minHeight: 120,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <KeyRound size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Change Password</h1>
            <p className="text-white/80 text-sm mt-0.5">
              Keep your account secure with a strong password
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
          <KeyRound size={28} className="text-white" />
        </div>
      </div>

      {/* Card */}
      <Card className="p-8 lg:p-10 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="space-y-1 mb-6">
          <h2 className="text-[17px] font-bold text-[#1a1c23]">Update Password</h2>
          <p className="text-[13px] text-gray-500">Enter your current password and choose a new one</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Fields */}
          <div className="flex-1 space-y-5 max-w-md">
            {(['current', 'next', 'confirm'] as PasswordKey[]).map((key) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="block text-[13px] font-semibold text-gray-700">{LABELS[key]}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword[key] ? 'text' : 'password'}
                    value={passwordData[key]}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, [key]: e.target.value }));
                      setError('');
                      setSuccess(false);
                    }}
                    placeholder="••••••••"
                    className="w-full h-11 pl-9 pr-10 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <p className="text-[13px] text-red-500 font-medium">{error}</p>
            )}
            {success && (
              <p className="text-[13px] text-green-600 font-medium">Password updated successfully.</p>
            )}

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={changePassword.isPending}
                className="bg-linear-to-r from-[#0ea5e9] to-[#10b981] hover:shadow-lg hover:shadow-teal-500/20 text-white"
              >
                {changePassword.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={15} className="animate-spin" /> Updating...
                  </span>
                ) : 'Update Password'}
              </Button>
            </div>
          </div>

          {/* Password rules panel */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-6 flex flex-col gap-5 h-full">

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-r from-[#0ea5e9] to-[#10b981] flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-800">Password strength</p>
                  <p className="text-[11px] text-gray-400">Requirements for a secure password</p>
                </div>
              </div>

              {/* Strength meter */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        strength && passedCount > i
                          ? strengthColor[strength]
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-[11px] font-semibold transition-colors ${
                  !strength ? 'text-gray-400' :
                  strength === 'weak' ? 'text-red-500' :
                  strength === 'fair' ? 'text-amber-500' :
                  'text-emerald-600'
                }`}>
                  {strength ? strengthLabel[strength] : 'Enter a new password'}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Rules */}
              <div className="space-y-3">
                {RULES.map((rule) => {
                  const passed = rule.test(newPassword);
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

              {/* Tip */}
              <div className="mt-auto pt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Tip: use a mix of words, numbers, and uppercase letters you can remember.
                </p>
              </div>

            </div>
          </div>

        </div>
      </Card>
    </div>
  );
}