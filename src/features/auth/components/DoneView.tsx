"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, Button } from '@/common/ui';
import { AuthLayout } from './AuthLayout';
import { AuthHeader } from './AuthHeader';

export function DoneView() {
  return (
    <AuthLayout>
      <AuthHeader currentStep={4} />

      <Card className="w-full max-w-[500px] p-6 md:p-8 flex flex-col items-center text-center relative z-20 mt-2">
        {/* Top Icon Area */}
        <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-tr from-[#2178ff] to-[#00b2ff] flex items-center justify-center shadow-[0_16px_32px_-8px_rgba(33,120,255,0.5)] mb-6 relative">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
          >
            <defs>
              <mask id="plane-mask">
                {/* White shows everything */}
                <rect width="100%" height="100%" fill="white" />
                {/* Black circle knocks out the plane underneath the checkmark */}
                <circle cx="16.5" cy="16.5" r="5" fill="black" />
              </mask>
            </defs>

            {/* Paper plane lines (masked so they disappear under the checkmark circle) */}
            <g mask="url(#plane-mask)">
              <path
                d="M21.5 2.5L10.5 13.5M21.5 2.5l-6.5 19-4-8.5-8.5-4 19-6.5z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Checkmark circle border (no fill so gradient flows naturally) */}
            <circle cx="16.5" cy="16.5" r="5" stroke="currentColor" strokeWidth="1.2" fill="transparent" />
            {/* Checkmark ticks */}
            <path d="M14.5 16.5l1.5 1.5 2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Headings */}
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#1a1c23] mb-2">Email Sent Successfully</h1>
        <p className="text-[13.5px] md:text-[14px] text-gray-500 font-medium mb-8 leading-relaxed max-w-[340px]">
          Please check your inbox and follow the instructions to complete your account setup.
        </p>

        {/* What's Next Box */}
        <div className="w-full bg-[#f8fafc] rounded-2xl p-5 mb-8 border border-gray-100 flex flex-col items-center">
          <h3 className="text-[14px] font-bold text-gray-800 mb-4">What's Next?</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#2178ff] text-white flex items-center justify-center text-[11px] font-bold shrink-0">1</div>
              <span className="text-[13px] font-medium text-gray-600">Open your email</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#2178ff] text-white flex items-center justify-center text-[11px] font-bold shrink-0">2</div>
              <span className="text-[13px] font-medium text-gray-600">Click the setup link</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#2178ff] text-white flex items-center justify-center text-[11px] font-bold shrink-0">3</div>
              <span className="text-[13px] font-medium text-gray-600">Create your password</span>
            </div>
          </div>
        </div>

        {/* Main Button */}
        <Button
          fullWidth
          icon={<ArrowRight className="w-4 h-4" />}
          // TODO: Backend Integration
          // The real setup flow:
          // 1. Backend sends setup email to admin
          // 2. Email contains link to: /create-password?token=SETUP_TOKEN
          // 3. Only clicking that email link should open the Create Password page
          onClick={() => {
            // UI-only for now: represents opening the inbox
            console.log('Open Email client');
          }}
        >
          Open Email
        </Button>

        {/* Footer Help */}
        <p className="mt-6 text-[12px] text-gray-400 font-medium tracking-wide">
          Need help getting started? <Link href="#" className="font-bold text-[#2178ff] hover:text-[#1a60cc] transition-colors">Check our guide</Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
