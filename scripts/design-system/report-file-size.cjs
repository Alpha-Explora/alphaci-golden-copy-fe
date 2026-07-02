#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const {
  createFileSizeReport,
  compareBaselineItems,
  readJsonIfExists,
  toPosix,
  writeJson,
} = require('./lib/report-helpers.cjs');

const rootDir = process.cwd();
const scanRoots = ['src', 'tests', 'scripts', 'docs/superpowers'];
const reportPath = path.join(rootDir, '.design-system', 'reports', 'file-size.json');
const baselinePath = path.join(rootDir, '.design-system', 'baselines', 'file-size.json');
const allowedExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.cjs', '.mjs']);
const ignoredDirs = new Set(['node_modules', '.next', 'coverage', '.git', 'reports', 'current']);

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

async function countFileLines(filePath) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let count = 0;
  for await (const _line of lines) count += 1;
  return count;
}

async function main() {
  const filePaths = scanRoots.flatMap((scanRoot) => walk(path.join(rootDir, scanRoot)));
  const files = [];
  for (const filePath of filePaths) {
    const stats = fs.statSync(filePath);
    files.push({
      path: toPosix(path.relative(rootDir, filePath)),
      lines: await countFileLines(filePath),
      bytes: stats.size,
    });
  }

  const report = createFileSizeReport(files.sort((a, b) => b.lines - a.lines));
  const baseline = readJsonIfExists(baselinePath, { items: [] });
  report.baseline = {
    path: toPosix(path.relative(rootDir, baselinePath)),
    itemCount: Array.isArray(baseline.items) ? baseline.items.length : 0,
    comparison: compareBaselineItems(
      Array.isArray(baseline.items) ? baseline.items : [],
      report.overBudget,
      (item) => item.path,
    ),
  };

  writeJson(reportPath, report);
  console.log(`File-size report: ${report.files.length} files scanned`);
  console.log(`Over budget: ${report.overBudget.length}`);
  console.log(`Migration priority: ${report.migrationPriority.length}`);
  console.log(`Red flags: ${report.redFlags.length}`);
  console.log(`New over-budget files vs baseline: ${report.baseline.comparison.newItems.length}`);
  console.log(`Report written: ${toPosix(path.relative(rootDir, reportPath))}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});