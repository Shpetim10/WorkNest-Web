"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Input, Textarea, Button } from '@/common/ui';
import { Settings, Building2, Camera } from 'lucide-react';

type CompanyFormData = {
  name: string;
  email: string;
  address: string;
};

export function CompanySettingsView() {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: 'WorkNest Inc.',
    email: 'info@worknest.com',
    address: '',
  });
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const [logoError, setLogoError] = useState('');

  useEffect(() => {
    return () => {
      if (logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setSaveError('');
    setSaveSuccess(false);
  }

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
    if (logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  }

  function handleLogoDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (logoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoFile(null);
    setLogoPreviewUrl('');
    setLogoError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSave() {
    try {
      setSaveError('');
      setSaveSuccess(false);

      // Placeholder until backend integration is wired in this view.
      await Promise.resolve({ formData, logoFile });

      setSaveSuccess(true);
    } catch {
      setSaveError('Failed to save settings. Please try again.');
    }
  }

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      <div
        className="relative rounded-2xl overflow-hidden px-8 py-8 flex items-center justify-between"
        style={{
          background: 'linear-gradient(90deg, #2B7FFF 0%, #00BBA7 100%)',
          minHeight: 120,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center gap-4 relative z-10">
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
      </div>

      <div
        className="bg-white rounded-2xl border border-gray-100 p-8 lg:p-10"
        style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.12)' }}
      >
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-6">
            <Input
              id="name"
              label="Company Name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter company name"
            />
            <Input
              id="email"
              label="Company Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter company email"
            />
            <Textarea
              id="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter company address"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="relative w-fit">
              <div
                onClick={handleLogoClick}
                className="w-36 h-10 rounded-full flex items-center justify-center bg-linear-to-r from-[#0ea5e9] to-[#10b981] cursor-pointer overflow-hidden group relative shadow-[0_4px_14px_-4px_rgba(14,165,233,0.5)]"
              >
                {logoPreviewUrl ? (
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
          </div>

          {logoError && <p className="text-[12px] text-red-500 font-medium mt-3">{logoError}</p>}
          {saveError && <p className="text-[12px] text-red-500 font-medium mt-3">{saveError}</p>}
          {saveSuccess && <p className="text-[12px] text-emerald-600 font-medium mt-3">Settings saved.</p>}

          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handleSave}
              className="h-11 px-8 rounded-xl bg-gradient-to-r from-[#2B7FFF] to-[#00BBA7] text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanySettingsView;
