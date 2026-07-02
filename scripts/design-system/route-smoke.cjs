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


function windowsBrowserFallbacks() {
  if (process.platform !== 'win32') return [];
  return [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter((candidate) => fs.existsSync(candidate));
}

async function launchBrowser() {
  const requested = process.env.DESIGN_SYSTEM_BROWSER_EXECUTABLE;
  const candidates = requested ? [requested] : [null, ...windowsBrowserFallbacks()];
  const errors = [];

  for (const executablePath of candidates) {
    try {
      const browser = await chromium.launch({
        headless: true,
        executablePath: executablePath || undefined,
      });
      return { browser, executablePath: executablePath || 'playwright-managed' };
    } catch (error) {
      errors.push(`${executablePath || 'playwright-managed'}: ${error.message || error}`);
      if (requested) break;
    }
  }

  throw new Error(`Unable to launch a browser for route smoke. Tried: ${errors.join(' | ')}`);
}

function routeList() {
  const raw = argValue('--routes', process.env.DESIGN_SYSTEM_ROUTES || '');
  if (!raw) return ['/', '/pricing', '/home', '/settings', '/login', '/signup', '/workflows', '/runs', '/subscribe'];
  const routes = raw.split(',').map((route) => route.trim()).filter(Boolean);
  if (routes.length === 0) throw new Error('--routes must include at least one route.');
  return routes;
}

async function primeScrollTriggeredSections(page, settleMs) {
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  if (!Number.isFinite(pageHeight) || !Number.isFinite(viewportHeight) || pageHeight <= viewportHeight) return;

  const step = Math.max(240, Math.floor(viewportHeight * 0.75));
  for (let position = 0; position < pageHeight; position += step) {
    await page.evaluate((y) => window.scrollTo(0, y), position);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(settleMs);
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
    const skipped = status === 404;
    if (!skipped) {
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(options.settleMs);
    }
    const title = await page.title().catch(() => '');
    let screenshot = null;

    if (options.screenshots && !skipped) {
      if (options.primeScroll) await primeScrollTriggeredSections(page, options.settleMs);
      const fileName = routePath === '/' ? 'root.png' : `${routePath.replace(/^\//, '').replace(/\//g, '-')}.png`;
      screenshot = path.join(options.outputDir, fileName);
      fs.mkdirSync(options.outputDir, { recursive: true });
      await page.screenshot({ path: screenshot, fullPage: options.fullPage });
      screenshot = toPosix(path.relative(rootDir, screenshot));
    }

    const failed =
      status === 0 ||
      (!skipped && status >= 400) ||
      (skipped && !options.allowMissingRoutes) ||
      pageErrors.length > 0;
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
  const fullPage = !hasFlag('--viewport-only') && process.env.DESIGN_SYSTEM_VIEWPORT_ONLY !== '1';
  const primeScroll = fullPage && !hasFlag('--no-prime-scroll') && process.env.DESIGN_SYSTEM_NO_PRIME_SCROLL !== '1';
  const settleMs = Number(argValue('--settle-ms', process.env.DESIGN_SYSTEM_SETTLE_MS || '1500'));
  if (!Number.isFinite(settleMs) || settleMs < 0) {
    throw new Error('--settle-ms must be a finite non-negative number.');
  }
  const reportPath = path.join(rootDir, '.design-system', 'reports', 'route-smoke.json');
  const baselineManifestPath = path.join(rootDir, '.design-system', 'baselines', 'screenshots.json');
  const routes = routeList();
  const allowMissingRoutes = hasFlag('--allow-missing-routes') || process.env.DESIGN_SYSTEM_ALLOW_MISSING_ROUTES === '1';

  assertFreshLocalMarker(baseUrl);

  if (!(await isReachable(baseUrl))) {
    console.error(`Route smoke failed: ${baseUrl} is not reachable.`);
    console.error('Start a clean server with npm run dev:clean or set DESIGN_SYSTEM_BASE_URL.');
    process.exit(1);
  }

  const launched = await launchBrowser();
  const browser = launched.browser;
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  try {
    const results = [];
    for (const routePath of routes) results.push(await smokeRoute(page, baseUrl, routePath, { screenshots, outputDir, settleMs, baselineMode, allowMissingRoutes, fullPage, primeScroll }));

    const report = {
      generatedAt: new Date().toISOString(),
      mode: 'report-only',
      baseUrl,
      screenshots,
      settleMs,
      routeScope: routes,
      consoleErrorMode: 'report-only',
      browserExecutable: launched.executablePath,
      viewport: { width: 1366, height: 900 },
      fullPage,
      primeScroll,
      routes: results,
    };
    writeJson(reportPath, report);

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

    if (baselineMode) {
      writeJson(baselineManifestPath, {
        version: 1,
        status: 'captured',
        reviewed: false,
        capturedAt: report.generatedAt,
        baseUrl,
        routeScope: routes,
        browserExecutable: report.browserExecutable,
        viewport: report.viewport,
        fullPage: report.fullPage,
        primeScroll: report.primeScroll,
        routes: results.map((result) => ({ path: result.path, status: result.status, screenshot: result.screenshot })),
      });
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
