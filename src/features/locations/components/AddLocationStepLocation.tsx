"use client";

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, ChevronDown, Navigation } from 'lucide-react';
import { Input, Button } from '@/common/ui';
import { Issue, LocationStep2Data, LocationStep2Errors } from '../types';
import { COUNTRY_CENTROIDS, DEFAULT_MAP_VIEW } from '../constants/country-centroids';

// Dynamically import the map – avoids Leaflet SSR errors (it needs `window`)
const LocationMap = dynamic(
  () => import('./LocationMap').then((m) => ({ default: m.LocationMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] w-full items-center justify-center rounded-2xl border border-[#EAECF0] bg-[#F8FAFF]">
        <span className="text-[13px] font-medium text-[#98A2B3]">Loading map...</span>
      </div>
    ),
  },
);

interface AddLocationStepLocationProps {
  data: LocationStep2Data;
  errors: LocationStep2Errors;
  warnings: Issue[];
  isDetecting: boolean;
  /** ISO 3166-1 alpha-2 country code from Step 1 */
  countryCode?: string;
  onChange: (updates: Partial<LocationStep2Data>) => void;
  onDetect: () => void | Promise<void>;
}

export function AddLocationStepLocation({
  data,
  errors,
  warnings,
  isDetecting,
  countryCode,
  onChange,
  onDetect,
}: AddLocationStepLocationProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Resolve the country centre for the initial map view
  const countryCenter = useMemo<[number, number, number]>(() => {
    if (!countryCode) return DEFAULT_MAP_VIEW;
    return COUNTRY_CENTROIDS[countryCode] ?? DEFAULT_MAP_VIEW;
  }, [countryCode]);

  // When the user drags the pin to manually correct position
  const handlePinMoved = (lat: number, lng: number) => {
    onChange({ latitude: lat, longitude: lng, locationDetected: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Detect Button Row */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={() => void onDetect()}
          isLoading={isDetecting}
          variant="primary"
          className="h-10 px-6"
          icon={<Navigation size={16} strokeWidth={3} />}
          iconPosition="left"
        >
          {isDetecting ? 'Detecting...' : 'Detect My Location'}
        </Button>

        {data.locationDetected && (
          <div className="animate-in zoom-in flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-emerald-600 duration-300 shadow-sm">
            <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Live Coordinates Active</span>
          </div>
        )}
      </div>

      {/* Error / Warning banners */}
      {(errors.detection || errors.coordinates) && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700 flex items-center gap-3">
          <AlertTriangle size={16} />
          <span>{errors.detection ?? errors.coordinates}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          {warnings.map((warning) => (
            <div key={warning.code} className="flex items-start gap-3 text-[13px] font-medium text-amber-800">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Interactive OpenStreetMap */}
      <div className="relative overflow-hidden rounded-2xl shadow-sm">
        <LocationMap
          detectedLat={data.latitude}
          detectedLng={data.longitude}
          countryCenter={countryCenter}
          onPinMoved={handlePinMoved}
          className="h-[220px]"
        />

        {/* Geofence radius badge – floating over the map */}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm border border-[#EAECF0]">
          <span className="text-[11px] font-bold text-[#344054]">Geofence</span>
          <span className="rounded-md bg-[#155DFC] px-2 py-0.5 text-[11px] font-black text-white">
            {data.geofenceRadius}m
          </span>
        </div>

        {/* Hint when no detection yet */}
        {!data.locationDetected && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <div className="rounded-full bg-white/90 backdrop-blur-sm border border-[#EAECF0] px-4 py-1.5 shadow-sm">
              <span className="text-[12px] font-semibold text-[#667085]">
                Press &ldquo;Detect My Location&rdquo; for a precise pin
              </span>
            </div>
          </div>
        )}

        {/* Coordinates badge after detection */}
        {data.locationDetected && data.latitude != null && data.longitude != null && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm border border-[#EAECF0]">
            <span className="font-mono text-[11px] font-bold text-[#344054]">
              {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
            </span>
            {data.detectedAccuracy != null && (
              <span className="text-[10px] text-[#98A2B3]">±{Math.round(data.detectedAccuracy)}m</span>
            )}
          </div>
        )}
      </div>

      {/* Geofence Radius Slider */}
      <div className="bg-[#F8FAFC]/50 p-5 rounded-2xl border border-[#EAECF0]/50">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[14px] font-bold text-[#364153]">Geofence Radius</p>
          <div className="rounded-lg bg-[#155DFC] px-3 py-1 text-[13px] font-bold text-white shadow-sm">
            {data.geofenceRadius}m
          </div>
        </div>
        <input
          type="range"
          min={30}
          max={500}
          value={data.geofenceRadius}
          onChange={(e) => onChange({ geofenceRadius: Number(e.target.value) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#E2E8F0] accent-[#155DFC] transition-all hover:accent-[#155DFC]/80"
        />
        <div className="mt-2.5 flex justify-between px-1">
          <span className="text-[11px] font-bold text-[#98A2B3]">30m (Min)</span>
          <span className="text-[11px] font-bold text-[#98A2B3]">500m (Max)</span>
        </div>
      </div>

      {/* Address Fields */}
      <div className="grid grid-cols-2 gap-x-6 items-start">
        <Input
          id="addressLine1"
          label="Address Line 1"
          required
          placeholder="e.g 123 Main St"
          value={data.addressLine1}
          onChange={(e) => onChange({ addressLine1: e.target.value })}
          error={errors.addressLine1}
          autoComplete="street-address"
        />
        <Input
          id="city"
          label="City"
          required
          placeholder="e.g Tirana"
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
          error={errors.city}
          autoComplete="address-level2"
        />
      </div>

      <div className="grid grid-cols-2 gap-x-6 items-start">
        <Input
          id="stateRegion"
          label="State / Region"
          placeholder="e.g Tirana County"
          value={data.stateRegion}
          onChange={(e) => onChange({ stateRegion: e.target.value })}
          autoComplete="address-level1"
        />
        <Input
          id="postalCode"
          label="Postal Code"
          placeholder="e.g 1001"
          value={data.postalCode}
          onChange={(e) => onChange({ postalCode: e.target.value })}
          autoComplete="postal-code"
        />
      </div>

      <Input
        id="addressLine2"
        label="Address Line 2 (Optional)"
        placeholder="Apartment, suite, unit, etc."
        value={data.addressLine2}
        onChange={(e) => onChange({ addressLine2: e.target.value })}
      />

      {/* Advanced Settings Toggle */}
      <div className="border-t border-[#EAECF0] pt-5">
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="group mb-5 flex items-center gap-2 text-[13px] font-bold text-[#155DFC] transition-all hover:opacity-80"
        >
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-[#155DFC]/10 transition-transform duration-300 ${advancedOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} />
          </div>
          Advanced Location Settings
        </button>

        {advancedOpen && (
          <div className="grid grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
            <Input
              id="entryBuffer"
              label="Entry Buffer (m)"
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
            />
            <Input
              id="exitBuffer"
              label="Exit Buffer (m)"
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
            />
            <Input
              id="maxAccuracy"
              label="Max Accuracy (m)"
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
            />
          </div>
        )}
      </div>
    </div>
  );
}
