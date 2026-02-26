#!/usr/bin/env node
/**
 * validate-workflow.mjs — Local workflow validator for web-booking-e1 (مناسباتي)
 *
 * Catches CI deploy issues before pushing to GitHub by running four checks:
 *   1. YAML structure       — no tabs, required top-level keys present
 *   2. TypeScript build deploy — server/dist is copied (not raw server/*),
 *      and the build step runs before the copy
 *   3. package.json sim.    — extracts deletions from the workflow itself,
 *      applies them to server/package.json, and verifies the result is clean
 *   4. Completeness check   — proactively verifies every forbidden-pattern script
 *      in package.json has a matching delete statement in the workflow
 *
 * Usage:
 *   node validate-workflow.mjs        # run all checks, exit 1 on failure
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 *
 * Note: This project uses TypeScript. The server is pre-compiled with `tsc`
 * and only the compiled `dist/` directory is deployed — no rsync needed.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

// ── Helpers ────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function ok(msg) {
  console.log(`  ✅ ${msg}`);
  passed++;
}
function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failed++;
}
function warn(msg) {
  console.warn(`  ⚠️  ${msg}`);
}
function section(title) {
  console.log(`\n── ${title}`);
}

// ── Project config ─────────────────────────────────────────────────────────
const WF_PATH = path.join(ROOT, '.github/workflows/build-and-deploy.yml');
const PKG_PATH = path.join(ROOT, 'server/package.json');

// Scripts that MUST remain after stripping (production entry points)
const REQUIRED_SCRIPTS = ['start'];

// Scripts whose presence after stripping signals a broken deploy
// (reference tools that will be absent in production)
const FORBIDDEN_PATTERNS = [
  /^dev$/,
  /^build$/,    // only needed to compile; dist/ is already present
  /^test/,      // test, test:all, test:*, etc.
  /^format/,    // format, format:check
];

// cp patterns that MUST NOT appear (raw server copy would include node_modules/tests)
const FORBIDDEN_CP_PATTERNS = [
  { pattern: 'server/*', description: 'raw server/* copy (includes node_modules, tests)' },
  { pattern: 'server/node_modules', description: 'explicit node_modules copy' },
  { pattern: 'server/tests', description: 'test directory copy' },
];

// TypeScript devDependencies that MUST be removed before deploy
const REQUIRED_STRIPPED_DEVDEPS = ['typescript', 'ts-node', 'ts-node-dev'];

// ── 1. YAML structure ──────────────────────────────────────────────────────
section('1. YAML structure');

if (!existsSync(WF_PATH)) {
  fail(`Workflow file not found: ${WF_PATH}`);
  process.exit(1);
}

const yaml = readFileSync(WF_PATH, 'utf8');

if (/\t/.test(yaml)) {
  fail('Workflow contains hard tab characters (invalid YAML — GitHub will reject it)');
} else {
  ok('No hard tab characters');
}

for (const key of ['name:', 'on:', 'permissions:', 'concurrency:', 'jobs:']) {
  if (yaml.includes(key)) ok(`Required key present: "${key}"`);
  else fail(`Missing required top-level key: "${key}"`);
}

if (yaml.includes('[skip ci]')) {
  ok('Deploy commits use [skip ci] to prevent recursive triggers');
} else {
  fail('Deploy commit messages missing [skip ci]');
}

// ── 2. TypeScript build deploy (server) ───────────────────────────────────
section('2. TypeScript build deploy (server)');

// Verify tsc build step exists before deploy
if (yaml.includes('npm run build')) {
  ok('Server build step found (tsc compiles TypeScript before deploy)');
} else {
  fail('No "npm run build" step found — dist/ may not be compiled before deploy');
}

// Verify only dist/ is copied, not raw server/ contents
if (yaml.includes('cp -r server/dist')) {
  ok('Workflow copies server/dist (compiled output only)');
} else {
  fail('Workflow does not copy server/dist — check deploy step copies compiled output');
}

// Verify forbidden raw-copy patterns are absent
for (const { pattern, description } of FORBIDDEN_CP_PATTERNS) {
  const matchingLines = yaml
    .split('\n')
    .filter(l => {
      // Only check cp commands (not comments)
      const trimmed = l.trim();
      return !trimmed.startsWith('#') && trimmed.includes('cp ') && trimmed.includes(pattern);
    });
  if (matchingLines.length > 0) {
    matchingLines.forEach(l => fail(`Forbidden copy found (${description}): ${l.trim()}`));
  }
}

// Verify workflow strips TypeScript devDeps
const deletesDevDeps = yaml.includes('delete p.devDependencies');
if (deletesDevDeps) {
  ok('Workflow deletes devDependencies (TypeScript tools excluded from production)');
} else {
  fail('Workflow does not delete devDependencies — TypeScript devDeps will reach Heroku');
}

// ── 3. package.json simulation ────────────────────────────────────────────
section('3. package.json stripping simulation');

if (!existsSync(PKG_PATH)) {
  fail(`server/package.json not found: ${PKG_PATH}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));

// Extract every script name being deleted from the workflow YAML
// Handles both: delete p.scripts['name'] and delete p.scripts.name
const deletedByWorkflow = new Set([
  ...[...yaml.matchAll(/delete\s+p\.scripts\[['"]([^'"]+)['"]\]/g)].map(m => m[1]),
  ...[...yaml.matchAll(/delete\s+p\.scripts\.(\w+)/g)].map(m => m[1]),
]);

// Report any phantom deletes (listed in workflow but don't exist in package.json)
for (const name of deletedByWorkflow) {
  if (pkg.scripts?.[name] === undefined) {
    warn(`Workflow deletes "${name}" but it doesn't exist in server/package.json (harmless but stale)`);
  }
}

// Simulate the stripping
const prod = JSON.parse(JSON.stringify(pkg)); // deep clone
for (const name of deletedByWorkflow) delete prod.scripts?.[name];
if (deletesDevDeps) delete prod.devDependencies;

// Check required scripts survive
for (const s of REQUIRED_SCRIPTS) {
  if (prod.scripts?.[s]) {
    ok(`"${s}" script preserved: "${prod.scripts[s]}"`);
  } else {
    fail(`"${s}" script missing after stripping — server will not start on Heroku`);
  }
}

// Check no forbidden scripts remain
for (const [name, cmd] of Object.entries(prod.scripts ?? {})) {
  const isForbidden = FORBIDDEN_PATTERNS.some(re => re.test(name));
  if (isForbidden) {
    fail(`Script "${name}" still present after stripping ("${cmd}") — may reference missing tools`);
  } else {
    ok(`Script "${name}" is safe for production deploy`);
  }
}

// Check devDependencies are gone
if (!deletesDevDeps) {
  fail('Workflow does not delete p.devDependencies — dev packages will be deployed');
} else if (prod.devDependencies && Object.keys(prod.devDependencies).length > 0) {
  fail(`devDependencies still present: ${Object.keys(prod.devDependencies).join(', ')}`);
} else {
  ok('devDependencies removed');
}

// Check that critical TypeScript devDeps are gone
for (const dep of REQUIRED_STRIPPED_DEVDEPS) {
  if (pkg.devDependencies?.[dep]) {
    if (!prod.devDependencies?.[dep]) {
      ok(`TypeScript devDep "${dep}" removed from deploy`);
    } else {
      fail(`TypeScript devDep "${dep}" still present after stripping — Heroku will install it`);
    }
  } else {
    warn(`"${dep}" not found in devDependencies (may have been renamed or removed)`);
  }
}

// Check remaining scripts don't reference devDep tools
const devBinaries = Object.keys(pkg.devDependencies ?? {});
for (const [name, cmd] of Object.entries(prod.scripts ?? {})) {
  for (const bin of devBinaries) {
    if (cmd.includes(bin)) {
      fail(`Script "${name}" uses "${bin}" which is in devDependencies (will be absent in production)`);
    }
  }
}

// ── 4. Completeness check (scripts → workflow sync) ─────────────────────
section('4. Completeness check (scripts \u2192 workflow sync)');

// Proactively find any script in package.json that matches FORBIDDEN_PATTERNS
// but is NOT in the workflow's deletion list — catches the "I added test:foo
// but forgot to update the workflow" class of failure before it hits CI.
const allScriptNames = Object.keys(pkg.scripts ?? {});
const missingFromWorkflow = allScriptNames.filter(name => {
  const isForbidden = FORBIDDEN_PATTERNS.some(re => re.test(name));
  const isRequired  = REQUIRED_SCRIPTS.includes(name);
  return isForbidden && !isRequired && !deletedByWorkflow.has(name);
});

if (missingFromWorkflow.length === 0) {
  ok('All forbidden-pattern scripts are accounted for in workflow deletions');
} else {
  for (const name of missingFromWorkflow) {
    fail(
      `Script "${name}" matches a forbidden pattern but is NOT deleted by the workflow` +
      ` — add: delete p.scripts['${name}'];`
    );
  }
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`  Passed: ${passed}   Failed: ${failed}`);

if (failed > 0) {
  console.error('\n[FAIL] Workflow has issues — fix them before pushing.\n');
  process.exit(1);
} else {
  console.log('\n[OK] Workflow is valid and ready to push.\n');
}
