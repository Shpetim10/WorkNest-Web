/**
 * Status of an employee in the system
 */
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  PENDING = 'PENDING',
}

/**
 * Employee Data Transfer Object
 */
export interface EmployeeDTO {
  id: string;
  userId?: string;
  employeeId?: string; // Business ID (e.g., WN-001)
  firstName?: string;
  lastName?: string;
  name?: string; // Combined first/last
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

/**
 * Summary DTO for assigned employees
 */
export interface EmployeeSummaryDTO {
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentName: string;
  jobTitle: string;
}

/**
 * Staff Data Transfer Object
 */
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
}
