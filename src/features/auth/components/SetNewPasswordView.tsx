"use client";

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Card, Input, Button } from '@/common/ui';

export function SetNewPasswordView() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] font-sans p-4 relative overflow-hidden">

      {/* Background Glow - Lower Left Green Glow */}
      <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] bg-[#B9F8CF]/40 rounded-full blur-[130px] pointer-events-none" />

      {/* Card */}
      <Card className="relative w-full max-w-[480px] p-10 sm:p-12 z-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">

        <div className="mb-8">
          {/* Logo Text */}
          <div className="mb-6">
            <h1 className="font-sans font-bold text-[22px] leading-[28px] bg-gradient-to-r from-[#155DFC] to-[#00A63E] bg-clip-text text-transparent inline-block">
              WorkNest
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-[#1a1c23] mb-3">Set New Password</h2>
          <p className="text-gray-500 text-[15px]">
            Your new password must be different from previously used passwords
          </p>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>

          <Input
            id="new-password"
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            icon={<Lock className="h-[18px] w-[18px]" />}
            iconRight={showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            onIconRightClick={() => setShowPassword(!showPassword)}
          />

          <Input
            id="confirm-password"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            icon={<Lock className="h-[18px] w-[18px]" />}
            iconRight={showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            onIconRightClick={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          {/* Password Requirements Info Box */}
          <div className="bg-[#f0f4f8] p-5 rounded-xl border border-[#e2e8f0]/60">
            <p className="text-[13px] font-semibold text-gray-700 mb-3">Password must contain:</p>
            <ul className="text-[13px] text-gray-500 space-y-2 pl-1">
              <li className="flex items-center gap-2.5">
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                At least 8 characters
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                One uppercase letter
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                One lowercase letter
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                One number
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            fullWidth
            icon={<ArrowRight className="h-[18px] w-[18px]" />}
          >
            Update Password
          </Button>
        </form>

      </Card>
    </div>
  );
}
