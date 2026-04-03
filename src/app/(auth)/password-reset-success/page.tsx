import { PasswordResetSuccessView } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Sent | WorkNest",
  description: "Your WorkNest password reset link has been sent.",
};

export default function PasswordResetSuccessPage() {
  return <PasswordResetSuccessView />;
}
