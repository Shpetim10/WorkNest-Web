export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  PENDING = 'PENDING',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export enum PaymentMethod {
  FIXED_MONTHLY = 'FIXED_MONTHLY',
  HOURLY = 'HOURLY',
}

export interface EmployeeDTO {
  id: string;
  userId?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  jobTitle: string;
  departmentName: string;
  departmentId?: string;
  companySiteName?: string;
  companySiteId?: string;
  status: EmployeeStatus;
  hireDate?: string;
  supervisorRoleAssignmentId?: string;
  supervisorName?: string;
  supervisorJobTitle?: string;
  companyId?: string;
  // Employment & Contract
  employmentType?: EmploymentType | null;
  contractDocumentKey?: string | null;
  contractDocumentPath?: string | null;
  contractExpiryDate?: string | null;
  leaveDaysPerYear?: number | null;
  paymentMethod?: PaymentMethod | null;
  monthlySalary?: number | null;
  hourlyRate?: number | null;
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: EmployeeStatus;
  page?: number;
  size?: number;
}

export interface EmployeeSummaryDTO {
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName: string;
  jobTitle: string;
}

export interface StaffDTO {
  id: string;
  userId: string;
  roleAssignmentId?: string;
  supervisorRoleAssignmentId?: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  departmentName: string;
  departmentId?: string;
  jobTitle: string;
  companySiteName: string;
  companySiteId?: string;
  role: string;
  startDate: string;
  status: EmployeeStatus;
  permissionCodes?: string[];
  assignedEmployeesCount?: number;
  assignedEmployees?: EmployeeSummaryDTO[];
  // Employment & Contract
  employmentType?: EmploymentType | null;
  contractDocumentKey?: string | null;
  contractDocumentPath?: string | null;
  contractExpiryDate?: string | null;
  leaveDaysPerYear?: number | null;
  paymentMethod?: PaymentMethod | null;
  monthlySalary?: number | null;
  hourlyRate?: number | null;
}
