"use client";

import React, { useState } from 'react';
import { Card, Input, Textarea, Button } from '@/common/ui';
import { Settings } from 'lucide-react';

export function CompanySettingsView() {
  const [formData, setFormData] = useState({
    name: 'WorkNest Inc.',
    email: 'info@worknest.com',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    alert('Settings saved successfully (Mock)');
  };

  return (
    <div className="flex flex-col gap-6 -mx-2 lg:-mx-4">
      
      {/* ── Page Header Card ───────────────────────────────────────────── */}
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
          </div>

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
