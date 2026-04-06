"use client";
import React from 'react';
import Link from 'next/link';
import { Card } from '@/common/ui';

/**
 * View displayed after a successful Forgot Password request (Step 1).
 */
export function EmailSentView() {
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] font-sans p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#B9F8CF]/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Card */}
      <Card className="w-full max-w-[460px] p-12 flex flex-col items-center text-center relative z-10">

        {/* Blue Circle Icon */}
        <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-tr from-[#155DFC] to-[#4b8df8] shadow-lg shadow-blue-500/20 flex items-center justify-center mb-8">
          <svg
            width="42"
            height="42"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white relative right-[2px] bottom-[2px]"
          >
            {/* Paper Plane */}
            <path d="M41 7L21 27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M41 7L29 41L21 27L7 19L41 7Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Badge background to cut out plane lines */}
            <circle cx="34" cy="34" r="11" fill="#2B7FFF" />
            <circle cx="34" cy="34" r="10" stroke="white" strokeWidth="2" />

            {/* Checkmark */}
            <path d="M29 34L32.5 37.5L39 30.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-[26px] leading-[34px] font-bold text-[#1a1c23] mb-4">
          Email Sent<br />
          Successfully!
        </h1>

        {/* Subtext */}
        <p className="text-gray-500 text-[15px] leading-[24px]">
          We’ve sent you a password reset link.<br className="hidden sm:block" />
          Please check your email and follow the<br className="hidden sm:block" />
          instructions to continue.
        </p>

      </Card>

      {/* Back to Login Link */}
      <div className="mt-8 z-10">
        <Link
          href="/login"
          className="text-[#0066FF] font-medium text-[15px] hover:text-blue-700 transition-colors"
        >
          Back to Login
        </Link>
      </div>

    </div>
  );
}
