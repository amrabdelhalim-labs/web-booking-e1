#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

const requiredFiles = [
  'docker-compose.yml',
  'server/Dockerfile',
  'client/Dockerfile',
  'client/nginx.conf',
  'scripts/docker/deliver.mjs',
];

const requiredSnippets = [
  { file: 'docker-compose.yml', regex: /services:\s*[\s\S]*server:/m },
  { file: 'docker-compose.yml', regex: /services:\s*[\s\S]*client:/m },
  { file: 'docker-compose.yml', regex: /healthcheck:/m },
  { file: 'server/Dockerfile', regex: /npm prune --omit=dev/ },
  { file: 'client/Dockerfile', regex: /docker-entrypoint\.sh/ },
  { file: 'client/Dockerfile', regex: /CYPRESS_INSTALL_BINARY=0 npm ci/ },
  {
    file: 'scripts/docker/deliver.mjs',
    regex: /compose['"]?\s*,\s*['"]build|docker compose build/m,
  },
  { file: 'scripts/docker/deliver.mjs', regex: /scanWithTrivy/ },
  { file: 'scripts/docker/deliver.mjs', regex: /web-booking-e1-server/ },
  { file: 'scripts/docker/deliver.mjs', regex: /web-booking-e1-client/ },
];

const mergeMarkersPattern = /^(<{7}|={7}|>{7})/m;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exitCode = 1;
  }
}

for (const relativeFile of requiredFiles) {
  const absolutePath = path.join(root, relativeFile);
  assert(existsSync(absolutePath), `Missing required file: ${relativeFile}`);
}

for (const check of requiredSnippets) {
  const absolutePath = path.join(root, check.file);
  if (!existsSync(absolutePath)) {
    continue;
  }

  const content = readFileSync(absolutePath, 'utf8');
  assert(check.regex.test(content), `Missing required pattern in ${check.file}: ${check.regex}`);
  assert(!mergeMarkersPattern.test(content), `Merge conflict markers found in ${check.file}`);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('✅ Docker validation passed');
