#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const {
  MOJIBAKE_MARKERS,
  compareBaselineItems,
  readJsonIfExists,
  toPosix,
  writeJson,
} = require('./lib/report-helpers.cjs');

const rootDir = process.cwd();
const scanRoots = ['src', 'tests', 'scripts', 'docs/superpowers'];
const reportPath = path.join(rootDir, '.design-system', 'reports', 'mojibake.json');
const baselinePath = path.join(rootDir, '.design-system', 'baselines', 'mojibake.json');
const allowedExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.cjs', '.mjs']);
const ignoredDirs = new Set(['node_modules', '.next', 'coverage', '.git', 'reports', 'current']);
const maxHitsPerFile = 200;

function walk(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) return files;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (!allowedExtensions.has(path.extname(entry.name))) continue;
    files.push(fullPath);
  }
  return files;
}

function contextFor(line, index) {
  const start = Math.max(0, index - 24);
  const end = Math.min(line.length, index + 25);
  return line.slice(start, end);
}

async function scanFile(filePath) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const hits = [];
  let totalHits = 0;
  let lineNumber = 0;

  for await (const line of lines) {
    lineNumber += 1;
    for (let index = 0; index < line.length; index += 1) {
      const value = line[index];
      if (!MOJIBAKE_MARKERS.includes(value)) continue;
      totalHits += 1;
      if (hits.length < maxHitsPerFile) {
        hits.push({
          line: lineNumber,
          column: index + 1,
          value,
          reason: 'common mojibake marker',
          context: contextFor(line, index),
        });
      }
    }
  }

  return { hits, totalHits, capped: totalHits > hits.length };
}

async function main() {
  const files = [];
  for (const filePath of scanRoots.flatMap((scanRoot) => walk(path.join(rootDir, scanRoot)))) {
    const result = await scanFile(filePath);
    if (result.totalHits > 0) {
      files.push({
        path: toPosix(path.relative(rootDir, filePath)),
        totalHits: result.totalHits,
        sampledHits: result.hits,
        capped: result.capped,
      });
    }
  }

  const baseline = readJsonIfExists(baselinePath, { items: [] });
  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'report-only',
    maxHitsPerFile,
    files,
    fileCount: files.length,
    totalHits: files.reduce((sum, file) => sum + file.totalHits, 0),
    cappedFiles: files.filter((file) => file.capped).map((file) => file.path),
    baseline: {
      path: toPosix(path.relative(rootDir, baselinePath)),
      itemCount: Array.isArray(baseline.items) ? baseline.items.length : 0,
      comparison: compareBaselineItems(
        Array.isArray(baseline.items) ? baseline.items : [],
        files,
        (item) => item.path,
      ),
    },
  };

  writeJson(reportPath, report);
  console.log(`Mojibake report: ${report.fileCount} files with hits`);
  console.log(`Total hits: ${report.totalHits}`);
  console.log(`Capped files: ${report.cappedFiles.length}`);
  console.log(`New files vs baseline: ${report.baseline.comparison.newItems.length}`);
  console.log(`Report written: ${toPosix(path.relative(rootDir, reportPath))}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});