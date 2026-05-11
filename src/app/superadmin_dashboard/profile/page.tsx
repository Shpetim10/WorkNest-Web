import { SuperAdminProfileView } from '@/features/super-admin';

export const metadata = {
  title: 'My Profile | WorkNest',
};

const enableSuperAdminProfileApi = process.env.NEXT_PUBLIC_ENABLE_SUPERADMIN_PROFILE_API === 'true';

export default function SuperAdminProfilePage() {
  return (
    <SuperAdminProfileView
      activeSection="personal-info"
      enableProfileQuery={enableSuperAdminProfileApi}
    />
  );
}
