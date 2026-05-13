"use client";
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, ArrowLeft, Camera } from 'lucide-react';
import { Card, Input, Button } from '@/common/ui';
import { useI18n } from '@/common/i18n';
import { AuthLayout } from './AuthLayout';
import { AuthHeader } from './AuthHeader';
import { useRegistrationStore } from '../store/useRegistrationStore';

export function CompanyView() {
  const { t } = useI18n();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    companyName, nipt, primaryEmail, primaryPhone, industry, currency, dateFormat,
    logoPreviewUrl,
    setCompanyData, setLogoFile 
  } = useRegistrationStore();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!companyName) newErrors.companyName = t('validation.companyNameRequired');
    if (!nipt) newErrors.nipt = t('validation.niptRequired');
    if (!primaryPhone) newErrors.primaryPhone = t('validation.contactNumberRequired');
    
    if (!primaryEmail) {
      newErrors.primaryEmail = t('validation.contactEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryEmail)) {
      newErrors.primaryEmail = t('validation.validEmail');
    }

    if (!currency) newErrors.currency = t('validation.currencyRequired');
    if (!dateFormat) newErrors.dateFormat = t('validation.dateFormatRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      router.push('/register/admin');
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCompanyData({ [field]: e.target.value });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logo: t('validation.imageFile') }));
        return;
      }
      // Validate file size (e.g., 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: t('validation.imageSize') }));
        return;
      }
      setLogoFile(file);
      setErrors(prev => ({ ...prev, logo: '' }));
    }
  };

  return (
    <AuthLayout>
      <AuthHeader currentStep={2} />

      <Card className="w-full max-w-[580px] p-5 md:px-8 md:py-6 flex flex-col relative z-20 mt-2">

        {/* Header row: title + logo upload pill */}
        <div className="flex items-start justify-between mb-5 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-[24px] md:text-[28px] font-bold text-[#1a1c23] mb-1">{t('auth.register.company.title')}</h1>
            <p className="text-[13.5px] md:text-[14px] text-gray-500 font-medium">{t('auth.register.company.subtitle')}</p>
          </div>

          {/* Logo upload pill */}
          <div className="relative shrink-0 ml-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            {/* Gradient capsule / Preview */}
            <div 
              onClick={handleLogoClick}
              className="w-[100px] h-[44px] rounded-full bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] flex items-center justify-center shadow-[0_6px_20px_-4px_rgba(43,127,255,0.4)] cursor-pointer overflow-hidden group"
            >
              {logoPreviewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreviewUrl} alt={t('auth.register.company.logoPreview')} className="w-full h-full object-cover" />
                </>
              ) : (
                <Building2 size={22} strokeWidth={1.8} className="text-white" />
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera size={16} className="text-white" />
              </div>
            </div>
            {/* Overlapping upload icon button */}
            <button
              type="button"
              onClick={handleLogoClick}
              aria-label={t('auth.register.company.uploadLogo')}
              className="absolute -bottom-2.5 -right-1.5 w-7 h-7 rounded-full bg-white border border-gray-100 shadow-md flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>

        {errors.logo && (
          <p className="text-[12px] text-red-500 font-medium mb-3 -mt-3">{errors.logo}</p>
        )}

        <form className="space-y-3.5" onSubmit={handleSubmit}>

          {/* Company Name */}
          <Input
            id="company_name"
            label={t('common.fields.companyName')}
            placeholder="Acme Corporation"
            required
            icon={<Building2 className="w-[16px] h-[16px]" />}
            value={companyName}
            onChange={handleInputChange('companyName')}
            error={errors.companyName}
          />

          {/* NIPT (Tax ID) */}
          <Input
            id="nipt"
            label={t('common.fields.nipt')}
            placeholder="K12345678A"
            required
            value={nipt}
            onChange={handleInputChange('nipt')}
            error={errors.nipt}
          />

          {/* Primary Contact Number */}
          <Input
            id="primary_contact_number"
            label={t('common.fields.contactNumber')}
            placeholder="+355 69 123 4567"
            required
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.73a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.66 16z" />
              </svg>
            }
            value={primaryPhone}
            onChange={handleInputChange('primaryPhone')}
            error={errors.primaryPhone}
          />

          {/* Primary Contact Email */}
          <Input
            id="primary_contact_email"
            label={t('common.fields.contactEmail')}
            type="text"
            placeholder="contact@company.com"
            required
            icon={<Mail className="w-[16px] h-[16px]" />}
            value={primaryEmail}
            onChange={handleInputChange('primaryEmail')}
            error={errors.primaryEmail}
          />

          {/* Industry — full-width select */}
          <div className="space-y-1 w-full text-left">
            <label className="text-[13px] font-semibold text-gray-700 font-sans" htmlFor="industry">
              {t('common.fields.industry')}
            </label>
            <div className="relative">
              <select
                id="industry"
                className="w-full pl-4 pr-10 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all appearance-none cursor-pointer"
                value={industry}
                onChange={handleInputChange('industry')}
              >
                <option value="" disabled>{t('auth.register.company.industryPlaceholder')}</option>
                <option value="technology">{t('auth.register.company.industries.technology')}</option>
                <option value="finance">{t('auth.register.company.industries.finance')}</option>
                <option value="healthcare">{t('auth.register.company.industries.healthcare')}</option>
                <option value="retail">{t('auth.register.company.industries.retail')}</option>
                <option value="manufacturing">{t('auth.register.company.industries.manufacturing')}</option>
                <option value="education">{t('auth.register.company.industries.education')}</option>
                <option value="construction">{t('auth.register.company.industries.construction')}</option>
                <option value="hospitality">{t('auth.register.company.industries.hospitality')}</option>
                <option value="other">{t('auth.register.company.industries.other')}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Currency + Date Format — two-column */}
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Currency select */}
            <div className="space-y-1 w-full text-left">
              <label className="text-[13px] font-semibold text-gray-700 font-sans" htmlFor="currency">
                {t('common.fields.currency')} <span className="text-gray-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="currency"
                  className={`w-full pl-4 pr-10 py-2.5 bg-[#f8fafc] border ${errors.currency ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#0066FF] focus:ring-[#0066FF]/20'} rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer`}
                  value={currency}
                  onChange={handleInputChange('currency')}
                >
                  <option value="" disabled>{t('auth.register.company.currencyPlaceholder')}</option>
                  <option value="ALL">{t('auth.register.company.currencies.ALL')}</option>
                  <option value="EUR">{t('auth.register.company.currencies.EUR')}</option>
                  <option value="USD">{t('auth.register.company.currencies.USD')}</option>
                  <option value="GBP">{t('auth.register.company.currencies.GBP')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              {errors.currency && <p className="text-[12px] text-red-500 font-medium mt-1 pl-1">{errors.currency}</p>}
            </div>

            {/* Date Format select */}
            <div className="space-y-1 w-full text-left">
              <label className="text-[13px] font-semibold text-gray-700 font-sans" htmlFor="date_format">
                {t('common.fields.dateFormat')} <span className="text-gray-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="date_format"
                  className={`w-full pl-4 pr-10 py-2.5 bg-[#f8fafc] border ${errors.dateFormat ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#0066FF] focus:ring-[#0066FF]/20'} rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer`}
                  value={dateFormat}
                  onChange={handleInputChange('dateFormat')}
                >
                  <option value="" disabled>{t('auth.register.company.dateFormatPlaceholder')}</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              {errors.dateFormat && <p className="text-[12px] text-red-500 font-medium mt-1 pl-1">{errors.dateFormat}</p>}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 gap-4">
            <button
              type="button"
              onClick={() => router.push('/register/pricing')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-600 text-[13px] font-bold hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.actions.back')}
            </button>
            <Button
              type="submit"
              className="flex-1"
            >
              {t('common.actions.continue')}
            </Button>
          </div>
        </form>

      </Card>
    </AuthLayout>
  );
}
