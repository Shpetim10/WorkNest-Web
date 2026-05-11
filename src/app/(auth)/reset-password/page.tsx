import { SetNewPasswordView } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password | WorkNest",
  description: "Set a new secure password for your WorkNest account.",
};

type ResetPasswordPageProps = {
  searchParams?: Promise<{ token?: string | string[] }>;
};

export default async function SetNewPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const rawToken = params?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  return <SetNewPasswordView token={token} />;
}
