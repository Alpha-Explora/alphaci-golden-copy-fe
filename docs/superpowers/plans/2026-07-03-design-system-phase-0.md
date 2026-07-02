# AlphaCI Design System Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reliability baseline, guardrail reports, and visual-baseline tooling required before any design-system migration changes public, dashboard, settings, or workflow UI.

**Architecture:** Phase 0 adds small Node-based scripts under `scripts/` and pure helper functions for reports. The scripts are local-first, report-only by default, and designed to avoid silently reusing stale servers or stale `.next` output. The existing app visuals are preserved; this phase does not migrate UI styles.

**Tech Stack:** Next.js 16, React 19, Jest 30, Playwright, Node.js scripts using CommonJS for direct Jest coverage.

---

## File Structure

- Create `scripts/design-system/lib/report-helpers.cjs`: pure helpers for line counting, mojibake detection, CSS selector extraction/classification, file-size reporting, baseline comparison, and JSON report writing.
- Create `tests/unit/design-system-report-helpers.test.js`: Jest tests for report helpers.
- Create `scripts/design-system/report-file-size.cjs`: CLI for file-size report and `.design-system/reports/file-size.json` output.
- Create `scripts/design-system/report-mojibake.cjs`: CLI for mojibake report and `.design-system/reports/mojibake.json` output.
- Create `scripts/design-system/report-css-boundaries.cjs`: CLI for `src/app/globals.css` selector ownership report and `.design-system/reports/css-boundaries.json` output.
- Create `scripts/design-system/route-smoke.cjs`: Playwright route smoke and optional screenshot baseline capture for `/`, `/pricing`, `/home`, `/settings`, `/login`, and `/signup` when routes exist.
- Create `scripts/design-system/check-design-system.cjs`: aggregate runner for file-size, CSS-boundary, mojibake, and route smoke checks.
- Create `scripts/dev/clean-next.cjs`: Windows-safe `.next` cleanup helper with remove-then-rename fallback.
- Create `scripts/dev/run-next-dev.cjs`: clean dev starter that checks port availability before starting Next and supports Turbopack or webpack mode.
- Modify `package.json`: add Phase 0 scripts without changing existing script names.
- Create `.design-system/baselines/file-size.json`: current over-budget file debt baseline with schema.
- Create `.design-system/baselines/css-boundaries.json`: current non-global selector debt baseline with schema.
- Create `.design-system/baselines/mojibake.json`: current mojibake file debt baseline with schema.
- Create `.design-system/baselines/exceptions.json`: explicit exception list for accepted Phase 0 debt.
- Modify `.gitignore`: ignore `.design-system/reports/` and `.design-system/screenshots/current/`; keep baselines trackable.

## Task 1: Report Helper Tests

**Files:**
- Create: `tests/unit/design-system-report-helpers.test.js`
- Create later in Task 2: `scripts/design-system/lib/report-helpers.cjs`

- [ ] **Step 1: Write failing helper tests**

Create `tests/unit/design-system-report-helpers.test.js`:

```js
const {
  countLines,
  detectMojibake,
  classifyGlobalSelector,
  extractCssSelectors,
  createFileSizeReport,
} = require('../../scripts/design-system/lib/report-helpers.cjs');

describe('design-system report helpers', () => {
  test('countLines handles empty, single-line, and multi-line text', () => {
    expect(countLines('')).toBe(0);
    expect(countLines('one')).toBe(1);
    expect(countLines('one\ntwo\n')).toBe(2);
  });

  test('detectMojibake reports common corrupted characters with indexes', () => {
    expect(detectMojibake('clean text')).toEqual([]);
    const marker = String.fromCharCode(0xe2);
    expect(detectMojibake(`bad ${marker} text`)).toEqual([
      { index: 4, value: marker, reason: 'common mojibake marker' },
    ]);
  });

  test('classifyGlobalSelector separates allowed, primitive, feature, and unknown selectors', () => {
    expect(classifyGlobalSelector(':root')).toBe('global allowed');
    expect(classifyGlobalSelector('.skip-link')).toBe('global allowed');
    expect(classifyGlobalSelector('.button')).toBe('primitive-owned');
    expect(classifyGlobalSelector('.public-site-nav')).toBe('feature-owned');
    expect(classifyGlobalSelector('.raw-hero-actions')).toBe('feature-owned');
    expect(classifyGlobalSelector('.surprise-selector')).toBe('legacy-frozen');
  });

  test('extractCssSelectors ignores at-rules and keeps comma-separated selectors', () => {
    const css = '@media (min-width: 800px) { .a, .b:hover { color: red; } }\n:root { --x: 1; }';
    expect(extractCssSelectors(css)).toEqual(['.a', '.b:hover', ':root']);
  });

  test('createFileSizeReport marks files above their budget', () => {
    const report = createFileSizeReport([
      { path: 'src/app/globals.css', lines: 900 },
      { path: 'src/app/page.tsx', lines: 499 },
      { path: 'src/components/product/workflow-current-tab.tsx', lines: 1200 },
    ]);

    expect(report.overBudget.map((item) => item.path)).toEqual([
      'src/app/globals.css',
      'src/components/product/workflow-current-tab.tsx',
    ]);
    expect(report.redFlags.map((item) => item.path)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run helper tests and verify they fail because helpers do not exist**

Run: `npm test -- tests/unit/design-system-report-helpers.test.js --runInBand --coverage=false`

Expected: FAIL with a module-not-found error for `scripts/design-system/lib/report-helpers.cjs`.

## Task 2: Report Helper Implementation

**Files:**
- Create: `scripts/design-system/lib/report-helpers.cjs`
- Test: `tests/unit/design-system-report-helpers.test.js`

- [ ] **Step 1: Implement pure helper module**

Create `scripts/design-system/lib/report-helpers.cjs` with these exported functions:

```js
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_BUDGETS = {
  'src/app/globals.css': 800,
  route: 500,
  component: 350,
  cssModule: 400,
  priority: 1000,
  redFlag: 5000,
};

const MOJIBAKE_MARKERS = ['\\u00e2', '\\ufffd', '\\u00c3', '\\u00c2', '\\u00f0', '\\u00d0'];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function countLines(text) {
  if (text.length === 0) return 0;
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '').split('\n').length;
}

function detectMojibake(text) {
  const hits = [];
  for (let index = 0; index < text.length; index += 1) {
    const value = text[index];
    if (MOJIBAKE_MARKERS.includes(value)) {
      hits.push({ index, value, reason: 'common mojibake marker' });
    }
  }
  return hits;
}

function classifyGlobalSelector(selector) {
  const normalized = selector.trim();
  if (normalized === ':root' || normalized === 'html' || normalized === 'body' || normalized.startsWith('*') || normalized.includes('.skip-link')) {
    return 'global allowed';
  }
  if (/\.(button|badge|card|tabs|tab|input|dialog|tooltip|logo|wordmark)\b/.test(normalized)) {
    return 'primitive-owned';
  }
  if (/\.(public-site|raw-hero|pricing|landing|auth|dashboard|workflow|settings|home|app-nav)\b/.test(normalized)) {
    return 'feature-owned';
  }
  return 'legacy-frozen';
}

function extractCssSelectors(cssText) {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  const regex = /([^{}@]+)\{/g;
  let match;
  while ((match = regex.exec(withoutComments)) !== null) {
    const raw = match[1].trim();
    if (!raw || raw.includes(':') && raw.endsWith(')')) continue;
    for (const selector of raw.split(',')) {
      const trimmed = selector.trim();
      if (trimmed && !trimmed.startsWith('@')) selectors.push(trimmed);
    }
  }
  return selectors;
}

function budgetForPath(filePath, budgets = DEFAULT_BUDGETS) {
  const posix = toPosix(filePath);
  if (posix === 'src/app/globals.css') return budgets['src/app/globals.css'];
  if (/\.module\.css$/.test(posix)) return budgets.cssModule;
  if (/src\/app\/.*page\.tsx$/.test(posix)) return budgets.route;
  if (/src\/components\/.*\.(tsx|ts)$/.test(posix)) return budgets.component;
  return budgets.priority;
}

function createFileSizeReport(files, budgets = DEFAULT_BUDGETS) {
  const items = files.map((file) => ({ ...file, budget: budgetForPath(file.path, budgets) }));
  return {
    generatedAt: new Date().toISOString(),
    budgets,
    files: items,
    overBudget: items.filter((file) => file.lines > file.budget),
    migrationPriority: items.filter((file) => file.lines > budgets.priority),
    redFlags: items.filter((file) => file.lines > budgets.redFlag),
  };
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

module.exports = {
  DEFAULT_BUDGETS,
  MOJIBAKE_MARKERS,
  toPosix,
  countLines,
  detectMojibake,
  classifyGlobalSelector,
  extractCssSelectors,
  createFileSizeReport,
  ensureDirectory,
  writeJson,
};
```

- [ ] **Step 2: Run helper tests and verify they pass**

Run: `npm test -- tests/unit/design-system-report-helpers.test.js --runInBand --coverage=false`

Expected: PASS for all tests in `design-system-report-helpers.test.js`.

## Task 3: Local Report Scripts and Baselines

**Files:**
- Create: `scripts/design-system/report-file-size.cjs`
- Create: `scripts/design-system/report-mojibake.cjs`
- Create: `scripts/design-system/report-css-boundaries.cjs`
- Create: `.design-system/baselines/file-size.json`
- Create: `.design-system/baselines/css-boundaries.json`
- Create: `.design-system/baselines/mojibake.json`
- Create: `.design-system/baselines/exceptions.json`

- [ ] **Step 1: Add report CLIs**

Each CLI should scan the repo, write `.design-system/reports/*.json`, print a short summary, and exit `0` in report-only mode. `report-file-size.cjs` scans `src`, `tests`, `scripts`, and `docs/superpowers`. `report-mojibake.cjs` scans tracked source-like files. `report-css-boundaries.cjs` reads `src/app/globals.css` and classifies selectors using `classifyGlobalSelector`.

- [ ] **Step 2: Add baseline files**

Create JSON files with this shape:

```json
{
  "version": 1,
  "mode": "report-only",
  "createdFor": "design-system-phase-0",
  "items": []
}
```

For `.design-system/baselines/exceptions.json`, use:

```json
{
  "version": 1,
  "exceptions": []
}
```

- [ ] **Step 3: Run reports**

Run:

```powershell
node scripts/design-system/report-file-size.cjs
node scripts/design-system/report-mojibake.cjs
node scripts/design-system/report-css-boundaries.cjs
```

Expected: each command exits `0`, writes a report under `.design-system/reports/`, and prints counts.

## Task 4: Dev Reliability Scripts

**Files:**
- Create: `scripts/dev/clean-next.cjs`
- Create: `scripts/dev/run-next-dev.cjs`

- [ ] **Step 1: Add `.next` cleanup helper**

`clean-next.cjs` removes `.next` when possible. If removal fails on Windows, it renames `.next` to `.next-stale-<timestamp>` and prints the fallback path.

- [ ] **Step 2: Add guarded dev starter**

`run-next-dev.cjs` checks whether the target port accepts a TCP connection. If the port is in use, it exits `1` with a clear stale-server diagnostic. If the port is free, it runs `clean-next.cjs`, then starts `npx next dev --turbopack --hostname 127.0.0.1 --port <port>` or `npx next dev --webpack --hostname 127.0.0.1 --port <port>` depending on `--mode`.

- [ ] **Step 3: Run cleanup helper**

Run: `node scripts/dev/clean-next.cjs`

Expected: exits `0` and reports whether `.next` was removed, renamed, or absent.

## Task 5: Route Smoke and Aggregate Check

**Files:**
- Create: `scripts/design-system/route-smoke.cjs`
- Create: `scripts/design-system/check-design-system.cjs`

- [ ] **Step 1: Add route smoke runner**

`route-smoke.cjs` accepts `--base-url`, `--screenshots`, and `--output-dir`. It visits `/`, `/pricing`, `/home`, `/settings`, `/login`, `/signup`, `/workflows`, `/runs`, and `/subscribe`. It records status, title, console errors, and screenshots when requested. Missing routes with `404` are recorded as skipped; HTTP `500` or browser errors fail.

- [ ] **Step 2: Add aggregate runner**

`check-design-system.cjs` runs the three report scripts and then route smoke against `DESIGN_SYSTEM_BASE_URL` or `http://127.0.0.1:3000`.

- [ ] **Step 3: Run aggregate check against the current local app if reachable**

Run: `node scripts/design-system/check-design-system.cjs`

Expected: reports run. Route smoke either passes against a reachable app started by `npm run dev:clean`, or fails with a clear message that no clean runtime marker/server is reachable.

## Task 6: Package Scripts and Gitignore

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Add package scripts**

Add these scripts while keeping existing scripts:

```json
{
  "clean:next": "node scripts/dev/clean-next.cjs",
  "dev:clean": "node scripts/dev/run-next-dev.cjs --mode turbo --port 3000",
  "dev:webpack": "node scripts/dev/run-next-dev.cjs --mode webpack --port 3000",
  "build:clean": "node scripts/dev/clean-next.cjs && next build",
  "check:file-size": "node scripts/design-system/report-file-size.cjs",
  "check:css-boundaries": "node scripts/design-system/report-css-boundaries.cjs",
  "check:mojibake": "node scripts/design-system/report-mojibake.cjs",
  "check:routes": "node scripts/design-system/route-smoke.cjs",
  "check:design-system": "node scripts/design-system/check-design-system.cjs"
}
```

- [ ] **Step 2: Add report ignores**

Add these lines to `.gitignore`:

```gitignore
.design-system/reports/
.design-system/screenshots/current/
```

Baselines under `.design-system/baselines/` remain trackable.

## Task 7: Phase 0 Verification and Council Review

**Files:**
- Read: `docs/superpowers/specs/2026-07-03-design-system-architecture.md`
- Read: generated `.design-system/reports/*.json`

- [ ] **Step 1: Run verification commands**

Run:

```powershell
npm test -- tests/unit/design-system-report-helpers.test.js --runInBand --coverage=false
npm run check:file-size
npm run check:css-boundaries
npm run check:mojibake
npm run check:design-system
```

Expected: unit tests pass. Report scripts exit `0`. `check:design-system` may fail only at route smoke if no reachable server exists; if it fails, capture the exact message.

- [ ] **Step 2: Spawn phase council**

Spawn review agents for:

1. Reliability scripts and stale-server behavior.
2. Report helper correctness and baselines.
3. Visual baseline and route smoke coverage.
4. Spec compliance for Phase 0.

- [ ] **Step 3: Fix council findings before Phase 1**

Fix all Critical and Important findings. Re-run the affected verification commands. Do not start Phase 1 until Phase 0 council review is resolved, the Phase 0 changes are committed, and the branch is pushed to origin.
- [ ] **Step 4: Commit and push Phase 0 on the current branch**

Run:

```powershell
git branch --show-current
git add docs/superpowers/specs/2026-07-03-design-system-architecture.md docs/superpowers/plans/2026-07-03-design-system-phase-0.md package.json .gitignore scripts .design-system/baselines tests/unit/design-system-report-helpers.test.js
git commit -m "chore: add design system phase 0 guardrails"
git push origin feature/migrate-vercel-render-to-gcp
```

Expected: current branch is `feature/migrate-vercel-render-to-gcp`; commit succeeds; push succeeds. If `.git/index.lock` exists while Git processes are active, wait instead of deleting the lock.

## Council Fix Notes

- Phase 0 commits must stage only tooling, docs, tests, package scripts, `.gitignore`, and `.design-system/baselines/`. Existing public UI, route, logo, theme, and `globals.css` changes in the working tree are treated as pre-existing visual work and must not be swept into the Phase 0 commit.
- File-size and mojibake scanners stream large files. They must not read the 300MB+ `src/app/globals.css` into memory.
- Baseline files are not placeholders. They freeze current accepted debt so later phases can report no-new-debt deltas.
- Local route smoke requires a fresh `.design-system/runtime/dev-server.json` marker from `npm run dev:clean`, unless `--allow-existing-server` is passed intentionally.
- Screenshot baseline capture is tracked by `.design-system/baselines/screenshots.json`. It may remain `pending-capture` in Phase 0 when `.next` is locked or a clean server cannot be started; Phase 1 cannot begin until the screenshot baseline is captured and reviewed.
