import { SelectRoleView } from '@/features/auth/components/SelectRoleView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Select Workspace | WorkNest',
  description: 'Choose which company and role you would like to use for your active session.',
};

export default function SelectRolePage() {
  return <SelectRoleView />;
}
