import {
  CompanySiteFormValues,
  CompanySiteRequest,
  CompanySiteResponse,
  DetectNetworkResponse,
  GeofenceShapeType,
  Location,
  LocationAssessmentResult,
  LocationFormData,
  LocationStep2Data,
  NetworkType,
  TrustedNetworkDraftRequest,
  TrustedNetworkFormValue,
} from '../types';

export const DEFAULT_ATTENDANCE_SETTINGS = {
  locationRequired: true,
  qrEnabled: true,
  checkInEnabled: true,
  checkOutEnabled: true,
};

export const DEFAULT_LOCATION_STEP: LocationStep2Data = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  latitude: null,
  longitude: null,
  geofenceShapeType: 'CIRCLE',
  geofenceRadius: 100,
  geofencePolygonGeoJson: '',
  detectedAccuracy: null,
  browserTimestampMs: null,
  locationDetected: false,
  advancedSettings: {
    entryBuffer: 30,
    exitBuffer: 30,
    maxAccuracy: 50,
  },
};

export const EMPTY_TRUSTED_NETWORK: TrustedNetworkFormValue = {
  id: null,
  name: '',
  networkType: 'OFFICE_NETWORK',
  cidrBlock: '',
  ipVersion: 'IPV4',
  detectedIp: '',
  confidence: 'MANUAL',
  torExitNode: false,
  vpnDetected: false,
  cgnatDetected: false,
  setExpiry: false,
  expiryDate: '',
  notes: '',
  priorityOrder: '',
  version: null,
};

function trimToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  return trimmed ? `${trimmed}T23:59:59.000Z` : null;
}

export function hasTrustedNetworkInput(network: TrustedNetworkFormValue) {
  return Boolean(
    network.name.trim() ||
      network.cidrBlock.trim() ||
      network.detectedIp.trim() ||
      network.notes.trim() ||
      network.expiryDate.trim() ||
      network.id,
  );
}

export function clearTrustedNetworkFormValue(): TrustedNetworkFormValue {
  return { ...EMPTY_TRUSTED_NETWORK };
}

export function mapDetectNetworkResponseToFormValue(
  response: DetectNetworkResponse,
  current: TrustedNetworkFormValue,
): TrustedNetworkFormValue {
  return {
    ...current,
    name: response.name ?? current.name,
    networkType: response.networkType ?? current.networkType,
    cidrBlock: response.cidrBlock ?? response.suggestedCidr ?? current.cidrBlock,
    ipVersion: response.ipVersion ?? current.ipVersion,
    detectedIp: response.detectedIp ?? current.detectedIp,
    confidence: response.confidence ?? current.confidence,
    torExitNode: Boolean(response.torExitNode),
    vpnDetected: Boolean(response.vpnOrDatacenter),
    cgnatDetected: Boolean(response.cgnat),
    notes: response.notes ?? current.notes,
    priorityOrder:
      response.priorityOrder != null ? String(response.priorityOrder) : current.priorityOrder,
  };
}

export function applyDetectedLocationToStep(
  current: LocationStep2Data,
  assessment: LocationAssessmentResult,
) {
  return {
    ...current,
    latitude: assessment.latitude,
    longitude: assessment.longitude,
    detectedAccuracy: assessment.accuracyMeters,
    browserTimestampMs: Date.now(),
    locationDetected: true,
    geofenceShapeType: 'CIRCLE' as GeofenceShapeType,
    geofenceRadius: assessment.suggestedRadiusMeters || current.geofenceRadius,
    advancedSettings: {
      ...current.advancedSettings,
      entryBuffer: current.advancedSettings.entryBuffer || 30,
      exitBuffer: current.advancedSettings.exitBuffer || 30,
      maxAccuracy: current.advancedSettings.maxAccuracy || 50,
    },
  } satisfies LocationStep2Data;
}

export function buildCompanySiteFormValues(
  basicInfo: LocationFormData,
  location: LocationStep2Data,
  attendanceRules: CompanySiteFormValues['attendanceRules'],
  trustedNetworks: TrustedNetworkFormValue[],
): CompanySiteFormValues {
  return {
    basicInfo,
    location,
    attendanceRules,
    trustedNetworks,
  };
}

export function mapLocationToForm(location: Location) {
  return {
    basicInfo: {
      siteType: location.siteType,
      siteName: location.siteName,
      siteCode: location.siteCode,
      country: location.countryCode,
      timezone: location.timezone,
      notes: location.notes ?? '',
    },
    location: {
      addressLine1: location.addressLine1 ?? '',
      addressLine2: location.addressLine2 ?? '',
      city: location.city ?? '',
      stateRegion: location.stateRegion ?? '',
      postalCode: location.postalCode ?? '',
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
      geofenceShapeType: location.geofenceShapeType ?? 'CIRCLE',
      geofenceRadius: location.geofenceRadius ?? 100,
      geofencePolygonGeoJson: location.geofencePolygonGeoJson ?? '',
      detectedAccuracy: location.advancedLocationSettings.maxAccuracy,
      browserTimestampMs: null,
      locationDetected: Boolean(location.latitude != null && location.longitude != null),
      advancedSettings: location.advancedLocationSettings,
    },
    attendanceRules: {
      locationRequired: location.locationRequired,
      qrEnabled: location.qrEnabled,
      checkInEnabled: location.checkInEnabled,
      checkOutEnabled: location.checkOutEnabled,
    },
    trustedNetworks: [
      {
        id: location.trustedNetworks[0]?.id ?? null,
        name: location.networkName ?? '',
        networkType: location.networkType ?? 'OFFICE_NETWORK',
        cidrBlock: location.cidrBlock ?? '',
        ipVersion: location.ipVersion ?? 'IPV4',
        detectedIp: location.detectedIp ?? '',
        confidence: location.confidence ?? 'MANUAL',
        torExitNode: location.torExitNode ?? false,
        vpnDetected: location.vpnDetected ?? false,
        cgnatDetected: location.cgnatDetected ?? false,
        setExpiry: location.setExpiry ?? false,
        expiryDate: location.expiryDate ?? '',
        notes: location.networkNotes ?? '',
        priorityOrder: location.priorityOverride ?? '',
        version: location.trustedNetworks[0]?.version ?? null,
      },
    ],
  } satisfies CompanySiteFormValues;
}

export function mapFormToCreateCompanySiteRequest(
  values: CompanySiteFormValues,
  version: number | null,
): CompanySiteRequest {
  const networkPayload = values.trustedNetworks
    .filter(hasTrustedNetworkInput)
    .map<TrustedNetworkDraftRequest>((network) => {
      const priority = network.priorityOrder.trim() 
        ? Math.max(1, Number(network.priorityOrder.trim())) 
        : 1;

      return {
        id: network.id,
        name: network.name.trim(),
        networkType: network.networkType,
        cidrBlock: network.cidrBlock.trim(),
        ipVersion: network.ipVersion || undefined,
        isActive: true,
        priorityOrder: priority,
        expiresAt: network.setExpiry ? normalizeDate(network.expiryDate) : null,
        version: network.id ? network.version ?? 0 : null,
        notes: trimToUndefined(network.notes) ?? null,
      };
    });

  // Determine original capture method based on form state
  const detectionSource: LocationDetectionSource = values.location.locationDetected 
    ? 'BROWSER_GEOLOCATION' 
    : 'MANUAL_ENTRY';

  return {
    code: values.basicInfo.siteCode.trim(),
    name: values.basicInfo.siteName.trim(),
    type: values.basicInfo.siteType,
    countryCode: values.basicInfo.country.trim(),
    timezone: values.basicInfo.timezone.trim(),
    checkInEnabled: values.attendanceRules.checkInEnabled,
    checkOutEnabled: values.attendanceRules.checkOutEnabled,
    qrEnabled: values.attendanceRules.qrEnabled,
    locationRequired: values.attendanceRules.locationRequired,
    location: {
      latitude: values.location.latitude,
      longitude: values.location.longitude,
      addressLine1: trimToUndefined(values.location.addressLine1),
      addressLine2: trimToUndefined(values.location.addressLine2),
      city: trimToUndefined(values.location.city),
      stateRegion: trimToUndefined(values.location.stateRegion),
      postalCode: trimToUndefined(values.location.postalCode),
      geofenceShapeType: values.location.geofenceShapeType,
      geofenceRadiusMeters:
        values.location.geofenceShapeType === 'CIRCLE' ? values.location.geofenceRadius : undefined,
      geofencePolygonGeoJson:
        values.location.geofenceShapeType === 'POLYGON'
          ? trimToUndefined(values.location.geofencePolygonGeoJson)
          : undefined,
      entryBufferMeters: values.location.advancedSettings.entryBuffer,
      exitBufferMeters: values.location.advancedSettings.exitBuffer,
      maxLocationAccuracyMeters: values.location.advancedSettings.maxAccuracy,
      locationDetectionSource: detectionSource,
    },
    trustedNetworks: networkPayload.length > 0 ? networkPayload : undefined,
    version,
    notes: trimToUndefined(values.basicInfo.notes),
  };
}

export function mapForMainDetailsUpdate(values: CompanySiteFormValues, version: number | null) {
  return {
    code: values.basicInfo.siteCode.trim(),
    name: values.basicInfo.siteName.trim(),
    type: values.basicInfo.siteType,
    status: 'ACTIVE', // Status isn't modified here normally but the API requires a value. It could be retrieved from original if needed.
    countryCode: values.basicInfo.country.trim(),
    timezone: values.basicInfo.timezone.trim(),
    notes: trimToUndefined(values.basicInfo.notes),
    qrEnabled: values.attendanceRules.qrEnabled,
    checkInEnabled: values.attendanceRules.checkInEnabled,
    checkOutEnabled: values.attendanceRules.checkOutEnabled,
    version: version ?? 0,
  };
}

export function mapForLocationUpdate(values: CompanySiteFormValues, version: number | null) {
  const detectionSource: LocationDetectionSource = values.location.locationDetected 
    ? 'BROWSER_GEOLOCATION' 
    : 'MANUAL_ENTRY';

  return {
    addressLine1: trimToUndefined(values.location.addressLine1),
    addressLine2: trimToUndefined(values.location.addressLine2),
    city: trimToUndefined(values.location.city),
    stateRegion: trimToUndefined(values.location.stateRegion),
    postalCode: trimToUndefined(values.location.postalCode),
    countryCode: values.basicInfo.country.trim(),
    timezone: values.basicInfo.timezone.trim(),
    latitude: values.location.latitude,
    longitude: values.location.longitude,
    geofenceShapeType: values.location.geofenceShapeType,
    geofenceRadiusMeters:
      values.location.geofenceShapeType === 'CIRCLE' ? values.location.geofenceRadius : undefined,
    geofencePolygonGeoJson:
      values.location.geofenceShapeType === 'POLYGON'
        ? trimToUndefined(values.location.geofencePolygonGeoJson)
        : undefined,
    entryBufferMeters: values.location.advancedSettings.entryBuffer,
    exitBufferMeters: values.location.advancedSettings.exitBuffer,
    maxLocationAccuracyMeters: values.location.advancedSettings.maxAccuracy,
    locationRequired: values.attendanceRules.locationRequired,
    version: version ?? 0,
  };
}

export function mapForNetworkUpdate(network: TrustedNetworkFormValue) {
  return {
    name: network.name.trim(),
    networkType: network.networkType,
    cidrBlock: network.cidrBlock.trim(),
    isActive: true,
    notes: trimToUndefined(network.notes) ?? null,
    expiresAt: network.setExpiry ? normalizeDate(network.expiryDate) : null,
    version: network.version ?? 0,
  };
}

export function mapCreatedSiteToLocation(site: CompanySiteResponse): Partial<Location> {
  return {
    id: site.id,
    companyId: site.companyId,
    siteName: site.name,
    siteCode: site.code,
    siteType: site.type,
    status: site.status,
    country: site.countryCode,
    countryCode: site.countryCode,
    timezone: site.timezone,
    version: site.version,
    addressLine1: site.addressLine1 ?? '',
    addressLine2: site.addressLine2 ?? '',
    city: site.city ?? '',
    stateRegion: site.stateRegion ?? '',
    postalCode: site.postalCode ?? '',
    latitude: site.latitude ?? null,
    longitude: site.longitude ?? null,
    geofenceShapeType: site.geofenceShapeType ?? 'CIRCLE',
    geofenceRadius: site.geofenceRadiusMeters ?? 100,
    geofencePolygonGeoJson: site.geofencePolygonGeoJson ?? '',
    locationRequired: site.locationRequired,
    qrEnabled: site.qrEnabled,
    checkInEnabled: site.checkInEnabled,
    checkOutEnabled: site.checkOutEnabled,
    notes: site.notes ?? '',
    readyToActivate: site.status === 'ACTIVE',
    blockingIssues: [],
    warnings: [],
    trustedNetworks: [],
    advancedLocationSettings: {
      entryBuffer: site.entryBufferMeters ?? 30,
      exitBuffer: site.exitBufferMeters ?? 30,
      maxAccuracy: site.maxLocationAccuracyMeters ?? 50,
    },
    detectedIp: '',
    networkName: '',
    cidrBlock: '',
    networkType: 'OFFICE_NETWORK' as NetworkType,
    ipVersion: 'IPV4',
    confidence: 'MANUAL',
    torExitNode: false,
    vpnDetected: false,
    cgnatDetected: false,
    setExpiry: false,
    expiryDate: '',
    networkNotes: '',
    priorityOverride: '',
    createdAt: site.createdAt ?? '',
  };
}
