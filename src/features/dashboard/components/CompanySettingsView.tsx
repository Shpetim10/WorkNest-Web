"use client";

import React, { useState, useRef } from 'react';
import { Card, Button } from '@/common/ui';
import {
  Settings,
  ChevronDown,
  Building2,
  Camera,
  LayoutGrid,
  Mail,
  Loader2,
} from 'lucide-react';
import { useCompanySettings, useUpdateCompanySettings } from '@/features/company-settings/api/use-company-settings';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse } from '@/common/types/api';
import { CompanySettingsResponse } from '@/features/company-settings/types';
import { UseMutationResult } from '@tanstack/react-query';
import { UpdateCompanySettingsRequest } from '@/features/company-settings/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:8080';

interface MediaUploadResponse {
  storageKey: string;
  storagePath: string;
}

type CompanyFormData = {
  name: string;
  email: string;
  adminEmail: string;
  nipt: string;
  phone: string;
  industry: string;
  currency: string;
  dateFormat: string;
};

const INDUSTRY_OPTIONS = [
  'HR & Workforce Management',
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Other',
];
const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'ALL'];
const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

const SELECT_OPTIONS: Partial<Record<keyof CompanyFormData, string[]>> = {
  industry: INDUSTRY_OPTIONS,
  currency: CURRENCY_OPTIONS,
  dateFormat: DATE_FORMAT_OPTIONS,
};

const READ_ONLY_FIELDS: (keyof CompanyFormData)[] = ['email', 'adminEmail'];

interface FieldProps {
  id: keyof CompanyFormData;
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  icon?: React.ReactNode;
}

function Field({ id, label, value, onChange, readOnly, icon }: FieldProps) {
  const options = SELECT_OPTIONS[id];

  const displayBox =
    'w-full h-11 bg-[#f8fafc] border border-gray-100 rounded-xl text-sm text-gray-800 flex items-center px-4';
  const inputBase =
    'w-full bg-[#f8fafc] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#155dfc]/10 focus:border-[#155dfc]/40 transition-all';

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-[13px] font-semibold text-gray-700">{label}</label>

      {readOnly ? (
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <div className={`${displayBox} ${icon ? 'pl-9' : ''}`}>
            <span>{value || <span className="text-gray-400">—</span>}</span>
          </div>
        </div>
      ) : options ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`h-11 pl-4 pr-10 appearance-none cursor-pointer ${inputBase}`}
          >
            {options.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      ) : (
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`h-11 ${icon ? 'pl-9' : 'pl-4'} pr-4 ${inputBase}`}
          />
        </div>
      )}
    </div>
  );
}

interface SettingsFormProps {
  data: CompanySettingsResponse;
  adminEmail: string;
  updateMutation: UseMutationResult<ApiResponse<CompanySettingsResponse>, Error, UpdateCompanySettingsRequest>;
}

function SettingsForm({ data, adminEmail, updateMutation }: SettingsFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: data.name ?? '',
    email: data.email ?? '',
    adminEmail,
    nipt: data.nipt ?? '',
    phone: data.phoneNumber ?? '',
    industry: data.industry ?? '',
    currency: data.currency ?? '',
    dateFormat: data.dateFormat ?? '',
  });
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(
    data.logoKey ? `${API_BASE}/api/v1/media/files/${data.logoKey}` : '',
  );
  const [logoDeleted, setLogoDeleted] = useState(false);
  const [logoError, setLogoError] = useState('');

  function handleLogoClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Only JPEG, PNG, and WEBP images are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Image size should be less than 5MB');
      return;
    }
    setLogoError('');
    const prev = logoPreviewUrl;
    if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
    setLogoFile(file);
    setLogoDeleted(false);
    setLogoPreviewUrl(URL.createObjectURL(file));
  }

  function handleLogoDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (logoPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(null);
    setLogoPreviewUrl('');
    setLogoDeleted(true);
    setLogoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function set(field: keyof CompanyFormData) {
    return (v: string) => {
      setFormData((prev) => ({ ...prev, [field]: v }));
      setSaveError('');
      setSaveSuccess(false);
    };
  }

  function fieldProps(id: keyof CompanyFormData) {
    return {
      id,
      value: formData[id],
      onChange: set(id),
      readOnly: READ_ONLY_FIELDS.includes(id),
    };
  }

  async function handleSave() {
    setSaveError('');
    setSaveSuccess(false);

    let logoKey: string | undefined;
    let logoPath: string | undefined;

    try {
      if (logoFile) {
        const formPayload = new window.FormData();
        formPayload.append('category', 'COMPANY_LOGO');
        formPayload.append('file', logoFile);
        const uploadRes = await apiClient.post<ApiResponse<MediaUploadResponse>>(
          '/media/upload',
          formPayload,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        logoKey = uploadRes.data.data.storageKey;
        logoPath = uploadRes.data.data.storagePath;
      }

      await updateMutation.mutateAsync({
        name: formData.name,
        nipt: formData.nipt || null,
        phoneNumber: formData.phone || null,
        industry: formData.industry || null,
        currency: formData.currency,
        dateFormat: formData.dateFormat,
        timezone: data.timezone ?? 'Europe/Tirane',
        countryCode: data.countryCode ?? 'AL',
        ...(logoDeleted ? { clearLogo: true } : logoKey ? { logoKey, logoPath } : {}),
      });
      setLogoFile(null);
      setLogoDeleted(false);
      setSaveSuccess(true);
    } catch {
      setSaveError('Failed to save settings. Please try again.');
    }
  }

  return (
    <>
      {/* Logo pill */}
      <div className="mb-8">
        <div className="relative inline-block">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <div
            onClick={handleLogoClick}
            className="w-36 h-10 rounded-full flex items-center justify-center bg-linear-to-r from-[#0ea5e9] to-[#10b981] cursor-pointer overflow-hidden group relative shadow-[0_4px_14px_-4px_rgba(14,165,233,0.5)]"
          >
            {logoPreviewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoPreviewUrl} alt="Company logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 text-white" />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <Camera size={14} className="text-white" />
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogoClick}
            aria-label="Upload company logo"
            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          {logoPreviewUrl && (
            <button
              type="button"
              onClick={handleLogoDelete}
              aria-label="Remove company logo"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 border border-white shadow-sm flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {logoError && (
          <p className="text-[12px] text-red-500 font-medium mt-3">{logoError}</p>
        )}
      </div>

      <div className="space-y-6">

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Company Name" icon={<LayoutGrid size={16} />} {...fieldProps('name')} />
          <Field label="NIPT (Tax ID)" {...fieldProps('nipt')} />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Company Email" icon={<Mail size={16} />} {...fieldProps('email')} />
          <Field label="Admin Email" icon={<Mail size={16} />} {...fieldProps('adminEmail')} />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Primary Contact Number" {...fieldProps('phone')} />
          <Field label="Industry" {...fieldProps('industry')} />
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Currency" {...fieldProps('currency')} />
          <Field label="Date Format" {...fieldProps('dateFormat')} />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {saveError && (
          <p className="text-[13px] text-red-500 font-medium text-right">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-[13px] text-green-600 font-medium text-right">Settings saved successfully.</p>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-1">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-linear-to-r from-[#0ea5e9] to-[#10b981] hover:shadow-lg hover:shadow-teal-500/20 text-white"
          >
            {updateMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={15} className="animate-spin" /> Saving...
              </span>
            ) : 'Save Changes'}
          </Button>
        </div>
      </div>
    </>
  );
}

function CompanySettingsView() {
  const [companyId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem('current_company_id'),
  );

  const { data, isLoading } = useCompanySettings(companyId);
  const updateMutation = useUpdateCompanySettings(companyId ?? '');

  const [adminEmail] = useState<string>(() =>
    typeof window === 'undefined' ? '' : (localStorage.getItem('user_email') ?? ''),
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* Header banner */}
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 50%, #10B981 100%)',
          minHeight: 120,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Settings size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Company Settings</h1>
            <p className="text-white/80 text-sm mt-0.5">
              Configure company information and preferences
            </p>
          </div>
        </div>
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
          <Settings size={28} className="text-white" />
        </div>
      </div>

      {/* Main card */}
      <Card className="p-8 lg:p-10 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

        {/* Card header */}
        <div className="space-y-1 mb-6">
          <h2 className="text-[17px] font-bold text-[#1a1c23]">Company Setting</h2>
          <p className="text-[13px] text-gray-500">
            Update your organization profile and payroll preferences
          </p>
        </div>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : (
          <SettingsForm
            key={data.companyId}
            data={data}
            adminEmail={adminEmail}
            updateMutation={updateMutation}
          />
        )}
      </Card>

    </div>
  );
}

export default CompanySettingsView