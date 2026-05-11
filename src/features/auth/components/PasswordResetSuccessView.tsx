"use client";
import React from 'react';
import Link from 'next/link';
import { Card } from '@/common/ui';

/**
 * View displayed after a successful Password Reset update (Step 2).
 */
export function PasswordResetSuccessView() {
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] font-sans p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#B9F8CF]/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Card */}
      <Card className="w-full max-w-[460px] p-12 flex flex-col items-center text-center relative z-10">

        {/* Green Circle Icon */}
        <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-tr from-[#2B7FFF] to-[#00BBA7] shadow-lg shadow-green-500/20 flex items-center justify-center mb-8">
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-[26px] leading-[34px] font-bold text-[#1a1c23] mb-4">
          Password Reset<br />
          Successfully!
        </h1>

        {/* Subtext */}
        <p className="text-gray-500 text-[15px] leading-[24px]">
          Your password has been successfully updated.<br className="hidden sm:block" />
          You can now use your new password to sign in.
        </p>

      </Card>

      {/* Back to Login Link */}
      <div className="mt-8 z-10">
        <Link
          href="/login"
          className="text-[#0066FF] font-medium text-[15px] hover:text-blue-700 transition-colors"
        >
          Proceed to Login
        </Link>
      </div>

    </div>
  );
}
