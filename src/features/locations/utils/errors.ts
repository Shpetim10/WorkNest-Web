import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/common/types/api';
import {
  LocationFormErrors,
  LocationStep2Errors,
  LocationStep3Errors,
} from '../types';

export type NestedFieldErrors = Record<string, unknown>;

export interface LocationFormServerErrors {
  formError?: string;
  formDetails: string[];
  nestedErrors: NestedFieldErrors;
  step1Errors: LocationFormErrors;
  step2Errors: LocationStep2Errors;
  step3Errors: LocationStep3Errors;
}

type FieldErrorEntry = {
  field: string;
  message: string;
};

function getApiError(error: unknown): ApiErrorResponse | undefined {
  return (error as AxiosError<ApiErrorResponse>)?.response?.data;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return (
    (error as AxiosError<ApiErrorResponse>)?.response?.status ??
    ((error as { status?: number })?.status ?? undefined)
  );
}

export function getApiErrorCode(error: unknown): string | undefined {
  const apiError = getApiError(error);
  return apiError?.errorCode ?? apiError?.code;
}

function getValidationEntries(apiError: ApiErrorResponse): FieldErrorEntry[] {
  if (apiError.fieldErrors?.length) {
    return apiError.fieldErrors.map(({ field, message }) => ({ field, message }));
  }

  return Object.entries(apiError.errors ?? {}).map(([field, message]) => ({ field, message }));
}

function parseFieldPath(path: string) {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

function stringifyFieldPath(path: Array<string | number>) {
  return path.reduce((result, segment) => {
    if (typeof segment === 'number') {
      return `${result}[${segment}]`;
    }

    return result ? `${result}.${segment}` : segment;
  }, '');
}

function setNestedValue(target: NestedFieldErrors, path: Array<string | number>, value: string) {
  let current: unknown = target;

  path.forEach((segment, index) => {
    const isLast = index === path.length - 1;
    const nextSegment = path[index + 1];

    if (typeof segment === 'number') {
      if (!Array.isArray(current)) {
        return;
      }

      if (isLast) {
        current[segment] = value;
        return;
      }

      if (current[segment] == null) {
        current[segment] = typeof nextSegment === 'number' ? [] : {};
      }

      current = current[segment];
      return;
    }

    const record = current as Record<string, unknown>;
    if (isLast) {
      record[segment] = value;
      return;
    }

    if (record[segment] == null) {
      record[segment] = typeof nextSegment === 'number' ? [] : {};
    }

    current = record[segment];
  });
}

function normalizeBackendFieldPath(field: string) {
  if (field === 'code') return 'basicInfo.siteCode';
  if (field === 'name') return 'basicInfo.siteName';
  if (field === 'type') return 'basicInfo.siteType';
  if (field === 'countryCode') return 'basicInfo.country';
  if (field === 'timezone') return 'basicInfo.timezone';

  if (field === 'attendancePolicy') return 'attendanceRules';
  if (field.startsWith('attendancePolicy.')) {
    return field.replace(/^attendancePolicy\./, 'attendanceRules.');
  }

  if (field.startsWith('location.')) {
    return field
      .replace(/^location\.geofenceRadiusMeters$/, 'location.geofenceRadius')
      .replace(/^location\.entryBufferMeters$/, 'location.advancedSettings.entryBuffer')
      .replace(/^location\.exitBufferMeters$/, 'location.advancedSettings.exitBuffer')
      .replace(/^location\.maxLocationAccuracyMeters$/, 'location.advancedSettings.maxAccuracy');
  }

  if (field === 'addressLine1' || field === 'addressLine2' || field === 'city' || field === 'stateRegion' || field === 'postalCode' || field === 'latitude' || field === 'longitude' || field === 'geofenceShapeType' || field === 'geofenceRadiusMeters' || field === 'geofencePolygonGeoJson' || field === 'entryBufferMeters' || field === 'exitBufferMeters' || field === 'maxLocationAccuracyMeters') {
    return normalizeBackendFieldPath(`location.${field}`);
  }

  if (field.startsWith('trustedNetworks[')) {
    return field.replace(/\.expiresAt$/, '.expiryDate');
  }

  if (field === 'trustedNetworks') {
    return field;
  }

  return field;
}

function toVisibleField(
  path: string,
  mapped: LocationFormServerErrors,
  message: string,
) {
  switch (path) {
    case 'basicInfo.siteType':
      mapped.step1Errors.siteType ??= message;
      return true;
    case 'basicInfo.siteName':
      mapped.step1Errors.siteName ??= message;
      return true;
    case 'basicInfo.siteCode':
      mapped.step1Errors.siteCode ??= message;
      return true;
    case 'basicInfo.country':
      mapped.step1Errors.country ??= message;
      return true;
    case 'basicInfo.timezone':
      mapped.step1Errors.timezone ??= message;
      return true;
    case 'attendanceRules.requireQr':
      mapped.step1Errors.requireQr ??= message;
      return true;
    case 'attendanceRules.requireLocation':
      mapped.step1Errors.requireLocation ??= message;
      return true;
    case 'attendanceRules.checkInEnabled':
      mapped.step1Errors.checkInEnabled ??= message;
      return true;
    case 'attendanceRules.checkOutEnabled':
      mapped.step1Errors.checkOutEnabled ??= message;
      return true;
    case 'attendanceRules.useNetworkAsWarning':
      mapped.step1Errors.useNetworkAsWarning ??= message;
      return true;
    case 'attendanceRules.rejectOutsideGeofence':
      mapped.step1Errors.rejectOutsideGeofence ??= message;
      return true;
    case 'attendanceRules.rejectPoorAccuracy':
      mapped.step1Errors.rejectPoorAccuracy ??= message;
      return true;
    case 'attendanceRules.allowManualCorrection':
      mapped.step1Errors.allowManualCorrection ??= message;
      return true;
    case 'attendanceRules.allowManagerManualEntry':
      mapped.step1Errors.allowManagerManualEntry ??= message;
      return true;
    case 'location.addressLine1':
      mapped.step2Errors.addressLine1 ??= message;
      return true;
    case 'location.addressLine2':
      mapped.step2Errors.addressLine2 ??= message;
      return true;
    case 'location.city':
      mapped.step2Errors.city ??= message;
      return true;
    case 'location.stateRegion':
      mapped.step2Errors.stateRegion ??= message;
      return true;
    case 'location.postalCode':
      mapped.step2Errors.postalCode ??= message;
      return true;
    case 'location.latitude':
      mapped.step2Errors.latitude ??= message;
      mapped.step2Errors.coordinates ??= message;
      return true;
    case 'location.longitude':
      mapped.step2Errors.longitude ??= message;
      mapped.step2Errors.coordinates ??= message;
      return true;
    case 'location.geofenceShapeType':
      mapped.step2Errors.geofenceShapeType ??= message;
      return true;
    case 'location.geofenceRadius':
      mapped.step2Errors.geofenceRadius ??= message;
      return true;
    case 'location.geofencePolygonGeoJson':
      mapped.step2Errors.geofencePolygonGeoJson ??= message;
      return true;
    case 'location.advancedSettings.entryBuffer':
      mapped.step2Errors.entryBuffer ??= message;
      return true;
    case 'location.advancedSettings.exitBuffer':
      mapped.step2Errors.exitBuffer ??= message;
      return true;
    case 'location.advancedSettings.maxAccuracy':
      mapped.step2Errors.maxAccuracy ??= message;
      return true;
    case 'trustedNetworks[0].name':
      mapped.step3Errors.networkName ??= message;
      return true;
    case 'trustedNetworks[0].networkType':
      mapped.step3Errors.networkType ??= message;
      return true;
    case 'trustedNetworks[0].cidrBlock':
      mapped.step3Errors.cidrBlock ??= message;
      return true;
    case 'trustedNetworks[0].ipVersion':
      mapped.step3Errors.ipVersion ??= message;
      return true;
    case 'trustedNetworks[0].expiryDate':
      mapped.step3Errors.expiryDate ??= message;
      return true;
    default:
      return false;
  }
}

function pushFormDetail(details: string[], message: string) {
  if (!message || details.includes(message)) {
    return;
  }

  details.push(message);
}

export function buildNestedFieldErrorTree(entries: FieldErrorEntry[]) {
  const nestedErrors: NestedFieldErrors = {};

  entries.forEach(({ field, message }) => {
    const normalizedPath = normalizeBackendFieldPath(field);
    const parsedPath = parseFieldPath(normalizedPath);
    if (parsedPath.length === 0) {
      return;
    }

    const first = parsedPath[0];
    if (typeof first === 'number') {
      return;
    }

    if (!(first in nestedErrors)) {
      nestedErrors[first] = typeof parsedPath[1] === 'number' ? [] : {};
    }

    setNestedValue(nestedErrors, parsedPath, message);
  });

  return nestedErrors;
}

export function formatApiError(error: unknown) {
  const apiError = getApiError(error);

  if (apiError?.message) {
    return apiError.message;
  }

  if (apiError?.fieldErrors?.length) {
    return apiError.fieldErrors[0]?.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong.';
}

export function formatAttendanceFriendlyError(
  error: unknown,
  fallback = 'Something went wrong.',
) {
  const code = getApiErrorCode(error);
  const status = getApiErrorStatus(error);

  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (status === 403 || code === 'ACCESS_DENIED') {
    return 'You do not have permission to manage attendance settings for this site.';
  }
  if (code === 'MANUAL_ENTRY_DISABLED') {
    return 'Manual check-in and check-out are disabled by this site attendance policy.';
  }
  if (code === 'MANUAL_CORRECTION_DISABLED') {
    return 'Manual day-record adjustments are disabled by this site attendance policy.';
  }

  if (code === 'SITE_NOT_FOUND') {
    return 'This site could not be found.';
  }

  if (code === 'TERMINAL_NOT_FOUND') {
    return 'This QR terminal could not be found.';
  }

  if (code === 'TERMINAL_DISABLED') {
    return 'This QR terminal is not active.';
  }

  if (status === 500) {
    return fallback;
  }

  if (code === 'VALIDATION_ERROR') {
    return getApiError(error)?.message ?? 'Some fields are missing or invalid.';
  }

  return formatApiError(error) || fallback;
}

export function buildConflictMessage(error: unknown) {
  const apiError = getApiError(error);
  const status = getApiErrorStatus(error);

  if (status !== 409) {
    return null;
  }

  const errorCode = apiError?.errorCode ?? apiError?.code ?? '';
  const message = apiError?.message ?? '';
  const isVersionConflict =
    /VERSION|OPTIMISTIC/i.test(errorCode) ||
    /another tab|refresh/i.test(message);

  if (!isVersionConflict && errorCode !== 'STALE_SITE_DATA_CONFLICT') {
    return null;
  }

  return 'Data is stale, please refresh.';
}

export function mapServerErrorsToLocationForm(error: unknown): LocationFormServerErrors {
  const apiError = getApiError(error);
  const validationEntries = apiError ? getValidationEntries(apiError) : [];

  const mapped: LocationFormServerErrors = {
    formError: apiError?.message ?? buildConflictMessage(error) ?? formatApiError(error),
    formDetails: [],
    nestedErrors: buildNestedFieldErrorTree(validationEntries),
    step1Errors: {},
    step2Errors: {},
    step3Errors: {},
  };

  validationEntries.forEach(({ field, message }) => {
    const normalizedPath = normalizeBackendFieldPath(field);
    const handled = toVisibleField(normalizedPath, mapped, message);

    if (!handled) {
      pushFormDetail(mapped.formDetails, message);
    }
  });

  if (
    apiError?.errorCode === 'DUPLICATE_SITE_CODE' ||
    apiError?.code === 'DUPLICATE_SITE_CODE' ||
    /duplicate/i.test(apiError?.message ?? '') ||
    /already exists/i.test(apiError?.message ?? '')
  ) {
    mapped.step1Errors.siteCode ??= validationEntries.find(({ field }) => normalizeBackendFieldPath(field) === 'basicInfo.siteCode')?.message
      ?? apiError?.message
      ?? 'Duplicate site code';
  }

  const trustedNetworkValidation = validationEntries.find(({ field }) =>
    normalizeBackendFieldPath(field).startsWith('trustedNetworks['),
  );

  if (trustedNetworkValidation || /network/i.test(apiError?.message ?? '')) {
    mapped.step3Errors.detection ??= trustedNetworkValidation?.message ?? apiError?.message;
  }

  return mapped;
}

export function stringifyNestedFieldPath(path: string) {
  return stringifyFieldPath(parseFieldPath(path));
}
