export type DepartmentStatus = 'ACTIVE' | 'INACTIVE';

export interface DepartmentListItem {
  id: string;
  name: string;
  status: DepartmentStatus;
  description?: string;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentDetails {
  id: string;
  name: string;
  status: DepartmentStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentLookupItem {
  id: string;
  name: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  status?: DepartmentStatus;
}

export interface UpdateDepartmentRequest {
  name: string;
  description?: string;
  status: DepartmentStatus;
}
