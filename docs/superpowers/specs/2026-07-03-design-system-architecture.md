# AlphaCI Design System Architecture

Date: 2026-07-03
Status: Approved design direction with council amendments
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
- Phase 0 is a hard gate before design-system migration. Reliability scripts,
  reports, and baselines must exist before moving public or dashboard UI.
- Keep guardrails local to this frontend repo first. Wire them into the shared
  central workflow only after they are stable locally.
- Use report-only guardrails during migration, then enforce once stable.
- Use a fresh reviewed screenshot baseline from the current approved UI before
  visual migration begins.
- Use controlled polish while migrating: spacing, hit area, contrast,
  consistency, and accessibility fixes are allowed.
- Include dev/build reliability as Phase 0.
- Include mojibake reporting and cleanup.
- Defer Radix until a primitive actually needs behavior that is easy to get
  wrong. Do not install Radix during the first public-shell slice.
- Product workflow refactors are behavior-first, styling-second.

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
      settings/
    workflows/
  app/
    page.tsx
    pricing/page.tsx
    home/page.tsx
```

`globals.css` should become a small import and root setup file. It should not
own page-specific or component-specific selectors.

Route files under `src/app` should remain thin Next.js route entry points.
Route-specific composition, state containers, panels, and CSS modules should
move into `features/*`.

`features/*` owns page composition plus feature-specific hooks and API adapters.
Feature modules must not import other feature modules directly. Shared code
flows through `components/ui`, `components/brand`, `components/layout`, `hooks`,
and `lib`.

`components/layout` is for shell composition only. Components with data loading,
workspace state, notifications, billing behavior, or feature mutations belong
in `features/*` or hooks, not in pure layout primitives.

The canonical logo asset lives in `public/`. Rendering, sizing, alt text, and
wordmark treatment are owned by `components/brand`.

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

### Selector Ownership

Every selector should fall into one of these categories:

- `global allowed`: Tailwind import, font setup, design tokens, reset/base
  element styles, root variables, accessibility utilities, and low-level
  layout utilities.
- `primitive-owned`: selectors used only by design-system primitives such as
  button, card, badge, tabs, input, dialog, tooltip, logo, and skip link.
- `feature-owned`: selectors used only by a route or feature such as landing,
  pricing, auth, home, settings, or workflows.
- `legacy-frozen`: existing global selectors that remain temporarily during
  migration but cannot be copied, extended, or used by newly migrated files.

Migrated components must not emit legacy global classes such as
`primary-button`, `ghost-button`, `public-site-*`, page section classes, or
feature-specific dashboard/workflow classes. If a migrated component needs that
styling, create or use a primitive variant or a local CSS module.

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

Primitive APIs must be defined before migration uses them. Each primitive must
document supported variants, sizes, disabled/loading states where relevant,
focus-visible behavior, accessibility expectations, and whether it supports
`asChild` composition.

Initial contracts:

- `Button`: custom AlphaCI component. Supports public and dashboard visual
  modes, primary/secondary/ghost/danger variants, icon spacing, disabled state,
  loading state when needed, and fixed hit-area rules.
- `PublicLink`: custom AlphaCI component for public nav links and public CTAs.
  Handles link hit target, active/current page state, and chevron/icon spacing.
- `Badge`: custom AlphaCI component for status dots, plan tags, and compact
  labels. Tone and size variants must map to design tokens.
- `Card`: custom AlphaCI component with separate dashboard and public surface
  variants. Page-local card styles are allowed only when a primitive variant
  would be misleading.
- `Logo` and `PixelWordmark`: custom brand components that own asset path,
  dimensions, alt text, and public/dashboard sizing rules.
- `PublicNav`: composed from brand and link primitives. It owns no route data
  beyond href labels and active state.
- `SkipLink`: one shared accessibility primitive. Pages should not create
  their own skip-link CSS.

Radix should be added selectively for primitives where behavior and
accessibility are easy to get wrong, such as dialog, dropdown/menu, tabs, and
tooltip. Visual styling remains custom AlphaCI styling. Feature code must not
import Radix directly; it should use AlphaCI wrappers from `components/ui`.

Radix package approval is per primitive:

- Phase 2 first slice: no Radix package.
- Later `Dialog`: `@radix-ui/react-dialog`.
- Later `Tooltip`: `@radix-ui/react-tooltip`.
- Later behavior-heavy `Tabs`: `@radix-ui/react-tabs`.
- Later menu/dropdown: approve package only when a concrete menu surface is
  migrated.

## File Budgets

Budgets are report-only during migration:

- `globals.css`: target under 800 lines after foundation split
- Route pages: target under 500 lines
- Components: target under 350 lines
- CSS modules: target under 400 lines
- Any file over 1,000 lines is a migration priority
- Any file over 5,000 lines is a red flag and must not survive the refactor

After migrated surfaces stabilize, these reports should become failing checks.

Reports must include a baseline file and a current run output. Existing debt can
be grandfathered behind the baseline, but migrated files must pass clean gates.
The rule during migration is no new debt and measurable reduction on the
surface being migrated.

## Guardrails

Add report-only scripts first:

- file-size report
- global selector report
- mojibake report
- CSS import and layer-order check
- route smoke-check runner

Initial local scripts:

- `clean:next`: removes or safely renames stale `.next` output with Windows
  retry behavior.
- `dev:clean`: cleans stale output, checks port 3000, then starts the dev
  server.
- `dev:webpack`: starts Next with webpack fallback for diagnosis when Turbopack
  is unstable.
- `build:clean`: cleans stale output before `next build`.
- `check:file-size`: reports source, style, test, and route files above the
  agreed budgets.
- `check:css-boundaries`: reports global selectors by ownership category and
  detects new prohibited selectors.
- `check:mojibake`: reports mojibake in tracked source files and fails for
  migrated files.
- `check:design-system`: runs file-size, CSS-boundary, mojibake, and route
  smoke checks together.

Baselines:

- file-size baseline
- prohibited global selector baseline
- mojibake baseline
- route screenshot baseline
- allowed exception list with owner and reason

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
before design-system migration can be trusted. Phase 0 is a hard gate before
Phase 1 through Phase 6 migration work.

Deliverables:

- reliable clean dev start script
- reliable clean build script
- port 3000 check or cleanup helper
- stale `.next` cleanup helper
- verification notes for Turbopack vs webpack fallback
- initial reports for file size, global selectors, and mojibake
- initial route smoke runner
- fresh reviewed screenshot baseline for `/`, `/pricing`, auth pages, `/home`,
  and `/settings`
- baseline and exception files for existing oversized files, global selectors,
  and mojibake

Acceptance criteria:

- `dev:clean` starts a reachable app or fails with a clear diagnostic.
- `build:clean` completes or fails with a clear non-stale diagnostic.
- reports run locally without modifying source files.
- stale server reuse is detected instead of silently accepted.
- migrated-file checks can fail independently from legacy baseline reports.

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
- no Radix dependency in the first slice

### Phase 3: Public Shell Vertical Slice

Migrate the public shell in small visible slices. This is the proving ground
because these surfaces caused the most recent regressions.

Deliverables:

- public nav removed from global CSS
- reliable Pricing hit area
- stable logo and wordmark treatment
- landing shell moved to feature-owned styles
- landing page sections migrated only after the shell passes verification
- pricing shell migrated after landing shell, then pricing content
- auth shell migrated after pricing
- rendered verification for nav, pricing link, responsive layout, and skip link

Order:

1. Public nav, logo, and skip link.
2. Landing shell only.
3. Landing sections.
4. Pricing shell.
5. Pricing content.
6. Signup, login, and auth shell.

### Phase 4: Dashboard Shell

Migrate app shell, sidebar, top-level dashboard layout, cards, tabs, quick
actions, and status blocks into reusable primitives and feature modules.

Deliverables:

- smaller `/home` page
- app shell components with local styles
- dashboard card primitives
- consistent status and badge components

`/settings` is not part of the generic dashboard shell. It gets a dedicated
phase because it mixes auth redirect, workspace loading, notifications, usage,
billing, cancellation, and delete-account behavior.

### Phase 5: Settings

Decompose `/settings` into a dedicated feature module before product workflow
styling work.

Priority files:

- `src/app/settings/page.tsx`

Deliverables:

- route page reduced to a thin entry point
- settings feature module with containers and presentational sections
- behavior-preserving tests or route smoke coverage for billing, notifications,
  cancellation, and delete-account flows where feasible
- local CSS modules for settings sections

### Phase 6: Product Workflows

Decompose large product workflow components. Product workflow refactors are
behavior-first, styling-second.

Priority files:

- `src/components/product/workflow-current-tab.tsx`
- `src/components/product/workflow-setup-tab.tsx`
- `src/components/product/deployment-provisioning-setup.tsx`
- `src/components/product/project-env-panel.tsx`
- `src/components/product/workflow-builder.tsx`

Deliverables:

- container hooks separated from presentational panels
- one owner per API call or mutation path
- acceptance checks per tab and flow
- tests around quota loading, create/generate/scan disable rules, GitHub
  installation linking, deployment target normalization, and variable group
  mutation where feasible
- feature-owned subcomponents
- local CSS modules
- smaller testable units
- no component over the agreed budget unless explicitly justified

### Phase 7: Enforced Guardrails

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
4. Capture and review the screenshot baseline for `/`, `/pricing`, auth pages,
   `/home`, and `/settings`.
5. Migrate public nav, logo, skip link, and the landing shell only.
6. Verify file-size improvement, no mojibake in migrated files, Pricing link
   clickability, stable nav spacing, and a shrinking `globals.css`.

This first slice should prove the architecture before pricing, auth, dashboard,
or product workflows are migrated.

## Non-Goals

- Do not redesign the product from scratch.
- Do not replace AlphaCI visual identity with a generic SaaS theme.
- Do not migrate every page in one change.
- Do not add a broad component toolkit before component contracts are clear.
- Do not enforce budgets before the migration has a stable baseline.
- Do not migrate all landing sections in the first slice.
- Do not install Radix before a migrated primitive requires it.
- Do not refactor product workflow styling before behavior ownership is mapped.

## Success Criteria

- Styling changes no longer require editing a 6,000+ line global CSS file.
- Public nav and Pricing link can be changed without breaking unrelated pages.
- New UI work uses primitives or feature-owned CSS modules.
- Mojibake is reported and removed from migrated source.
- Dev/build workflow is reliable enough for rendered verification.
- Large files are reduced gradually and tracked by report.
- Each migration phase leaves the app runnable and reviewable.
- Migrated files do not emit legacy global selectors.
- Guardrail reports show no new debt compared with the approved baseline.
