import { PlatformRole } from './index';

/**
 * Distinguishes between different platform access points for sessions and role assignments.
 */
export enum PlatformAccess {
  MOBILE = 'MOBILE',
  WEB = 'WEB',
  BOTH = 'BOTH',
}

/**
 * Operational status of a user account for authentication and access decisions.
 */
export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

/**
 * Request payload for activating a pending invitation.
 */
export interface ActivateInvitationRequest {
  /** Raw invitation token received via e-mail. */
  token: string;

  /** Chosen password. Must be ≥ 8 characters, contain an uppercase letter and a digit. */
  password: string;

  /** GDPR / Terms of Service consent flag. */
  gdprConsent: boolean;

  /** Preferred UI language code (BCP-47) */
  preferredLanguage?: string;

  /** Storage key for the uploaded profile image */
  profileImageStorageKey?: string;

  /** Full storage path/URL for the profile image */
  profileImageStoragePath?: string;
}

/**
 * Response containing user and session details after activation
 */
export interface ActivateInvitationResponse {
  userId: string;
  roleAssignmentId: string;
  role: PlatformRole;
  platformAccess: PlatformAccess;
  status: UserStatus;
  message: string;
}
