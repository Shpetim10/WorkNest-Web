/**
 * Enum for media categories matching Spring Boot backend
 */
export enum MediaCategory {
  COMPANY_LOGO = 'COMPANY_LOGO',
  USER_PROFILE = 'USER_PROFILE',
  REGISTRATION_LOGO = 'REGISTRATION_LOGO',
}

/**
 * Request payload for registering a new company workspace.
 */
export interface CompanyRegistrationRequest {
  // Company core
  companyName: string;
  slug: string;
  nipt: string;
  primaryEmail: string;
  primaryPhone?: string;
  countryCode?: string;
  timezone?: string;
  locale?: string;
  currency?: string;
  dateFormat?: string;
  industry?: string;

  // Initial administrator
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhoneNumber?: string;
  preferredLanguage?: string;

  // Media (Logo)
  logoKey?: string;
  logoPath?: string;
}

/**
 * Response returned after the company registration request is accepted.
 */
export interface CompanyRegistrationResponse {
  companyId: string;
  adminUserId: string;
  adminRoleAssignmentId: string;
  adminInvitationId: string;
  companyStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED'; // Simplified enum
  onboardingCompleted: boolean;
  activationEmailSent: boolean;
  message: string;
}

/**
 * Response containing details of the uploaded media file
 */
export interface MediaUploadResponse {
  storageKey: string;
  storagePath: string;
  originalFilename: string;
  contentType: string;
  size: number;
  message: string;
}
