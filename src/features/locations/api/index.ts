import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/common/network/api-client';
import { ApiErrorResponse, ApiResponse } from '@/common/types/api';
import {
  ActivateSiteResponse,
  CompanySiteRequest,
  CompanySiteResponse,
  CreateCompanySiteResponse,
  DetectNetworkResponse,
  Issue,
  Location,
  LocationDetectionRequest,
  LocationDetectionResponse,
  LocationListItem,
  SiteSetupStatus,
  CompanySiteDetails,
  TrustedNetwork,
} from '../types';

const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });
const EMPTY_ISSUES: Issue[] = [];

export const SITES_LIST_UNAVAILABLE_MESSAGE =
  'The company sites endpoint is returning a server error right now. You can still create and configure locations, but the existing list cannot be loaded until the backend issue is fixed.';

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (companyId: string) => [...locationKeys.lists(), companyId] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (siteId: string) => [...locationKeys.details(), siteId] as const,
  setupStatuses: () => [...locationKeys.all, 'setup-status'] as const,
  setupStatus: (siteId: string) => [...locationKeys.setupStatuses(), siteId] as const,
};

export interface LocationsQueryResult {
  items: LocationListItem[];
  listUnavailable: boolean;
}

export interface ApiRequestOptions {
  signal?: AbortSignal;
}

function unwrapApiResponse<T>(payload: T | ApiResponse<T>): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiResponse<T>)) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

function buildAxiosConfig(options?: ApiRequestOptions): AxiosRequestConfig | undefined {
  if (!options?.signal) {
    return undefined;
  }

  return {
    signal: options.signal,
  };
}

async function getPayload<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const response = await apiClient.get<T | ApiResponse<T>>(path, buildAxiosConfig(options));
  return unwrapApiResponse(response.data);
}

async function postPayload<TResponse, TRequest>(
  path: string,
  body?: TRequest,
  options?: ApiRequestOptions,
): Promise<TResponse> {
  const response = await apiClient.post<TResponse | ApiResponse<TResponse>>(path, body, buildAxiosConfig(options));
  return unwrapApiResponse(response.data);
}

async function putPayload<TResponse, TRequest>(
  path: string,
  body: TRequest,
  options?: ApiRequestOptions,
): Promise<TResponse> {
  const response = await apiClient.put<TResponse | ApiResponse<TResponse>>(path, body, buildAxiosConfig(options));
  return unwrapApiResponse(response.data);
}

function normalizeNetwork(siteStatus: SiteSetupStatus): TrustedNetwork | undefined {
  return siteStatus.trustedNetworks[0];
}

function formatCountry(countryCode: string): string {
  return COUNTRY_NAMES.of(countryCode) ?? countryCode;
}

function mapCompanySiteToListItem(site: CompanySiteResponse): LocationListItem {
  return {
    id: site.id,
    siteName: site.name,
    siteCode: site.code,
    siteType: site.type,
    country: formatCountry(site.countryCode),
    countryCode: site.countryCode,
    status: site.status,
    createdAt: site.createdAt ?? '',
    version: site.version,
    timezone: site.timezone,
    readyToActivate: site.status === 'ACTIVE',
    blockingIssues: EMPTY_ISSUES,
    warnings: EMPTY_ISSUES,
  };
}

export function mapSetupStatusToLocation(status: SiteSetupStatus): Location {
  const network = normalizeNetwork(status);

  return {
    ...mapCompanySiteToListItem(status.site),
    readyToActivate: status.readyToActivate,
    blockingIssues: status.blockingIssues ?? EMPTY_ISSUES,
    warnings: status.warnings ?? EMPTY_ISSUES,
    companyId: status.site.companyId,
    addressLine1: status.site.addressLine1 ?? '',
    addressLine2: status.site.addressLine2 ?? '',
    city: status.site.city ?? '',
    stateRegion: status.site.stateRegion ?? '',
    postalCode: status.site.postalCode ?? '',
    latitude: status.site.latitude ?? null,
    longitude: status.site.longitude ?? null,
    geofenceShapeType: status.site.geofenceShapeType ?? 'CIRCLE',
    geofenceRadius: status.site.geofenceRadiusMeters ?? 100,
    geofencePolygonGeoJson: status.site.geofencePolygonGeoJson ?? '',
    advancedLocationSettings: {
      entryBuffer: status.site.entryBufferMeters ?? 30,
      exitBuffer: status.site.exitBufferMeters ?? 30,
      maxAccuracy: status.site.maxLocationAccuracyMeters ?? 50,
    },
    notes: status.site.notes ?? '',
    locationRequired: status.site.locationRequired,
    qrEnabled: status.site.qrEnabled,
    checkInEnabled: status.site.checkInEnabled,
    checkOutEnabled: status.site.checkOutEnabled,
    trustedNetworks: status.trustedNetworks ?? [],
    detectedIp: network?.detectedIp ?? '',
    networkName: network?.name ?? '',
    cidrBlock: network?.cidrBlock ?? '',
    networkType: network?.networkType ?? 'OFFICE_NETWORK',
    ipVersion: network?.ipVersion ?? 'IPV4',
    confidence: network?.confidence ?? 'MANUAL',
    torExitNode: false,
    vpnDetected: false,
    cgnatDetected: false,
    setExpiry: Boolean(network?.expiresAt),
    expiryDate: network?.expiresAt ? network.expiresAt.slice(0, 10) : '',
    networkNotes: network?.notes ?? '',
    priorityOverride: network?.priorityOrder != null ? String(network.priorityOrder) : '',
  };
}

export function mapDetailsToLocation(details: CompanySiteDetails): Location {
  const network = details.trustedNetworks[0] || null;

  return {
    ...mapCompanySiteToListItem(details.site),
    country: details.countryName, // Use countryName from backend
    readyToActivate: details.site.status === 'ACTIVE',
    blockingIssues: EMPTY_ISSUES,
    warnings: EMPTY_ISSUES,
    companyId: details.site.companyId,
    addressLine1: details.site.addressLine1 ?? '',
    addressLine2: details.site.addressLine2 ?? '',
    city: details.site.city ?? '',
    stateRegion: details.site.stateRegion ?? '',
    postalCode: details.site.postalCode ?? '',
    latitude: details.site.latitude ?? null,
    longitude: details.site.longitude ?? null,
    geofenceShapeType: details.site.geofenceShapeType ?? 'CIRCLE',
    geofenceRadius: details.site.geofenceRadiusMeters ?? 100,
    geofencePolygonGeoJson: details.site.geofencePolygonGeoJson ?? '',
    advancedLocationSettings: {
      entryBuffer: details.site.entryBufferMeters ?? 30,
      exitBuffer: details.site.exitBufferMeters ?? 30,
      maxAccuracy: details.site.maxLocationAccuracyMeters ?? 50,
    },
    notes: details.site.notes ?? '',
    locationRequired: details.site.locationRequired,
    qrEnabled: details.site.qrEnabled,
    checkInEnabled: details.site.checkInEnabled,
    checkOutEnabled: details.site.checkOutEnabled,
    trustedNetworks: details.trustedNetworks ?? [],
    detectedIp: network?.detectedIp ?? '',
    networkName: network?.name ?? '',
    cidrBlock: network?.cidrBlock ?? '',
    networkType: network?.networkType ?? 'OFFICE_NETWORK',
    ipVersion: network?.ipVersion ?? 'IPV4',
    confidence: network?.confidence ?? 'MANUAL',
    torExitNode: false,
    vpnDetected: false,
    cgnatDetected: false,
    setExpiry: Boolean(network?.expiresAt),
    expiryDate: network?.expiresAt ? network.expiresAt.slice(0, 10) : '',
    networkNotes: network?.notes ?? '',
    priorityOverride: network?.priorityOrder != null ? String(network.priorityOrder) : '',
  };
}

async function fetchCompanySites(companyId: string): Promise<{ sites: CompanySiteResponse[]; listUnavailable: boolean }> {
  const response = await apiClient.get<CompanySiteResponse[] | ApiResponse<CompanySiteResponse[]>>(
    `/companies/${companyId}/sites`,
    {
      validateStatus: (status) => (status >= 200 && status < 300) || status >= 500,
    },
  );

  if (response.status >= 500) {
    return { sites: [], listUnavailable: true };
  }

  return { sites: unwrapApiResponse(response.data), listUnavailable: false };
}

export async function fetchLocationSetupStatus(siteId: string, options?: ApiRequestOptions): Promise<SiteSetupStatus> {
  return getPayload<SiteSetupStatus>(`/sites/${siteId}/setup-status`, options);
}

export async function fetchSiteDetails(
  companyId: string,
  siteId: string,
  options?: ApiRequestOptions,
): Promise<CompanySiteDetails> {
  return getPayload<CompanySiteDetails>(`/companies/${companyId}/sites/${siteId}`, options);
}

export async function fetchSite(siteId: string, options?: ApiRequestOptions): Promise<CompanySiteResponse> {
  return getPayload<CompanySiteResponse>(`/sites/${siteId}`, options);
}

export async function createCompanySite(
  companyId: string,
  data: CompanySiteRequest,
  options?: ApiRequestOptions,
): Promise<CreateCompanySiteResponse> {
  return postPayload<CreateCompanySiteResponse, CompanySiteRequest>(`/companies/${companyId}/sites`, data, options);
}

export async function updateCompanySite(
  siteId: string,
  data: CompanySiteRequest,
  options?: ApiRequestOptions,
): Promise<CompanySiteResponse> {
  return putPayload<CompanySiteResponse, CompanySiteRequest>(`/sites/${siteId}`, data, options);
}

export async function deleteCompanySite(
  companyId: string,
  siteId: string,
  options?: ApiRequestOptions,
): Promise<void> {
  const path = `/companies/${companyId}/sites/${siteId}`;
  await apiClient.delete(path, buildAxiosConfig(options));
}

export async function activateCompanySite(
  companyId: string,
  siteId: string,
  options?: ApiRequestOptions,
): Promise<ActivateSiteResponse> {
  return postPayload<ActivateSiteResponse, undefined>(
    `/companies/${companyId}/sites/${siteId}/activate`,
    undefined,
    options,
  );
}

export async function disableCompanySite(
  companyId: string,
  siteId: string,
  options?: ApiRequestOptions,
): Promise<ActivateSiteResponse> {
  return postPayload<ActivateSiteResponse, undefined>(
    `/companies/${companyId}/sites/${siteId}/disable`,
    undefined,
    options,
  );
}

export async function assessExistingSiteLocation(
  siteId: string,
  data: LocationDetectionRequest,
  options?: ApiRequestOptions,
): Promise<LocationDetectionResponse> {
  return postPayload<LocationDetectionResponse, LocationDetectionRequest>(`/sites/${siteId}/detect-location`, data, options);
}

export async function detectSiteNetwork(options?: ApiRequestOptions): Promise<DetectNetworkResponse> {
  return postPayload<DetectNetworkResponse, undefined>('/site-network/detect', undefined, options);
}

export const useLocations = (companyId: string | null) =>
  useQuery<LocationsQueryResult>({
    queryKey: companyId ? locationKeys.list(companyId) : [...locationKeys.lists(), 'anonymous'],
    queryFn: async () => {
      if (!companyId) {
        return { items: [], listUnavailable: false };
      }

      const result = await fetchCompanySites(companyId);
      return {
        items: result.sites.map(mapCompanySiteToListItem),
        listUnavailable: result.listUnavailable,
      };
    },
    enabled: Boolean(companyId),
    retry: false,
  });

export const useLocationSetupStatus = (siteId: string | null) =>
  useQuery<SiteSetupStatus>({
    queryKey: siteId ? locationKeys.setupStatus(siteId) : [...locationKeys.setupStatuses(), 'empty'],
    queryFn: async () => {
      if (!siteId) {
        throw new Error('Site ID is required');
      }

      return fetchLocationSetupStatus(siteId);
    },
    enabled: Boolean(siteId),
    staleTime: 0,
  });

export const useSiteDetails = (companyId: string | null, siteId: string | null) =>
  useQuery<CompanySiteDetails>({
    queryKey: siteId ? locationKeys.detail(siteId) : [...locationKeys.details(), 'empty'],
    queryFn: async () => {
      if (!companyId || !siteId) {
        throw new Error('Company ID and Site ID are required');
      }

      return fetchSiteDetails(companyId, siteId);
    },
    enabled: Boolean(companyId && siteId),
    staleTime: 5 * 60 * 1000, // 5 minutes cache for details
  });

export const useSite = (siteId: string | null) =>
  useQuery<CompanySiteResponse>({
    queryKey: siteId ? locationKeys.detail(siteId) : [...locationKeys.details(), 'empty'],
    queryFn: async () => {
      if (!siteId) {
        throw new Error('Site ID is required');
      }

      return fetchSite(siteId);
    },
    enabled: Boolean(siteId),
  });

export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateCompanySiteResponse,
    ApiErrorResponse,
    { companyId: string; data: CompanySiteRequest; signal?: AbortSignal }
  >({
    mutationFn: async ({ companyId, data, signal }) => createCompanySite(companyId, data, { signal }),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(companyId) });
    },
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CompanySiteResponse,
    ApiErrorResponse,
    { siteId: string; data: CompanySiteRequest; signal?: AbortSignal }
  >({
    mutationFn: async ({ siteId, data, signal }) => updateCompanySite(siteId, data, { signal }),
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.setupStatus(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
};

export const useDetectLocation = () =>
  useMutation<
    LocationDetectionResponse,
    ApiErrorResponse,
    { siteId: string; data: LocationDetectionRequest; signal?: AbortSignal }
  >({
    mutationFn: async ({ siteId, data, signal }) => assessExistingSiteLocation(siteId, data, { signal }),
  });

export const useDetectNetwork = () =>
  useMutation<DetectNetworkResponse, ApiErrorResponse, { signal?: AbortSignal }>({
    mutationFn: async ({ signal }) => detectSiteNetwork({ signal }),
  });

export const useActivateSite = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ActivateSiteResponse,
    ApiErrorResponse,
    { companyId: string; siteId: string; options?: ApiRequestOptions }
  >({
    mutationFn: async ({ companyId, siteId, options }) =>
      activateCompanySite(companyId, siteId, options),
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.setupStatus(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
};

export const useDisableSite = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ActivateSiteResponse,
    ApiErrorResponse,
    { companyId: string; siteId: string; options?: ApiRequestOptions }
  >({
    mutationFn: async ({ companyId, siteId, options }) =>
      disableCompanySite(companyId, siteId, options),
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.setupStatus(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiErrorResponse,
    { companyId: string; siteId: string; options?: ApiRequestOptions }
  >({
    mutationFn: async ({ companyId, siteId, options }) =>
      deleteCompanySite(companyId, siteId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
};
