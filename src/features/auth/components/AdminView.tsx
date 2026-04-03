"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Check, Camera } from 'lucide-react';
import { Card, Input, Button } from '@/common/ui';
import { AuthLayout } from './AuthLayout';

export function AdminView() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState<'en' | 'sq'>('en');

  return (
    <AuthLayout>
      {/* Top Stepper Area - Steps 1 & 2 Completed, Step 3 active */}
      <div className="flex items-start justify-center w-full max-w-[600px] mb-4 relative shrink-0">
        {/* Step 1: Pricing (Completed) */}
        <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
          <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-r from-[#2178ff] to-[#01c951] text-white flex items-center justify-center text-[15px] font-bold shadow-[0_6px_16px_-4px_rgba(21,93,252,0.5)]">
            <Check size={18} strokeWidth={3} />
          </div>
          <span className="text-[11px] font-bold text-gray-800">Pricing</span>
        </div>

        {/* Connecting Line 1 (Completed) */}
        <div className="flex-1 h-[2px] bg-gradient-to-r from-[#01c951] to-[#2178ff] mt-[17px] mx-3 lg:mx-4" />

        {/* Step 2: Company (Completed) */}
        <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
          <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-r from-[#2178ff] to-[#01c951] text-white flex items-center justify-center text-[15px] font-bold shadow-[0_6px_16px_-4px_rgba(21,93,252,0.5)]">
            <Check size={18} strokeWidth={3} />
          </div>
          <span className="text-[11px] font-bold text-gray-800">Company</span>
        </div>

        {/* Connecting Line 2 (Completed) */}
        <div className="flex-1 h-[2px] bg-gradient-to-r from-[#01c951] to-[#2178ff] mt-[17px] mx-3 lg:mx-4" />

        {/* Step 3: Admin (Active) */}
        <div className="flex flex-col items-center gap-2 w-[60px] shrink-0">
          <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-r from-[#2178ff] to-[#01c951] text-white flex items-center justify-center text-[13px] font-bold shadow-[0_6px_16px_-4px_rgba(21,93,252,0.5)]">
            3
          </div>
          <span className="text-[11px] font-bold text-gray-800">Admin</span>
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

      {/* Main Admin Form Card */}
      <Card className="w-full max-w-[580px] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] p-5 md:px-8 md:py-6 flex flex-col relative z-20 mt-2">
        <div className="mb-4 border-b border-gray-100 pb-4">
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#1a1c23] mb-1">Admin Profile</h1>
          <p className="text-[13.5px] md:text-[14px] text-gray-500 font-medium">Set up your administrator account</p>
        </div>

        {/* Avatar Placeholder section */}
        <div className="flex justify-center mb-6 pt-2">
          <div className="relative w-[84px] h-[84px]">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#155DFC] to-[#4b8df8] flex items-center justify-center text-white shadow-lg overflow-hidden border-2 border-white">
              <User size={42} strokeWidth={1.5} className="opacity-90" />
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
              <Camera size={14} />
            </button>
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* First/Last Name Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              id="firstName" 
              label="First Name" 
              placeholder="John" 
              required 
              icon={<User size={16} />} 
              className="bg-white border-gray-200"
            />
            <Input 
              id="lastName" 
              label="Last Name" 
              placeholder="Doe" 
              required 
              icon={<User size={16} />} 
              className="bg-white border-gray-200"
            />
          </div>

          <Input 
            id="email" 
            label="Email Address" 
            type="email" 
            placeholder="john@company.com" 
            required 
            icon={<Mail size={16} />}
            className="bg-white border-gray-200"
          />

          <Input 
            id="phone" 
            label="Phone Number" 
            placeholder="+355 69 123 4567" 
            required 
            icon={<Phone size={16} />}
            className="bg-white border-gray-200"
          />

          {/* Language Selection */}
          <div className="space-y-1.5 w-full">
            <label className="text-[13px] font-semibold text-gray-700 font-sans">
              Preferred Language <span className="text-gray-500">*</span>
            </label>
            <div className="flex p-1 bg-[#f1f5f9] rounded-xl border border-gray-200/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 text-[13px] font-bold rounded-[9px] transition-all duration-200 ${
                  language === 'en' 
                    ? 'bg-gradient-to-r from-[#2178ff] to-[#01c951] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('sq')}
                className={`flex-1 py-2 text-[13px] font-bold rounded-[9px] transition-all duration-200 ${
                  language === 'sq' 
                    ? 'bg-gradient-to-r from-[#2178ff] to-[#01c951] text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Shqip
              </button>
            </div>
          </div>

          <Input 
            id="password" 
            label="Password" 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Create a strong password" 
            required 
            icon={<Lock size={16} />}
            iconRight={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            onIconRightClick={() => setShowPassword(!showPassword)}
            className="bg-white border-gray-200"
          />

          {/* Bottom Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/register/company')}
              icon={<ArrowLeft className="w-4 h-4" />}
              iconPosition="left"
            >
              Back
            </Button>

            <Button
              type="submit"
              onClick={() => router.push('/register/done')}
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
