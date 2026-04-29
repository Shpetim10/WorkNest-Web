"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { User, Mail, ArrowLeft, ArrowRight, ChevronDown, Loader2 } from 'lucide-react';
import { Card, Input, Button } from '@/common/ui';
import { AuthLayout } from './AuthLayout';
import { AuthHeader } from './AuthHeader';
import { useRegistrationStore } from '../store/useRegistrationStore';
import { usePublicMediaUpload, useRegisterCompany } from '../api/register-company';
import { MediaCategory } from '../types/registration';

// TODO: Replace with a real notification library like 'sonner' or 'react-hot-toast'
const notify = {
  success: (msg: string) => console.log('SUCCESS:', msg),
  error: (msg: string) => console.error('ERROR:', msg)
};

export function AdminView() {
  const router = useRouter();
  
  const { 
    // Company data
    companyName, nipt, primaryEmail, primaryPhone, industry, currency, dateFormat,
    // Admin data
    adminFirstName, adminLastName, adminEmail, adminPhone, preferredLanguage,
    // Logo
    logoFile,
    setAdminData, resetStore 
  } = useRegistrationStore();

  const uploadLogoMutation = usePublicMediaUpload();
  const registerCompanyMutation = useRegisterCompany();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!adminFirstName) newErrors.adminFirstName = 'First Name is required';
    if (!adminLastName) newErrors.adminLastName = 'Last Name is required';
    if (!adminPhone) newErrors.adminPhone = 'Phone Number is required';

    if (!adminEmail) {
      newErrors.adminEmail = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      newErrors.adminEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      let logoKey = undefined;
      let logoPath = undefined;

      // 1. Upload logo if exists
      if (logoFile) {
        const uploadResponse = await uploadLogoMutation.mutateAsync({ 
          file: logoFile, 
          category: MediaCategory.REGISTRATION_LOGO,
        });
        logoKey = uploadResponse.storageKey;
        logoPath = uploadResponse.storagePath;
      }

      // 2. Register Company
      await registerCompanyMutation.mutateAsync({
        companyName,
        slug: generateSlug(companyName),
        nipt,
        primaryEmail,
        primaryPhone,
        currency,
        dateFormat,
        industry,
        adminFirstName,
        adminLastName,
        adminEmail,
        adminPhoneNumber: adminPhone,
        preferredLanguage,
        logoKey,
        logoPath,
        // Defaults
        countryCode: 'AL',
        timezone: 'Europe/Tirane',
        locale: 'sq',
      });

      // 3. Success
      notify.success('Registration successful! Please check your email for activation.');
      router.push('/register/done');
      // Reset store after a delay to ensure the "done" page doesn't glitch if it uses any data
      setTimeout(resetStore, 1000);
    } catch (error: unknown) {
      let message = 'Something went wrong during registration';

      if (axios.isAxiosError(error)) {
        if (!error.response) {
          message =
            'Registration request could not reach the server. Check CORS/backend connectivity and try again.';
        } else {
          message = error.response.data?.message || message;
        }
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }

      notify.error(message);
      
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminData({ [field]: e.target.value });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const isSubmitting = uploadLogoMutation.isPending || registerCompanyMutation.isPending;

  return (
    <AuthLayout>
      <div className="w-full max-w-[850px] relative z-20">
        {/* Left: Language Selector */}
        <div className="absolute left-0 top-[2px]">
          <div className="relative">
            <select
              value={preferredLanguage}
              onChange={(e) => setAdminData({ preferredLanguage: e.target.value as 'en' | 'sq' })}
              className="appearance-none pl-3 pr-8 py-1.5 text-[12.5px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] cursor-pointer transition-all"
            >
              <option value="en">English</option>
              <option value="sq">Albanian</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400">
              <ChevronDown size={13} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      <AuthHeader currentStep={3} />

      <Card className="w-full max-w-[580px] px-5 pt-6 pb-8 md:px-8 md:pt-7 md:pb-9 flex flex-col relative z-20 mt-2">
        <div className="mb-4">
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#1a1c23] mb-1">Admin Profile</h1>
          <p className="text-[13.5px] md:text-[14px] text-gray-500 font-medium">
            Set up your administrator account
          </p>
        </div>

        <div className="flex justify-center mb-5">
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#2178ff] to-[#01c9c9] flex items-center justify-center shadow-[0_6px_20px_-4px_rgba(21,93,252,0.4)]">
            <User size={34} strokeWidth={1.6} className="text-white" />
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              id="adminFirstName"
              label="First Name"
              placeholder="John"
              disabled={isSubmitting}
              required
              icon={<User size={16} />}
              value={adminFirstName}
              onChange={handleInputChange('adminFirstName')}
              error={errors.adminFirstName}
            />
            <Input
              id="adminLastName"
              label="Last Name"
              placeholder="Doe"
              disabled={isSubmitting}
              required
              value={adminLastName}
              onChange={handleInputChange('adminLastName')}
              error={errors.adminLastName}
            />
          </div>

          <Input
            id="adminEmail"
            label="Email Address"
            type="text"
            placeholder="john@company.com"
            disabled={isSubmitting}
            required
            icon={<Mail size={16} />}
            value={adminEmail}
            onChange={handleInputChange('adminEmail')}
            error={errors.adminEmail}
          />

          <Input
            id="adminPhone"
            label="Phone Number"
            placeholder="+355 69 123 4567"
            disabled={isSubmitting}
            required
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.66 16z" />
              </svg>
            }
            value={adminPhone}
            onChange={handleInputChange('adminPhone')}
            error={errors.adminPhone}
          />

          <div className="flex items-center gap-3 pt-5 mt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => router.push('/register/company')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-600 text-[13px] font-bold hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <Button
              type="submit"
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              className="flex-1"
            >
              {isSubmitting ? 'Processing...' : 'Complete Registration'}
            </Button>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
}
