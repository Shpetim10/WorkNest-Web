"use client";

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/common/ui';
import { Issue, LocationStep2Data, LocationStep2Errors } from '../types';
import { LocationMap } from './LocationMap';

interface AddLocationStepLocationProps {
  data: LocationStep2Data;
  errors: LocationStep2Errors;
  warnings: Issue[];
  locationRequired: boolean;
  countryCenter: [number, number, number];
  isDetecting: boolean;
  isHydratingAddress: boolean;
  onChange: (updates: Partial<LocationStep2Data>) => void;
  onDetect: () => void | Promise<void>;
  onPinMoved: (lat: number, lng: number) => void | Promise<void>;
}

export function AddLocationStepLocation({
  data,
  errors,
  warnings,
  locationRequired,
  countryCenter,
  isDetecting,
  isHydratingAddress,
  onChange,
  onDetect,
  onPinMoved,
}: AddLocationStepLocationProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const inputBase =
    'h-[40px] rounded-[10px] bg-[#F9FAFB] border-[#E5E7EB] text-[14px] placeholder:text-[rgba(10,10,10,0.5)]';
  const labelBase = 'text-[13px] font-semibold text-[#364153] leading-[20px] mb-1';

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[#DCE7FF] bg-[linear-gradient(135deg,rgba(239,244,255,0.92),rgba(255,255,255,1))] p-4 shadow-[0_20px_40px_-28px_rgba(21,93,252,0.45)]">
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D7E3FF] bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#155DFC]">
            <span className="h-2 w-2 rounded-full bg-[#12B76A]" />
            Precision Location Assist
          </div>

          <button
            type="button"
            onClick={() => void onDetect()}
            disabled={isDetecting}
            className="flex h-[44px] items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#155DFC] via-[#246BFF] to-[#1447E6] px-5 text-sm font-medium text-white shadow-[0_18px_30px_-18px_rgba(21,93,252,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_36px_-18px_rgba(21,93,252,0.75)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDetecting ? (
              <Loader2 size={16} className="animate-spin text-white" strokeWidth={2.5} />
            ) : (
              <Navigation size={16} className="text-white" strokeWidth={2.5} />
            )}
            {isDetecting ? 'Detecting your location...' : data.locationDetected ? 'Refresh Detected Location' : 'Detect My Location'}
          </button>

          <p className="text-center text-[12px] leading-5 text-[#475467]">
            We&apos;ll suggest a geofence, drop the pin precisely, and prefill the location details for you.
          </p>

          {data.locationDetected && !isDetecting && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-1 text-[12px] font-medium text-[#027A48]">
              <CheckCircle2 size={14} />
              Location synced to the form
            </div>
          )}

          {(errors.detection || errors.coordinates) && (
            <p className="animate-in slide-in-from-top-1 text-[12px] font-medium text-rose-500 duration-300 fade-in">
              {errors.detection ?? errors.coordinates}
            </p>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3">
          {warnings.map((warning) => (
            <div key={warning.code} className="flex items-start gap-2 text-[13px] text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {!locationRequired && (
        <div className="rounded-[10px] border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-800">
          Location is optional for this site. You can still detect or enter coordinates now, or leave this section blank.
        </div>
      )}

      <LocationMap
        detectedLat={data.latitude}
        detectedLng={data.longitude}
        geofenceRadiusMeters={data.geofenceRadius}
        countryCenter={countryCenter}
        className="h-[280px]"
        onPinMoved={onPinMoved}
      />

      <div className="flex items-center justify-between rounded-[14px] border border-[#E4E7EC] bg-white px-4 py-3 shadow-[0_16px_30px_-28px_rgba(16,24,40,0.35)]">
        <div>
          <p className="text-[13px] font-semibold text-[#101828]">Live pin sync</p>
          <p className="text-[12px] text-[#667085]">
            Drag the pin to refine the site. The address fields update from the new map position.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#F2F4F7] px-3 py-1 text-[12px] font-medium text-[#475467]">
          {isHydratingAddress ? (
            <>
              <Loader2 size={14} className="animate-spin text-[#155DFC]" />
              Updating details...
            </>
          ) : (
            <>
              <CheckCircle2 size={14} className="text-[#12B76A]" />
              Synced
            </>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold leading-[20px] text-[#364153]">
          Geofence Radius: <span className="text-[#155DFC]">{data.geofenceRadius}m</span>
        </p>
        <input
          type="range"
          min={30}
          max={500}
          value={data.geofenceRadius}
          onChange={(e) => onChange({ geofenceRadius: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer accent-[#155DFC]"
        />
        <div className="mt-1 flex justify-between">
          <span className="text-[10px] text-[#6A7282]">30m</span>
          <span className="text-[10px] text-[#6A7282]">500m</span>
        </div>
      </div>

      <Input
        id="addressLine1"
        label="Address Line 1"
        required={locationRequired}
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
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="city"
          label="City"
          required={locationRequired}
          placeholder="City name"
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
          error={errors.city}
          className={inputBase}
        />
        <Input
          id="stateRegion"
          label="State / Region"
          placeholder="Region"
          value={data.stateRegion}
          onChange={(e) => onChange({ stateRegion: e.target.value })}
          className={inputBase}
        />
      </div>
      <Input
        id="postalCode"
        label="Postal Code"
        placeholder="1001"
        value={data.postalCode}
        onChange={(e) => onChange({ postalCode: e.target.value })}
        className={inputBase}
      />

      <div className="border-t border-[#E5E7EB] pt-3">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-[#155DFC] transition-opacity hover:opacity-80"
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
              <label className={`block ${labelBase}`}>Entry Buffer (m)</label>
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
                className="h-[40px] w-full rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[14px] text-[#101828] transition-all focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20"
              />
            </div>
            <div>
              <label className={`block ${labelBase}`}>Exit Buffer (m)</label>
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
                className="h-[40px] w-full rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[14px] text-[#101828] transition-all focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20"
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
                className="h-[40px] w-full rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[14px] text-[#101828] transition-all focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
