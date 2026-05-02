export interface CompanySettingsResponse {
  timezone: string;
  dateFormat: string;
  currency: string;
  locale: string;
  countryCode: string;
  logoPath?: string | null;
}
