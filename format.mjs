#!/usr/bin/env node
/**
 * format.mjs — Cross-platform code formatter for web-booking-e1
 *
 * Runs Prettier across server/ and client/ source files.
 * Works on Windows, macOS, and Linux without any extra tools.
 *
 * Usage:
 *   node format.mjs           # format all files (write mode)
 *   node format.mjs --check   # validate only, exit 1 if unformatted (CI)
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCheck = process.argv.includes('--check');
const mode = isCheck ? '--check' : '--write';
let failed = false;

/**
 * Run Prettier on a sub-package directory.
 * @param {string} dir   - sub-directory relative to project root (e.g. 'server')
 * @param {string} glob  - file glob to format (e.g. 'src/**\/*.ts')
 */
function runPrettier(dir, glob) {
  const cwd = path.join(__dirname, dir);
  console.log(`\n==> Prettier ${mode} : ${dir}/${glob}`);
  try {
    execSync(`npx prettier ${mode} "${glob}"`, { cwd, stdio: 'inherit' });
  } catch {
    failed = true;
  }
}

runPrettier('server', 'src/**/*.ts');
runPrettier('client', 'src/**/*.{ts,tsx,css}');

if (failed) {
  console.error('\n[FAIL] Some files are not formatted. Run: node format.mjs');
  process.exit(1);
} else {
  console.log('\n[OK] All files are properly formatted.');
}
