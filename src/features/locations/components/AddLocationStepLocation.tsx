"use client";

import React, { useState } from 'react';
import { ChevronDown, MapPin, Navigation } from 'lucide-react';
import { Input } from '@/common/ui';
import { LocationStep2Data, LocationStep2Errors } from '../types';

interface AddLocationStepLocationProps {
  data: LocationStep2Data;
  errors: LocationStep2Errors;
  onChange: (updates: Partial<LocationStep2Data>) => void;
}

const MOCK_DETECTED_LOCATION = {
  addressLine1: 'Rruga e Kavajës',
  addressLine2: '',
  city: 'Tirana',
  geofenceRadius: 100,
  locationDetected: true,
};

export function AddLocationStepLocation({
  data,
  errors,
  onChange,
}: AddLocationStepLocationProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleDetect = () => {
    setIsDetecting(true);
    setTimeout(() => {
      onChange(MOCK_DETECTED_LOCATION);
      setIsDetecting(false);
    }, 1200);
  };

  const inputBase =
    'h-[40px] rounded-[10px] bg-[#F9FAFB] border-[#E5E7EB] text-[14px] placeholder:text-[rgba(10,10,10,0.5)]';
  const labelBase =
    'text-[13px] font-semibold text-[#364153] leading-[20px] mb-1';

  return (
    <div className="space-y-3">
      {/* Detect My Location Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleDetect}
          disabled={isDetecting}
          className="flex items-center justify-center gap-2 px-5 h-[40px] rounded-[14px] bg-gradient-to-r from-[#155DFC] to-[#1447E6] text-white text-sm font-medium shadow-md shadow-blue-200 transition-all hover:shadow-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Navigation size={16} className="text-white" strokeWidth={2.5} />
          {isDetecting
            ? 'Detecting...'
            : data.locationDetected
            ? 'Location Detected'
            : 'Detect My Location'}
        </button>
      </div>

      {/* Map Placeholder */}
      <div className="w-full h-[140px] rounded-[10px] overflow-hidden border border-[#E5E7EB] bg-gradient-to-br from-[#F0F4FF] to-[#EBF9F0] flex flex-col items-center justify-center gap-2">
        {data.locationDetected ? (
          <>
            <div className="w-9 h-9 rounded-full bg-white border-2 border-[#155DFC] shadow-md flex items-center justify-center">
              <MapPin size={18} className="text-[#155DFC]" />
            </div>
            <p className="text-[13px] font-semibold text-[#155DFC]">
              {data.addressLine1}, {data.city}
            </p>
            <p className="text-[11px] text-[#6A7282]">Location detected</p>
          </>
        ) : (
          <>
            <MapPin size={24} className="text-[#CBD5E1]" />
            <p className="text-[12px] text-[#6A7282]">Click detect to show map</p>
          </>
        )}
      </div>

      {/* Geofence Radius Slider */}
      <div>
        <p className="text-[13px] font-semibold text-[#364153] leading-[20px] mb-2">
          Geofence Radius:{' '}
          <span className="text-[#155DFC]">{data.geofenceRadius}m</span>
        </p>
        <input
          type="range"
          min={30}
          max={500}
          value={data.geofenceRadius}
          onChange={(e) => onChange({ geofenceRadius: Number(e.target.value) })}
          className="w-full h-1.5 accent-[#155DFC] cursor-pointer"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[#6A7282]">30m</span>
          <span className="text-[10px] text-[#6A7282]">500m</span>
        </div>
      </div>

      {/* Address Fields */}
      <Input
        id="addressLine1"
        label="Address Line 1"
        required
        placeholder="Street address"
        value={data.addressLine1}
        onChange={(e) => onChange({ addressLine1: e.target.value })}
        error={errors.addressLine1}
        className={inputBase}
      />
      <Input
        id="addressLine2"
        label="Address Line 2"
        placeholder="Apartment, suite, etc."
        value={data.addressLine2}
        onChange={(e) => onChange({ addressLine2: e.target.value })}
        className={inputBase}
      />
      <Input
        id="city"
        label="City"
        required
        placeholder="City name"
        value={data.city}
        onChange={(e) => onChange({ city: e.target.value })}
        error={errors.city}
        className={inputBase}
      />

      {/* Advanced Settings – flat expandable, no card */}
      <div className="border-t border-[#E5E7EB] pt-3">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[#155DFC] text-[13px] font-semibold mb-3 hover:opacity-80 transition-opacity"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`}
          />
          Advanced Settings
        </button>

        {advancedOpen && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`block ${labelBase}`}>Entry Buffer (s)</label>
              <input
                type="number"
                min={0}
                value={data.advancedSettings.entryBuffer}
                onChange={(e) =>
                  onChange({
                    advancedSettings: {
                      ...data.advancedSettings,
                      entryBuffer: Number(e.target.value),
                    },
                  })
                }
                className="w-full h-[40px] px-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 transition-all"
              />
            </div>
            <div>
              <label className={`block ${labelBase}`}>Exit Buffer (s)</label>
              <input
                type="number"
                min={0}
                value={data.advancedSettings.exitBuffer}
                onChange={(e) =>
                  onChange({
                    advancedSettings: {
                      ...data.advancedSettings,
                      exitBuffer: Number(e.target.value),
                    },
                  })
                }
                className="w-full h-[40px] px-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 transition-all"
              />
            </div>
            <div>
              <label className={`block ${labelBase}`}>Max Accuracy (m)</label>
              <input
                type="number"
                min={0}
                value={data.advancedSettings.maxAccuracy}
                onChange={(e) =>
                  onChange({
                    advancedSettings: {
                      ...data.advancedSettings,
                      maxAccuracy: Number(e.target.value),
                    },
                  })
                }
                className="w-full h-[40px] px-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 transition-all"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
