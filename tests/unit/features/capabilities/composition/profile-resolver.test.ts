import fs from "node:fs";
import path from "node:path";

// The profile resolver is a CommonJS build helper; load it without making the
// test module itself depend on a runtime TypeScript import boundary.
/* eslint-disable @typescript-eslint/no-require-imports */
const {
  PROFILE_PACKS,
  loadCatalogPackage,
  packageDriftErrors,
  readSurfaceRegistry,
  resolveBuildProfile,
  resolveProfile,
  scanBuildOutput,
  stubSource,
} = require("../../../../../scripts/lib/capability-profile.cjs");
/* eslint-enable @typescript-eslint/no-require-imports */

const root = path.resolve(__dirname, "../../../../../");
const catalogPackage = loadCatalogPackage();
const surfaces = readSurfaceRegistry();

function project(profile: "hosted-saas" | "hosted-edu" | "enterprise") {
  return resolveProfile(profile, {
    catalog: catalogPackage.catalog,
    manifests: catalogPackage.manifests,
    surfaces,
  });
}

describe("frontend build profile resolver", () => {
  it("projects SaaS as a physically isolated profile", () => {
    const first = project("hosted-saas");
    const second = project("hosted-saas");

    expect(first).toEqual(second);
    expect(first.packs).toEqual(["saas"]);
    expect(first.includedCapabilityKeys).toContain("identity.self-serve-auth");
    expect(first.excludedCapabilityKeys).toEqual(expect.arrayContaining([
      "identity.edu-auth",
      "identity.lms-lti",
      "identity.cohort-policy",
      "identity.edu-provisioning",
      "identity.ferpa-workflows",
    ]));
    expect(first.excludedFeatureBarrels).toContain("@/features/auth/edu-signin");
    expect(first.excludedArtifactSymbols).toContain(
      "EnterpriseClientCompositionSettingsView",
    );
  });

  it("projects EDU as a physically isolated profile", () => {
    const projection = project("hosted-edu");

    expect(projection.packs).toEqual(["edu"]);
    expect(projection.includedCapabilityKeys).toContain("identity.edu-auth");
    expect(projection.excludedCapabilityKeys).not.toContain("identity.edu-auth");
    expect(projection.excludedCapabilityKeys).toContain("identity.self-serve-auth");
    expect(projection.excludedFeatureBarrels).toContain("@/features/auth/self-serve");
  });

  it("projects enterprise deterministically and keeps current surfaces included", () => {
    const projection = project("enterprise");

    expect(projection.packs).toEqual(["enterprise"]);
    expect(projection.excludedCapabilityKeys).toEqual([
      "identity.lms-lti",
      "identity.cohort-policy",
      "identity.edu-provisioning",
      "identity.ferpa-workflows",
      "identity.self-serve-auth",
      "identity.edu-auth",
      "platform.public-site",
      "billing.checkout",
    ]);
    expect(projection.includedFeatureBarrels).toContain("@/features/projects");
    expect(projection.excludedFeatureBarrels).toEqual([
      "@/features/auth/self-serve",
      "@/features/auth/edu-signin",
      "@/features/auth/edu-signup",
      "@/features/auth/edu-password-recovery",
      "@/features/auth/edu-connect-github",
      "@/features/auth/edu-labs",
      "@/features/auth/edu-session",
      "@/features/public-site",
    ]);
    expect(projection.includedArtifactSymbols).toContain(
      "EnterpriseClientCompositionSettingsView",
    );
    expect(projection.excludedArtifactSymbols).toEqual([]);
  });

  it("rejects a SaaS output containing the Enterprise implementation symbol", () => {
    const projection = project("hosted-saas");
    const outputDirectory = path.join(
      root,
      ".next",
      "test-hosted-saas-client-composition-artifact",
    );
    fs.rmSync(outputDirectory, { recursive: true, force: true });
    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(outputDirectory, "bundle.js"),
      "const EnterpriseClientCompositionSettingsView = null;\n",
      "utf8",
    );

    try {
      expect(scanBuildOutput(outputDirectory, projection)).toEqual([
        expect.objectContaining({
          symbol: "EnterpriseClientCompositionSettingsView",
        }),
      ]);
    } finally {
      fs.rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it("fails clearly for an unknown profile", () => {
    expect(() => resolveBuildProfile("unknown")).toThrow("Unknown ALPHACI_BUILD_PROFILE");
    expect(() => resolveProfile("unknown", {
      catalog: catalogPackage.catalog,
      manifests: catalogPackage.manifests,
      surfaces,
    })).toThrow("Unknown build profile");
  });

  it("detects package drift against the snapshot", () => {
    const snapshot = JSON.parse(
      fs.readFileSync(path.join(root, "docs/capabilities/catalog.snapshot.json"), "utf8"),
    );
    expect(packageDriftErrors(snapshot, catalogPackage)).toEqual([]);
    expect(packageDriftErrors(snapshot, {
      ...catalogPackage,
      catalog: catalogPackage.catalog.slice(1),
    })).toEqual(expect.arrayContaining([
      expect.stringContaining("does not match docs/capabilities/catalog.snapshot.json"),
    ]));
  });

  it("generates a notFound stub for any future excluded barrel", () => {
    const stub = stubSource("@/features/settings/client-composition");

    expect(stub).toContain("return notFound();");
    expect(stub).toContain("export default client_composition;");
    expect(stub).not.toContain("EnterpriseClientCompositionSettingsView");
  });

  it("does not scan the generated stub but still rejects the implementation symbol", () => {
    const projection = project("hosted-saas");
    const outputDirectory = path.join(root, ".next", "test-hosted-saas-client-composition-stub");
    fs.rmSync(outputDirectory, { recursive: true, force: true });
    fs.mkdirSync(outputDirectory, { recursive: true });

    try {
      fs.writeFileSync(
        path.join(outputDirectory, "stub.js"),
        stubSource("@/features/settings/client-composition"),
        "utf8",
      );
      expect(scanBuildOutput(outputDirectory, projection)).toEqual([]);

      fs.writeFileSync(
        path.join(outputDirectory, "bundle.js"),
        "const EnterpriseClientCompositionSettingsView = null;\n",
        "utf8",
      );
      expect(scanBuildOutput(outputDirectory, projection)).toEqual([
        expect.objectContaining({
          symbol: "EnterpriseClientCompositionSettingsView",
        }),
      ]);
    } finally {
      fs.rmSync(outputDirectory, { recursive: true, force: true });
    }
  });

  it("keeps profile membership data-driven", () => {
    expect(PROFILE_PACKS).toEqual({
      "hosted-saas": ["saas"],
      "hosted-edu": ["edu"],
      enterprise: ["enterprise"],
    });
  });

  it("rejects a dependency that crosses the selected profile ceiling", () => {
    const manifests = {
      ...catalogPackage.manifests,
      saas: ["billing.checkout"],
    };
    const catalog = catalogPackage.catalog.map((record) =>
      record.key === "billing.checkout"
        ? { ...record, requires: ["runtime.managed-secrets"] }
        : record,
    );

    expect(() => resolveProfile("hosted-saas", { catalog, manifests, surfaces })).toThrow(
      "dependency closure exceeds its pack ceiling",
    );
  });

  it("does not exclude a barrel still needed by an included capability", () => {
    const sharedBarrel = "@/features/shared-surface";
    const projection = resolveProfile("hosted-saas", {
      catalog: catalogPackage.catalog,
      manifests: catalogPackage.manifests,
      surfaces: [
        { key: "runtime.env-provisioning", featureBarrels: [sharedBarrel] },
        { key: "runtime.managed-secrets", featureBarrels: [sharedBarrel] },
      ],
    });

    expect(projection.includedFeatureBarrels).toEqual([sharedBarrel]);
    expect(projection.excludedFeatureBarrels).toEqual([]);
  });
});
