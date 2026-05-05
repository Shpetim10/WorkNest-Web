"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from '@/common/ui';
import { Check, ChevronRight, X } from 'lucide-react';
import { useCreateSite, useDetectLocation, useDetectNetwork, useUpdateSite, useUpdateMainDetails, useUpdateLocation, useUpdateTrustedNetwork } from '../api';
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
} from '../types';
import { COUNTRY_CENTROIDS, DEFAULT_MAP_VIEW } from '../constants/country-centroids';
import { AddLocationStepActivate } from './AddLocationStepActivate';
import { AddLocationStepDetails } from './AddLocationStepDetails';
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
  mapForMainDetailsUpdate,
  mapForLocationUpdate,
  mapForNetworkUpdate,
  mapLocationToForm,
} from '../utils/mappers';
import { getCompanySiteFormErrors, validateStep1, validateStep2, validateStep3 } from '../utils/validation';

export type LocationFormMode = 'add' | 'edit';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: LocationFormMode;
  companyId?: string | null;
  initialLocation?: Location | null;
  initialStep?: number;
  onCompleted?: () => void;
  isStandalone?: boolean;
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

const VISIBLE_FIELD_PATHS = [
  'basicInfo.siteType',
  'basicInfo.siteName',
  'basicInfo.siteCode',
  'basicInfo.country',
  'basicInfo.timezone',
  'attendanceRules.requireQr',
  'attendanceRules.requireLocation',
  'attendanceRules.checkInEnabled',
  'attendanceRules.checkOutEnabled',
  'attendanceRules.useNetworkAsWarning',
  'attendanceRules.rejectOutsideGeofence',
  'attendanceRules.rejectPoorAccuracy',
  'attendanceRules.allowManualCorrection',
  'attendanceRules.allowManagerManualEntry',
  'location.addressLine1',
  'location.addressLine2',
  'location.city',
  'location.stateRegion',
  'location.postalCode',
  'location.latitude',
  'location.longitude',
  'location.geofenceShapeType',
  'location.geofenceRadius',
  'location.geofencePolygonGeoJson',
  'location.advancedSettings.entryBuffer',
  'location.advancedSettings.exitBuffer',
  'location.advancedSettings.maxAccuracy',
  'trustedNetworks[0].name',
  'trustedNetworks[0].networkType',
  'trustedNetworks[0].cidrBlock',
  'trustedNetworks[0].ipVersion',
  'trustedNetworks[0].expiryDate',
] as const;

type TouchedFieldState = Partial<Record<(typeof VISIBLE_FIELD_PATHS)[number], true>>;

function buildTouchedFieldState(paths: readonly string[]) {
  return Object.fromEntries(paths.map((path) => [path, true])) as TouchedFieldState;
}

function pruneEmpty<T extends object>(errors: T) {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as T;
}

function buildTouchedStep1Errors(flatErrors: Record<string, string>, touched: Partial<Record<string, true>>) {
  return pruneEmpty<LocationFormErrors>({
    siteType: touched['basicInfo.siteType'] ? flatErrors['basicInfo.siteType'] : undefined,
    siteName: touched['basicInfo.siteName'] ? flatErrors['basicInfo.siteName'] : undefined,
    siteCode: touched['basicInfo.siteCode'] ? flatErrors['basicInfo.siteCode'] : undefined,
    country: touched['basicInfo.country'] ? flatErrors['basicInfo.country'] : undefined,
    timezone: touched['basicInfo.timezone'] ? flatErrors['basicInfo.timezone'] : undefined,
    requireQr: touched['attendanceRules.requireQr'] ? flatErrors['attendanceRules.requireQr'] : undefined,
    requireLocation: touched['attendanceRules.requireLocation'] ? flatErrors['attendanceRules.requireLocation'] : undefined,
    checkInEnabled: touched['attendanceRules.checkInEnabled'] ? flatErrors['attendanceRules.checkInEnabled'] : undefined,
    checkOutEnabled: touched['attendanceRules.checkOutEnabled'] ? flatErrors['attendanceRules.checkOutEnabled'] : undefined,
    useNetworkAsWarning: touched['attendanceRules.useNetworkAsWarning'] ? flatErrors['attendanceRules.useNetworkAsWarning'] : undefined,
    rejectOutsideGeofence: touched['attendanceRules.rejectOutsideGeofence'] ? flatErrors['attendanceRules.rejectOutsideGeofence'] : undefined,
    rejectPoorAccuracy: touched['attendanceRules.rejectPoorAccuracy'] ? flatErrors['attendanceRules.rejectPoorAccuracy'] : undefined,
    allowManualCorrection: touched['attendanceRules.allowManualCorrection'] ? flatErrors['attendanceRules.allowManualCorrection'] : undefined,
    allowManagerManualEntry: touched['attendanceRules.allowManagerManualEntry'] ? flatErrors['attendanceRules.allowManagerManualEntry'] : undefined,
  });
}

function buildTouchedStep2Errors(flatErrors: Record<string, string>, touched: Partial<Record<string, true>>) {
  const errors = pruneEmpty<LocationStep2Errors>({
    addressLine1: touched['location.addressLine1'] ? flatErrors['location.addressLine1'] : undefined,
    addressLine2: touched['location.addressLine2'] ? flatErrors['location.addressLine2'] : undefined,
    city: touched['location.city'] ? flatErrors['location.city'] : undefined,
    stateRegion: touched['location.stateRegion'] ? flatErrors['location.stateRegion'] : undefined,
    postalCode: touched['location.postalCode'] ? flatErrors['location.postalCode'] : undefined,
    latitude: touched['location.latitude'] ? flatErrors['location.latitude'] : undefined,
    longitude: touched['location.longitude'] ? flatErrors['location.longitude'] : undefined,
    geofenceShapeType: touched['location.geofenceShapeType'] ? flatErrors['location.geofenceShapeType'] : undefined,
    geofenceRadius: touched['location.geofenceRadius'] ? flatErrors['location.geofenceRadius'] : undefined,
    geofencePolygonGeoJson: touched['location.geofencePolygonGeoJson'] ? flatErrors['location.geofencePolygonGeoJson'] : undefined,
    entryBuffer: touched['location.advancedSettings.entryBuffer'] ? flatErrors['location.advancedSettings.entryBuffer'] : undefined,
    exitBuffer: touched['location.advancedSettings.exitBuffer'] ? flatErrors['location.advancedSettings.exitBuffer'] : undefined,
    maxAccuracy: touched['location.advancedSettings.maxAccuracy'] ? flatErrors['location.advancedSettings.maxAccuracy'] : undefined,
  });

  if (errors.latitude || errors.longitude) {
    errors.coordinates = errors.latitude ?? errors.longitude;
  }

  return errors;
}

function buildTouchedStep3Errors(flatErrors: Record<string, string>, touched: Partial<Record<string, true>>) {
  return pruneEmpty<LocationStep3Errors>({
    networkName: touched['trustedNetworks[0].name'] ? flatErrors['trustedNetworks[0].name'] : undefined,
    networkType: touched['trustedNetworks[0].networkType'] ? flatErrors['trustedNetworks[0].networkType'] : undefined,
    cidrBlock: touched['trustedNetworks[0].cidrBlock'] ? flatErrors['trustedNetworks[0].cidrBlock'] : undefined,
    ipVersion: touched['trustedNetworks[0].ipVersion'] ? flatErrors['trustedNetworks[0].ipVersion'] : undefined,
    expiryDate: touched['trustedNetworks[0].expiryDate'] ? flatErrors['trustedNetworks[0].expiryDate'] : undefined,
  });
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

export function LocationFormModal(props: LocationFormModalProps) {
  const {
    isOpen,
    onClose,
    mode,
    companyId,
    initialLocation,
    initialStep = 1,
    onCompleted,
    isStandalone = false,
  } = props;
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
  const [formDetails, setFormDetails] = useState<string[]>([]);
  const [touchedFields, setTouchedFields] = useState<TouchedFieldState>({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const createSiteMutation = useCreateSite();
  const updateSiteMutation = useUpdateSite();
  const detectLocationMutation = useDetectLocation();
  const detectNetworkMutation = useDetectNetwork();
  
  const updateMainDetailsMutation = useUpdateMainDetails();
  const updateLocationMutation = useUpdateLocation();
  const updateNetworkMutation = useUpdateTrustedNetwork();

  const siteIdRef = useRef<string | null>(initialLocation?.id ?? null);
  const versionRef = useRef<number | null>(initialLocation?.version ?? null);
  const reverseGeocodeControllerRef = useRef<AbortController | null>(null);
  const detectNetworkControllerRef = useRef<AbortController | null>(null);
  const submitControllerRef = useRef<AbortController | null>(null);
  const detectLocationControllerRef = useRef<AbortController | null>(null);
  const locationSyncRequestRef = useRef(0);
  
  // Sync internal step with prop when modal opens or step changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep);
    }
  }, [isOpen, initialStep]);

  const isSubmitting = createSiteMutation.isPending || updateSiteMutation.isPending || updateMainDetailsMutation.isPending || updateLocationMutation.isPending || updateNetworkMutation.isPending;
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
      setFormDetails([]);
      setTouchedFields({});

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

  const syncTouchedErrors = (
    nextValues: CompanySiteFormValues,
    nextTouched: Partial<Record<string, true>> = touchedFields,
  ) => {
    const flatErrors = getCompanySiteFormErrors(nextValues);
    setStep1Errors(buildTouchedStep1Errors(flatErrors, nextTouched));
    setStep2Errors((previous) => ({
      ...buildTouchedStep2Errors(flatErrors, nextTouched),
      detection: previous.detection,
    }));
    setStep3Errors((previous) => ({
      ...buildTouchedStep3Errors(flatErrors, nextTouched),
      detection: previous.detection,
    }));
    setFormDetails([]);
  };

  const markFieldTouched = (path: string) => {
    setTouchedFields((previous) => {
      const nextTouched = { ...previous, [path]: true };
      syncTouchedErrors(formValues, nextTouched);
      return nextTouched;
    });
  };

  const revealAllValidationErrors = () => {
    const nextTouched = buildTouchedFieldState(VISIBLE_FIELD_PATHS);
    setTouchedFields(nextTouched);
    syncTouchedErrors(formValues, nextTouched);
  };

  const applyServerErrors = (error: unknown) => {
    const mapped = mapServerErrorsToLocationForm(error);
    setFormError(mapped.formError ?? formatApiError(error));
    setFormDetails(mapped.formDetails);
    setTouchedFields(buildTouchedFieldState(VISIBLE_FIELD_PATHS));
    setStep1Errors(mapped.step1Errors);
    setStep2Errors(mapped.step2Errors);
    setStep3Errors(mapped.step3Errors);
  };

  const updateStep1Data = (updates: Partial<LocationFormData>) => {
    setFormError('');
    setFormDetails([]);
    setStep1Data((previous) => {
      const next = { ...previous, ...updates };
      syncTouchedErrors(
        buildCompanySiteFormValues(next, step2Data, attendanceSettings, [step3Data]),
      );
      return next;
    });
  };

  const updateAttendanceSettings = (updates: Partial<CompanySiteFormValues['attendanceRules']>) => {
    setFormError('');
    setFormDetails([]);
    setAttendanceSettings((previous) => {
      const next = {
        ...previous,
        ...updates,
      };

      syncTouchedErrors(
        buildCompanySiteFormValues(step1Data, step2Data, next, [step3Data]),
      );
      return next;
    });
  };

  const updateStep2Data = (updates: Partial<LocationStep2Data>) => {
    setFormError('');
    setFormDetails([]);
    setStep2Data((previous) => {
      const next = { ...previous, ...updates };
      syncTouchedErrors(
        buildCompanySiteFormValues(step1Data, next, attendanceSettings, [step3Data]),
      );
      return next;
    });
  };

  const updateStep3Data = (updates: Partial<LocationStep3Data>) => {
    setFormError('');
    setFormDetails([]);
    setStep3Data((previous) => {
      const next = { ...previous, ...updates };
      syncTouchedErrors(
        buildCompanySiteFormValues(step1Data, step2Data, attendanceSettings, [next]),
      );
      return next;
    });
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

      setStep2Data((prev) => {
        const next = {
          ...prev,
          latitude,
          longitude,
          locationDetected: true,
          addressLine1: address.addressLine1 ?? prev.addressLine1,
          addressLine2: address.addressLine2 ?? prev.addressLine2,
          city: address.city ?? prev.city,
          stateRegion: address.stateRegion ?? prev.stateRegion,
          postalCode: address.postalCode ?? prev.postalCode,
        };
        syncTouchedErrors(
          buildCompanySiteFormValues(step1Data, next, attendanceSettings, [step3Data]),
        );
        return next;
      });

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
    setFormDetails([]);
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
              companyId: initialLocation?.companyId || companyId || '',
              siteId: siteIdRef.current,
              data: toLocationDetectionRequest(browserLocation),
              signal: controller.signal,
            }),
          )
        : buildLocalLocationAssessment(browserLocation, step2Data.advancedSettings.maxAccuracy);

      setLocationWarnings(assessment.warnings);
      setStep2Data((prev) => {
        const next = applyDetectedLocationToStep(prev, assessment);
        syncTouchedErrors(
          buildCompanySiteFormValues(step1Data, next, attendanceSettings, [step3Data]),
        );
        return next;
      });
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
    updateStep2Data({
      latitude,
      longitude,
      locationDetected: true,
      browserTimestampMs: Date.now(),
    });
    await syncAddressFromCoordinates(latitude, longitude);
  };

  const handleDetectNetwork = async () => {
    setFormError('');
    setFormDetails([]);
    setStep3Errors((prev) => ({ ...prev, detection: undefined }));
    detectNetworkControllerRef.current?.abort();
    const controller = new AbortController();
    detectNetworkControllerRef.current = controller;

    try {
      const detection = await detectNetworkMutation.mutateAsync({ signal: controller.signal });
      setNetworkWarnings([...(detection.warnings ?? []), ...(detection.blockingIssues ?? [])]);
      setStep3Data((prev) => {
        const next = mapDetectNetworkResponseToFormValue(detection, prev);
        syncTouchedErrors(
          buildCompanySiteFormValues(step1Data, step2Data, attendanceSettings, [next]),
        );
        return next;
      });
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
    const clearedNetwork = clearTrustedNetworkFormValue();
    setFormDetails([]);
    setStep3Errors({});
    setStep3Data(clearedNetwork);
    syncTouchedErrors(
      buildCompanySiteFormValues(
        step1Data,
        step2Data,
        attendanceSettings,
        [clearedNetwork],
      ),
    );
    setNetworkWarnings([]);
  };

  const handleNext = () => {
    setFormError('');
    setFormDetails([]);

    if (currentStep === 1) {
      const errors = validateStep1(formValues);
      setStep1Errors(errors);
      if (Object.keys(errors).length === 0) {
        setCurrentStep(2);
      } else {
        revealAllValidationErrors();
      }
      return;
    }

    if (currentStep === 2) {
      const errors = validateStep2(formValues);
      setStep2Errors(errors);
      if (Object.keys(errors).length === 0) {
        setCurrentStep(3);
      } else {
        revealAllValidationErrors();
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
      } else {
        revealAllValidationErrors();
      }
    }
  };

  const handleFinalSubmit = async () => {
    setFormError('');
    setFormDetails([]);
    clearStepErrors();
    revealAllValidationErrors();
    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    if (isStandalone) {
      const resolvedSiteId = siteIdRef.current;
      const resolvedCompanyId = initialLocation?.companyId || companyId;

      if (!resolvedSiteId || !resolvedCompanyId) {
        setFormError('Site or company context is missing. Please close the modal and try again.');
        return;
      }

      try {
        if (currentStep === 1) {
          const step1Validation = validateStep1(formValues);
          if (Object.keys(step1Validation).length > 0) {
            setStep1Errors(step1Validation);
            return;
          }
          const payload = mapForMainDetailsUpdate(formValues, versionRef.current);
          const updatedSite = await updateMainDetailsMutation.mutateAsync({
            companyId: resolvedCompanyId,
            siteId: resolvedSiteId,
            data: payload,
            signal: controller.signal,
          });
          versionRef.current = updatedSite.version;
        } else if (currentStep === 2) {
          const step2Validation = validateStep2(formValues);
          if (Object.keys(step2Validation).length > 0) {
            setStep2Errors(step2Validation);
            return;
          }
          const payload = mapForLocationUpdate(formValues, versionRef.current);
          const updatedSite = await updateLocationMutation.mutateAsync({
            companyId: resolvedCompanyId,
            siteId: resolvedSiteId,
            data: payload,
            signal: controller.signal,
          });
          versionRef.current = updatedSite.version;
        } else if (currentStep === 3) {
          const step3Validation = validateStep3(formValues);
          if (step3Data.torExitNode && hasTrustedNetworkInput(step3Data)) {
            step3Validation.detection = 'Tor exit nodes cannot be saved as trusted networks.';
          }
          if (Object.keys(step3Validation).length > 0) {
            setStep3Errors(step3Validation);
            return;
          }
          if (!step3Data.id) {
             setFormError('Cannot update network without an ID. Please retry.');
             return;
          }
          const payload = mapForNetworkUpdate(step3Data);
          const updatedNetwork = await updateNetworkMutation.mutateAsync({
            companyId: resolvedCompanyId,
            siteId: resolvedSiteId,
            networkId: step3Data.id,
            data: payload,
            signal: controller.signal,
          });
          setStep3Data(prev => ({ ...prev, version: updatedNetwork.version ?? prev.version }));
        }
        
        onCompleted?.();
        onClose();
        return;
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
          return;
        }
        applyServerErrors(error);
        return;
      }
    } else {
      const step1Validation = validateStep1(formValues);
      const step2Validation = validateStep2(formValues);
      const step3Validation = validateStep3(formValues);
      if (step3Data.torExitNode && hasTrustedNetworkInput(step3Data)) {
        step3Validation.detection = 'Tor exit nodes cannot be saved as trusted networks.';
      }

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      width="max-w-[660px]"
      containerClassName="p-0"
      showDefaultStyles={false}
    >
      <div className="flex flex-col max-h-[80vh] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)]">
        <div className={`border-b border-[#E5E7EB] px-6 pt-5 pb-4`}>
          <div className={`${isStandalone ? '' : 'mb-4'} flex items-center justify-between`}>
            <h2 className="text-[24px] font-bold leading-[32px] text-[#101828] font-inter">
              {isStandalone
                ? currentStep === 1
                  ? 'Edit Details'
                  : currentStep === 2
                    ? 'Edit Location'
                    : currentStep === 3
                      ? 'Edit Network'
                      : 'Review'
                : isEdit
                  ? 'Edit Location'
                  : 'Add New Location'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-[#6A7282] transition-colors hover:text-[#101828] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={18} />
            </button>
          </div>
          {!isStandalone && (
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
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {formError && (
            <div className="mb-4 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
              <p>{formError}</p>
              {formDetails.length > 0 && (
                <div className="mt-2 space-y-1 text-[12px] font-normal text-rose-700">
                  {formDetails.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <AddLocationStepDetails
              data={step1Data}
              errors={step1Errors}
                attendanceSettings={attendanceSettings}
                onChange={updateStep1Data}
                onAttendanceChange={updateAttendanceSettings}
                onBlurField={markFieldTouched}
              />
          )}

          {currentStep === 2 && (
            <AddLocationStepLocation
              data={step2Data}
              errors={step2Errors}
              warnings={locationWarnings}
              requireLocation={attendanceSettings.requireLocation}
              countryCenter={countryCenter}
              isDetecting={isDetectingLocation}
              isHydratingAddress={isReverseGeocoding}
              onChange={updateStep2Data}
              onBlurField={markFieldTouched}
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
              onChange={updateStep3Data}
              onBlurField={markFieldTouched}
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

        <div className={`flex items-center justify-between border-t border-[#E5E7EB] bg-[#FDFDFD] px-6 py-4`}>
          {isStandalone ? (
            <>
              <button
                onClick={handleClose}
                className="flex items-center gap-1.5 text-[16px] font-medium leading-[24px] text-[#364153] transition-colors hover:text-[#101828] font-inter"
              >
                <ChevronRight className="rotate-180" size={16} />
                Back
              </button>
              <Button
                onClick={() => void handleFinalSubmit()}
                isLoading={isSubmitting}
                className="flex h-[44px] items-center rounded-[14px] bg-[#155DFC] bg-none px-8 text-[14px] font-medium leading-[24px] text-white transition-all hover:bg-[#124dc8] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 font-inter"
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <button
                disabled={currentStep === 1 || isSubmitting}
                onClick={handleBack}
                className={`flex items-center gap-1.5 text-[16px] font-medium leading-[24px] transition-all font-inter ${
                  currentStep === 1
                    ? 'cursor-not-allowed text-[#6A7282]/40'
                    : 'text-[#364153] hover:text-[#101828] disabled:cursor-not-allowed disabled:opacity-60'
                }`}
              >
                <ChevronRight className="rotate-180" size={16} />
                Back
              </button>
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  isLoading={false}
                  className="flex h-[40px] items-center rounded-[14px] bg-[#155DFC] bg-none px-6 text-[14px] font-medium leading-[24px] text-white transition-all hover:bg-[#124dc8] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 font-inter"
                >
                  Next
                </Button>
              ) : isEdit ? (
                <Button
                  onClick={() => void handleFinalSubmit()}
                  isLoading={isSubmitting}
                  className="flex h-[40px] items-center rounded-[14px] bg-[#155DFC] bg-none px-6 text-[14px] font-medium leading-[24px] text-white transition-all hover:bg-[#124dc8] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 font-inter"
                >
                  Save Location
                </Button>
              ) : (
                <Button
                  onClick={() => void handleFinalSubmit()}
                  isLoading={isSubmitting}
                  className="flex h-[40px] items-center rounded-[14px] bg-[#155DFC] bg-none px-6 text-[14px] font-medium leading-[24px] text-white transition-all hover:bg-[#124dc8] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 font-inter"
                >
                  Create Site
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
