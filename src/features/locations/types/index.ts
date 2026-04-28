export type SiteStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'DISABLED' | 'ARCHIVED' | 'DRAFT' | 'INACTIVE';
export type SiteType = string;
export type GeofenceShapeType = 'CIRCLE' | 'POLYGON';
export type NetworkType = string;
export type DetectionConfidence = string;
export type IpVersion = string;
export type LocationDetectionSource = 'BROWSER_GEOLOCATION' | 'MANUAL_ENTRY' | 'MAP_PIN';
export type AttendancePolicySource = 'COMPANY_DEFAULT' | 'SITE_OVERRIDE';
export type QrTerminalStatus = 'ACTIVE' | 'DISABLED' | string;

export interface Issue {
  code: string;
  message: string;
  field?: string;
}

export interface TrustedNetwork {
  id?: string | null;
  siteId?: string;
  name?: string;
  cidrBlock?: string;
  networkType?: NetworkType;
  ipVersion?: IpVersion;
  detectedIp?: string;
  confidence?: DetectionConfidence;
  priorityOrder?: number | null;
  expiresAt?: string | null;
  notes?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  version?: number | null;
}

export interface CompanySiteResponse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: SiteType;
  status: SiteStatus;
  version: number;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  postalCode?: string | null;
  countryCode: string;
  timezone: string;
  latitude?: number | null;
  longitude?: number | null;
  geofenceShapeType?: GeofenceShapeType | null;
  geofenceRadiusMeters?: number | null;
  geofencePolygonGeoJson?: string | null;
  entryBufferMeters?: number | null;
  exitBufferMeters?: number | null;
  maxLocationAccuracyMeters?: number | null;
  locationRequired: boolean;
  qrEnabled: boolean;
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  notes?: string | null;
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

export interface LocationAssessmentResult {
  usable: boolean;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  coordinateAgeMs: number;
  stale: boolean;
  lowAccuracy: boolean;
  suggestedRadiusMeters: number;
  warnings: Issue[];
}

export interface LocationDetectionResponse {
  usable?: boolean;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  coordinateAgeMs?: number;
  stale?: boolean;
  lowAccuracy?: boolean;
  suggestedRadiusMeters?: number;
  warnings?: Issue[];
}

export interface ReverseGeocodeResult {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface DetectNetworkResponse {
  detectedIp?: string;
  name?: string;
  networkType?: NetworkType;
  cidrBlock?: string;
  suggestedCidr?: string;
  ipVersion?: IpVersion;
  priorityOrder?: number | null;
  notes?: string | null;
  confidence?: DetectionConfidence;
  cgnat?: boolean;
  vpnOrDatacenter?: boolean;
  torExitNode?: boolean;
  overlapDetected?: boolean;
  overlappingCidrs?: string[];
  warnings?: Issue[];
  blockingIssues?: Issue[];
}

export type NetworkDetectionResponse = DetectNetworkResponse;

export interface ActivateSiteResponse {
  siteId?: string;
  dryRun?: boolean;
  activated?: boolean;
  readyToActivate: boolean;
  status?: SiteStatus;
  blockingIssues: Issue[];
  warnings?: Issue[];
  site?: CompanySiteResponse;
}

export interface CompanySiteDetails {
  site: CompanySiteResponse;
  countryName: string;
  trustedNetworks: TrustedNetwork[];
  attendancePolicy?: AttendancePolicy | null;
  linkedQrTerminals?: QrTerminalSummary[];
}

export interface AttendancePolicy {
  policyId: string;
  policySource: AttendancePolicySource;
  requireQr: boolean;
  requireLocation: boolean;
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  useNetworkAsWarning: boolean;
  rejectOutsideGeofence: boolean;
  rejectPoorAccuracy: boolean;
  allowManualCorrection: boolean;
  allowManagerManualEntry: boolean;
  missingCheckoutAutoCloseEnabled: boolean;
  autoCheckoutAfterMinutes: number | null;
  lateGraceMinutes: number;
  earlyClockInWindowMinutes: number;
}

export interface AttendancePolicyEnvelope {
  companyId: string;
  siteId?: string;
  policy: AttendancePolicy;
}

export interface AttendancePolicyUpdateRequest {
  requireQr: boolean;
  requireLocation: boolean;
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  useNetworkAsWarning: boolean;
  rejectOutsideGeofence: boolean;
  rejectPoorAccuracy: boolean;
  allowManualCorrection: boolean;
  allowManagerManualEntry: boolean;
  missingCheckoutAutoCloseEnabled: boolean;
  autoCheckoutAfterMinutes: number | null;
  lateGraceMinutes: number;
  earlyClockInWindowMinutes: number;
}

export interface QrTerminalSummary {
  id: string;
  name: string;
  status: QrTerminalStatus;
  rotationSeconds: number;
  autoCreated: boolean;
  lastHeartbeatAt: string | null;
}

export interface CreateQrTerminalRequest {
  name: string;
  rotationSeconds: number;
}

export interface CurrentQrToken {
  terminalId: string;
  siteId: string;
  token: string;
  issuedAt: string;
  expiresAt: string;
  rotationSeconds: number;
}

export interface TrustedNetworkDraftRequest {
  id: string | null;
  name: string;
  networkType: NetworkType;
  cidrBlock: string;
  ipVersion?: IpVersion;
  isActive: boolean;
  priorityOrder?: number | null;
  expiresAt: string | null;
  version: number | null;
  notes: string | null;
}

export interface SiteLocationRequest {
  latitude: number | null;
  longitude: number | null;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  geofenceShapeType: GeofenceShapeType;
  geofenceRadiusMeters?: number;
  geofencePolygonGeoJson?: string;
  entryBufferMeters?: number;
  exitBufferMeters?: number;
  maxLocationAccuracyMeters?: number;
  locationDetectionSource: LocationDetectionSource;
}

export interface CreateCompanySiteRequest {
  code: string;
  name: string;
  type: SiteType;
  countryCode: string;
  timezone: string;
  notes?: string;
  locationRequired?: boolean;
  qrEnabled?: boolean;
  checkInEnabled?: boolean;
  checkOutEnabled?: boolean;
  location: SiteLocationRequest;
  trustedNetworks?: TrustedNetworkDraftRequest[];
  version: number | null;
}

export type CompanySiteRequest = CreateCompanySiteRequest;
export type CreateCompanySiteResponse = CompanySiteResponse;

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

export interface AttendanceSettings {
  locationRequired: boolean;
  qrEnabled: boolean;
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
}

export interface TrustedNetworkFormValue {
  id: string | null;
  name: string;
  networkType: NetworkType;
  cidrBlock: string;
  ipVersion: IpVersion;
  detectedIp: string;
  confidence: DetectionConfidence;
  torExitNode: boolean;
  vpnDetected: boolean;
  cgnatDetected: boolean;
  setExpiry: boolean;
  expiryDate: string;
  notes: string;
  priorityOrder: string;
  version: number | null;
}

export interface CompanySiteFormValues {
  basicInfo: LocationFormData;
  location: LocationStep2Data;
  attendanceRules: AttendanceSettings;
  trustedNetworks: TrustedNetworkFormValue[];
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
  geofenceShapeType: GeofenceShapeType;
  geofenceRadius: number;
  geofencePolygonGeoJson: string;
  detectedAccuracy: number | null;
  browserTimestampMs: number | null;
  locationDetected: boolean;
  advancedSettings: AdvancedSettings;
}

export interface LocationStep2Errors {
  addressLine1?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  coordinates?: string;
  geofenceRadius?: string;
  geofencePolygonGeoJson?: string;
  detection?: string;
}

export type LocationStep3Data = TrustedNetworkFormValue;

export interface LocationStep3Errors {
  networkName?: string;
  cidrBlock?: string;
  expiryDate?: string;
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
  geofencePolygonGeoJson: string;
  advancedLocationSettings: AdvancedSettings;
  notes: string;
  locationRequired: boolean;
  qrEnabled: boolean;
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  trustedNetworks: TrustedNetwork[];
  detectedIp: string;
  networkName: string;
  cidrBlock: string;
  networkType: NetworkType;
  ipVersion: IpVersion;
  confidence: DetectionConfidence;
  torExitNode: boolean;
  vpnDetected: boolean;
  cgnatDetected: boolean;
  setExpiry: boolean;
  expiryDate: string;
  networkNotes: string;
  priorityOverride: string;
}
