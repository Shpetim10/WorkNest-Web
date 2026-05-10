export type CompanyManagementStatus = 'active' | 'suspended';

export type CompanyManagementPlan = 'Starter' | 'Professional' | 'Enterprise';

export interface CompanyManagementRow {
  id: string;
  companyName: string;
  countryCode: string;
  legalName: string;
  nipt: string;
  registrationNumber: string;
  email: string;
  plan: CompanyManagementPlan;
  status: CompanyManagementStatus;
  createdAt: string;
}
