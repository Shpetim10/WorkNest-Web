import { SuperAdminLoginView } from '@/features/super-admin';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin Login | WorkNest',
  description: 'Sign in to your WorkNest super admin account',
};

export default function SuperAdminLoginPage() {
  return <SuperAdminLoginView />;
}
