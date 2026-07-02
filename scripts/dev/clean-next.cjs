#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();
const nextDir = path.join(rootDir, '.next');

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function removeNextDir() {
  if (!fs.existsSync(nextDir)) {
    console.log('clean:next: .next is absent');
    return;
  }

  try {
    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
    console.log('clean:next: removed .next');
    return;
  } catch (removeError) {
    const staleDir = path.join(rootDir, `.next-stale-${timestamp()}`);
    try {
      fs.renameSync(nextDir, staleDir);
      console.log(`clean:next: renamed locked .next to ${path.basename(staleDir)}`);
      return;
    } catch (renameError) {
      console.error('clean:next: failed to remove or rename .next');
      console.error(`remove error: ${removeError.message}`);
      console.error(`rename error: ${renameError.message}`);
      process.exit(1);
    }
  }
}

removeNextDir();