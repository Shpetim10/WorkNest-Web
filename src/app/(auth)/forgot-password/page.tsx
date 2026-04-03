import { ForgotPasswordView } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | WorkNest",
  description: "Reset your WorkNest account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
