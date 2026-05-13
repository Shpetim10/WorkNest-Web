import { ForgotPasswordView } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | WorkNest",
  description: "Reset your WorkNest account password",
};

type Props = { searchParams?: Promise<{ from?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const isSuperAdmin = params?.from === 'superadmin';

  return (
    <ForgotPasswordView
      backHref={isSuperAdmin ? '/login-superadmin' : '/login'}
      backLabel={isSuperAdmin ? 'Back to admin login' : 'Back to login'}
      apiPath={isSuperAdmin ? '/auth/forgot-password/superadmin' : '/auth/forgot-password'}
    />
  );
}