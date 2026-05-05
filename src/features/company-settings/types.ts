export interface CompanySettingsResponse {
  companyId: string;
  name: string;
  email: string;
  nipt: string | null;
  phoneNumber: string | null;
  industry: string | null;
  timezone: string;
  dateFormat: string;
  currency: string;
  locale: string;
  countryCode: string;
  logoKey?: string | null;
  logoPath?: string | null;
}

export interface UpdateCompanySettingsRequest {
  name: string;
  nipt?: string | null;
  phoneNumber?: string | null;
  industry?: string | null;
  currency: string;
  dateFormat: string;
  timezone: string;
  countryCode: string;
  logoKey?: string | null;
  logoPath?: string | null;
  clearLogo?: boolean;
}