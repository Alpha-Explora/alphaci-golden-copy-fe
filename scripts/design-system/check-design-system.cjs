#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const commands = [
  ['node', ['scripts/design-system/report-file-size.cjs']],
  ['node', ['scripts/design-system/report-css-boundaries.cjs']],
  ['node', ['scripts/design-system/report-mojibake.cjs']],
  ['node', ['scripts/design-system/route-smoke.cjs']],
];

let exitCode = 0;
for (const [command, args] of commands) {
  const label = `${command} ${args.join(' ')}`;
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) {
    exitCode = result.status || 1;
    break;
  }
}

process.exit(exitCode);