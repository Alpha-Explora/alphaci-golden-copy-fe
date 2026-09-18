"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { BUILD_EDITION } from "@/shared/composition/build-profile";
import { PipelineLoader } from "@/shared/layout/pipeline-loader";

export function EduRoute({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const enabled = BUILD_EDITION === "edu";

  useEffect(() => {
    if (!enabled) router.replace("/login");
  }, [enabled, router]);

  if (!enabled) {
    return <PipelineLoader label="Returning to sign in" />;
  }

  return children;
}
