"use client";

import type { RuntimeDomain } from "@/lib/api/domains";

interface ProjectDomainsPanelProps {
  domains: RuntimeDomain[];
  managedDomainBase?: string;
  expectedTarget: string;
  onAddCustomDomain?: () => void;
  onVerifyDomain?: (domain: RuntimeDomain) => void;
}

function statusLabel(domain: RuntimeDomain): string {
  if (domain.certificateStatus === "active") return "Active";
  if (domain.certificateStatus === "failed") return "Failed";
  if (domain.certificateStatus === "provisioning") return "Provisioning";
  if (domain.certificateStatus === "not_required") return "DNS only";
  return "Pending verification";
}

export function ProjectDomainsPanel({
  domains,
  expectedTarget,
  managedDomainBase = "itsandbox.site",
  onAddCustomDomain,
  onVerifyDomain,
}: Readonly<ProjectDomainsPanelProps>) {
  const managedDomains = domains.filter((domain) => domain.kind === "generated" || domain.kind === "preview");
  const customDomains = domains.filter((domain) => domain.kind === "custom");

  return (
    <section className="project-domains-panel" aria-labelledby="project-domains-title">
      <div className="panel-heading-row">
        <div>
          <h3 id="project-domains-title">Domains</h3>
          <p className="muted">Managed AlphaCI URLs use {managedDomainBase}. Custom domains stay pending until DNS matches.</p>
        </div>
        <button type="button" onClick={onAddCustomDomain} disabled={!onAddCustomDomain}>
          Add custom domain
        </button>
      </div>

      <div className="domain-section">
        <h4>Managed URLs</h4>
        {managedDomains.length ? (
          <ul className="domain-list">
            {managedDomains.map((domain) => (
              <li key={domain.id}>
                <strong>{domain.hostname}</strong>
                <span>{statusLabel(domain)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No managed URL has been reserved yet.</p>
        )}
      </div>

      <div className="domain-section">
        <h4>Custom Domains</h4>
        {customDomains.length ? (
          <ul className="domain-list">
            {customDomains.map((domain) => (
              <li key={domain.id}>
                <div>
                  <strong>{domain.hostname}</strong>
                  <p className="muted">CNAME {domain.dnsInstructions.name} to {domain.dnsInstructions.value || expectedTarget}</p>
                </div>
                <span>{statusLabel(domain)}</span>
                <button type="button" onClick={() => onVerifyDomain?.(domain)} disabled={!onVerifyDomain}>
                  Verify
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No custom domains have been added.</p>
        )}
      </div>
    </section>
  );
}
