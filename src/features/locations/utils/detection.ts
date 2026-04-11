import {
  Issue,
  LocationAssessmentResult,
  LocationDetectionRequest,
  LocationDetectionResponse,
  ReverseGeocodeResult,
} from '../types';

export type BrowserGeolocationResult = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  browserTimestampMs: number;
};

type ReverseGeocodeAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
};

export function getBrowserGeolocation(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
): Promise<BrowserGeolocationResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('Geolocation is not supported in this browser.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          browserTimestampMs: position.timestamp,
        }),
      reject,
      options,
    );
  });
}

export function buildLocalLocationAssessment(
  location: BrowserGeolocationResult,
  maxAccuracy: number,
  now = Date.now(),
): LocationAssessmentResult {
  const coordinateAgeMs = Math.max(0, now - location.browserTimestampMs);
  const stale = coordinateAgeMs > 30000;
  const lowAccuracy = location.accuracyMeters > maxAccuracy;
  const warnings: Issue[] = [];

  if (stale) {
    warnings.push({
      code: 'LOCATION_STALE',
      message: 'The detected coordinates may be stale. Retry for a fresher fix.',
      field: 'location',
    });
  }

  if (lowAccuracy) {
    warnings.push({
      code: 'LOCATION_LOW_ACCURACY',
      message: 'The detected coordinates have low accuracy. You can keep editing manually or retry.',
      field: 'location',
    });
  }

  return {
    usable: true,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracyMeters: location.accuracyMeters,
    coordinateAgeMs,
    stale,
    lowAccuracy,
    suggestedRadiusMeters: Math.max(50, Math.round(location.accuracyMeters * 2 + 30)),
    warnings,
  };
}

export function toLocationDetectionRequest(location: BrowserGeolocationResult): LocationDetectionRequest {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracyMeters: location.accuracyMeters,
    browserTimestampMs: location.browserTimestampMs,
  };
}

function buildAddressLine1(address?: ReverseGeocodeAddress) {
  return [address?.house_number, address?.road].filter(Boolean).join(' ').trim() || address?.neighbourhood || address?.suburb || '';
}

function buildAddressLine2(address?: ReverseGeocodeAddress) {
  if (address?.neighbourhood && address?.suburb && address.neighbourhood !== address.suburb) {
    return `${address.neighbourhood}, ${address.suburb}`;
  }

  return address?.neighbourhood || address?.suburb || '';
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`,
    {
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Unable to resolve address details for this location.');
  }

  const payload = (await response.json()) as { address?: ReverseGeocodeAddress };

  return {
    addressLine1: buildAddressLine1(payload.address),
    addressLine2: buildAddressLine2(payload.address),
    city:
      payload.address?.city ??
      payload.address?.town ??
      payload.address?.village ??
      payload.address?.municipality ??
      '',
    stateRegion: payload.address?.state ?? payload.address?.county ?? '',
    postalCode: payload.address?.postcode ?? '',
    countryCode: payload.address?.country_code?.toUpperCase(),
  };
}

export function normalizeLocationDetectionResponse(
  fallback: BrowserGeolocationResult,
  response: LocationAssessmentResult | LocationDetectionResponse,
): LocationAssessmentResult {
  return {
    usable: response.usable ?? true,
    latitude: response.latitude ?? fallback.latitude,
    longitude: response.longitude ?? fallback.longitude,
    accuracyMeters: response.accuracyMeters ?? fallback.accuracyMeters,
    coordinateAgeMs: response.coordinateAgeMs ?? Math.max(0, Date.now() - fallback.browserTimestampMs),
    stale: Boolean(response.stale),
    lowAccuracy: Boolean(response.lowAccuracy),
    suggestedRadiusMeters: response.suggestedRadiusMeters ?? Math.max(50, Math.round(fallback.accuracyMeters * 2 + 30)),
    warnings: response.warnings ?? [],
  };
}
