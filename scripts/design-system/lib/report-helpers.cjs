const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_BUDGETS = {
  'src/app/globals.css': 1040,
  route: 650,
  component: 455,
  cssModule: 520,
  priority: 1300,
  redFlag: 5000,
};

const MOJIBAKE_MARKERS = ['\u00e2', '\ufffd', '\u00c3', '\u00c2', '\u00f0', '\u00d0'];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function countLines(text) {
  if (text.length === 0) return 0;
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '').split('\n').length;
}

function detectMojibake(text, options = {}) {
  const maxHits = Number.isFinite(options.maxHits) ? options.maxHits : Number.POSITIVE_INFINITY;
  const hits = [];
  for (let index = 0; index < text.length; index += 1) {
    const value = text[index];
    if (MOJIBAKE_MARKERS.includes(value)) {
      hits.push({ index, value, reason: 'common mojibake marker' });
      if (hits.length >= maxHits) return hits;
    }
  }
  return hits;
}

function classifyGlobalSelectorDetailed(selector) {
  const normalized = selector.trim();
  if (
    normalized === ':root' ||
    normalized === 'html' ||
    normalized === 'body' ||
    normalized.startsWith('*') ||
    normalized.includes('.skip-link')
  ) {
    return { ownership: 'global allowed', owner: 'global', reason: 'allowed base or accessibility selector' };
  }

  const primitiveMatch = normalized.match(/\.(button|badge|card|tabs|tab|input|dialog|tooltip|logo|wordmark)\b/);
  if (primitiveMatch) {
    return { ownership: 'primitive-owned', owner: primitiveMatch[1], reason: 'matches primitive selector prefix' };
  }

  const featureMatch = normalized.match(/\.(public-site|raw-hero|pricing|landing|auth|dashboard|workflow|settings|home|app-nav)\b/);
  if (featureMatch) {
    const owner = featureMatch[1] === 'raw-hero' ? 'landing' : featureMatch[1];
    return { ownership: 'feature-owned', owner, reason: 'matches feature selector prefix' };
  }

  return { ownership: 'legacy-frozen', owner: 'legacy', reason: 'no explicit design-system owner matched' };
}

function classifyGlobalSelector(selector) {
  return classifyGlobalSelectorDetailed(selector).ownership;
}

function stripKeyframes(cssText) {
  let output = '';
  let index = 0;

  while (index < cssText.length) {
    const match = cssText.slice(index).match(/@(?:-webkit-)?keyframes\b/);
    if (!match || match.index === undefined) {
      output += cssText.slice(index);
      break;
    }

    const start = index + match.index;
    output += cssText.slice(index, start);
    const open = cssText.indexOf('{', start);
    if (open === -1) break;

    let depth = 1;
    let cursor = open + 1;
    while (cursor < cssText.length && depth > 0) {
      if (cssText[cursor] === '{') depth += 1;
      if (cssText[cursor] === '}') depth -= 1;
      cursor += 1;
    }
    index = cursor;
  }

  return output;
}

function extractCssSelectors(cssText) {
  const withoutComments = stripKeyframes(cssText).replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  const regex = /([^{}]+)\{/g;
  let match;

  while ((match = regex.exec(withoutComments)) !== null) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith('@') || raw.includes('@')) continue;
    if (/^(media|supports|keyframes|font-face|layer|container)\b/.test(raw)) continue;

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

function compareBaselineItems(baselineItems, currentItems, getKey) {
  const baselineMap = new Map(baselineItems.map((item) => [getKey(item), item]));
  const currentMap = new Map(currentItems.map((item) => [getKey(item), item]));
  return {
    newItems: currentItems.filter((item) => !baselineMap.has(getKey(item))),
    resolvedItems: baselineItems.filter((item) => !currentMap.has(getKey(item))),
    unchangedItems: currentItems.filter((item) => baselineMap.has(getKey(item))),
  };
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
  classifyGlobalSelectorDetailed,
  compareBaselineItems,
  extractCssSelectors,
  createFileSizeReport,
  readJsonIfExists,
  ensureDirectory,
  writeJson,
};
