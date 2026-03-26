#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const mode = process.env.DOCKER_DELIVERY_MODE || process.argv[2] || 'build';
const imageTag = process.env.DOCKER_IMAGE_TAG || 'local';
const registry = process.env.DOCKER_IMAGE_REGISTRY || '';
const runSmoke = process.env.DOCKER_RUN_SMOKE === '1';

const serverImage = `${registry}web-booking-server:${imageTag}`;
const clientImage = `${registry}web-booking-client:${imageTag}`;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || '');
    process.exit(result.status ?? 1);
  }

  return result.stdout || '';
}

function tryRun(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status === 0;
}

function scanWithTrivy(imageRef) {
  const trivyImage = process.env.TRIVY_IMAGE || 'aquasec/trivy:0.57.1';
  const severity = process.env.TRIVY_SEVERITY || 'HIGH,CRITICAL';
  const ignoreFixed = process.env.TRIVY_IGNORE_STATUS_FIXED !== '0';
  const extra = process.env.TRIVY_EXTRA_ARGS ? process.env.TRIVY_EXTRA_ARGS.split(' ') : [];

  const localScanArgs = [
    'image',
    '--scanners',
    'vuln',
    '--severity',
    severity,
    '--ignore-unfixed',
    ...(ignoreFixed ? ['--ignore-status', 'fixed'] : []),
    ...extra,
    imageRef,
  ];

  console.log(`🔎 Security scan for ${imageRef}`);
  if (tryRun('trivy', localScanArgs)) {
    return true;
  }

  if (!tryRun('docker', ['pull', trivyImage])) {
    return false;
  }

  const dockerSocket =
    process.platform === 'win32'
      ? '//var/run/docker.sock:/var/run/docker.sock'
      : '/var/run/docker.sock:/var/run/docker.sock';

  const trivyContainerArgs = [
    'run',
    '--rm',
    '-v',
    dockerSocket,
    trivyImage,
    ...localScanArgs,
  ];

  return tryRun('docker', trivyContainerArgs);
}

function smokeTest() {
  console.log('🧪 Running smoke test');

  const waitForHealthy = (serviceName, maxAttempts = 30, delayMs = 2000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const raw = runCapture('docker', ['compose', 'ps', '--format', 'json']);
      const entries = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const service = entries.find((entry) => entry.Service === serviceName);
      const healthy = service?.Health === 'healthy';
      if (healthy) {
        return;
      }

      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
    }

    throw new Error(`Service "${serviceName}" did not become healthy in time.`);
  };

  try {
    run('docker', ['compose', 'up', '-d', '--build']);
    run('docker', ['compose', 'ps']);
    waitForHealthy('server');
    waitForHealthy('client');
  } finally {
    run('docker', ['compose', 'down', '--remove-orphans', '-v']);
  }
}

if (!['build', 'publish'].includes(mode)) {
  console.error(`Unsupported mode: ${mode}. Use "build" or "publish".`);
  process.exit(1);
}

run('node', ['scripts/infra/validate-docker.mjs']);

console.log('🏗️ Building images');
run('docker', ['compose', 'build', '--pull']);

console.log('🏷️ Tagging images');
run('docker', ['tag', 'web-booking-e1-server:latest', serverImage]);
run('docker', ['tag', 'web-booking-e1-client:latest', clientImage]);

for (const imageRef of [serverImage, clientImage]) {
  const scanOk = scanWithTrivy(imageRef);
  if (!scanOk) {
    const message = `Trivy scan failed or unavailable for ${imageRef}`;
    if (mode === 'publish') {
      console.error(`❌ ${message}`);
      process.exit(1);
    }
    console.warn(`⚠️ ${message} (allowed in build mode)`);
  }
}

if (runSmoke) {
  smokeTest();
}

if (mode === 'publish') {
  if (!registry) {
    console.error('DOCKER_IMAGE_REGISTRY is required in publish mode.');
    process.exit(1);
  }
  if (!registry.endsWith('/')) {
    console.error('DOCKER_IMAGE_REGISTRY must end with "/" (example: ghcr.io/my-org/).');
    process.exit(1);
  }

  console.log('📤 Publishing images');
  run('docker', ['push', serverImage]);
  run('docker', ['push', clientImage]);
} else {
  console.log('✅ Build mode completed (no publish)');
}
