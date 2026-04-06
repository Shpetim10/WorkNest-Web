/**
 * Roles available in the platform
 */
export enum PlatformRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  EMPLOYEE = 'EMPLOYEE',
}

/**
 * Supported platform access types
 */
export enum PlatformAccess {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

/**
 * Resolved tenant context for the authenticated session
 */
export interface TenantContextDto {
  companyId: string;
  companyName: string;
  companySlug: string;
}

/**
 * A selectable organization/role context for a user
 */
export interface AvailableLoginContextDto {
  companyId: string;
  companyName: string;
  companySlug: string;
  roleAssignmentId: string;
  role: PlatformRole;
  jobTitle: string;
  platformAccess: PlatformAccess;
}

/**
 * Credentials for primary authentication
 */
export interface LoginRequest {
  email: string;
  password?: string;
  platformAccess: PlatformAccess;
}

/**
 * Response containing authentication tokens and session state
 */
export interface LoginResponse {
  authenticated: boolean;
  roleSelectionRequired: boolean;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  activeRoleAssignmentId?: string;
  role?: PlatformRole;
  platformAccess?: PlatformAccess;
  tenantContext?: TenantContextDto;
  availableContexts?: AvailableLoginContextDto[];
  message?: string;
}

/**
 * Request to select a specific organization/role context
 */
export interface SelectRoleRequest {
  roleAssignmentId: string;
  platformAccess: PlatformAccess;
}

/**
 * Response containing the new session tokens and active context
 */
export interface SelectRoleResponse {
  activeRoleAssignmentId: string;
  platformRole: PlatformRole;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tenantContext: TenantContextDto;
}

/**
 * Request to initiate a password reset (Step 1)
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Request to execute a password reset with token (Step 2)
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  activeRoleAssignmentId: string;
  platformAccess: PlatformAccess;
  tenantContext: TenantContextDto;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export * from './registration';
export * from './invitation';
