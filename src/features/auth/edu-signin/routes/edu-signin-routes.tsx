import { Suspense } from "react";

import { EduRoute } from "@/features/auth/edu-session";
import { PipelineLoader } from "@/shared/layout/pipeline-loader";

import { EduSignInView } from "../views/edu-signin-view";

export function EduStudentSignInRoute() {
  return (
    <EduRoute>
      <Suspense fallback={<PipelineLoader label="Preparing student sign in" />}>
        <EduSignInView audience="STUDENT" />
      </Suspense>
    </EduRoute>
  );
}

export function EduStaffSignInRoute() {
  return (
    <EduRoute>
      <Suspense fallback={<PipelineLoader label="Preparing staff sign in" />}>
        <EduSignInView audience="STAFF" />
      </Suspense>
    </EduRoute>
  );
}
