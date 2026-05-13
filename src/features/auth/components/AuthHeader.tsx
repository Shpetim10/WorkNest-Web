"use client";
import React from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '@/common/i18n';

interface AuthHeaderProps {
  currentStep: 1 | 2 | 3 | 4;
}

function Step({
  currentStep,
  stepNum,
  label,
}: {
  currentStep: AuthHeaderProps['currentStep'];
  stepNum: number;
  label: string;
}) {
  const isCompleted = currentStep > stepNum;
  const isActive = currentStep === stepNum;

  return (
    <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
      <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center text-[13px] font-bold ${
        isCompleted || isActive
          ? 'bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] text-white shadow-[0_6px_16px_-4px_rgba(43,127,255,0.5)]'
          : 'bg-[#e2e8f0] text-gray-500'
      }`}>
        {isCompleted ? <Check size={18} strokeWidth={3} /> : stepNum}
      </div>
      <span className={`text-[11px] ${isActive || isCompleted ? 'font-bold text-gray-800' : 'font-medium text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

function Line({ currentStep, stepNum }: { currentStep: AuthHeaderProps['currentStep']; stepNum: number }) {
  const isCompleted = currentStep > stepNum;
  return (
    <div className={`flex-1 h-[2px] mt-[17px] mx-3 lg:mx-4 ${
      isCompleted ? 'bg-gradient-to-r from-[#00BBA7] to-[#2B7FFF]' : 'bg-gray-200'
    }`} />
  );
}

export function AuthHeader({ currentStep }: AuthHeaderProps) {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-[850px] flex items-start justify-center mb-6 relative">
      {/* Center: Stepper */}
      <div className="flex items-start justify-center w-full max-w-[600px] relative z-10 shrink-0">
        <Step currentStep={currentStep} stepNum={1} label={t('auth.register.steps.pricing')} />
        <Line currentStep={currentStep} stepNum={1} />
        <Step currentStep={currentStep} stepNum={2} label={t('auth.register.steps.company')} />
        <Line currentStep={currentStep} stepNum={2} />
        <Step currentStep={currentStep} stepNum={3} label={t('auth.register.steps.admin')} />
        <Line currentStep={currentStep} stepNum={3} />
        <Step currentStep={currentStep} stepNum={4} label={t('auth.register.steps.done')} />
      </div>
    </div>
  );
}
