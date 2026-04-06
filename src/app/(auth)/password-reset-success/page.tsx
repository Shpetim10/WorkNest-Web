import { PasswordResetSuccessView } from "@/features/auth/components/PasswordResetSuccessView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password Reset Successfully | WorkNest",
  description: "Your WorkNest password has been updated.",
};

export default function PasswordResetSuccessPage() {
  return <PasswordResetSuccessView />;
}
