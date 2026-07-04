#!/usr/bin/env node
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function isPortReachable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function writeRuntimeMarker(baseUrl, mode) {
  const dir = path.join(process.cwd(), '.next');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'alphaci-dev-server.json'),
    `${JSON.stringify({
      version: 1,
      baseUrl,
      mode,
      startedAt: new Date().toISOString(),
      pid: process.pid,
    }, null, 2)}\n`,
    'utf8',
  );
}

async function main() {
  const mode = argValue('--mode', 'turbo');
  const port = Number(argValue('--port', '3000'));
  const host = argValue('--hostname', '127.0.0.1');
  const baseUrl = `http://${host}:${port}`;

  if (!Number.isInteger(port) || port <= 0) {
    console.error(`dev:clean: invalid port ${port}`);
    process.exit(1);
  }

  if (await isPortReachable(port, host)) {
    console.error(`dev:clean: ${host}:${port} is already reachable.`);
    console.error('dev:clean: stop the existing server before starting a clean dev session.');
    process.exit(1);
  }

  const clean = spawnSync(process.execPath, ['scripts/dev/clean-next.cjs'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
  });
  if (clean.status !== 0) process.exit(clean.status || 1);

  writeRuntimeMarker(baseUrl, mode);

  const modeFlag = mode === 'webpack' ? '--webpack' : '--turbopack';
  const child = spawn('npx', ['next', 'dev', modeFlag, '--hostname', host, '--port', String(port)], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`dev:clean: next dev exited from signal ${signal}`);
      process.exit(1);
    }
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
