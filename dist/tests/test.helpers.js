"use strict";
/**
 * Test Helpers
 *
 * Custom test framework for running server tests without external dependencies.
 * Provides assertion utilities, colored output, section logging, and result summary.
 *
 * Usage:
 *   import { assert, logSection, logStep, printSummary } from './test.helpers';
 *   logSection('User Tests');
 *   logStep('Creating user...');
 *   assert(user !== null, 'User should be created');
 *   printSummary();
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestCounts = getTestCounts;
exports.resetTestCounts = resetTestCounts;
exports.assert = assert;
exports.logSection = logSection;
exports.logStep = logStep;
exports.logInfo = logInfo;
exports.logError = logError;
exports.printSummary = printSummary;
// ─── Colors ──────────────────────────────────────────────────────────────────
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
};
// ─── Counters ────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
/**
 * Returns current test counts.
 */
function getTestCounts() {
    return { passed, failed };
}
/**
 * Resets test counters.
 */
function resetTestCounts() {
    passed = 0;
    failed = 0;
}
// ─── Assertion ───────────────────────────────────────────────────────────────
/**
 * Asserts a condition is true.
 * Logs colored pass/fail result with message.
 */
function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ${colors.green}✓${colors.reset} ${message}`);
    }
    else {
        failed++;
        console.log(`  ${colors.red}✗${colors.reset} ${message}`);
    }
}
// ─── Logging ─────────────────────────────────────────────────────────────────
/**
 * Logs a section header (e.g., "User Repository Tests").
 */
function logSection(title) {
    console.log(`\n${colors.cyan}${colors.bold}═══ ${title} ═══${colors.reset}\n`);
}
/**
 * Logs a step description (e.g., "Creating user...").
 */
function logStep(message) {
    console.log(`${colors.dim}  → ${message}${colors.reset}`);
}
/**
 * Logs an info message.
 */
function logInfo(message) {
    console.log(`${colors.yellow}  ℹ ${message}${colors.reset}`);
}
/**
 * Logs an error message.
 */
function logError(message) {
    console.log(`${colors.red}  ✗ ${message}${colors.reset}`);
}
// ─── Summary ─────────────────────────────────────────────────────────────────
/**
 * Prints the final test summary with pass/fail counts.
 * Returns the exit code (0 = all passed, 1 = failures).
 */
function printSummary() {
    const total = passed + failed;
    console.log(`\n${colors.bold}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}  Test Summary${colors.reset}`);
    console.log(`${colors.bold}═══════════════════════════════════════════${colors.reset}`);
    console.log(`  ${colors.green}Passed: ${passed}${colors.reset} / ${total}`);
    if (failed > 0) {
        console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
        console.log(`\n${colors.red}${colors.bold}  ✗ SOME TESTS FAILED${colors.reset}\n`);
        return 1;
    }
    console.log(`\n${colors.green}${colors.bold}  ✓ ALL TESTS PASSED${colors.reset}\n`);
    return 0;
}
//# sourceMappingURL=test.helpers.js.map