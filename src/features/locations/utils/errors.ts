import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/common/types/api';
import {
  LocationFormErrors,
  LocationStep2Errors,
  LocationStep3Errors,
} from '../types';

export interface LocationFormServerErrors {
  formError?: string;
  step1Errors: LocationFormErrors;
  step2Errors: LocationStep2Errors;
  step3Errors: LocationStep3Errors;
}

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
  return getApiError(error)?.errorCode;
}

export function formatApiError(error: unknown) {
  const apiError = getApiError(error);
  if (apiError?.message) {
    return apiError.message;
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
    return 'Some fields are missing or invalid.';
  }

  return formatApiError(error) || fallback;
}

export function buildConflictMessage(error: unknown) {
  const apiError = getApiError(error);
  const status =
    (error as AxiosError<ApiErrorResponse>)?.response?.status ??
    ((error as { status?: number })?.status ?? undefined);

  if (status !== 409) {
    return null;
  }

  const errorCode = apiError?.errorCode ?? '';
  const message = apiError?.message ?? '';
  const isVersionConflict =
    /VERSION|OPTIMISTIC/i.test(errorCode) ||
    /another tab|refresh/i.test(message);

  if (!isVersionConflict && errorCode !== 'STALE_SITE_DATA_CONFLICT') {
    return null;
  }

  return 'Data is stale, please refresh.';
}

function mapFieldError(
  field: string,
  message: string,
  mapped: LocationFormServerErrors,
) {
  if (field === 'code') mapped.step1Errors.siteCode = message;
  else if (field === 'name') mapped.step1Errors.siteName = message;
  else if (field === 'type') mapped.step1Errors.siteType = message;
  else if (field === 'countryCode') mapped.step1Errors.country = message;
  else if (field === 'timezone') mapped.step1Errors.timezone = message;
  else if (field === 'addressLine1') mapped.step2Errors.addressLine1 = message;
  else if (field === 'city') mapped.step2Errors.city = message;
  else if (field === 'stateRegion') mapped.step2Errors.stateRegion = message;
  else if (field === 'postalCode') mapped.step2Errors.postalCode = message;
  else if (field === 'latitude' || field === 'longitude') mapped.step2Errors.coordinates = message;
  else if (field === 'geofenceRadiusMeters') mapped.step2Errors.geofenceRadius = message;
  else if (field === 'geofencePolygonGeoJson') mapped.step2Errors.geofencePolygonGeoJson = message;
  else if (field.includes('trustedNetworks') && field.includes('name')) mapped.step3Errors.networkName = message;
  else if (field.includes('trustedNetworks') && field.includes('cidrBlock')) mapped.step3Errors.cidrBlock = message;
  else if (field.includes('trustedNetworks') && field.includes('expiresAt')) mapped.step3Errors.expiryDate = message;
}

export function mapServerErrorsToLocationForm(error: unknown): LocationFormServerErrors {
  const mapped: LocationFormServerErrors = {
    formError: buildConflictMessage(error) ?? formatApiError(error),
    step1Errors: {},
    step2Errors: {},
    step3Errors: {},
  };

  const apiError = getApiError(error);
  const fieldErrors = apiError?.errors ?? {};

  Object.entries(fieldErrors).forEach(([field, message]) => {
    mapFieldError(field, message, mapped);
  });

  if (
    apiError?.errorCode === 'DUPLICATE_SITE_CODE' ||
    /duplicate/i.test(apiError?.message ?? '') ||
    /already exists/i.test(apiError?.message ?? '')
  ) {
    mapped.step1Errors.siteCode ??= apiError?.message ?? 'Duplicate site code';
  }

  if (fieldErrors['trustedNetworks'] || /network/i.test(apiError?.message ?? '')) {
    mapped.step3Errors.detection ??= fieldErrors['trustedNetworks'] ?? apiError?.message;
  }

  return mapped;
}
