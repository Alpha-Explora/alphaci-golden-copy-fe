#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const {
  classifyGlobalSelectorDetailed,
  compareBaselineItems,
  readJsonIfExists,
  toPosix,
  writeJson,
} = require('./lib/report-helpers.cjs');

const rootDir = process.cwd();
const globalsPath = path.join(rootDir, 'src', 'app', 'globals.css');
const stylesDir = path.join(rootDir, 'src', 'styles');
const reportPath = path.join(rootDir, '.design-system', 'reports', 'css-boundaries.json');
const baselinePath = path.join(rootDir, '.design-system', 'baselines', 'css-boundaries.json');

function globalCssPaths() {
  const paths = [globalsPath];
  if (fs.existsSync(stylesDir)) {
    const styleFiles = fs.readdirSync(stylesDir)
      .filter((fileName) => fileName.endsWith('.css'))
      .sort()
      .map((fileName) => path.join(stylesDir, fileName));
    paths.push(...styleFiles);
  }
  return paths;
}

function shouldSkipSelector(selector) {
  const normalized = selector.trim();
  return (
    !normalized ||
    normalized.startsWith('@') ||
    normalized.includes('@') ||
    /^(media|supports|keyframes|font-face|layer|container)\b/.test(normalized)
  );
}

function addSelectorChunk(selectors, chunk, line, filePath) {
  const beforeBrace = chunk.slice(0, chunk.indexOf('{')).trim();
  if (shouldSkipSelector(beforeBrace)) return;
  for (const selector of beforeBrace.split(',')) {
    const trimmed = selector.trim();
    if (!shouldSkipSelector(trimmed)) {
      const key = `${toPosix(path.relative(rootDir, filePath))}::${trimmed}`;
      if (!selectors.has(key)) selectors.set(key, { selector: trimmed, line, filePath });
    }
  }
}

async function extractSelectorsFromFile(filePath) {
  const selectors = new Map();
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let pending = '';
  let pendingLine = 1;
  let inBlockComment = false;
  let keyframeDepth = 0;
  let lineNumber = 0;

  for await (const line of lines) {
    lineNumber += 1;
    let current = line;

    if (inBlockComment) {
      const end = current.indexOf('*/');
      if (end === -1) continue;
      current = current.slice(end + 2);
      inBlockComment = false;
    }

    while (current.includes('/*')) {
      const start = current.indexOf('/*');
      const end = current.indexOf('*/', start + 2);
      if (end === -1) {
        current = current.slice(0, start);
        inBlockComment = true;
        break;
      }
      current = `${current.slice(0, start)} ${current.slice(end + 2)}`;
    }

    const trimmed = current.trim();
    if (!trimmed) continue;

    if (/^@(keyframes|-webkit-keyframes)\b/.test(trimmed)) {
      keyframeDepth += (trimmed.match(/\{/g) || []).length;
      keyframeDepth -= (trimmed.match(/\}/g) || []).length;
      continue;
    }
    if (keyframeDepth > 0) {
      keyframeDepth += (trimmed.match(/\{/g) || []).length;
      keyframeDepth -= (trimmed.match(/\}/g) || []).length;
      if (keyframeDepth < 0) keyframeDepth = 0;
      continue;
    }
    if (!pending) pendingLine = lineNumber;
    pending = pending ? `${pending} ${trimmed}` : trimmed;

    while (pending.includes('{')) {
      addSelectorChunk(selectors, pending, pendingLine, filePath);
      pending = pending.slice(pending.indexOf('{') + 1);
      if (pending.includes('}')) pending = pending.slice(pending.lastIndexOf('}') + 1).trim();
      pendingLine = lineNumber;
      if (!pending.includes('{')) break;
    }

    if (trimmed.includes('}')) pending = '';
  }

  return [...selectors.values()].sort((a, b) => {
    const sourceCompare = toPosix(path.relative(rootDir, a.filePath)).localeCompare(toPosix(path.relative(rootDir, b.filePath)));
    if (sourceCompare !== 0) return sourceCompare;
    return a.selector.localeCompare(b.selector);
  });
}

async function main() {
  const cssPaths = globalCssPaths();
  const missing = cssPaths.filter((filePath) => !fs.existsSync(filePath));
  if (missing.length > 0) {
    console.error(`CSS boundary report failed: missing CSS files: ${missing.map((filePath) => toPosix(path.relative(rootDir, filePath))).join(', ')}`);
    process.exit(1);
  }

  const selectors = [];
  for (const filePath of cssPaths) selectors.push(...await extractSelectorsFromFile(filePath));

  const items = selectors.map(({ selector, line, filePath }) => ({
    selector,
    source: toPosix(path.relative(rootDir, filePath)),
    line,
    ...classifyGlobalSelectorDetailed(selector),
  }));
  const counts = items.reduce((acc, item) => {
    acc[item.ownership] = (acc[item.ownership] || 0) + 1;
    return acc;
  }, {});
  const governedSelectors = items.filter((item) => item.ownership !== 'global allowed');
  const baseline = readJsonIfExists(baselinePath, { items: [] });
  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'report-only',
    source: toPosix(path.relative(rootDir, globalsPath)),
    sources: cssPaths.map((filePath) => toPosix(path.relative(rootDir, filePath))),
    uniqueSelectorCount: items.length,
    counts,
    selectors: items,
    baseline: {
      path: toPosix(path.relative(rootDir, baselinePath)),
      itemCount: Array.isArray(baseline.items) ? baseline.items.length : 0,
      comparison: compareBaselineItems(
        Array.isArray(baseline.items) ? baseline.items : [],
        governedSelectors,
        (item) => item.selector,
      ),
    },
  };
  writeJson(reportPath, report);
  console.log(`CSS boundary report: ${items.length} unique selectors scanned`);
  console.log(`Sources: ${report.sources.join(', ')}`);
  for (const [name, count] of Object.entries(counts)) console.log(`${name}: ${count}`);
  console.log(`New governed selectors vs baseline: ${report.baseline.comparison.newItems.length}`);
  console.log(`Report written: ${toPosix(path.relative(rootDir, reportPath))}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
