import { Suspense } from "react";
import { redirect } from "next/navigation";

import { SelfServeSignupView } from "@/features/auth/self-serve";
import { SELF_SERVE_AUTH_ENABLED } from "@/shared/composition/build-profile";
import { PipelineLoader } from "@/shared/layout/pipeline-loader";

export default function SignupPage() {
  if (!SELF_SERVE_AUTH_ENABLED) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<PipelineLoader label="Preparing your account" />}>
      <SelfServeSignupView />
    </Suspense>
  );
}
