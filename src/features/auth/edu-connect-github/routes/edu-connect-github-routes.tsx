import { Suspense } from "react";

import { EduRoute } from "@/features/auth/edu-session";
import { PipelineLoader } from "@/shared/layout/pipeline-loader";

import { EduConnectGithubView } from "../views/edu-connect-github-view";

export function EduConnectGithubRoute() {
  return (
    <EduRoute>
      <Suspense fallback={<PipelineLoader label="Preparing GitHub linking" />}>
        <EduConnectGithubView />
      </Suspense>
    </EduRoute>
  );
}
