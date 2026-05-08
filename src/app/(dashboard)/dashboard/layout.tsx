import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";
import { RealtimeProvider } from "@/common/providers/RealtimeProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </RealtimeProvider>
  );
}
