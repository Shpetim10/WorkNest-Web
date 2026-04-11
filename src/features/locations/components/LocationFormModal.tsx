"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Input, Modal, Select, Textarea } from '@/common/ui';
import { Check, ChevronRight, Save, X } from 'lucide-react';
import { useCreateSite, useDetectLocation, useDetectNetwork, useUpdateSite } from '../api';
import {
  CompanySiteFormValues,
  Issue,
  Location,
  LocationFormData,
  LocationFormErrors,
  LocationStep2Data,
  LocationStep2Errors,
  LocationStep3Data,
  LocationStep3Errors,
  SiteType,
} from '../types';
import { COUNTRIES } from '../constants/countries';
import { COUNTRY_CENTROIDS, DEFAULT_MAP_VIEW } from '../constants/country-centroids';
import { TIMEZONES } from '../constants/timezones';
import { AddLocationStepActivate } from './AddLocationStepActivate';
import { AddLocationStepLocation } from './AddLocationStepLocation';
import { AddLocationStepNetwork } from './AddLocationStepNetwork';
import {
  buildLocalLocationAssessment,
  getBrowserGeolocation,
  normalizeLocationDetectionResponse,
  reverseGeocodeCoordinates,
  toLocationDetectionRequest,
} from '../utils/detection';
import {
  buildConflictMessage,
  formatApiError,
  mapServerErrorsToLocationForm,
} from '../utils/errors';
import {
  applyDetectedLocationToStep,
  buildCompanySiteFormValues,
  clearTrustedNetworkFormValue,
  DEFAULT_ATTENDANCE_SETTINGS,
  DEFAULT_LOCATION_STEP,
  EMPTY_TRUSTED_NETWORK,
  hasTrustedNetworkInput,
  mapDetectNetworkResponseToFormValue,
  mapFormToCreateCompanySiteRequest,
  mapLocationToForm,
} from '../utils/mappers';
import { validateStep1, validateStep2, validateStep3 } from '../utils/validation';

export type LocationFormMode = 'add' | 'edit';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: LocationFormMode;
  companyId?: string | null;
  initialLocation?: Location | null;
  initialStep?: number;
  onCompleted?: () => void;
}

const EMPTY_STEP1: LocationFormData = {
  siteType: '',
  siteName: '',
  siteCode: '',
  country: '',
  timezone: '',
  notes: '',
};

function createEmptyStep2(): LocationStep2Data {
  return {
    ...DEFAULT_LOCATION_STEP,
    advancedSettings: { ...DEFAULT_LOCATION_STEP.advancedSettings },
  };
}

function createEmptyAttendanceSettings() {
  return { ...DEFAULT_ATTENDANCE_SETTINGS };
}

function createEmptyStep3(): LocationStep3Data {
  return { ...EMPTY_TRUSTED_NETWORK };
}

function getGeolocationErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) {
    const geolocationError = error as GeolocationPositionError;

    if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
      return 'Location permission was denied. You can keep filling the address manually.';
    }

    if (geolocationError.code === geolocationError.TIMEOUT) {
      return 'Location detection timed out. Retry or enter the site details manually.';
    }

    if (geolocationError.code === geolocationError.POSITION_UNAVAILABLE) {
      return 'Current location is unavailable right now. You can continue with manual entry.';
    }
  }

  return formatApiError(error);
}

export function LocationFormModal({
  isOpen,
  onClose,
  mode,
  companyId,
  initialLocation,
  initialStep = 1,
  onCompleted,
}: LocationFormModalProps) {
  const isEdit = mode === 'edit';
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [step1Data, setStep1Data] = useState<LocationFormData>(EMPTY_STEP1);
  const [step1Errors, setStep1Errors] = useState<LocationFormErrors>({});
  const [step2Data, setStep2Data] = useState<LocationStep2Data>(createEmptyStep2);
  const [step2Errors, setStep2Errors] = useState<LocationStep2Errors>({});
  const [attendanceSettings, setAttendanceSettings] = useState(createEmptyAttendanceSettings);
  const [step3Data, setStep3Data] = useState<LocationStep3Data>(createEmptyStep3);
  const [step3Errors, setStep3Errors] = useState<LocationStep3Errors>({});
  const [locationWarnings, setLocationWarnings] = useState<Issue[]>([]);
  const [networkWarnings, setNetworkWarnings] = useState<Issue[]>([]);
  const [formError, setFormError] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const createSiteMutation = useCreateSite();
  const updateSiteMutation = useUpdateSite();
  const detectLocationMutation = useDetectLocation();
  const detectNetworkMutation = useDetectNetwork();

  const siteIdRef = useRef<string | null>(initialLocation?.id ?? null);
  const versionRef = useRef<number | null>(initialLocation?.version ?? null);
  const reverseGeocodeControllerRef = useRef<AbortController | null>(null);
  const detectNetworkControllerRef = useRef<AbortController | null>(null);
  const submitControllerRef = useRef<AbortController | null>(null);
  const detectLocationControllerRef = useRef<AbortController | null>(null);
  const locationSyncRequestRef = useRef(0);

  const isSubmitting = createSiteMutation.isPending || updateSiteMutation.isPending;
  const isDetectingNetwork = detectNetworkMutation.isPending;
  const countryCenter = step1Data.country
    ? COUNTRY_CENTROIDS[step1Data.country] ?? DEFAULT_MAP_VIEW
    : DEFAULT_MAP_VIEW;
  const formValues = useMemo<CompanySiteFormValues>(
    () =>
      buildCompanySiteFormValues(step1Data, step2Data, attendanceSettings, [
        step3Data,
      ]),
    [attendanceSettings, step1Data, step2Data, step3Data],
  );

  useEffect(() => {
    if (isOpen && initialLocation) {
      const mapped = mapLocationToForm(initialLocation);
      siteIdRef.current = initialLocation.id;
      versionRef.current = initialLocation.version;
      setStep1Data(mapped.basicInfo);
      setStep2Data(mapped.location);
      setAttendanceSettings(mapped.attendanceRules);
      setStep3Data(mapped.trustedNetworks[0] ?? clearTrustedNetworkFormValue());
      setLocationWarnings(initialLocation.warnings ?? []);
      setNetworkWarnings([]);
    }

    if (!isOpen) {
      setCurrentStep(initialStep);
      siteIdRef.current = initialLocation?.id ?? null;
      versionRef.current = initialLocation?.version ?? null;
      setStep1Errors({});
      setStep2Errors({});
      setStep3Errors({});
      setLocationWarnings([]);
      setNetworkWarnings([]);
      setFormError('');

      if (!initialLocation) {
        setStep1Data(EMPTY_STEP1);
        setStep2Data(createEmptyStep2());
        setAttendanceSettings(createEmptyAttendanceSettings());
        setStep3Data(createEmptyStep3());
      }
    }
  }, [initialLocation, isOpen]);

  useEffect(
    () => () => {
      reverseGeocodeControllerRef.current?.abort();
      detectNetworkControllerRef.current?.abort();
      submitControllerRef.current?.abort();
      detectLocationControllerRef.current?.abort();
    },
    [],
  );

  const clearStepErrors = () => {
    setStep1Errors({});
    setStep2Errors({});
    setStep3Errors({});
  };

  const applyServerErrors = (error: unknown) => {
    const mapped = mapServerErrorsToLocationForm(error);
    setFormError(mapped.formError ?? formatApiError(error));
    setStep1Errors((prev) => ({ ...prev, ...mapped.step1Errors }));
    setStep2Errors((prev) => ({ ...prev, ...mapped.step2Errors }));
    setStep3Errors((prev) => ({ ...prev, ...mapped.step3Errors }));
  };

  const syncAddressFromCoordinates = async (latitude: number, longitude: number) => {
    const requestId = ++locationSyncRequestRef.current;
    reverseGeocodeControllerRef.current?.abort();
    const controller = new AbortController();
    reverseGeocodeControllerRef.current = controller;
    setIsReverseGeocoding(true);

    try {
      const address = await reverseGeocodeCoordinates(latitude, longitude, controller.signal);

      if (requestId !== locationSyncRequestRef.current) {
        return;
      }

      setStep2Data((prev) => ({
        ...prev,
        latitude,
        longitude,
        locationDetected: true,
        addressLine1: address.addressLine1 ?? prev.addressLine1,
        addressLine2: address.addressLine2 ?? prev.addressLine2,
        city: address.city ?? prev.city,
        stateRegion: address.stateRegion ?? prev.stateRegion,
        postalCode: address.postalCode ?? prev.postalCode,
      }));

      if (address.countryCode) {
        setStep1Data((prev) => (prev.country ? prev : { ...prev, country: address.countryCode ?? prev.country }));
      }

      setStep2Errors((prev) => ({
        ...prev,
        addressLine1: undefined,
        city: undefined,
        coordinates: undefined,
      }));
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }

      setLocationWarnings((prev) => [
        ...prev.filter((warning) => warning.code !== 'REVERSE_GEOCODE_FAILED'),
        {
          code: 'REVERSE_GEOCODE_FAILED',
          message: 'Address lookup failed, but the detected coordinates were kept so you can continue manually.',
          field: 'location',
        },
      ]);
    } finally {
      if (requestId === locationSyncRequestRef.current) {
        setIsReverseGeocoding(false);
      }
    }
  };

  const handleDetectLocation = async () => {
    setFormError('');
    setStep2Errors((prev) => ({ ...prev, detection: undefined, coordinates: undefined }));
    detectLocationControllerRef.current?.abort();
    const controller = new AbortController();
    detectLocationControllerRef.current = controller;
    setIsDetectingLocation(true);

    try {
      const browserLocation = await getBrowserGeolocation();
      const assessment = isEdit && siteIdRef.current
        ? normalizeLocationDetectionResponse(
            browserLocation,
            await detectLocationMutation.mutateAsync({
              siteId: siteIdRef.current,
              data: toLocationDetectionRequest(browserLocation),
              signal: controller.signal,
            }),
          )
        : buildLocalLocationAssessment(browserLocation, step2Data.advancedSettings.maxAccuracy);

      setLocationWarnings(assessment.warnings);
      setStep2Data((prev) => applyDetectedLocationToStep(prev, assessment));
      await syncAddressFromCoordinates(assessment.latitude, assessment.longitude);
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }

      setStep2Errors((prev) => ({
        ...prev,
        detection: buildConflictMessage(error) ?? getGeolocationErrorMessage(error),
      }));
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handlePinMoved = async (latitude: number, longitude: number) => {
    setStep2Data((prev) => ({
      ...prev,
      latitude,
      longitude,
      locationDetected: true,
      browserTimestampMs: Date.now(),
    }));
    await syncAddressFromCoordinates(latitude, longitude);
  };

  const handleDetectNetwork = async () => {
    setFormError('');
    setStep3Errors((prev) => ({ ...prev, detection: undefined }));
    detectNetworkControllerRef.current?.abort();
    const controller = new AbortController();
    detectNetworkControllerRef.current = controller;

    try {
      const detection = await detectNetworkMutation.mutateAsync({ signal: controller.signal });
      setNetworkWarnings([...(detection.warnings ?? []), ...(detection.blockingIssues ?? [])]);
      setStep3Data((prev) => mapDetectNetworkResponseToFormValue(detection, prev));
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }

      setStep3Errors((prev) => ({
        ...prev,
        detection: buildConflictMessage(error) ?? formatApiError(error),
      }));
    }
  };

  const handleClearDetectedNetwork = () => {
    setStep3Data(clearTrustedNetworkFormValue());
    setStep3Errors({});
    setNetworkWarnings([]);
  };

  const handleNext = () => {
    setFormError('');

    if (currentStep === 1) {
      const errors = validateStep1(formValues);
      setStep1Errors(errors);
      if (Object.keys(errors).length === 0) {
        setCurrentStep(2);
      }
      return;
    }

    if (currentStep === 2) {
      const errors = validateStep2(formValues);
      setStep2Errors(errors);
      if (Object.keys(errors).length === 0) {
        setCurrentStep(3);
      }
      return;
    }

    if (currentStep === 3) {
      const errors = validateStep3(formValues);
      if (step3Data.torExitNode && hasTrustedNetworkInput(step3Data)) {
        errors.detection = 'Tor exit nodes cannot be saved as trusted networks.';
      }
      setStep3Errors(errors);
      if (Object.keys(errors).length === 0) {
        setCurrentStep(4);
      }
    }
  };

  const handleFinalSubmit = async () => {
    setFormError('');
    clearStepErrors();
    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    const step1Validation = validateStep1(formValues);
    const step2Validation = validateStep2(formValues);
    const step3Validation = validateStep3(formValues);

    if (Object.keys(step1Validation).length > 0) {
      setStep1Errors(step1Validation);
      setCurrentStep(1);
      return;
    }

    if (Object.keys(step2Validation).length > 0) {
      setStep2Errors(step2Validation);
      setCurrentStep(2);
      return;
    }

    if (Object.keys(step3Validation).length > 0) {
      setStep3Errors(step3Validation);
      setCurrentStep(3);
      return;
    }

    try {
      const payload = mapFormToCreateCompanySiteRequest(
        formValues,
        isEdit ? versionRef.current ?? 0 : null,
      );

      if (isEdit) {
        const resolvedSiteId = siteIdRef.current;
        if (!resolvedSiteId) {
          setFormError('Site is missing. Please close the modal and try again.');
          return;
        }

        const updatedSite = await updateSiteMutation.mutateAsync({
          siteId: resolvedSiteId,
          data: payload,
          signal: controller.signal,
        });
        versionRef.current = updatedSite.version;
      } else {
        if (!companyId) {
          setFormError('Company context is missing. Please sign in again and retry.');
          return;
        }

        const createdSite = await createSiteMutation.mutateAsync({
          companyId,
          data: payload,
          signal: controller.signal,
        });
        siteIdRef.current = createdSite.id;
        versionRef.current = createdSite.version;
      }

      onCompleted?.();
      onClose();
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }

      applyServerErrors(error);
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && !isSubmitting) {
      setCurrentStep((previous) => previous - 1);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  const getBubbleStyle = (stepId: number) =>
    currentStep > stepId ? 'completed' : currentStep === stepId ? 'active' : 'inactive';
  const steps = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Location' },
    { id: 3, label: 'Network' },
    { id: 4, label: 'Review' },
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
      showDefaultStyles={false}
    >
      <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)]">
        <div className="border-b border-[#E5E7EB] px-6 pt-5 pb-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-[#101828]">{isEdit ? 'Edit Location' : 'Add New Location'}</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-[#6A7282] transition-colors hover:text-[#101828] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between px-2">
            {steps.map((step, index) => {
              const style = getBubbleStyle(step.id);
              const connectorBlue = currentStep > step.id || currentStep === step.id + 1;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex shrink-0 flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-[8px] text-[13px] font-semibold transition-all ${
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
                  {index < steps.length - 1 && (
                    <div className="mx-3 mb-4 h-[1px] flex-1 transition-colors duration-300">
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

        <div
          className={`overflow-y-auto px-6 py-4 ${
            currentStep === 1 ? 'max-h-[58vh]' : currentStep === 4 ? 'max-h-[70vh]' : 'max-h-[62vh]'
          }`}
        >
          {formError && (
            <div className="mb-4 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
              {formError}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-3">
              <Select
                id="siteType"
                label="Site Type"
                required
                value={step1Data.siteType}
                onChange={(e) => setStep1Data((prev) => ({ ...prev, siteType: e.target.value as SiteType }))}
                error={step1Errors.siteType}
                className={labelClasses}
                style={{ height: '40px', borderRadius: '10px', backgroundColor: '#F9FAFB' }}
                options={[
                  { value: '', label: 'Select site type' },
                  { value: 'HQ', label: 'HQ' },
                  { value: 'BRANCH', label: 'Branch' },
                  { value: 'WAREHOUSE', label: 'Warehouse' },
                  { value: 'STORE', label: 'Store' },
                  { value: 'CLIENT_SITE', label: 'Client Site' },
                  { value: 'FIELD_ZONE', label: 'Field Zone' },
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="siteName"
                  label="Site Name"
                  required
                  placeholder="Tirana Headquarters"
                  value={step1Data.siteName}
                  onChange={(e) => setStep1Data((prev) => ({ ...prev, siteName: e.target.value }))}
                  error={step1Errors.siteName}
                  className={inputOverrideClasses}
                />
                <Input
                  id="siteCode"
                  label="Site Code"
                  required
                  placeholder="HQ-TIR"
                  value={step1Data.siteCode}
                  onChange={(e) =>
                    setStep1Data((prev) => ({ ...prev, siteCode: e.target.value.toUpperCase() }))
                  }
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
                  onChange={(e) => setStep1Data((prev) => ({ ...prev, country: e.target.value }))}
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
                  onChange={(e) => setStep1Data((prev) => ({ ...prev, timezone: e.target.value }))}
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
                onChange={(e) => setStep1Data((prev) => ({ ...prev, notes: e.target.value }))}
                className="h-[40px] !min-h-[70px] resize-none rounded-[10px] border-[#E5E7EB] bg-[#F9FAFB] py-2 text-[14px]"
              />

              <div className="grid grid-cols-2 gap-3 rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                <Checkbox
                  label="Location Required"
                  checked={attendanceSettings.locationRequired}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setAttendanceSettings((prev) => ({ ...prev, locationRequired: checked }));
                    if (!checked) {
                      setStep2Errors({});
                    }
                  }}
                />
                <Checkbox
                  label="QR Enabled"
                  checked={attendanceSettings.qrEnabled}
                  onChange={(event) =>
                    setAttendanceSettings((prev) => ({ ...prev, qrEnabled: event.target.checked }))
                  }
                />
                <Checkbox
                  label="Check-In Enabled"
                  checked={attendanceSettings.checkInEnabled}
                  onChange={(event) =>
                    setAttendanceSettings((prev) => ({
                      ...prev,
                      checkInEnabled: event.target.checked,
                    }))
                  }
                />
                <Checkbox
                  label="Check-Out Enabled"
                  checked={attendanceSettings.checkOutEnabled}
                  onChange={(event) =>
                    setAttendanceSettings((prev) => ({
                      ...prev,
                      checkOutEnabled: event.target.checked,
                    }))
                  }
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <AddLocationStepLocation
              data={step2Data}
              errors={step2Errors}
              warnings={locationWarnings}
              locationRequired={attendanceSettings.locationRequired}
              countryCenter={countryCenter}
              isDetecting={isDetectingLocation}
              isHydratingAddress={isReverseGeocoding}
              onChange={(updates) => setStep2Data((prev) => ({ ...prev, ...updates }))}
              onDetect={handleDetectLocation}
              onPinMoved={handlePinMoved}
            />
          )}

          {currentStep === 3 && (
            <AddLocationStepNetwork
              data={step3Data}
              errors={step3Errors}
              warnings={networkWarnings}
              isDetecting={isDetectingNetwork}
              onChange={(updates) => setStep3Data((prev) => ({ ...prev, ...updates }))}
              onDetect={handleDetectNetwork}
              onClear={handleClearDetectedNetwork}
            />
          )}

          {currentStep === 4 && (
            <AddLocationStepActivate
              step1={step1Data}
              step2={step2Data}
              step3={step3Data}
              mode={mode}
              warnings={[...locationWarnings, ...networkWarnings]}
              blockingIssues={[]}
              readyToActivate={!isSubmitting}
              isCheckingReadiness={false}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FDFDFD] px-6 py-4">
          <button
            disabled={currentStep === 1 || isSubmitting}
            onClick={handleBack}
            className={`flex items-center gap-1.5 text-[14px] font-semibold transition-all ${
              currentStep === 1
                ? 'cursor-not-allowed text-[#6A7282]/40'
                : 'text-[#6A7282] hover:text-[#101828] disabled:cursor-not-allowed disabled:opacity-60'
            }`}
          >
            <ChevronRight className="rotate-180" size={16} />
            Back
          </button>
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              isLoading={false}
              className="flex h-[40px] items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#155DFC] to-[#12B76A] px-6 text-[14px] font-semibold text-white"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          ) : isEdit ? (
            <Button
              onClick={() => void handleFinalSubmit()}
              isLoading={isSubmitting}
              className="flex h-[40px] items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#155DFC] to-[#1447E6] px-6 text-[14px] font-semibold text-white"
            >
              <Save size={16} />
              Save Location
            </Button>
          ) : (
            <Button
              onClick={() => void handleFinalSubmit()}
              isLoading={isSubmitting}
              className="flex h-[40px] items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#00A63E] to-[#008236] px-6 text-[14px] font-semibold text-white"
            >
              <Check size={16} />
              Create Site
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
