import { Suspense } from "react";

import { EduRoute } from "@/features/auth/edu-session";
import { PipelineLoader } from "@/shared/layout/pipeline-loader";

import { EduForgotPasswordView } from "../views/edu-forgot-password-view";
import { EduResetPasswordView } from "../views/edu-reset-password-view";

export function EduForgotPasswordRoute() {
  return (
    <EduRoute>
      <Suspense fallback={<PipelineLoader label="Preparing password help" />}>
        <EduForgotPasswordView />
      </Suspense>
    </EduRoute>
  );
}

export function EduResetPasswordRoute() {
  return (
    <EduRoute>
      <Suspense fallback={<PipelineLoader label="Checking password link" />}>
        <EduResetPasswordView />
      </Suspense>
    </EduRoute>
  );
}
