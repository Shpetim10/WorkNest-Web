import { SuperAdminProfileView } from '@/features/super-admin';

export const metadata = {
  title: 'Change Password | WorkNest',
};

const enableSuperAdminProfileApi = process.env.NEXT_PUBLIC_ENABLE_SUPERADMIN_PROFILE_API === 'true';

export default function SuperAdminChangePasswordPage() {
  return (
    <SuperAdminProfileView
      activeSection="change-password"
      enableProfileQuery={enableSuperAdminProfileApi}
    />
  );
}
