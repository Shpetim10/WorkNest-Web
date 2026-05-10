import { AuditLogView } from '@/features/super-admin';

export const metadata = {
  title: 'Audit Log | WorkNest',
};

const enableSuperAdminAuditLogApi = process.env.NEXT_PUBLIC_ENABLE_SUPERADMIN_AUDIT_LOG_API === 'true';

export default function SuperAdminAuditLogPage() {
  return <AuditLogView enableAuditLogQuery={enableSuperAdminAuditLogApi} />;
}
