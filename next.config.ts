import type { NextConfig } from "next";
import { createRequire } from "node:module";
import { dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { BUILD_EDITION, BUILD_PROFILE } from "./src/shared/composition/build-profile";

const require = createRequire(import.meta.url);
const {
  loadCatalogPackage,
  readSurfaceRegistry,
  resolveBuildProfile,
  resolveProfile,
  writeCapabilityStubs,
} = require("./scripts/lib/capability-profile.cjs");

const rootDir = dirname(fileURLToPath(import.meta.url));
const buildProfile = resolveBuildProfile(BUILD_PROFILE);
const catalogPackage = loadCatalogPackage();
const profileProjection = resolveProfile(buildProfile, {
  catalog: catalogPackage.catalog,
  manifests: catalogPackage.manifests,
  surfaces: readSurfaceRegistry(),
});
// Next owns `.next` and may clear it after this config is evaluated. Keep
// generated capability stubs outside that directory so both dev and build
// resolvers can rely on the files for the lifetime of the process.
const capabilityStubDirectory = `${rootDir}/.cache/capability-stubs`;
const capabilityAliases = writeCapabilityStubs(
  profileProjection,
  capabilityStubDirectory,
) as Record<string, string>;
// Turbopack's Windows resolver does not accept the backslash-containing
// absolute targets that Webpack accepts. Project-relative POSIX paths work in
// both the Windows and non-Windows Turbopack resolvers.
const turbopackCapabilityAliases = Object.fromEntries(
  Object.entries(capabilityAliases).map(([specifier, target]) => [
    specifier,
    `./${relative(rootDir, target).replaceAll("\\", "/")}`,
  ]),
);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_ALPHACI_BUILD_PROFILE: buildProfile,
    NEXT_PUBLIC_ALPHACI_EDITION: BUILD_EDITION,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  turbopack: {
    root: rootDir,
    resolveAlias: turbopackCapabilityAliases,
  },
  webpack(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      ...capabilityAliases,
    };
    return config;
  },
  async headers() {
    return [
      {
        // The page shell (nav, brand wordmark, layout) is statically
        // prerendered into HTML at build time. Without this, the browser's
        // disk cache / bfcache can serve a stale shell after a redeploy — e.g.
        // showing the old "FlowCI" brand on first paint until a later
        // navigation revalidates. `no-store` forces every document load to
        // fetch the current build and also opts the page out of bfcache, so a
        // rebrand/redeploy is reflected immediately.
        //
        // The negative lookahead excludes Next.js build output (/_next/*):
        // those assets are content-hashed and MUST stay immutably cached.
        source: "/:path((?!_next/).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
