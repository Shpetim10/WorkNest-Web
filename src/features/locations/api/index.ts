import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import { ApiResponse, ApiErrorResponse } from '@/common/types/api';
import {
  ActivateSiteResponse,
  CompanySiteResponse,
  CreateSiteDraftRequest,
  Issue,
  Location,
  LocationDetectionRequest,
  LocationDetectionResponse,
  LocationListItem,
  NetworkDetectionResponse,
  SaveBasicInfoRequest,
  SaveLocationRequest,
  SaveTrustedNetworkRequest,
  SiteSetupStatus,
  TrustedNetwork,
} from '../types';

const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (companyId: string) => [...locationKeys.lists(), companyId] as const,
  setupStatuses: () => [...locationKeys.all, 'setup-status'] as const,
  setupStatus: (siteId: string) => [...locationKeys.setupStatuses(), siteId] as const,
};

const EMPTY_ISSUES: Issue[] = [];
export const SITES_LIST_UNAVAILABLE_MESSAGE =
  'The company sites endpoint is returning a server error right now. You can still create and configure locations, but the existing list cannot be loaded until the backend issue is fixed.';

function unwrapApiResponse<T>(payload: T | ApiResponse<T>): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiResponse<T>)) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

async function getPayload<T>(path: string): Promise<T> {
  const response = await apiClient.get<T | ApiResponse<T>>(path);
  return unwrapApiResponse(response.data);
}

async function postPayload<TResponse, TRequest>(path: string, body?: TRequest): Promise<TResponse> {
  const response = await apiClient.post<TResponse | ApiResponse<TResponse>>(path, body);
  return unwrapApiResponse(response.data);
}

async function putPayload<TResponse, TRequest>(path: string, body: TRequest): Promise<TResponse> {
  const response = await apiClient.put<TResponse | ApiResponse<TResponse>>(path, body);
  return unwrapApiResponse(response.data);
}

function normalizeNetwork(siteStatus: SiteSetupStatus): TrustedNetwork | undefined {
  return siteStatus.trustedNetworks[0];
}

function formatCountry(countryCode: string): string {
  return COUNTRY_NAMES.of(countryCode) ?? countryCode;
}

function mapSiteToListItem(status: SiteSetupStatus): LocationListItem {
  return {
    id: status.site.id,
    siteName: status.site.name,
    siteCode: status.site.code,
    siteType: status.site.type,
    country: formatCountry(status.site.countryCode),
    countryCode: status.site.countryCode,
    status: status.status,
    createdAt: status.site.createdAt ?? '',
    version: status.version,
    timezone: status.site.timezone,
    readyToActivate: status.readyToActivate,
    blockingIssues: status.blockingIssues ?? EMPTY_ISSUES,
    warnings: status.warnings ?? EMPTY_ISSUES,
  };
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
    ...mapSiteToListItem(status),
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
    advancedLocationSettings: {
      entryBuffer: status.site.entryBufferMeters ?? 30,
      exitBuffer: status.site.exitBufferMeters ?? 30,
      maxAccuracy: status.site.maxLocationAccuracyMeters ?? 50,
    },
    notes: status.site.notes ?? '',
    locationRequired: status.site.locationRequired,
    trustedNetworks: status.trustedNetworks ?? [],
    detectedIp: network?.detectedIp ?? '',
    networkName: network?.name ?? '',
    cidrBlock: network?.cidr ?? '',
    networkType: network?.networkType ?? 'AUTO_DETECTED',
    ipVersion: network?.ipVersion ?? 'IPv4',
    confidence: network?.confidence ?? 'MANUAL',
    torExitNode: false,
    vpnDetected: false,
    cgnatDetected: false,
    setExpiry: Boolean(network?.expiresAt),
    expiryDate: network?.expiresAt ? network.expiresAt.slice(0, 10) : '',
    networkNotes: network?.notes ?? '',
    priorityOverride: network?.priority ? String(network.priority) : '1',
  };
}

async function fetchCompanySites(companyId: string): Promise<CompanySiteResponse[]> {
  const response = await apiClient.get<CompanySiteResponse[] | ApiResponse<CompanySiteResponse[]>>(
    `/companies/${companyId}/sites`,
    {
      validateStatus: (status) => (status >= 200 && status < 300) || status >= 500,
    },
  );

  if (response.status >= 500) {
    return [];
  }

  return unwrapApiResponse(response.data);
}

export const useLocations = (companyId: string | null) => {
  return useQuery<LocationListItem[]>({
    queryKey: companyId ? locationKeys.list(companyId) : [...locationKeys.lists(), 'anonymous'],
    queryFn: async () => {
      if (!companyId) {
        return [];
      }
      const sites = await fetchCompanySites(companyId);
      return sites.map(mapCompanySiteToListItem);
    },
    enabled: Boolean(companyId),
    retry: false,
  });
};

export const useLocationSetupStatus = (siteId: string | null) => {
  return useQuery<SiteSetupStatus>({
    queryKey: siteId ? locationKeys.setupStatus(siteId) : [...locationKeys.setupStatuses(), 'empty'],
    queryFn: async () => {
      if (!siteId) {
        throw new Error('Site ID is required');
      }
      return getPayload<SiteSetupStatus>(`/sites/${siteId}/setup-status`);
    },
    enabled: Boolean(siteId),
  });
};

export const useCreateSiteDraft = () => {
  const queryClient = useQueryClient();

  return useMutation<CompanySiteResponse, ApiErrorResponse, { companyId: string; data: CreateSiteDraftRequest }>({
    mutationFn: async ({ companyId, data }) =>
      postPayload<CompanySiteResponse, CreateSiteDraftRequest>(`/companies/${companyId}/sites`, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(companyId) });
    },
  });
};

export const useSaveBasicInfo = () => {
  const queryClient = useQueryClient();

  return useMutation<CompanySiteResponse, ApiErrorResponse, { siteId: string; data: SaveBasicInfoRequest }>({
    mutationFn: async ({ siteId, data }) =>
      putPayload<CompanySiteResponse, SaveBasicInfoRequest>(`/sites/${siteId}/basic-info`, data),
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.setupStatus(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
};

export const useDetectLocation = () => {
  return useMutation<LocationDetectionResponse, ApiErrorResponse, { siteId: string; data: LocationDetectionRequest }>({
    mutationFn: async ({ siteId, data }) =>
      postPayload<LocationDetectionResponse, LocationDetectionRequest>(`/sites/${siteId}/detect-location`, data),
  });
};

export const useSaveLocation = () => {
  const queryClient = useQueryClient();

  return useMutation<CompanySiteResponse, ApiErrorResponse, { siteId: string; data: SaveLocationRequest }>({
    mutationFn: async ({ siteId, data }) =>
      putPayload<CompanySiteResponse, SaveLocationRequest>(`/sites/${siteId}/location`, data),
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.setupStatus(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
};

export const useDetectNetwork = () => {
  return useMutation<NetworkDetectionResponse, ApiErrorResponse, { siteId: string }>({
    mutationFn: async ({ siteId }) => postPayload<NetworkDetectionResponse, undefined>(`/sites/${siteId}/detect-network`),
  });
};

export const useSaveTrustedNetwork = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TrustedNetwork,
    ApiErrorResponse,
    { siteId: string; networkId: string; data: SaveTrustedNetworkRequest }
  >({
    mutationFn: async ({ siteId, networkId, data }) =>
      putPayload<TrustedNetwork, SaveTrustedNetworkRequest>(
        `/sites/${siteId}/trusted-networks/${networkId}`,
        data,
      ),
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.setupStatus(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
};

export const useActivateSite = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ActivateSiteResponse,
    ApiErrorResponse,
    { siteId: string; dryRun?: boolean }
  >({
    mutationFn: async ({ siteId, dryRun = false }) =>
      postPayload<ActivateSiteResponse, undefined>(
        `/sites/${siteId}/activate${dryRun ? '?dryRun=true' : ''}`,
      ),
    onSuccess: (_, { siteId }) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.setupStatus(siteId) });
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
};
