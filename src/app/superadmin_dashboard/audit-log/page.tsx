import { AuditLogView } from '@/features/super-admin';

export const metadata = {
  title: 'Audit Log | WorkNest',
};

export default function SuperAdminAuditLogPage() {
  return <AuditLogView enableAuditLogQuery />;
}
