import { CompanyPersonRow, EmployeeDTO, EmploymentType, PlatformRole } from '../types';

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

export function getEmploymentTypeLabel(employmentType: EmploymentType | null | undefined): string {
  if (!employmentType) return 'Not set';
  return EMPLOYMENT_TYPE_LABELS[employmentType] ?? employmentType;
}

export function getDisplayRoleLabel(platformRole: PlatformRole | null | undefined): string {
  if (platformRole === 'EMPLOYEE') return 'Employee';
  if (platformRole === 'STAFF') return 'Manager';
  if (!platformRole) return 'Unknown';

  return platformRole
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeCompanyPersonRow(employee: EmployeeDTO): CompanyPersonRow {
  const fullName =
    employee.name?.trim() ||
    [employee.firstName, employee.lastName].filter(Boolean).join(' ').trim() ||
    employee.email;
  const platformRole = employee.platformRole ?? 'EMPLOYEE';
  const employmentType = employee.employmentType ?? null;

  return {
    id: employee.id,
    userId: employee.userId ?? '',
    fullName,
    email: employee.email,
    jobTitle: employee.jobTitle ?? '—',
    departmentName: employee.departmentName ?? '—',
    companySiteName: employee.companySiteName ?? '—',
    platformRole,
    employmentType,
    employmentTypeLabel: getEmploymentTypeLabel(employmentType),
    displayRoleLabel: getDisplayRoleLabel(platformRole),
    status: employee.status,
    raw: employee,
  };
}

export function resolvePersonDetailTarget(person: CompanyPersonRow): 'employee' | 'staff' {
  return person.platformRole === 'STAFF' ? 'staff' : 'employee';
}
