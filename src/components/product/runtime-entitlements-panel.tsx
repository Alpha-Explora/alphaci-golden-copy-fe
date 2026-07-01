"use client";

export interface RuntimeEntitlements {
  canDeploy: boolean;
  canCreatePreview: boolean;
  canAttachCustomDomain: boolean;
  canCreateDedicatedProject: boolean;
  previewLimit: number;
  customDomainLimit: number;
  maxInstances: number;
  deploysPerHour: number;
  projectVisible: boolean;
  retainEnvVars: boolean;
  retainExistingCustomDomains: boolean;
  retainExistingDedicatedRuntime: boolean;
  customerDatabaseManagedByAlphaCI: boolean;
  cleanupDestructive: boolean;
  limitReasons: string[];
}

interface RuntimeEntitlementsPanelProps {
  entitlements: RuntimeEntitlements;
}

export function RuntimeEntitlementsPanel({
  entitlements,
}: Readonly<RuntimeEntitlementsPanelProps>) {
  return (
    <section className="runtime-entitlements-panel" aria-labelledby="runtime-entitlements-title">
      <div className="panel-heading-row">
        <div>
          <h3 id="runtime-entitlements-title">Runtime Entitlements</h3>
          <p className="muted">Deployment limits are checked before runtime jobs are queued.</p>
        </div>
      </div>

      <div className="entitlement-grid">
        <span>{entitlements.canDeploy ? "Deploys allowed" : "Deploys blocked"}</span>
        <span>Previews {entitlements.previewLimit}</span>
        <span>
          {entitlements.canAttachCustomDomain
            ? `Custom domains ${entitlements.customDomainLimit}`
            : "Custom domains unavailable"}
        </span>
        <span>
          {entitlements.canCreateDedicatedProject
            ? "Dedicated project available"
            : "Dedicated project unavailable"}
        </span>
        <span>Max instances {entitlements.maxInstances}</span>
        <span>Deploys per hour {entitlements.deploysPerHour}</span>
        <span>{entitlements.retainEnvVars ? "Env vars retained" : "Env vars not retained"}</span>
        <span>
          {entitlements.customerDatabaseManagedByAlphaCI
            ? "Customer database managed"
            : "Customer database external"}
        </span>
        <span>
          {entitlements.cleanupDestructive ? "Destructive cleanup pending" : "No destructive cleanup"}
        </span>
      </div>

      {entitlements.limitReasons.length ? (
        <ul className="entitlement-reasons">
          {entitlements.limitReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
