import { LoginView } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | WorkNest",
  description: "Sign in to your WorkNest account",
};

export default function LoginPage() {
  return <LoginView />;
}
