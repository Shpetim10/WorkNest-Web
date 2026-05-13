"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { AuthHeader } from './AuthHeader';
import { useI18n } from '@/common/i18n';

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-2.5">
    <div className="flex-shrink-0 w-[16px] h-[16px] rounded-full bg-green-100 flex items-center justify-center">
      <svg className="w-[10px] h-[10px] text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </div>
    <span className="text-[12.5px] text-gray-600 font-medium">{text}</span>
  </li>
);

export function PricingView() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <AuthLayout>
      <AuthHeader currentStep={1} />

      {/* Headings */}
      <div className="text-center mb-10 shrink-0 mt-2">
        <h1 className="text-[28px] md:text-[32px] font-bold text-[#1a1c23] mb-2">{t('auth.register.pricing.title')}</h1>
        <p className="text-[14px] text-gray-500 font-medium">{t('auth.register.pricing.subtitle')}</p>
      </div>

      {/* Pricing Cards - Using Grid for balanced single-row layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 w-full flex-grow items-stretch">

        {/* Starter Plan */}
        <div className="bg-white rounded-[24px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] p-5 md:p-6 flex flex-col lg:hover:-translate-y-1 transition-transform relative z-10 lg:my-2">
          <h3 className="text-[18px] font-bold text-[#1a1c23] mb-1">{t('auth.register.pricing.starter')}</h3>
          <p className="text-[12px] text-gray-500 mb-6 font-medium leading-snug">{t('auth.register.pricing.starterDescription')}</p>
          <div className="flex items-baseline mb-6">
            <span className="text-[36px] font-bold text-[#1a1c23]">€49</span>
            <span className="text-[13px] font-semibold text-gray-500 ml-1">{t('auth.register.pricing.perMonth')}</span>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            <FeatureItem text={t('auth.register.pricing.features.upTo20')} />
            <FeatureItem text={t('auth.register.pricing.features.basicAttendance')} />
            <FeatureItem text={t('auth.register.pricing.features.leaveManagement')} />
            <FeatureItem text={t('auth.register.pricing.features.emailSupport')} />
            <FeatureItem text={t('auth.register.pricing.features.mobileAccess')} />
          </ul>

          <button
            onClick={() => router.push('/register/company')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-[#f4f7fb] text-gray-800 text-[13px] font-bold hover:bg-[#e2e8f0] transition-colors mt-auto"
          >
            {t('auth.register.pricing.chooseStarter')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Professional Plan (Highlighted) */}
        <div className="bg-white rounded-[24px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] p-5 md:px-7 md:py-8 flex flex-col relative z-20 border border-gray-100 lg:-translate-y-2 transition-transform lg:hover:-translate-y-3">
          <div className="absolute top-4 left-6">
            <span className="bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {t('auth.register.pricing.mostPopular')}
            </span>
          </div>

          <h3 className="text-[22px] font-bold text-[#1a1c23] mb-1 mt-5">{t('auth.register.pricing.professional')}</h3>
          <p className="text-[12px] text-gray-500 mb-6 font-medium leading-snug">{t('auth.register.pricing.professionalDescription')}</p>
          <div className="flex items-baseline mb-6">
            <span className="text-[44px] font-bold text-[#1a1c23]">€99</span>
            <span className="text-[13px] font-semibold text-gray-500 ml-1">{t('auth.register.pricing.perMonth')}</span>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            <FeatureItem text={t('auth.register.pricing.features.upTo100')} />
            <FeatureItem text={t('auth.register.pricing.features.advancedAttendance')} />
            <FeatureItem text={t('auth.register.pricing.features.payrollManagement')} />
            <FeatureItem text={t('auth.register.pricing.features.customReports')} />
            <FeatureItem text={t('auth.register.pricing.features.prioritySupport')} />
            <FeatureItem text={t('auth.register.pricing.features.apiAccess')} />
            <FeatureItem text={t('auth.register.pricing.features.customWorkflows')} />
          </ul>

          <button
            onClick={() => router.push('/register/company')}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-[10px] text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-[1px] bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] mt-auto"
          >
            {t('auth.register.pricing.chooseProfessional')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-[24px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)] p-5 md:p-6 flex flex-col lg:hover:-translate-y-1 transition-transform relative z-10 lg:my-2">
          <h3 className="text-[18px] font-bold text-[#1a1c23] mb-1">{t('auth.register.pricing.enterprise')}</h3>
          <p className="text-[12px] text-gray-500 mb-6 font-medium leading-snug">{t('auth.register.pricing.enterpriseDescription')}</p>
          <div className="flex items-baseline mb-6">
            <span className="text-[36px] font-bold text-[#1a1c23]">€199</span>
            <span className="text-[13px] font-semibold text-gray-500 ml-1">{t('auth.register.pricing.perMonth')}</span>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            <FeatureItem text={t('auth.register.pricing.features.unlimitedEmployees')} />
            <FeatureItem text={t('auth.register.pricing.features.advancedAnalytics')} />
            <FeatureItem text={t('auth.register.pricing.features.multiLocation')} />
            <FeatureItem text={t('auth.register.pricing.features.dedicatedManager')} />
            <FeatureItem text={t('auth.register.pricing.features.customIntegrations')} />
            <FeatureItem text={t('auth.register.pricing.features.sla')} />
            <FeatureItem text={t('auth.register.pricing.features.onPremise')} />
          </ul>

          <button
            onClick={() => router.push('/register/company')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-[#f4f7fb] text-gray-800 text-[13px] font-bold hover:bg-[#e2e8f0] transition-colors mt-auto"
          >
            {t('auth.register.pricing.chooseEnterprise')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Footer Text */}
      <div className="mt-8 text-[12px] text-gray-400 font-medium tracking-wide shrink-0">
        {t('auth.register.pricing.footer')}
      </div>
    </AuthLayout>
  );
}
