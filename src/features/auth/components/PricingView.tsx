"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { AuthHeader } from './AuthHeader';

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-2.5">
    <div className="flex-shrink-0 w-[16px] h-[16px] rounded-full bg-green-100 flex items-center justify-center">
      <svg className="w-[10px] h-[10px] text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </div>
    <span className="text-[12.5px] text-gray-600 font-medium">{text}</span>
  </li>
);

export function PricingView() {
  const router = useRouter();

  return (
    <AuthLayout>
      <AuthHeader currentStep={1} />

      {/* Headings */}
      <div className="text-center mb-10 shrink-0 mt-2">
        <h1 className="text-[28px] md:text-[32px] font-bold text-[#1a1c23] mb-2">Choose Your Plan</h1>
        <p className="text-[14px] text-gray-500 font-medium">Select the perfect plan for your organization</p>
      </div>

      {/* Pricing Cards - Using Grid for balanced single-row layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 w-full flex-grow items-stretch">

        {/* Starter Plan */}
        <div className="bg-white rounded-[24px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] p-5 md:p-6 flex flex-col lg:hover:-translate-y-1 transition-transform relative z-10 lg:my-2">
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
        <div className="bg-white rounded-[24px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] p-5 md:px-7 md:py-8 flex flex-col relative z-20 border border-gray-100 lg:-translate-y-2 transition-transform lg:hover:-translate-y-3">
          <div className="absolute top-4 left-6">
            <span className="bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
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
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-[10px] text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-[1px] bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] mt-auto"
          >
            Choose Professional
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-[24px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] p-5 md:p-6 flex flex-col lg:hover:-translate-y-1 transition-transform relative z-10 lg:my-2">
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
