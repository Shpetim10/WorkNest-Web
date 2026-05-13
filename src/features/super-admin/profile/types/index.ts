export interface SuperAdminProfile {
  displayName: string;
  email: string;
  role: string;
  accountStatus: string;
}

export interface UpdateSuperAdminProfileRequest {
  displayName: string;
}
