import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/common/network/api-client';
import type { ApiResponse } from '@/common/types/api';
import { persistUserProfileFromAuthPayload, resolveProfileImageUrl } from '@/common/utils/user-session-profile';
import type { SuperAdminProfile, UpdateSuperAdminProfileRequest } from '../types';

export const SUPER_ADMIN_PROFILE_ENDPOINT = '/super-admin/profile';

export const DEFAULT_SUPER_ADMIN_PROFILE: SuperAdminProfile = {
  displayName: 'Super Administrator',
  email: 'superadmin@worknest.com',
  role: 'Super Admin',
  accountStatus: 'Active',
  imageUrl: '',
};

export const superAdminProfileKeys = {
  all: ['super-admin-profile'] as const,
  detail: () => [...superAdminProfileKeys.all, 'detail'] as const,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapProfileResponse<T>(body: ApiResponse<T> | T): T {
  if (isRecord(body) && 'data' in body) {
    return body.data as T;
  }

  return body as T;
}

function getString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  return fallback;
}

function getOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);

  return undefined;
}

export function normalizeSuperAdminProfile(
  payload: unknown,
  fallback: SuperAdminProfile = DEFAULT_SUPER_ADMIN_PROFILE,
): SuperAdminProfile {
  if (!isRecord(payload)) return fallback;

  return {
    displayName: getString(
      payload.displayName ?? payload.fullName ?? payload.name ?? payload.username,
      fallback.displayName,
    ),
    email: getString(payload.email ?? payload.emailAddress ?? payload.username, fallback.email),
    role: getString(payload.role ?? payload.roleName ?? payload.authority ?? payload.userRole, fallback.role),
    accountStatus: getString(
      payload.accountStatus ?? payload.status ?? payload.state,
      fallback.accountStatus,
    ),
    imageUrl: resolveProfileImageUrl(
      getString(
        payload.imageUrl ??
          payload.photoUrl ??
          payload.avatarUrl ??
          payload.picture ??
          payload.profileImageUrl ??
          payload.profilePhotoUrl ??
          payload.profilePictureUrl ??
          payload.profileImageStoragePath,
        fallback.imageUrl ?? '',
      ),
      getString(
        payload.imageKey ??
          payload.avatarKey ??
          payload.profileImageKey ??
          payload.profilePhotoKey ??
          payload.profilePictureKey ??
          payload.profileImageStorageKey,
      ),
    ),
  };
}

function normalizeUpdatedProfile(payload: unknown): Partial<SuperAdminProfile> {
  if (!isRecord(payload)) return {};

  const displayName = getOptionalString(
    payload.displayName ?? payload.fullName ?? payload.name ?? payload.username,
  );
  const email = getOptionalString(payload.email ?? payload.emailAddress ?? payload.username);
  const role = getOptionalString(payload.role ?? payload.roleName ?? payload.authority ?? payload.userRole);
  const accountStatus = getOptionalString(payload.accountStatus ?? payload.status ?? payload.state);
  const imageUrl = getOptionalString(
    payload.imageUrl ??
      payload.photoUrl ??
      payload.avatarUrl ??
      payload.picture ??
      payload.profileImageUrl ??
      payload.profilePhotoUrl ??
      payload.profilePictureUrl ??
      payload.profileImageStoragePath,
  );
  const imageKey = getOptionalString(
    payload.imageKey ??
      payload.avatarKey ??
      payload.profileImageKey ??
      payload.profilePhotoKey ??
      payload.profilePictureKey ??
      payload.profileImageStorageKey,
  );
  const profile: Partial<SuperAdminProfile> = {};

  if (displayName) profile.displayName = displayName;
  if (email) profile.email = email;
  if (role) profile.role = role;
  if (accountStatus) profile.accountStatus = accountStatus;
  if (imageUrl || imageKey) profile.imageUrl = resolveProfileImageUrl(imageUrl, imageKey);

  return profile;
}

export async function fetchSuperAdminProfile(): Promise<SuperAdminProfile> {
  const response = await apiClient.get<ApiResponse<unknown> | unknown>(SUPER_ADMIN_PROFILE_ENDPOINT);

  return normalizeSuperAdminProfile(unwrapProfileResponse(response.data));
}

export async function updateSuperAdminProfile(
  data: UpdateSuperAdminProfileRequest,
): Promise<Partial<SuperAdminProfile>> {
  const response = await apiClient.put<ApiResponse<unknown> | unknown>(SUPER_ADMIN_PROFILE_ENDPOINT, data);

  return normalizeUpdatedProfile(unwrapProfileResponse(response.data));
}

export function useSuperAdminProfile(options?: { enabled?: boolean }) {
  return useQuery<SuperAdminProfile>({
    queryKey: superAdminProfileKeys.detail(),
    queryFn: fetchSuperAdminProfile,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}

export function useUpdateSuperAdminProfile() {
  const queryClient = useQueryClient();

  return useMutation<Partial<SuperAdminProfile>, Error, UpdateSuperAdminProfileRequest>({
    mutationFn: updateSuperAdminProfile,
    onSuccess: (profile, variables) => {
      persistUserProfileFromAuthPayload(profile, {
        displayName: profile.displayName ?? variables.displayName,
        email: profile.email ?? variables.email,
        role: profile.role,
        imageUrl: profile.imageUrl,
      });
      queryClient.setQueryData<SuperAdminProfile>(superAdminProfileKeys.detail(), (current) => ({
        ...(current ?? DEFAULT_SUPER_ADMIN_PROFILE),
        ...profile,
        displayName: profile.displayName ?? variables.displayName,
        email: profile.email ?? variables.email,
      }));
    },
  });
}
