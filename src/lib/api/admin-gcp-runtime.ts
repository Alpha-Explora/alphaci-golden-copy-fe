import { request } from "./request";

export type AdminGcpRuntimeStatusFilter =
  | "pending"
  | "provisioning"
  | "ready"
  | "degraded"
  | "drifted"
  | "blocked_by_access"
  | "failed"
  | "archived"
  | "provisioned";

export type AdminGcpRuntimePlacementFilter =
  | "shared_project"
  | "dedicated_customer_project";

export interface AdminGcpRuntimeProject {
  workspace: {
    id: string;
    name: string | null;
  };
  project: {
    id: string;
    repository: string;
    ownerLogin: string | null;
  };
  runtime: {
    placement: string;
    environment: string;
    serviceSlot: string;
    deploymentStatus: string;
    provisioningStatus: string;
    gcpProjectId: string;
    region: string;
    cloudRunServiceName: string;
  };
  reconciliation: {
    status: string | null;
    checkedAt: string | null;
    errorCode: string | null;
  };
  lastProvisioningJob: {
    id: string | null;
    type: string | null;
    status: string | null;
    updatedAt: string | null;
    errorCode: string | null;
  };
  domain: {
    hostname: string | null;
    kind: string | null;
    certificateStatus: string | null;
  };
  previewCount: number;
  blockedEntitlementReason: string | null;
  lastAuditEvent: {
    code: string | null;
    message: string | null;
    createdAt: string | null;
  };
  needsAttention: boolean;
}

export interface AdminGcpRuntimeProjectsPage {
  items: AdminGcpRuntimeProject[];
  total: number;
}

export async function getAdminGcpRuntimeProjects(params?: {
  status?: string;
  runtimePlacement?: string;
  owner?: string;
}): Promise<AdminGcpRuntimeProjectsPage> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.runtimePlacement) {
    query.set("runtimePlacement", params.runtimePlacement);
  }
  if (params?.owner) query.set("owner", params.owner);
  const qs = query.toString();
  return request<AdminGcpRuntimeProjectsPage>(
    `/admin/gcp-runtime${qs ? `?${qs}` : ""}`,
  );
}