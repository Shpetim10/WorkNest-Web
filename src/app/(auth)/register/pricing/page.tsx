import { PricingView } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose Plan | WorkNest",
  description: "Select the perfect WorkNest plan for your organization.",
};

export default function PricingPage() {
  return <PricingView />;
}
