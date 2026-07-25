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
/**
 * Returns current test counts.
 */
export declare function getTestCounts(): {
    passed: number;
    failed: number;
};
/**
 * Resets test counters.
 */
export declare function resetTestCounts(): void;
/**
 * Asserts a condition is true.
 * Logs colored pass/fail result with message.
 */
export declare function assert(condition: boolean, message: string): void;
/**
 * Logs a section header (e.g., "User Repository Tests").
 */
export declare function logSection(title: string): void;
/**
 * Logs a step description (e.g., "Creating user...").
 */
export declare function logStep(message: string): void;
/**
 * Logs an info message.
 */
export declare function logInfo(message: string): void;
/**
 * Logs an error message.
 */
export declare function logError(message: string): void;
/**
 * Prints the final test summary with pass/fail counts.
 * Returns the exit code (0 = all passed, 1 = failures).
 */
export declare function printSummary(): number;
//# sourceMappingURL=test.helpers.d.ts.map