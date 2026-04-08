export type SiteType = 'On-site' | 'Remote' | 'Hybrid';
export type SiteStatus = 'ACTIVE' | 'INACTIVE';

export interface LocationListItem {
  id: string;
  siteName: string;
  siteCode: string;
  siteType: SiteType;
  country: string;
  status: SiteStatus;
  createdAt: string;
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
}

export interface AdvancedSettings {
  entryBuffer: number;
  exitBuffer: number;
  maxAccuracy: number;
}

export interface LocationStep2Data {
  addressLine1: string;
  addressLine2: string;
  city: string;
  geofenceRadius: number;
  locationDetected: boolean;
  advancedSettings: AdvancedSettings;
}

export interface LocationStep2Errors {
  addressLine1?: string;
  city?: string;
}

export type IpVersion = 'IPv4' | 'IPv6';

export interface LocationStep3Data {
  detectedIp: string;
  networkName: string;
  cidrBlock: string;
  networkType: string;
  ipVersion: IpVersion;
  setExpiry: boolean;
  expiryDate: string;
  networkNotes: string;
  priorityOverride: string;
}

export interface LocationStep3Errors {
  networkName?: string;
  cidrBlock?: string;
}

export interface Location extends LocationListItem {
  timezone: string;
  notes: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  geofenceRadius: number;
  advancedLocationSettings: AdvancedSettings;
  detectedIp: string;
  networkName: string;
  cidrBlock: string;
  networkType: string;
  ipVersion: IpVersion;
  setExpiry: boolean;
  expiryDate: string;
  networkNotes: string;
  priorityOverride: string;
}
