"use client";

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Card, Input, Button } from '@/common/ui';

export function CreatePasswordView() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const pw = formData.password;

    if (!pw) {
      newErrors.password = 'Password is required';
    } else if (pw.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(pw)) {
      newErrors.password = 'Password must contain an uppercase letter';
    } else if (!/[a-z]/.test(pw)) {
      newErrors.password = 'Password must contain a lowercase letter';
    } else if (!/\d/.test(pw)) {
      newErrors.password = 'Password must contain a number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Setup successful logic here
      console.log('Password successfully set!');
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] font-sans p-4 relative overflow-hidden">
      {/* Background Glow - Lower Left Green Glow */}
      <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] bg-[#B9F8CF]/40 rounded-full blur-[130px] pointer-events-none" />

      <Card className="relative w-full max-w-[480px] p-10 sm:p-12 z-10">
        <div className="mb-8">
          {/* Logo Text */}
          <div className="mb-6">
            <h1 className="font-sans font-bold text-[22px] leading-[28px] bg-gradient-to-r from-[#155DFC] to-[#00A63E] bg-clip-text text-transparent inline-block">
              WorkNest
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-[#1a1c23] mb-3">Create Password</h2>
          <p className="text-gray-500 text-[14px] leading-relaxed">
            Choose a password to complete your account setup
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            id="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            icon={<Lock className="h-[18px] w-[18px]" />}
            iconRight={showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            onIconRightClick={() => setShowPassword(!showPassword)}
            value={formData.password}
            onChange={handleChange('password')}
            error={errors.password}
          />

          <Input
            id="confirm-password"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            icon={<Lock className="h-[18px] w-[18px]" />}
            iconRight={showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            onIconRightClick={() => setShowConfirmPassword(!showConfirmPassword)}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
          />

          {/* Password Requirements Info Box */}
          <div className="bg-[#f0f4f8] p-5 rounded-xl border border-[#e2e8f0]/60">
            <p className="text-[13px] font-semibold text-gray-700 mb-3">Password must contain:</p>
            <ul className="text-[13px] text-gray-500 space-y-2 pl-1">
              <li className="flex items-center gap-2.5">
                <span className={`w-1 h-1 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-500'}`} />
                At least 8 characters
              </li>
              <li className="flex items-center gap-2.5">
                <span className={`w-1 h-1 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-500'}`} />
                One uppercase letter
              </li>
              <li className="flex items-center gap-2.5">
                <span className={`w-1 h-1 rounded-full ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-500'}`} />
                One lowercase letter
              </li>
              <li className="flex items-center gap-2.5">
                <span className={`w-1 h-1 rounded-full ${/\d/.test(formData.password) ? 'bg-green-500' : 'bg-gray-500'}`} />
                One number
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            fullWidth
            icon={<ArrowRight className="h-[18px] w-[18px]" />}
          >
            Set Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
