import { Suspense } from "react";

import { OAuthLoginView } from "@/features/auth/login";
import { SelfServeLoginView } from "@/features/auth/self-serve";
import { SELF_SERVE_AUTH_ENABLED } from "@/shared/composition/build-profile";
import { PipelineLoader } from "@/shared/layout/pipeline-loader";

export default function LoginPage() {
  if (SELF_SERVE_AUTH_ENABLED) {
    return (
      <Suspense fallback={<PipelineLoader label="Preparing your sign in" />}>
        <SelfServeLoginView />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PipelineLoader label="Preparing your sign in" />}>
      <OAuthLoginView
        mode="login"
        title="Sign in to Alphaexplora."
        subtitle="Internal access for the Alphaexplora team. Use your company GitHub account — the door opens only after your Alphaexplora organization membership is confirmed."
      />
    </Suspense>
  );
}
