export const USER_PROFILE_CHANGE_EVENT = 'worknest:user-profile-changed';
export const USER_EMAIL_CHANGE_EVENT = 'worknest:user-email-changed';

export type UserProfileScope = 'admin' | 'superadmin';

export interface UserMenuProfile {
  displayName: string;
  email: string;
  role: string;
  imageUrl: string;
  initial: string;
}

type ProfileOverrides = {
  displayName?: string;
  email?: string;
  role?: string;
  imageUrl?: string;
  imageKey?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:8080';

const PROFILE_NAME_KEYS = [
  'displayName',
  'fullName',
  'name',
  'username',
  'preferred_username',
  'given_name',
];

const PROFILE_FIRST_NAME_KEYS = ['firstName', 'first_name', 'givenName', 'given_name'];
const PROFILE_LAST_NAME_KEYS = ['lastName', 'last_name', 'familyName', 'family_name', 'surname'];
const PROFILE_EMAIL_KEYS = ['email', 'emailAddress', 'username', 'preferred_username'];
const PROFILE_ROLE_KEYS = ['role', 'roleName', 'authority', 'userRole', 'platformRole'];

const PROFILE_IMAGE_URL_KEYS = [
  'profileImageUrl',
  'profilePhotoUrl',
  'profilePictureUrl',
  'avatarUrl',
  'photoUrl',
  'imageUrl',
  'picture',
  'profileImage',
  'profileImageStoragePath',
];

const PROFILE_IMAGE_KEY_KEYS = [
  'profileImageKey',
  'profilePhotoKey',
  'profilePictureKey',
  'avatarKey',
  'imageKey',
  'profileImageStorageKey',
];

const STORAGE_NAME_KEYS = [
  'user_display_name',
  'user_name',
  'display_name',
  'full_name',
];

const SUPERADMIN_STORAGE_NAME_KEYS = ['superadmin_profile_name', ...STORAGE_NAME_KEYS];
const STORAGE_EMAIL_KEYS = ['user_email', 'email'];
const STORAGE_ROLE_KEYS = ['platform_role', 'user_role', 'role'];

const STORAGE_IMAGE_URL_KEYS = [
  'user_profile_image_url',
  'user_profile_photo_url',
  'user_avatar_url',
  'profile_image_url',
  'profile_photo_url',
  'avatar_url',
  'photo_url',
  'picture',
  'profileImageStoragePath',
];

const STORAGE_IMAGE_KEY_KEYS = [
  'user_profile_image_key',
  'profile_image_key',
  'avatar_key',
  'profileImageStorageKey',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function readStoredValue(keys: string[]): string {
  if (typeof window === 'undefined') return '';

  for (const key of keys) {
    const value = window.localStorage.getItem(key)?.trim();
    if (value) return value;
  }

  return '';
}

function readFromSources(sources: Record<string, unknown>[], keys: string[]): string {
  for (const source of sources) {
    for (const key of keys) {
      const value = getString(source[key]);
      if (value) return value;
    }
  }

  return '';
}

function readDisplayNameFromSources(sources: Record<string, unknown>[]): string {
  const displayName = readFromSources(sources, PROFILE_NAME_KEYS);
  if (displayName) return displayName;

  const firstName = readFromSources(sources, PROFILE_FIRST_NAME_KEYS);
  const lastName = readFromSources(sources, PROFILE_LAST_NAME_KEYS);

  return [firstName, lastName].filter(Boolean).join(' ').trim();
}

function getPayloadSources(payload: unknown): Record<string, unknown>[] {
  if (!isRecord(payload)) return [];

  const nestedKeys = ['user', 'profile', 'account', 'principal', 'data'];
  const sources = [payload];

  for (const key of nestedKeys) {
    const nested = payload[key];
    if (isRecord(nested)) {
      sources.push(nested);
    }
  }

  return sources;
}

function decodeJwtPayload(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;

  const token = window.localStorage.getItem('auth_token');
  const payload = token?.split('.')[1];

  if (!payload) return null;

  try {
    const normalized = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decoded = window.atob(normalized);

    try {
      const utf8 = decodeURIComponent(
        Array.from(decoded)
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
      );
      return JSON.parse(utf8) as Record<string, unknown>;
    } catch {
      return JSON.parse(decoded) as Record<string, unknown>;
    }
  } catch {
    return null;
  }
}

function resolveMediaUrl(imageUrl: string, imageKey: string): string {
  const rawValue = imageUrl || imageKey;
  if (!rawValue) return '';

  if (/^(https?:|blob:|data:)/i.test(rawValue)) {
    return rawValue;
  }

  if (rawValue.startsWith('/')) {
    return rawValue;
  }

  if (rawValue.startsWith('api/')) {
    return `${API_BASE}/${rawValue}`;
  }

  return `${API_BASE}/api/v1/media/files/${rawValue}`;
}

export function resolveProfileImageUrl(imageUrl = '', imageKey = ''): string {
  return resolveMediaUrl(imageUrl, imageKey);
}

export function clearUserProfileImage() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem('user_profile_image_url');
  window.localStorage.removeItem('user_profile_photo_url');
  window.localStorage.removeItem('user_avatar_url');
  window.localStorage.removeItem('profile_image_url');
  window.localStorage.removeItem('profile_photo_url');
  window.localStorage.removeItem('avatar_url');
  window.localStorage.removeItem('photo_url');
  window.localStorage.removeItem('picture');
  window.localStorage.removeItem('profileImageStoragePath');
  window.localStorage.removeItem('user_profile_image_key');
  window.localStorage.removeItem('profile_image_key');
  window.localStorage.removeItem('avatar_key');
  window.localStorage.removeItem('profileImageStorageKey');
  notifyUserProfileChanged();
}

function getDefaultProfile(scope: UserProfileScope): UserMenuProfile {
  const isSuperAdmin = scope === 'superadmin';
  const displayName = isSuperAdmin ? 'Super Administrator' : 'Administrator';
  const email = isSuperAdmin ? 'superadmin@worknest.com' : 'admin@worknest.com';
  const role = isSuperAdmin ? 'SUPERADMIN' : 'ADMIN';

  return {
    displayName,
    email,
    role,
    imageUrl: '',
    initial: getProfileInitial(displayName, email),
  };
}

export function getDefaultUserMenuProfile(scope: UserProfileScope): UserMenuProfile {
  return getDefaultProfile(scope);
}

export function getProfileInitial(displayName: string, email: string): string {
  const source = displayName || email || 'U';
  const match = source.match(/[A-Za-z0-9]/);
  return match?.[0]?.toUpperCase() ?? 'U';
}

export function readUserMenuProfile(scope: UserProfileScope): UserMenuProfile {
  const defaults = getDefaultProfile(scope);
  const tokenPayload = decodeJwtPayload();
  const payloadSources = getPayloadSources(tokenPayload);
  const nameStorageKeys = scope === 'superadmin' ? SUPERADMIN_STORAGE_NAME_KEYS : STORAGE_NAME_KEYS;

  const email =
    readStoredValue(STORAGE_EMAIL_KEYS) ||
    readFromSources(payloadSources, PROFILE_EMAIL_KEYS) ||
    defaults.email;
  const role =
    readStoredValue(STORAGE_ROLE_KEYS) ||
    readFromSources(payloadSources, PROFILE_ROLE_KEYS) ||
    defaults.role;
  const displayName =
    readStoredValue(nameStorageKeys) ||
    readDisplayNameFromSources(payloadSources) ||
    defaults.displayName;
  const imageUrl = resolveMediaUrl(
    readStoredValue(STORAGE_IMAGE_URL_KEYS) || readFromSources(payloadSources, PROFILE_IMAGE_URL_KEYS),
    readStoredValue(STORAGE_IMAGE_KEY_KEYS) || readFromSources(payloadSources, PROFILE_IMAGE_KEY_KEYS),
  );

  return {
    displayName,
    email,
    role,
    imageUrl,
    initial: getProfileInitial(displayName, email),
  };
}

export function notifyUserProfileChanged() {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new Event(USER_PROFILE_CHANGE_EVENT));
  window.dispatchEvent(new Event(USER_EMAIL_CHANGE_EVENT));
}

export function persistUserProfileFromAuthPayload(payload: unknown, overrides: ProfileOverrides = {}) {
  if (typeof window === 'undefined') return;

  const sources = [overrides, ...getPayloadSources(payload)];
  const displayName = readDisplayNameFromSources(sources);
  const email = readFromSources(sources, PROFILE_EMAIL_KEYS);
  const role = readFromSources(sources, PROFILE_ROLE_KEYS);
  const imageUrl = readFromSources(sources, PROFILE_IMAGE_URL_KEYS);
  const imageKey = readFromSources(sources, PROFILE_IMAGE_KEY_KEYS);

  if (displayName) {
    window.localStorage.setItem('user_display_name', displayName);
  }

  if (email) {
    window.localStorage.setItem('user_email', email);
  }

  if (role) {
    window.localStorage.setItem('platform_role', role);
  }

  if (imageUrl) {
    window.localStorage.setItem('user_profile_image_url', resolveMediaUrl(imageUrl, ''));
  }

  if (imageKey) {
    window.localStorage.setItem('user_profile_image_key', imageKey);
  }

  notifyUserProfileChanged();
}
