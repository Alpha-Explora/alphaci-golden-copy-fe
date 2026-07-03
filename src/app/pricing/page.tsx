import type { Metadata } from "next";

import { PricingPage } from "@/features/public-site/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing | AlphaCI",
  description:
    "Choose an AlphaCI plan. Monthly credits power governed CI/CD automation, workflow updates, and release visibility.",
};

export default function PricingRoute() {
  return <PricingPage />;
}