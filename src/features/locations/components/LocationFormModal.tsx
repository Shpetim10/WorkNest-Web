"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Input, Select, Textarea, Stepper } from '@/common/ui';
import { Check, ChevronRight, Loader2, Save, X } from 'lucide-react';
import {
  useActivateSite,
  useCreateSiteDraft,
  useDetectLocation,
  useDetectNetwork,
  useSaveBasicInfo,
  useSaveLocation,
  useSaveTrustedNetwork,
} from '../api';
import {
  ActivateSiteResponse,
  Issue,
  Location,
  LocationDetectionResponse,
  LocationFormData,
  LocationFormErrors,
  LocationStep2Data,
  LocationStep2Errors,
  LocationStep3Data,
  LocationStep3Errors,
  NetworkDetectionResponse,
  SaveBasicInfoRequest,
  SaveLocationRequest,
  SaveTrustedNetworkRequest,
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
  companyId?: string | null;
  initialLocation?: Location | null;
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

const EMPTY_STEP2: LocationStep2Data = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  latitude: null,
  longitude: null,
  geofenceRadius: 100,
  detectedAccuracy: null,
  browserTimestampMs: null,
  locationDetected: false,
  advancedSettings: { entryBuffer: 30, exitBuffer: 30, maxAccuracy: 50 },
};

const EMPTY_STEP3: LocationStep3Data = {
  trustedNetworkId: null,
  detectedIp: '',
  networkName: '',
  cidrBlock: '',
  networkType: 'AUTO_DETECTED',
  ipVersion: 'IPv4',
  confidence: 'MANUAL',
  torExitNode: false,
  vpnDetected: false,
  cgnatDetected: false,
  setExpiry: false,
  expiryDate: '',
  networkNotes: '',
  priorityOverride: '1',
};

function buildStep1FromLocation(loc: Location): LocationFormData {
  return {
    siteType: loc.siteType,
    siteName: loc.siteName,
    siteCode: loc.siteCode,
    country: loc.countryCode,
    timezone: loc.timezone,
    notes: loc.notes ?? '',
  };
}

function buildStep2FromLocation(loc: Location): LocationStep2Data {
  return {
    addressLine1: loc.addressLine1,
    addressLine2: loc.addressLine2,
    city: loc.city,
    stateRegion: loc.stateRegion,
    postalCode: loc.postalCode,
    latitude: loc.latitude,
    longitude: loc.longitude,
    geofenceRadius: loc.geofenceRadius,
    detectedAccuracy: loc.advancedLocationSettings.maxAccuracy,
    browserTimestampMs: null,
    locationDetected: Boolean(loc.latitude && loc.longitude),
    advancedSettings: loc.advancedLocationSettings,
  };
}

function buildStep3FromLocation(loc: Location): LocationStep3Data {
  return {
    trustedNetworkId: loc.trustedNetworks[0]?.id ?? null,
    detectedIp: loc.detectedIp,
    networkName: loc.networkName,
    cidrBlock: loc.cidrBlock,
    networkType: loc.networkType,
    ipVersion: loc.ipVersion,
    confidence: loc.confidence,
    torExitNode: loc.torExitNode,
    vpnDetected: loc.vpnDetected,
    cgnatDetected: loc.cgnatDetected,
    setExpiry: loc.setExpiry,
    expiryDate: loc.expiryDate,
    networkNotes: loc.networkNotes,
    priorityOverride: loc.priorityOverride,
  };
}

function formatApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message ?? 'Something went wrong.');
  }
  return 'Something went wrong.';
}

function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    if ('status' in error) return (error as { status: number }).status;
    if ('response' in error) return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

function buildConflictMessage(error: unknown): string | null {
  if (getErrorStatus(error) === 409) {
    return 'Another admin updated this site while you were editing. You need to sync with the server to get the latest data before saving.';
  }
  return null;
}

function toIsoExpiryDate(date: string): string | null {
  if (!date) {
    return null;
  }
  return `${date}T23:59:59.000Z`;
}


export function LocationFormModal({
  isOpen,
  onClose,
  mode,
  companyId,
  initialLocation,
  onCompleted,
}: LocationFormModalProps) {
  const isEdit = mode === 'edit';
  const [currentStep, setCurrentStep] = useState(1);
  const [siteId, setSiteId] = useState<string | null>(initialLocation?.id ?? null);
  const [version, setVersion] = useState(initialLocation?.version ?? 0);
  const [step1Data, setStep1Data] = useState<LocationFormData>(EMPTY_STEP1);
  const [step1Errors, setStep1Errors] = useState<LocationFormErrors>({});
  const [step2Data, setStep2Data] = useState<LocationStep2Data>(EMPTY_STEP2);
  const [step2Errors, setStep2Errors] = useState<LocationStep2Errors>({});
  const [step3Data, setStep3Data] = useState<LocationStep3Data>(EMPTY_STEP3);
  const [step3Errors, setStep3Errors] = useState<LocationStep3Errors>({});
  const [locationWarnings, setLocationWarnings] = useState<Issue[]>([]);
  const [networkWarnings, setNetworkWarnings] = useState<Issue[]>([]);
  const [activationPreview, setActivationPreview] = useState<ActivateSiteResponse | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [isConflict, setIsConflict] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const createDraftMutation = useCreateSiteDraft();
  const saveBasicInfoMutation = useSaveBasicInfo();
  const detectLocationMutation = useDetectLocation();
  const saveLocationMutation = useSaveLocation();
  const detectNetworkMutation = useDetectNetwork();
  const saveTrustedNetworkMutation = useSaveTrustedNetwork();
  const activateSiteMutation = useActivateSite();

  const isBusy =
    createDraftMutation.isPending ||
    saveBasicInfoMutation.isPending ||
    detectLocationMutation.isPending ||
    saveLocationMutation.isPending ||
    detectNetworkMutation.isPending ||
    saveTrustedNetworkMutation.isPending ||
    activateSiteMutation.isPending ||
    isActivating;

  useEffect(() => {
    if (isOpen && initialLocation) {
      setSiteId(initialLocation.id);
      setVersion(initialLocation.version);
      setStep1Data(buildStep1FromLocation(initialLocation));
      setStep2Data(buildStep2FromLocation(initialLocation));
      setStep3Data(buildStep3FromLocation(initialLocation));
    }

    if (!isOpen) {
      setCurrentStep(1);
      setSiteId(initialLocation?.id ?? null);
      setVersion(initialLocation?.version ?? 0);
      setStep1Errors({});
      setStep2Errors({});
      setStep3Errors({});
      setLocationWarnings([]);
      setNetworkWarnings([]);
      setActivationPreview(null);
      setFormError('');

      if (!initialLocation) {
        setStep1Data(EMPTY_STEP1);
        setStep2Data(EMPTY_STEP2);
        setStep3Data(EMPTY_STEP3);
      }
      setIsConflict(false);
      setIsSyncing(false);
    }
  }, [initialLocation, isOpen]);

  useEffect(() => {
    if (!isOpen || currentStep !== 4 || !siteId || isEdit) {
      return;
    }

    let active = true;

    const previewActivation = async () => {
      try {
        const preview = await activateSiteMutation.mutateAsync({ siteId, dryRun: true });
        if (!active) {
          return;
        }
        setActivationPreview(preview);
        if (preview.site?.version) {
          setVersion(preview.site.version);
        }
        if (preview.blockingIssues.length > 0) {
          setFormError('The site is not ready to activate yet. Review the blocking issues before going live.');
        } else {
          setFormError('');
        }
      } catch (error) {
        if (!active) {
          return;
        }
        const conflict = buildConflictMessage(error);
        if (conflict) {
          setIsConflict(true);
          setFormError(conflict);
        } else {
          setFormError(formatApiError(error));
        }
      }
    };

    void previewActivation();

    return () => {
      active = false;
    };
  }, [activateSiteMutation, currentStep, isEdit, isOpen, siteId]);

  const mergedWarnings = useMemo(
    () => [...locationWarnings, ...networkWarnings, ...(activationPreview?.warnings ?? [])],
    [activationPreview?.warnings, locationWarnings, networkWarnings],
  );

  const handleClose = () => {
    if (isBusy) {
      return;
    }
    onClose();
  };

  const validateStep1 = (): boolean => {
    const errs: LocationFormErrors = {};
    if (!step1Data.siteType) errs.siteType = 'Site type is required';
    if (!step1Data.siteName.trim()) errs.siteName = 'Site name is required';
    if (!step1Data.siteCode.trim()) errs.siteCode = 'Site code is required';
    if (!step1Data.country.trim()) errs.country = 'Country is required';
    if (!step1Data.timezone.trim()) errs.timezone = 'Timezone is required';
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: LocationStep2Errors = {};
    if (!step2Data.addressLine1.trim()) errs.addressLine1 = 'Address is required';
    if (!step2Data.city.trim()) errs.city = 'City is required';
    if (step2Data.latitude == null || step2Data.longitude == null) {
      errs.coordinates = 'Detect or set a location before continuing.';
    }
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: LocationStep3Errors = {};
    if (!step3Data.networkName.trim()) errs.networkName = 'Network name is required';
    if (!step3Data.cidrBlock.trim()) errs.cidrBlock = 'CIDR block is required';
    if (step3Data.torExitNode) {
      errs.detection = 'Tor exit nodes cannot be trusted networks. Switch to a secure office network and detect again.';
    }
    setStep3Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const getOrCreateSiteId = async (): Promise<string> => {
    if (siteId) {
      return siteId;
    }

    if (!companyId) {
      throw new Error('Company context is missing. Please log in again and retry.');
    }

    const draft = await createDraftMutation.mutateAsync({
      companyId,
      data: {
        code: step1Data.siteCode.trim(),
        name: step1Data.siteName.trim(),
        type: step1Data.siteType as SiteType,
        countryCode: step1Data.country.trim(),
        timezone: step1Data.timezone.trim(),
      },
    });

    setSiteId(draft.id);
    setVersion(draft.version);
    return draft.id;
  };

  const handleConflictSync = async () => {
    if (!siteId || isSyncing) return;
    
    setIsSyncing(true);
    setFormError('');
    
    try {
      // Direct API call to get latest status to bypass cache if needed
      const { apiClient } = await import('@/common/network/api-client');
      const { mapSetupStatusToLocation } = await import('../api');
      const response = await apiClient.get(`/sites/${siteId}/setup-status`);
      const status = response.data.data || response.data;
      const latest = mapSetupStatusToLocation(status);
      
      // Update all form states with server data
      setVersion(latest.version);
      setStep1Data(buildStep1FromLocation(latest));
      setStep2Data(buildStep2FromLocation(latest));
      setStep3Data(buildStep3FromLocation(latest));
      
      // Reset conflict state
      setIsConflict(false);
      console.log('✅ [Conflict] State synchronized with version:', latest.version);
    } catch (error) {
      setFormError('Failed to synchronize with server. Please close and reopen the location.');
      console.error('❌ [Conflict] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveStep1 = async () => {
    const resolvedSiteId = await getOrCreateSiteId();

    const payload: SaveBasicInfoRequest = {
      version,
      code: step1Data.siteCode.trim(),
      name: step1Data.siteName.trim(),
      type: step1Data.siteType as SiteType,
      addressLine1: step2Data.addressLine1.trim(),
      addressLine2: step2Data.addressLine2.trim() || undefined,
      city: step2Data.city.trim(),
      stateRegion: step2Data.stateRegion.trim() || undefined,
      postalCode: step2Data.postalCode.trim() || undefined,
      countryCode: step1Data.country.trim(),
      timezone: step1Data.timezone.trim(),
      notes: step1Data.notes.trim() || undefined,
    };

    const updatedSite = await saveBasicInfoMutation.mutateAsync({
      siteId: resolvedSiteId,
      data: payload,
    });

    setVersion(updatedSite.version);
  };

  const saveStep2 = async () => {
    if (!siteId) {
      throw new Error('Site draft is missing. Please return to basic info and save again.');
    }

    const payload: SaveLocationRequest = {
      version,
      latitude: step2Data.latitude!,
      longitude: step2Data.longitude!,
      geofenceShapeType: 'CIRCLE',
      geofenceRadiusMeters: step2Data.geofenceRadius,
      entryBufferMeters: step2Data.advancedSettings.entryBuffer,
      exitBufferMeters: step2Data.advancedSettings.exitBuffer,
      maxLocationAccuracyMeters: step2Data.advancedSettings.maxAccuracy,
      locationRequired: true,
    };

    const updatedSite = await saveLocationMutation.mutateAsync({
      siteId,
      data: payload,
    });

    setVersion(updatedSite.version);
  };

  const saveStep3 = async () => {
    if (!siteId) {
      throw new Error('Site draft is missing. Please return to basic info and save again.');
    }

    const networkId = step3Data.trustedNetworkId ?? crypto.randomUUID();
    const payload: SaveTrustedNetworkRequest = {
      version,
      name: step3Data.networkName.trim(),
      cidr: step3Data.cidrBlock.trim(),
      networkType: step3Data.networkType,
      ipVersion: step3Data.ipVersion,
      detectedIp: step3Data.detectedIp || undefined,
      confidence: step3Data.confidence || undefined,
      expiresAt: step3Data.setExpiry ? toIsoExpiryDate(step3Data.expiryDate) : null,
      notes: step3Data.networkNotes.trim() || undefined,
      priority: Number(step3Data.priorityOverride || 1),
    };

    const network = await saveTrustedNetworkMutation.mutateAsync({
      siteId,
      networkId,
      data: payload,
    });

    setStep3Data((prev) => ({ ...prev, trustedNetworkId: network.id }));
    if (network.updatedAt) {
      setVersion((prev) => prev + 1);
    }
  };

  const handleDetectLocation = async () => {
    setFormError('');
    setStep2Errors((prev) => ({ ...prev, detection: undefined, coordinates: undefined }));

    if (!navigator.geolocation) {
      setStep2Errors((prev) => ({
        ...prev,
        detection: 'Geolocation is not supported in this browser.',
      }));
      return;
    }

    try {
      const resolvedSiteId = await getOrCreateSiteId();

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const detection = await detectLocationMutation.mutateAsync({
        siteId: resolvedSiteId,
        data: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          browserTimestampMs: position.timestamp,
        },
      });

      applyLocationDetection(position, detection);

      // --- Autofill address fields via Reverse Geocoding ---
      try {
        const lat = detection.latitude ?? position.coords.latitude;
        const lon = detection.longitude ?? position.coords.longitude;
        
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          const addr = geoData.address;
          
          if (addr) {
            // Build Address Line 1: prefer house_number + road
            const street = addr.road || addr.pedestrian || addr.suburb || '';
            const house = addr.house_number || '';
            const line1 = street ? (house ? `${house} ${street}` : street) : addr.amenity || '';

            setStep2Data((prev) => ({
              ...prev,
              addressLine1: line1 || prev.addressLine1,
              city: addr.city || addr.town || addr.village || prev.city,
              stateRegion: addr.state || addr.region || prev.stateRegion,
              postalCode: addr.postcode || prev.postalCode,
            }));
          }
        }
      } catch (geoError) {
        console.warn('Silent failure: Reverse geocoding failed', geoError);
        // We don't block the user if geocoding fails, they can still enter address manually
      }
      // ---------------------------------------------------
    } catch (error) {
      const geolocationError =
        error &&
        typeof error === 'object' &&
        'message' in error &&
        ('code' in error || 'PERMISSION_DENIED' in error);

      if (geolocationError) {
        setStep2Errors((prev) => ({
          ...prev,
          detection: String((error as { message?: string }).message || 'Unable to access your current location.'),
        }));
        return;
      }

      setStep2Errors((prev) => ({
        ...prev,
        detection: buildConflictMessage(error) ?? formatApiError(error),
      }));
      if (getErrorStatus(error) === 409) setIsConflict(true);
    }
  };

  const applyLocationDetection = (
    position: GeolocationPosition,
    detection: LocationDetectionResponse,
  ) => {
    setLocationWarnings(detection.warnings ?? []);
    setStep2Data((prev) => ({
      ...prev,
      latitude: detection.latitude ?? position.coords.latitude,
      longitude: detection.longitude ?? position.coords.longitude,
      geofenceRadius: detection.suggestedRadiusMeters ?? prev.geofenceRadius,
      detectedAccuracy: detection.accuracyMeters ?? position.coords.accuracy,
      browserTimestampMs: position.timestamp,
      locationDetected: true,
    }));
  };

  const handleDetectNetwork = async () => {
    setFormError('');
    setStep3Errors((prev) => ({ ...prev, detection: undefined }));

    try {
      const resolvedSiteId = await getOrCreateSiteId();
      const detection = await detectNetworkMutation.mutateAsync({ siteId: resolvedSiteId });
      applyNetworkDetection(detection);
    } catch (error) {
      setStep3Errors((prev) => ({
        ...prev,
        detection: buildConflictMessage(error) ?? formatApiError(error),
      }));
      if (getErrorStatus(error) === 409) setIsConflict(true);
    }
  };

  const applyNetworkDetection = (detection: NetworkDetectionResponse) => {
    setNetworkWarnings(detection.warnings ?? []);
    setStep3Data((prev) => ({
      ...prev,
      detectedIp: detection.detectedIp ?? prev.detectedIp,
      networkName: detection.suggestedNetworkName ?? prev.networkName,
      cidrBlock: detection.suggestedCidr ?? prev.cidrBlock,
      networkType: detection.networkType ?? prev.networkType,
      ipVersion: detection.ipVersion ?? prev.ipVersion,
      confidence: detection.confidence ?? prev.confidence,
      torExitNode: Boolean(detection.torExitNode),
      vpnDetected: Boolean(detection.vpnDetected),
      cgnatDetected: Boolean(detection.cgnatDetected),
    }));
  };

  const handleNext = async () => {
    setFormError('');

    try {
      if (currentStep === 1) {
        if (!validateStep1()) {
          return;
        }
        await saveStep1();
        setCurrentStep(2);
        return;
      }

      if (currentStep === 2) {
        if (!validateStep2()) {
          return;
        }
        await saveStep1();
        await saveStep2();
        setCurrentStep(3);
        return;
      }

      if (currentStep === 3) {
        if (!validateStep3()) {
          return;
        }
        await saveStep3();
        setCurrentStep(4);
      }
    } catch (error) {
      const conflict = buildConflictMessage(error);
      if (conflict) {
        setIsConflict(true);
        setFormError(conflict);
      } else {
        setFormError(formatApiError(error));
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && !isBusy) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!siteId) {
      setFormError('Site draft is missing. Please retry the setup flow.');
      return;
    }

    setFormError('');

    try {
      if (isEdit) {
        onCompleted?.();
        onClose();
        return;
      }

      setIsActivating(true);
      const activation = await activateSiteMutation.mutateAsync({ siteId });
      setActivationPreview(activation);

      if (!activation.readyToActivate || activation.blockingIssues.length > 0) {
        setFormError('The site still has blocking issues. Review the readiness panel and try again.');
        return;
      }

      onCompleted?.();
      onClose();
    } catch (error) {
      const conflict = buildConflictMessage(error);
      if (conflict) {
        setIsConflict(true);
        setFormError(conflict);
      } else {
        setFormError(formatApiError(error));
      }
    } finally {
      setIsActivating(false);
    }
  };

  const steps = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Location' },
    { id: 3, label: 'Network' },
    { id: 4, label: isEdit ? 'Review' : 'Activate' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Location' : 'Add New Location'}
      subtitle={
        isEdit
          ? 'Adjust location, network, and readiness settings with backend validation.'
          : 'Create a draft site, verify location and network, then activate it when ready.'
      }
      width="max-w-[794px]"
    >
      <div className="flex flex-col space-y-6">
        <Stepper steps={steps} currentStep={currentStep} className="mb-2" />

        <div className="min-h-0 flex-1">
          <div aria-live="polite" className="space-y-6">
            {formError && (
              <div className={`rounded-[12px] border px-4 py-3 text-[13px] font-medium transition-all duration-300 ${
                isConflict ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isConflict ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <Save size={14} />
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <X size={14} />
                      </div>
                    )}
                    <span>{formError}</span>
                  </div>
                  {isConflict && (
                    <button
                      onClick={() => void handleConflictSync()}
                      disabled={isSyncing}
                      className="ml-4 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-white transition-all hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                    >
                      {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Sync & Overwrite
                    </button>
                  )}
                </div>
                {isConflict && (
                  <p className="mt-2 text-[11px] opacity-80">
                    Warning: Syncing will overwrite your current unsaved changes with the latest data from the server.
                  </p>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="animate-in slide-in-from-right-2 space-y-6 duration-300 fade-in">
                <Select
                  id="siteType"
                  label="Site Type"
                  required
                  value={step1Data.siteType}
                  onChange={(e) =>
                    setStep1Data((prev) => ({ ...prev, siteType: e.target.value as SiteType }))
                  }
                  error={step1Errors.siteType}
                  options={[
                    { value: '', label: 'Select site type' },
                    { value: 'OFFICE', label: 'Office' },
                    { value: 'HQ', label: 'HQ' },
                    { value: 'BRANCH', label: 'Branch' },
                    { value: 'WAREHOUSE', label: 'Warehouse' },
                    { value: 'STORE', label: 'Store' },
                    { value: 'CLIENT_SITE', label: 'Client Site' },
                    { value: 'FIELD_ZONE', label: 'Field Zone' },
                  ]}
                />

                <div className="grid grid-cols-2 gap-x-10 items-start">
                  <Input
                    id="siteName"
                    label="Site Name"
                    required
                    placeholder="e.g Tirana HQ"
                    value={step1Data.siteName}
                    onChange={(e) => setStep1Data((prev) => ({ ...prev, siteName: e.target.value }))}
                    error={step1Errors.siteName}
                    autoComplete="off"
                  />
                  <Input
                    id="siteCode"
                    label="Site Code"
                    required
                    placeholder="e.g HQ-TIR"
                    value={step1Data.siteCode}
                    onChange={(e) => setStep1Data((prev) => ({ ...prev, siteCode: e.target.value }))}
                    error={step1Errors.siteCode}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-10 items-start">
                  <Select
                    id="country"
                    label="Country"
                    required
                    value={step1Data.country}
                    onChange={(e) => setStep1Data((prev) => ({ ...prev, country: e.target.value }))}
                    error={step1Errors.country}
                    options={[{ value: '', label: 'Select country' }, ...COUNTRIES]}
                  />
                  <Select
                    id="timezone"
                    label="Timezone"
                    required
                    value={step1Data.timezone}
                    onChange={(e) => setStep1Data((prev) => ({ ...prev, timezone: e.target.value }))}
                    error={step1Errors.timezone}
                    options={[{ value: '', label: 'Select timezone' }, ...TIMEZONES]}
                  />
                </div>

                <Textarea
                  id="notes"
                  label="Notes"
                  placeholder="Additional information about this location..."
                  value={step1Data.notes}
                  onChange={(e) => setStep1Data((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            )}

            {currentStep === 2 && (
              <AddLocationStepLocation
                data={step2Data}
                errors={step2Errors}
                warnings={locationWarnings}
                isDetecting={detectLocationMutation.isPending}
                countryCode={step1Data.country}
                onChange={(updates) => setStep2Data((prev) => ({ ...prev, ...updates }))}
                onDetect={handleDetectLocation}
              />
            )}

            {currentStep === 3 && (
              <AddLocationStepNetwork
                data={step3Data}
                errors={step3Errors}
                warnings={networkWarnings}
                isDetecting={detectNetworkMutation.isPending}
                onChange={(updates) => setStep3Data((prev) => ({ ...prev, ...updates }))}
                onDetect={handleDetectNetwork}
              />
            )}

            {currentStep === 4 && (
              <AddLocationStepActivate
                step1={step1Data}
                step2={step2Data}
                step3={step3Data}
                mode={mode}
                warnings={mergedWarnings}
                blockingIssues={activationPreview?.blockingIssues ?? []}
                readyToActivate={activationPreview?.readyToActivate ?? isEdit}
                isCheckingReadiness={activateSiteMutation.isPending && !isActivating}
              />
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100/50">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || isBusy}
            className={`px-10 py-2.5 text-[14px] font-bold text-gray-500 bg-gray-100/60 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition-all disabled:opacity-50 ${
              currentStep === 1 ? 'invisible pointer-events-none' : ''
            }`}
          >
            Back
          </button>
          
          {currentStep < 4 ? (
            <Button
              onClick={() => void handleNext()}
              isLoading={isBusy}
              className="h-11 rounded-xl px-12 font-bold min-w-[140px]"
              icon={<ChevronRight size={18} />}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => void handleFinalSubmit()}
              isLoading={isBusy}
              disabled={!isEdit && Boolean(activationPreview && activationPreview.blockingIssues.length > 0)}
              className="h-11 rounded-xl px-12 font-bold min-w-[160px]"
              icon={isEdit ? <Save size={18} /> : <Check size={18} strokeWidth={3} />}
            >
              {isEdit ? 'Finish Update' : 'Activate'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
