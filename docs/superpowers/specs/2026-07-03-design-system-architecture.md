# AlphaCI Design System Architecture

Date: 2026-07-03
Status: Completed and archived on 2026-07-04
Scope: `cicd-workflow-fe`

## Completion Record

The design-system migration is no longer active. The branch
`feature/migrate-vercel-render-to-gcp` now has the architecture in place for
normal product work to continue.

The temporary migration guardrail folder `.design-system/` and the temporary
`scripts/design-system/` tooling were removed during close-out. They were useful
for the migration run, but should not remain as active repo workflow after the
migration is considered complete.

Current verification should use the normal app checks:

- `npm run lint`
- `npm test -- --coverage=false`
- `npm run build`

For local development, keep using:

- `npm run dev:clean`
- `npm run dev:webpack` only when diagnosing Turbopack issues
- `npm run build:clean` when stale `.next` output is suspected

## Final Structure

The migration established these ownership boundaries:

- `src/styles/layers.css`: Tailwind layer ordering.
- `src/styles/tokens.css`: AlphaCI design tokens.
- `src/styles/base.css`: base document and element styles.
- `src/styles/utilities.css`: low-level shared utilities.
- `src/styles/public-site.css`: public guide and public-site-specific styles.
- `src/styles/auth.css`: login, signup, callback, and auth-provider styles.
- `src/styles/product-workflows.css`: workflow/project/deployment UI styles.
- `src/styles/provider-settings.css`: deployment provider settings styles.
- `src/app/globals.css`: global imports and remaining legacy/global selectors.
- `src/components/brand/*`: logo and pixel wordmark ownership.
- `src/components/layout/*`: public and app shell ownership.
- `src/components/ui/*`: shared primitives such as badge, card, public link,
  skip link, and tabs.
- `src/features/public-site/*`: public landing and pricing composition.
- `src/components/product/*`: product workflow panels and workflow containers.

## Rules Going Forward

- Do not add new feature/page selectors to `src/app/globals.css`.
- Put new public-site styles in the owning public feature/style file.
- Put auth styles in `src/styles/auth.css` or a future auth feature module.
- Put workflow styles in `src/styles/product-workflows.css` or a future
  workflow feature module.
- Put provider settings styles in `src/styles/provider-settings.css` or a
  future settings feature module.
- Prefer shared primitives when repeated selectors appear across surfaces.
- Keep route files thin and move substantial composition into components or
  feature modules.
- Keep dark-only styling unless the product strategy changes.
- Remove mojibake when touching a file.

## Remaining Debt

`src/app/globals.css` is still larger than the long-term ideal, but it is below
the hard 5,000-line red flag and no longer blocks product development. Future
cleanup should happen opportunistically while touching related surfaces.

Current known architectural debt:

- Some legacy global selectors still live in `src/app/globals.css`.
- Some extracted style files are intentionally plain CSS instead of CSS modules
  to preserve visuals and reduce churn.
- Some product workflow files remain near the accepted buffered size limits.

This debt is not an active migration phase. Treat it as normal maintenance:
reduce it when it is already in the path of a product change.

## Non-Goals

- Do not restart the migration as a standing project.
- Do not restore `.design-system/` evidence or `scripts/design-system/`
  guardrails unless a new migration needs them.
- Do not redesign the product from scratch as part of architecture cleanup.
- Do not introduce a broad component toolkit before a concrete primitive needs
  it.
