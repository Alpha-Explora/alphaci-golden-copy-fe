import type { Metadata } from "next";

import { OnboardingPage } from "@/features/dashboard/onboarding/onboarding-page";

export const metadata: Metadata = {
  title: "Onboarding | AlphaCI",
};

export default function Page() {
  return <OnboardingPage />;
}
