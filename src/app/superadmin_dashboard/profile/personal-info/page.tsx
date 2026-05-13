import { SuperAdminProfileView } from '@/features/super-admin';

export const metadata = {
  title: 'Personal Info | WorkNest',
};

export default function SuperAdminPersonalInfoPage() {
  return <SuperAdminProfileView activeSection="personal-info" enableProfileQuery />;
}
