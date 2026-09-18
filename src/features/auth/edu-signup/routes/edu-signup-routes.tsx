import { Suspense } from "react";

import { EduRoute } from "@/features/auth/edu-session";
import { PipelineLoader } from "@/shared/layout/pipeline-loader";

import { EduSignupView } from "../views/edu-signup-view";

export function EduStudentSignupRoute() {
  return (
    <EduRoute>
      <Suspense fallback={<PipelineLoader label="Preparing account creation" />}>
        <EduSignupView />
      </Suspense>
    </EduRoute>
  );
}
