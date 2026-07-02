# AlphaCI Design System Architecture

Date: 2026-07-03
Status: Approved design direction
Scope: `cicd-workflow-fe`

## Problem

AlphaCI frontend styling is too centralized and fragile. `src/app/globals.css`
has grown past 6,800 lines, which makes simple landing-page or nav changes
risky. Recent work repeatedly caused unrelated regressions: stale CSS chunks,
lost nav layout rules, tiny click targets, visible skip links, and mojibake in
comments. Large route and product files also make changes harder to review.

The goal is to create a real frontend design system and file architecture so
new UI work has clear contracts, smaller files, reliable verification, and less
global selector drift.

## Decisions

- Use a hybrid design system: custom AlphaCI visuals with selective Radix
  primitives for behavior-heavy components.
- Keep the current AlphaCI style, but split its personality by surface:
  - Public marketing pages keep the pixel, terminal, CI/CD identity.
  - Dashboard and product UI use cleaner SaaS primitives with AlphaCI accents.
- Include page and component decomposition, not only CSS extraction.
- Use CSS modules for feature and component styles.
- Use shared global CSS only for tokens, base styles, utilities, and layer
  ordering.
- Use report-only guardrails during migration, then enforce once stable.
- Use controlled polish while migrating: spacing, hit area, contrast,
  consistency, and accessibility fixes are allowed.
- Include dev/build reliability as Phase 0.
- Include mojibake reporting and cleanup.

## Target Architecture

```txt
src/
  styles/
    layers.css
    tokens.css
    base.css
    utilities.css
  components/
    ui/
      button/
      card/
      tabs/
      dialog/
      tooltip/
      badge/
      input/
      nav/
    layout/
      public-shell/
      app-shell/
    brand/
      logo/
      pixel-wordmark/
  features/
    public-site/
      landing/
      pricing/
      auth/
    dashboard/
      home/
      workflows/
      settings/
  app/
    page.tsx
    pricing/page.tsx
    home/page.tsx
```

`globals.css` should become a small import and root setup file. It should not
own page-specific or component-specific selectors.

## Styling Rules

- Global CSS is allowed for:
  - Tailwind import
  - font and root setup
  - design tokens
  - reset/base element styles
  - accessibility utilities such as skip links
  - low-level layout utilities
  - CSS layer ordering
- Global CSS is not allowed for:
  - public nav styling
  - landing section styling
  - pricing card styling
  - dashboard card styling
  - feature-specific selectors
  - component selectors that should be local to a primitive
- Feature styles should live beside the feature as `*.module.css`.
- Repeated selectors should become primitives or shared components, not copied
  into multiple CSS modules.
- Mojibake must be removed from migrated files. Obvious safe mojibake in
  comments and display text can be cleaned globally after a report.

## Component System

Initial primitives:

- `Button`
- `PublicLink`
- `Badge`
- `Card`
- `Tabs`
- `Input`
- `Dialog`
- `Tooltip`
- `Logo`
- `PixelWordmark`
- `PublicNav`
- `SkipLink`

Radix should be added selectively for primitives where behavior and
accessibility are easy to get wrong, such as dialog, dropdown/menu, tabs, and
tooltip. Visual styling remains custom AlphaCI styling.

## File Budgets

Budgets are report-only during migration:

- `globals.css`: target under 800 lines after foundation split
- Route pages: target under 500 lines
- Components: target under 350 lines
- CSS modules: target under 400 lines
- Any file over 1,000 lines is a migration priority
- Any file over 5,000 lines is a red flag and must not survive the refactor

After migrated surfaces stabilize, these reports should become failing checks.

## Guardrails

Add report-only scripts first:

- file-size report
- global selector report
- mojibake report
- CSS import and layer-order check
- route smoke-check runner

Later enforcement:

- fail when `globals.css` grows beyond the agreed budget
- fail when new page/component selectors are added to global CSS
- fail when migrated pages exceed agreed file budgets without an explicit
  exception
- fail when mojibake appears in tracked source files

## Phases

### Phase 0: Reliability Baseline

Fix or document the local dev and build loop before large UI migration work.
The current workflow can serve stale CSS, leave hung Next processes on port
3000, and fail `.next` cleanup under the Windows sandbox. This must be handled
before design-system migration can be trusted.

Deliverables:

- reliable clean dev start script
- reliable clean build script
- port 3000 check or cleanup helper
- stale `.next` cleanup helper
- verification notes for Turbopack vs webpack fallback
- initial reports for file size, global selectors, and mojibake

### Phase 1: Style Foundation

Create `src/styles` and move foundations out of `globals.css`.

Deliverables:

- `src/styles/layers.css`
- `src/styles/tokens.css`
- `src/styles/base.css`
- `src/styles/utilities.css`
- reduced `src/app/globals.css`
- mojibake cleanup for moved foundation comments and text

### Phase 2: UI Primitives

Create the initial `components/ui`, `components/brand`, and shell primitives.

Deliverables:

- reusable primitive APIs
- CSS modules for primitive styling
- Radix wrappers only where needed
- basic usage examples in migrated public shell components

### Phase 3: Public Shell Vertical Slice

Migrate public nav, logo, landing, pricing, signup, login, and auth shell into
the new architecture. This is the proving ground because these surfaces caused
the most recent regressions.

Deliverables:

- public nav removed from global CSS
- reliable Pricing hit area
- stable logo and wordmark treatment
- landing page section components
- pricing page section components
- auth page shell components
- rendered verification for nav, pricing link, responsive layout, and skip link

### Phase 4: Dashboard Shell

Migrate app shell, sidebar, top-level dashboard layout, cards, tabs, quick
actions, and status blocks into reusable primitives and feature modules.

Deliverables:

- smaller `/home` page
- app shell components with local styles
- dashboard card primitives
- consistent status and badge components

### Phase 5: Product Workflows

Decompose large product workflow components.

Priority files:

- `src/components/product/workflow-current-tab.tsx`
- `src/components/product/workflow-setup-tab.tsx`
- `src/components/product/deployment-provisioning-setup.tsx`
- `src/components/product/project-env-panel.tsx`
- `src/components/product/workflow-builder.tsx`

Deliverables:

- feature-owned subcomponents
- local CSS modules
- smaller testable units
- no component over the agreed budget unless explicitly justified

### Phase 6: Enforced Guardrails

Once the main migrated surfaces are stable, convert report-only checks into
failing checks.

Deliverables:

- file-size budget enforcement
- global selector enforcement
- mojibake enforcement
- updated contributor/design-system documentation

## First Implementation Slice

The first implementation plan should include:

1. Add reliability scripts and reports.
2. Create the style foundation files.
3. Create first primitives: `Button`, `PublicLink`, `Badge`, `Logo`,
   `PublicNav`, and `SkipLink`.
4. Migrate public nav and the landing shell.
5. Verify file-size improvement, no mojibake in migrated files, Pricing link
   clickability, stable nav spacing, and a shrinking `globals.css`.

This first slice should prove the architecture before pricing, auth, dashboard,
or product workflows are migrated.

## Non-Goals

- Do not redesign the product from scratch.
- Do not replace AlphaCI visual identity with a generic SaaS theme.
- Do not migrate every page in one change.
- Do not add a broad component toolkit before component contracts are clear.
- Do not enforce budgets before the migration has a stable baseline.

## Success Criteria

- Styling changes no longer require editing a 6,000+ line global CSS file.
- Public nav and Pricing link can be changed without breaking unrelated pages.
- New UI work uses primitives or feature-owned CSS modules.
- Mojibake is reported and removed from migrated source.
- Dev/build workflow is reliable enough for rendered verification.
- Large files are reduced gradually and tracked by report.
- Each migration phase leaves the app runnable and reviewable.