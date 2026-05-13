import { SuperAdminProfileView } from '@/features/super-admin';

export const metadata = {
  title: 'Change Password | WorkNest',
};

export default function SuperAdminChangePasswordPage() {
  return <SuperAdminProfileView activeSection="change-password" enableProfileQuery />;
}
