/**
 * Roles available in the platform
 */
export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

/**
 * Authentication request DTO
 */
export interface LoginRequest {
  email: string;
  password?: string;
}

/**
 * Authentication response DTO
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: PlatformRole;
    companyId?: string;
  };
}

export * from './registration';
export * from './invitation';
