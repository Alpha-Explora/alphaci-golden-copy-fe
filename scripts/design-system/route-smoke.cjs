#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { toPosix, writeJson } = require('./lib/report-helpers.cjs');

const rootDir = process.cwd();

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function isLocalhost(baseUrl) {
  try {
    const url = new URL(baseUrl);
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function assertFreshLocalMarker(baseUrl) {
  if (hasFlag('--allow-existing-server') || process.env.DESIGN_SYSTEM_ALLOW_EXISTING_SERVER === '1') return;
  if (!isLocalhost(baseUrl)) return;

  const markerPath = path.join(rootDir, '.design-system', 'runtime', 'dev-server.json');
  if (!fs.existsSync(markerPath)) {
    throw new Error('Route smoke refused local server: missing .design-system/runtime/dev-server.json. Start with npm run dev:clean or pass --allow-existing-server for an intentional external check.');
  }

  const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  const ageMs = Date.now() - Date.parse(marker.startedAt || '1970-01-01T00:00:00.000Z');
  if (marker.baseUrl !== baseUrl) {
    throw new Error(`Route smoke refused local server: runtime marker is for ${marker.baseUrl}, not ${baseUrl}.`);
  }
  if (!Number.isFinite(ageMs) || ageMs > 12 * 60 * 60 * 1000) {
    throw new Error('Route smoke refused local server: runtime marker is stale. Start with npm run dev:clean.');
  }
}

async function isReachable(baseUrl) {
  try {
    const response = await fetch(baseUrl, { method: 'GET' });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

async function smokeRoute(page, baseUrl, routePath, options) {
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onPageError = (error) => pageErrors.push(error.message);

  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  try {
    const response = await page.goto(`${baseUrl}${routePath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    const status = response ? response.status() : 0;
    const title = await page.title().catch(() => '');
    const skipped = status === 404;
    const failed = status >= 500 || consoleErrors.length > 0 || pageErrors.length > 0;
    let screenshot = null;

    if (options.screenshots && !skipped) {
      const fileName = routePath === '/' ? 'root.png' : `${routePath.replace(/^\//, '').replace(/\//g, '-')}.png`;
      screenshot = path.join(options.outputDir, fileName);
      fs.mkdirSync(options.outputDir, { recursive: true });
      await page.screenshot({ path: screenshot, fullPage: true });
      screenshot = toPosix(path.relative(rootDir, screenshot));
    }

    return { path: routePath, status, title, skipped, failed, screenshot, consoleErrors, pageErrors };
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }
}

async function main() {
  const baseUrl = argValue('--base-url', process.env.DESIGN_SYSTEM_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
  const baselineMode = hasFlag('--baseline');
  const outputDir = path.resolve(argValue('--output-dir', baselineMode ? '.design-system/screenshots/baseline' : '.design-system/screenshots/current'));
  const screenshots = baselineMode || hasFlag('--screenshots') || process.env.DESIGN_SYSTEM_SCREENSHOTS === '1';
  const reportPath = path.join(rootDir, '.design-system', 'reports', 'route-smoke.json');
  const baselineManifestPath = path.join(rootDir, '.design-system', 'baselines', 'screenshots.json');
  const routes = ['/', '/pricing', '/home', '/settings', '/login', '/signup', '/workflows', '/runs', '/subscribe'];

  assertFreshLocalMarker(baseUrl);

  if (!(await isReachable(baseUrl))) {
    console.error(`Route smoke failed: ${baseUrl} is not reachable.`);
    console.error('Start a clean server with npm run dev:clean or set DESIGN_SYSTEM_BASE_URL.');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  try {
    const results = [];
    for (const routePath of routes) results.push(await smokeRoute(page, baseUrl, routePath, { screenshots, outputDir }));

    const report = { generatedAt: new Date().toISOString(), mode: 'report-only', baseUrl, screenshots, routes: results };
    writeJson(reportPath, report);

    if (baselineMode) {
      writeJson(baselineManifestPath, {
        version: 1,
        status: 'captured',
        reviewed: false,
        capturedAt: report.generatedAt,
        baseUrl,
        routes: results.map((result) => ({ path: result.path, status: result.status, screenshot: result.screenshot })),
      });
    }

    const failed = results.filter((result) => result.failed);
    const skipped = results.filter((result) => result.skipped);
    console.log(`Route smoke: ${results.length} routes checked`);
    console.log(`Skipped 404 routes: ${skipped.length}`);
    console.log(`Failed routes: ${failed.length}`);
    console.log(`Report written: ${toPosix(path.relative(rootDir, reportPath))}`);

    if (failed.length > 0) {
      for (const result of failed) console.error(`${result.path} failed with status ${result.status}`);
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});