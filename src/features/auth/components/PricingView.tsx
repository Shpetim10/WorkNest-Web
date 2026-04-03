"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-2.5">
    <div className="flex-shrink-0 w-[16px] h-[16px] rounded-full bg-green-100 flex items-center justify-center">
      <Check className="w-[10px] h-[10px] text-green-600" strokeWidth={3} />
    </div>
    <span className="text-[12.5px] text-gray-600 font-medium">{text}</span>
  </li>
);

export function PricingView() {
  const router = useRouter();

  return (
    <AuthLayout>
      {/* Top Navbar */}
      <div className="w-full flex justify-center mb-8 relative shrink-0">
        <div className="w-full max-w-[850px] relative flex justify-center">

          {/* Back Button Container */}
          <div className="absolute left-0 sm:left-4 md:left-0 top-[9px] z-20">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>

          {/* Steps Indicator */}
          <div className="flex justify-center z-10 shrink-0 w-full px-6 md:px-0">
            <div className="flex items-start justify-center w-full max-w-[600px]">

              {/* Step 1 */}
              <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
                <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-r from-[#2178ff] to-[#01c951] text-white flex items-center justify-center text-[13px] font-bold shadow-[0_6px_16px_-4px_rgba(21,93,252,0.5)]">
                  1
                </div>
                <span className="text-[11px] font-bold text-gray-800">Pricing</span>
              </div>

              {/* Connecting Line 1 */}
              <div className="flex-1 h-[2px] bg-gray-200 mt-[17px] mx-3 lg:mx-4" />

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
                <div className="w-[36px] h-[36px] rounded-full bg-[#e2e8f0] text-gray-500 flex items-center justify-center text-[13px] font-bold">
                  2
                </div>
                <span className="text-[11px] font-medium text-gray-500">Company</span>
              </div>

              {/* Connecting Line 2 */}
              <div className="flex-1 h-[2px] bg-gray-200 mt-[17px] mx-3 lg:mx-4" />

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
                <div className="w-[36px] h-[36px] rounded-full bg-[#e2e8f0] text-gray-500 flex items-center justify-center text-[13px] font-bold">
                  3
                </div>
                <span className="text-[11px] font-medium text-gray-500">Admin</span>
              </div>

              {/* Connecting Line 3 */}
              <div className="flex-1 h-[2px] bg-gray-200 mt-[17px] mx-3 lg:mx-4" />

              {/* Step 4 */}
              <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
                <div className="w-[36px] h-[36px] rounded-full bg-[#e2e8f0] text-gray-500 flex items-center justify-center text-[13px] font-bold">
                  4
                </div>
                <span className="text-[11px] font-medium text-gray-500">Done</span>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Headings */}
      <div className="text-center mb-10 shrink-0 mt-2">
        <h1 className="text-[28px] md:text-[32px] font-bold text-[#1a1c23] mb-2">Choose Your Plan</h1>
        <p className="text-[14px] text-gray-500 font-medium">Select the perfect plan for your organization</p>
      </div>

      {/* Pricing Cards - Using Grid for balanced single-row layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 w-full flex-grow items-stretch">

        {/* Starter Plan */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] p-5 md:p-6 flex flex-col lg:hover:-translate-y-1 transition-transform relative z-10 lg:my-2">
          <h3 className="text-[18px] font-bold text-[#1a1c23] mb-1">Starter</h3>
          <p className="text-[12px] text-gray-500 mb-6 font-medium leading-snug">Perfect for small teams getting started</p>
          <div className="flex items-baseline mb-6">
            <span className="text-[36px] font-bold text-[#1a1c23]">€49</span>
            <span className="text-[13px] font-semibold text-gray-500 ml-1">/month</span>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            <FeatureItem text="Up to 20 employees" />
            <FeatureItem text="Basic attendance tracking" />
            <FeatureItem text="Leave management" />
            <FeatureItem text="Email support" />
            <FeatureItem text="Mobile app access" />
          </ul>

          <button
            onClick={() => router.push('/register/company')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-[#f4f7fb] text-gray-800 text-[13px] font-bold hover:bg-[#e2e8f0] transition-colors mt-auto"
          >
            Choose Starter
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Professional Plan (Highlighted) */}
        <div className="bg-white rounded-[24px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.12)] p-5 md:px-7 md:py-8 flex flex-col relative z-20 border border-gray-100 lg:-translate-y-2 transition-transform lg:hover:-translate-y-3">
          <div className="absolute top-4 left-6">
            <span className="bg-gradient-to-r from-[#0066FF] to-[#00C853] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Most Popular
            </span>
          </div>

          <h3 className="text-[22px] font-bold text-[#1a1c23] mb-1 mt-5">Professional</h3>
          <p className="text-[12px] text-gray-500 mb-6 font-medium leading-snug">Most popular for growing businesses</p>
          <div className="flex items-baseline mb-6">
            <span className="text-[44px] font-bold text-[#1a1c23]">€99</span>
            <span className="text-[13px] font-semibold text-gray-500 ml-1">/month</span>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            <FeatureItem text="Up to 100 employees" />
            <FeatureItem text="Advanced attendance & GPS" />
            <FeatureItem text="Payroll management" />
            <FeatureItem text="Custom reports" />
            <FeatureItem text="Priority support" />
            <FeatureItem text="API access" />
            <FeatureItem text="Custom workflows" />
          </ul>

          <button
            onClick={() => router.push('/register/company')}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-[10px] text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-[1px] bg-gradient-to-r from-[#0066FF] to-[#00C853] mt-auto"
          >
            Choose Professional
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] p-5 md:p-6 flex flex-col lg:hover:-translate-y-1 transition-transform relative z-10 lg:my-2">
          <h3 className="text-[18px] font-bold text-[#1a1c23] mb-1">Enterprise</h3>
          <p className="text-[12px] text-gray-500 mb-6 font-medium leading-snug">Advanced features for large organizations</p>
          <div className="flex items-baseline mb-6">
            <span className="text-[36px] font-bold text-[#1a1c23]">€199</span>
            <span className="text-[13px] font-semibold text-gray-500 ml-1">/month</span>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            <FeatureItem text="Unlimited employees" />
            <FeatureItem text="Advanced analytics" />
            <FeatureItem text="Multi-location support" />
            <FeatureItem text="Dedicated account manager" />
            <FeatureItem text="Custom integrations" />
            <FeatureItem text="SLA guarantee" />
            <FeatureItem text="On-premise option" />
          </ul>

          <button
            onClick={() => router.push('/register/company')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-[#f4f7fb] text-gray-800 text-[13px] font-bold hover:bg-[#e2e8f0] transition-colors mt-auto"
          >
            Choose Enterprise
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Footer Text */}
      <div className="mt-8 text-[12px] text-gray-400 font-medium tracking-wide shrink-0">
        All plans include 14-day free trial • No credit card required
      </div>
    </AuthLayout>
  );
}
