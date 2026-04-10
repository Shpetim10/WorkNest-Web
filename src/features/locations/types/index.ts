export type SiteStatus = 'DRAFT' | 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
export type SiteType = 'OFFICE' | 'HQ' | 'BRANCH' | 'WAREHOUSE' | 'STORE' | 'CLIENT_SITE' | 'FIELD_ZONE';
export type GeofenceShapeType = 'CIRCLE' | 'POLYGON';
export type NetworkType = 'PUBLIC_IP' | 'CIDR_RANGE' | 'VPN' | 'AUTO_DETECTED';
export type DetectionConfidence = 'AUTO_HIGH' | 'AUTO_LOW' | 'MANUAL';
export type IpVersion = 'IPv4' | 'IPv6';

export interface Issue {
  code: string;
  message: string;
  field?: string;
}

export interface TrustedNetwork {
  id: string;
  siteId?: string;
  name?: string;
  cidr?: string;
  networkType?: NetworkType | string;
  ipVersion?: IpVersion;
  detectedIp?: string;
  confidence?: DetectionConfidence | string;
  priority?: number;
  expiresAt?: string | null;
  notes?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanySiteResponse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: SiteType;
  status: SiteStatus;
  version: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  countryCode: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  geofenceShapeType?: GeofenceShapeType;
  geofenceRadiusMeters?: number;
  geofencePolygonGeoJson?: string;
  entryBufferMeters?: number;
  exitBufferMeters?: number;
  maxLocationAccuracyMeters?: number;
  locationRequired: boolean;
  qrEnabled: boolean;
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteSetupStatus {
  siteId: string;
  status: SiteStatus;
  version: number;
  basicInfoComplete: boolean;
  locationComplete: boolean;
  networkComplete: boolean;
  readyToActivate: boolean;
  blockingIssues: Issue[];
  warnings: Issue[];
  site: CompanySiteResponse;
  trustedNetworks: TrustedNetwork[];
}

export interface LocationDetectionRequest {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  browserTimestampMs: number;
}

export interface LocationDetectionResponse {
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  suggestedRadiusMeters?: number;
  stale?: boolean;
  lowAccuracy?: boolean;
  warnings?: Issue[];
}

export interface NetworkDetectionResponse {
  detectedIp?: string;
  suggestedCidr?: string;
  suggestedNetworkName?: string;
  networkType?: NetworkType | string;
  ipVersion?: IpVersion;
  confidence?: DetectionConfidence | string;
  torExitNode?: boolean;
  vpnDetected?: boolean;
  cgnatDetected?: boolean;
  warnings?: Issue[];
}

export interface ActivateSiteResponse {
  readyToActivate: boolean;
  status?: SiteStatus;
  blockingIssues: Issue[];
  warnings?: Issue[];
  site?: CompanySiteResponse;
}

export interface CreateSiteDraftRequest {
  code: string;
  name: string;
  type: SiteType;
  countryCode: string;
  timezone: string;
}

export interface SaveBasicInfoRequest {
  version: number;
  code: string;
  name: string;
  type: SiteType;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  countryCode: string;
  timezone: string;
  notes?: string;
}

export interface SaveLocationRequest {
  version: number;
  latitude: number;
  longitude: number;
  geofenceShapeType: GeofenceShapeType;
  geofenceRadiusMeters: number;
  entryBufferMeters: number;
  exitBufferMeters: number;
  maxLocationAccuracyMeters: number;
  locationRequired: boolean;
}

export interface SaveTrustedNetworkRequest {
  version: number;
  name: string;
  cidr: string;
  networkType: NetworkType | string;
  ipVersion: IpVersion;
  detectedIp?: string;
  confidence?: DetectionConfidence | string;
  expiresAt?: string | null;
  notes?: string;
  priority?: number;
}

export interface LocationListItem {
  id: string;
  siteName: string;
  siteCode: string;
  siteType: SiteType;
  country: string;
  countryCode: string;
  status: SiteStatus;
  createdAt: string;
  version: number;
  timezone: string;
  readyToActivate: boolean;
  blockingIssues: Issue[];
  warnings: Issue[];
}

export interface AdvancedSettings {
  entryBuffer: number;
  exitBuffer: number;
  maxAccuracy: number;
}

export interface LocationFormData {
  siteType: SiteType | '';
  siteName: string;
  siteCode: string;
  country: string;
  timezone: string;
  notes: string;
}

export interface LocationFormErrors {
  siteType?: string;
  siteName?: string;
  siteCode?: string;
  country?: string;
  timezone?: string;
  form?: string;
}

export interface LocationStep2Data {
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  geofenceRadius: number;
  detectedAccuracy: number | null;
  browserTimestampMs: number | null;
  locationDetected: boolean;
  advancedSettings: AdvancedSettings;
}

export interface LocationStep2Errors {
  addressLine1?: string;
  city?: string;
  coordinates?: string;
  detection?: string;
}

export interface LocationStep3Data {
  trustedNetworkId: string | null;
  detectedIp: string;
  networkName: string;
  cidrBlock: string;
  networkType: NetworkType | string;
  ipVersion: IpVersion;
  confidence: DetectionConfidence | string;
  torExitNode: boolean;
  vpnDetected: boolean;
  cgnatDetected: boolean;
  setExpiry: boolean;
  expiryDate: string;
  networkNotes: string;
  priorityOverride: string;
}

export interface LocationStep3Errors {
  networkName?: string;
  cidrBlock?: string;
  detection?: string;
}

export interface Location extends LocationListItem {
  companyId: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  geofenceShapeType: GeofenceShapeType;
  geofenceRadius: number;
  advancedLocationSettings: AdvancedSettings;
  notes: string;
  locationRequired: boolean;
  trustedNetworks: TrustedNetwork[];
  detectedIp: string;
  networkName: string;
  cidrBlock: string;
  networkType: NetworkType | string;
  ipVersion: IpVersion;
  confidence: DetectionConfidence | string;
  torExitNode: boolean;
  vpnDetected: boolean;
  cgnatDetected: boolean;
  setExpiry: boolean;
  expiryDate: string;
  networkNotes: string;
  priorityOverride: string;
}
