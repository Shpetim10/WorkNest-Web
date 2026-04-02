/**
 * Status of an employee in the system
 */
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

/**
 * Employee Data Transfer Object
 */
export interface EmployeeDTO {
  id: string;
  employeeId: string; // Business ID (e.g., WN-001)
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentName: string;
  status: EmployeeStatus;
  hireDate: string;
  companyId: string;
}

/**
 * Filter criteria for employee search
 */
export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: EmployeeStatus;
  page?: number;
  size?: number;
}
