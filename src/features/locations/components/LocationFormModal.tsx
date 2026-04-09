"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Textarea, Button } from '@/common/ui';
import { Check, ChevronRight, X, Save } from 'lucide-react';
import {
  LocationFormData,
  LocationFormErrors,
  LocationStep2Data,
  LocationStep2Errors,
  LocationStep3Data,
  LocationStep3Errors,
  Location,
  SiteType,
} from '../types';
import { COUNTRIES } from '../constants/countries';
import { TIMEZONES } from '../constants/timezones';
import { AddLocationStepLocation } from './AddLocationStepLocation';
import { AddLocationStepNetwork } from './AddLocationStepNetwork';
import { AddLocationStepActivate } from './AddLocationStepActivate';

export type LocationFormMode = 'add' | 'edit';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: LocationFormMode;
  /** In edit mode, pass the full location to prefill all form steps */
  initialLocation?: Location | null;
  /** Called on final submit with all collected form data */
  onSubmit?: (data: {
    step1: LocationFormData;
    step2: LocationStep2Data;
    step3: LocationStep3Data;
  }) => void;
}

const EMPTY_STEP1: LocationFormData = {
  siteType: '',
  siteName: '',
  siteCode: '',
  country: '',
  timezone: '',
  notes: '',
};

const EMPTY_STEP2: LocationStep2Data = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  geofenceRadius: 100,
  locationDetected: false,
  advancedSettings: { entryBuffer: 30, exitBuffer: 30, maxAccuracy: 50 },
};

const EMPTY_STEP3: LocationStep3Data = {
  detectedIp: '192.168.1.45',
  networkName: '',
  cidrBlock: '',
  networkType: '',
  ipVersion: 'IPv4',
  setExpiry: false,
  expiryDate: '',
  networkNotes: '',
  priorityOverride: '1',
};

function buildStep1FromLocation(loc: Location): LocationFormData {
  return {
    siteType: loc.siteType as SiteType,
    siteName: loc.siteName,
    siteCode: loc.siteCode,
    country: loc.country,
    timezone: loc.timezone ?? '',
    notes: loc.notes ?? '',
  };
}

function buildStep2FromLocation(loc: Location): LocationStep2Data {
  return {
    addressLine1: loc.addressLine1 ?? '',
    addressLine2: loc.addressLine2 ?? '',
    city: loc.city ?? '',
    geofenceRadius: loc.geofenceRadius ?? 100,
    locationDetected: false,
    advancedSettings: loc.advancedLocationSettings ?? {
      entryBuffer: 30,
      exitBuffer: 30,
      maxAccuracy: 50,
    },
  };
}

function buildStep3FromLocation(loc: Location): LocationStep3Data {
  return {
    detectedIp: loc.detectedIp ?? '192.168.1.45',
    networkName: loc.networkName ?? '',
    cidrBlock: loc.cidrBlock ?? '',
    networkType: loc.networkType ?? '',
    ipVersion: loc.ipVersion ?? 'IPv4',
    setExpiry: loc.setExpiry ?? false,
    expiryDate: loc.expiryDate ?? '',
    networkNotes: loc.networkNotes ?? '',
    priorityOverride: loc.priorityOverride ?? '1',
  };
}

export function LocationFormModal({
  isOpen,
  onClose,
  mode,
  initialLocation,
  onSubmit,
}: LocationFormModalProps) {
  const isEdit = mode === 'edit';
  const [currentStep, setCurrentStep] = useState(1);

  // ── Step 1
  const [step1Data, setStep1Data] = useState<LocationFormData>(EMPTY_STEP1);
  const [step1Errors, setStep1Errors] = useState<LocationFormErrors>({});

  // ── Step 2
  const [step2Data, setStep2Data] = useState<LocationStep2Data>(EMPTY_STEP2);
  const [step2Errors, setStep2Errors] = useState<LocationStep2Errors>({});

  // ── Step 3
  const [step3Data, setStep3Data] = useState<LocationStep3Data>(EMPTY_STEP3);
  const [step3Errors, setStep3Errors] = useState<LocationStep3Errors>({});

  // ── Prefill when opening in edit mode
  useEffect(() => {
    if (isOpen && isEdit && initialLocation) {
      setStep1Data(buildStep1FromLocation(initialLocation));
      setStep2Data(buildStep2FromLocation(initialLocation));
      setStep3Data(buildStep3FromLocation(initialLocation));
    }
    if (!isOpen) {
      // Reset on close so next open starts clean
      setCurrentStep(1);
      setStep1Errors({});
      setStep2Errors({});
      setStep3Errors({});
      if (!isEdit) {
        setStep1Data(EMPTY_STEP1);
        setStep2Data(EMPTY_STEP2);
        setStep3Data(EMPTY_STEP3);
      }
    }
  }, [isOpen, isEdit, initialLocation]);

  const handleClose = () => {
    setCurrentStep(1);
    setStep1Errors({});
    setStep2Errors({});
    setStep3Errors({});
    if (!isEdit) {
      setStep1Data(EMPTY_STEP1);
      setStep2Data(EMPTY_STEP2);
      setStep3Data(EMPTY_STEP3);
    }
    onClose();
  };

  // ── Validation (identical to original)
  const validateStep1 = (): boolean => {
    const errs: LocationFormErrors = {};
    if (!step1Data.siteType) errs.siteType = 'Site type is required';
    if (!step1Data.siteName) errs.siteName = 'Site name is required';
    if (!step1Data.siteCode) errs.siteCode = 'Site code is required';
    if (!step1Data.country) errs.country = 'Country is required';
    if (!step1Data.timezone) errs.timezone = 'Timezone is required';
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: LocationStep2Errors = {};
    if (!step2Data.addressLine1.trim()) errs.addressLine1 = 'Address is required';
    if (!step2Data.city.trim()) errs.city = 'City is required';
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: LocationStep3Errors = {};
    if (!step3Data.networkName.trim()) errs.networkName = 'Network name is required';
    if (!step3Data.cidrBlock.trim()) errs.cidrBlock = 'CIDR block is required';
    setStep3Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((p) => p - 1);
  };

  const handleFinalSubmit = () => {
    console.log(`[LocationFormModal] ${isEdit ? 'Update' : 'Activate'} location:`, {
      step1Data,
      step2Data,
      step3Data,
    });
    onSubmit?.({ step1: step1Data, step2: step2Data, step3: step3Data });
    handleClose();
  };

  const getBubbleStyle = (stepId: number) => {
    if (currentStep > stepId) return 'completed';
    if (currentStep === stepId) return 'active';
    return 'inactive';
  };

  const STEPS_CFG = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Location' },
    { id: 3, label: 'Network' },
    { id: 4, label: isEdit ? 'Review' : 'Activate' },
  ];

  const labelClasses = 'text-[13px] font-semibold text-[#364153] leading-[20px] mb-1';
  const inputOverrideClasses =
    'h-[40px] rounded-[10px] bg-[#F9FAFB] border-[#E5E7EB] text-[14px] placeholder:text-[rgba(10,10,10,0.5)]';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      width={currentStep === 4 ? 'max-w-[660px]' : 'max-w-[540px]'}
      containerClassName="p-0"
    >
      <div className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm">
        {/* ─── Header ─── */}
        <div className="pt-5 px-6 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#101828]">
              {isEdit ? 'Edit Location' : 'Add New Location'}
            </h2>
            <button
              onClick={handleClose}
              className="text-[#6A7282] hover:text-[#101828] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ─── Stepper ─── */}
          <div className="flex items-center justify-between px-2">
            {STEPS_CFG.map((step, index) => {
              const style = getBubbleStyle(step.id);
              const connectorBlue = currentStep > step.id || currentStep === step.id + 1;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-semibold transition-all ${
                        style === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : style === 'active'
                          ? 'bg-[#155DFC] text-white shadow-sm'
                          : 'bg-[#E5E7EB] text-[#6A7282]'
                      }`}
                    >
                      {style === 'completed' ? <Check size={14} strokeWidth={2.5} /> : step.id}
                    </div>
                    <span
                      className={`mt-1.5 text-[11px] font-medium transition-colors ${
                        style === 'active' ? 'text-[#155DFC]' : 'text-[#6A7282]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {index < STEPS_CFG.length - 1 && (
                    <div className="flex-1 h-[1px] mx-3 mb-4 transition-colors duration-300">
                      <div
                        className={`h-full transition-all duration-500 ${
                          connectorBlue ? 'bg-[#155DFC]' : 'bg-[#E5E7EB]'
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ─── Form Body ─── */}
        <div
          className={`px-6 py-4 overflow-y-auto ${
            currentStep === 1
              ? 'max-h-[52vh]'
              : currentStep === 4
              ? 'max-h-[70vh]'
              : 'max-h-[62vh]'
          }`}
        >
          {/* Step 1 – Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <Select
                id="siteType"
                label="Site Type"
                required
                value={step1Data.siteType}
                onChange={(e) =>
                  setStep1Data({ ...step1Data, siteType: e.target.value as SiteType })
                }
                error={step1Errors.siteType}
                className={labelClasses}
                style={{ height: '40px', borderRadius: '10px', backgroundColor: '#F9FAFB' }}
                options={[
                  { value: '', label: 'Select site type' },
                  { value: 'On-site', label: 'On-site' },
                  { value: 'Remote', label: 'Remote' },
                  { value: 'Hybrid', label: 'Hybrid' },
                ]}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="siteName"
                  label="Site Name"
                  required
                  placeholder="Main Office"
                  value={step1Data.siteName}
                  onChange={(e) => setStep1Data({ ...step1Data, siteName: e.target.value })}
                  error={step1Errors.siteName}
                  className={inputOverrideClasses}
                />
                <Input
                  id="siteCode"
                  label="Site Code"
                  required
                  placeholder="HQ-001"
                  value={step1Data.siteCode}
                  onChange={(e) => setStep1Data({ ...step1Data, siteCode: e.target.value })}
                  error={step1Errors.siteCode}
                  className={inputOverrideClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  id="country"
                  label="Country"
                  required
                  value={step1Data.country}
                  onChange={(e) => setStep1Data({ ...step1Data, country: e.target.value })}
                  error={step1Errors.country}
                  className={labelClasses}
                  style={{ height: '40px', borderRadius: '10px', backgroundColor: '#F9FAFB' }}
                  options={[{ value: '', label: 'Select country' }, ...COUNTRIES]}
                />
                <Select
                  id="timezone"
                  label="Timezone"
                  required
                  value={step1Data.timezone}
                  onChange={(e) => setStep1Data({ ...step1Data, timezone: e.target.value })}
                  error={step1Errors.timezone}
                  className={labelClasses}
                  style={{ height: '40px', borderRadius: '10px', backgroundColor: '#F9FAFB' }}
                  options={[{ value: '', label: 'Select timezone' }, ...TIMEZONES]}
                />
              </div>

              <Textarea
                id="notes"
                label="Notes"
                placeholder="Additional information..."
                value={step1Data.notes}
                onChange={(e) => setStep1Data({ ...step1Data, notes: e.target.value })}
                className="h-[40px] rounded-[10px] bg-[#F9FAFB] border-[#E5E7EB] text-[14px] !min-h-[70px] resize-none py-2"
              />
            </div>
          )}

          {/* Step 2 – Location */}
          {currentStep === 2 && (
            <AddLocationStepLocation
              data={step2Data}
              errors={step2Errors}
              onChange={(updates) => setStep2Data((prev) => ({ ...prev, ...updates }))}
            />
          )}

          {/* Step 3 – Network */}
          {currentStep === 3 && (
            <AddLocationStepNetwork
              data={step3Data}
              errors={step3Errors}
              onChange={(updates) => setStep3Data((prev) => ({ ...prev, ...updates }))}
            />
          )}

          {/* Step 4 – Summary / Review */}
          {currentStep === 4 && (
            <AddLocationStepActivate
              step1={step1Data}
              step2={step2Data}
              step3={step3Data}
              mode={mode}
            />
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between bg-[#FDFDFD]">
          <button
            disabled={currentStep === 1}
            onClick={handleBack}
            className={`flex items-center gap-1.5 text-[14px] font-semibold transition-all ${
              currentStep === 1
                ? 'text-[#6A7282]/40 cursor-not-allowed'
                : 'text-[#6A7282] hover:text-[#101828]'
            }`}
          >
            <ChevronRight className="rotate-180" size={16} />
            Back
          </button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="h-[40px] px-6 rounded-[10px] bg-gradient-to-r from-[#155DFC] to-[#12B76A] text-white text-[14px] font-semibold flex items-center gap-2"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          ) : isEdit ? (
            <Button
              onClick={handleFinalSubmit}
              className="h-[40px] px-6 rounded-[10px] bg-gradient-to-r from-[#155DFC] to-[#1447E6] text-white text-[14px] font-semibold flex items-center gap-2"
            >
              <Save size={16} />
              Update Location
            </Button>
          ) : (
            <Button
              onClick={handleFinalSubmit}
              className="h-[40px] px-6 rounded-[10px] bg-gradient-to-r from-[#00A63E] to-[#008236] text-white text-[14px] font-semibold flex items-center gap-2"
            >
              <Check size={16} />
              Activate Location
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
