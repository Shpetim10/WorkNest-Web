"use client";

import React, { useState } from 'react';
import { Card, Input, Textarea, Button } from '@/common/ui';

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
    <div className="w-full max-w-[1000px] space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* Header section */}
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold text-[#1a1c23] tracking-tight">Company Settings</h1>
        <p className="text-[14.5px] text-gray-500 font-medium">Configure company information and preferences</p>
      </div>

      <Card className="p-8 lg:p-10 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
              className="bg-gradient-to-r from-[#0066FF] to-[#00C853] hover:shadow-lg hover:shadow-blue-500/20"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

    </div>
  );
}
