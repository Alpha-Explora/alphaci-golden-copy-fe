import { request } from './request';

export type RuntimeDomainKind = 'generated' | 'preview' | 'custom' | 'fallback';
export type RuntimeDomainCertificateStatus =
  | 'pending'
  | 'provisioning'
  | 'active'
  | 'failed'
  | 'not_required';

export interface RuntimeDomain {
  id: string;
  deploymentTargetId: string;
  hostname: string;
  domainBase: string;
  kind: RuntimeDomainKind;
  routingMode: 'load_balancer' | 'cloud_run_domain_mapping' | 'dns_only' | 'manual';
  isPrimary: boolean;
  certificateStatus: RuntimeDomainCertificateStatus;
  dnsInstructions: {
    type: 'CNAME';
    name: string;
    value: string;
    status?: 'missing' | 'matched' | 'mismatched';
    message?: string;
  };
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReserveManagedDomainRequest {
  deploymentTargetId: string;
  projectSlug: string;
  environment: 'dev' | 'stg' | 'uat' | 'prod' | 'preview';
  managedDomainBase?: string;
}

export interface ReserveCustomDomainRequest {
  deploymentTargetId: string;
  hostname: string;
  expectedTarget: string;
}

export interface VerifyDomainRequest {
  domainId: string;
  hostname: string;
  expectedTarget: string;
}

export function reserveManagedDomain(
  payload: ReserveManagedDomainRequest,
): Promise<RuntimeDomain> {
  return request<RuntimeDomain>('/runtime-domains/managed', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function reserveCustomDomain(
  payload: ReserveCustomDomainRequest,
): Promise<RuntimeDomain> {
  return request<RuntimeDomain>('/runtime-domains/custom', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function verifyRuntimeDomain(
  payload: VerifyDomainRequest,
): Promise<RuntimeDomain> {
  return request<RuntimeDomain>('/runtime-domains/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
