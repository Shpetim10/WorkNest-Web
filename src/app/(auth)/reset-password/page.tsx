import { SetNewPasswordView } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password | WorkNest",
  description: "Set a new secure password for your WorkNest account.",
};

export default function SetNewPasswordPage() {
  return <SetNewPasswordView />;
}
