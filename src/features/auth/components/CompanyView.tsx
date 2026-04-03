"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, Mail, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Card, Input, Button } from '@/common/ui';
import { AuthLayout } from './AuthLayout';

export function CompanyView() {
  const router = useRouter();

  return (
    <AuthLayout>
      {/* Top Stepper Area - Center Aligned */}
      <div className="w-full flex justify-center mb-4 relative shrink-0">
        <div className="flex justify-center w-full px-6 md:px-0">
          <div className="flex items-start justify-center w-full max-w-[600px]">

            {/* Step 1: Pricing (Completed) */}
            <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
              <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-r from-[#2178ff] to-[#01c951] text-white flex items-center justify-center text-[15px] font-bold shadow-[0_6px_16px_-4px_rgba(21,93,252,0.5)]">
                <Check size={18} strokeWidth={3} />
              </div>
              <span className="text-[11px] font-bold text-gray-800">Pricing</span>
            </div>

            {/* Connecting Line 1 (Completed) */}
            <div className="flex-1 h-[2px] bg-gradient-to-r from-[#01c951] to-[#2178ff] mt-[17px] mx-3 lg:mx-4" />

            {/* Step 2: Company (Active) */}
            <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
              <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-r from-[#2178ff] to-[#01c951] text-white flex items-center justify-center text-[13px] font-bold shadow-[0_6px_16px_-4px_rgba(21,93,252,0.5)]">
                2
              </div>
              <span className="text-[11px] font-bold text-gray-800">Company</span>
            </div>

            {/* Connecting Line 2 (Inactive) */}
            <div className="flex-1 h-[2px] bg-gray-200 mt-[17px] mx-3 lg:mx-4" />

            {/* Step 3: Admin (Inactive) */}
            <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
              <div className="w-[36px] h-[36px] rounded-full bg-[#e2e8f0] text-gray-500 flex items-center justify-center text-[13px] font-bold">
                3
              </div>
              <span className="text-[11px] font-medium text-gray-500">Admin</span>
            </div>

            {/* Connecting Line 3 (Inactive) */}
            <div className="flex-1 h-[2px] bg-gray-200 mt-[17px] mx-3 lg:mx-4" />

            {/* Step 4: Done (Inactive) */}
            <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
              <div className="w-[36px] h-[36px] rounded-full bg-[#e2e8f0] text-gray-500 flex items-center justify-center text-[13px] font-bold">
                4
              </div>
              <span className="text-[11px] font-medium text-gray-500">Done</span>
            </div>

          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="w-full max-w-[580px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] p-5 md:px-8 md:py-6 flex flex-col relative z-20 mt-2">

        <div className="mb-4 border-b border-gray-100 pb-4">
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#1a1c23] mb-1">Company Setup</h1>
          <p className="text-[13.5px] md:text-[14px] text-gray-500 font-medium">Tell us about your organization</p>
        </div>

        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>

          <Input
            id="company_name"
            label="Company Name"
            placeholder="Acme Corporation"
            icon={<Building2 className="w-[16px] h-[16px]" />}
          />

          <Input
            id="nipt"
            label="NIPT (Tax ID)"
            placeholder="K12345678A"
          />

          <Input
            id="location"
            label="Location"
            placeholder="Tirana, Albania"
            icon={<MapPin className="w-[16px] h-[16px]" />}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="industry"
              label="Industry"
              placeholder="Technology"
            />
            <Input
              id="company_size"
              label="Company Size"
              placeholder="10-50 Employees"
            />
          </div>

          <Input
            id="email"
            label="Primary Contact Email"
            placeholder="contact@company.com"
            icon={<Mail className="w-[16px] h-[16px]" />}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="currency"
              label="Currency"
              placeholder="EUR (€)"
            />
            <Input
              id="timezone"
              label="Timezone"
              placeholder="Europe/Tirane"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center gap-3 pt-4 mt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/register/pricing')}
              icon={<ArrowLeft className="w-4 h-4" />}
              iconPosition="left"
            >
              Back
            </Button>

            <Button
              type="submit"
              onClick={() => router.push('/register/admin')}
              icon={<ArrowRight className="w-4 h-4" />}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </form>

      </Card>
    </AuthLayout>
  );
}
