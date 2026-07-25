"use strict";
/**
 * Repository Manager
 *
 * Central access point for all repositories.
 * Provides a singleton RepositoryManager with lazy-initialized repositories.
 *
 * Usage:
 *   import { getRepositoryManager } from '../repositories';
 *   const repos = getRepositoryManager();
 *   const user = await repos.user.findByEmail('test@example.com');
 *   const events = await repos.event.findAllWithCreator();
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryManager = void 0;
exports.getRepositoryManager = getRepositoryManager;
const user_repository_1 = require("./user.repository");
const event_repository_1 = require("./event.repository");
const booking_repository_1 = require("./booking.repository");
/**
 * Repository Manager class.
 * Provides typed access to all entity repositories.
 */
class RepositoryManager {
    /** User repository — authentication, profiles, lookups */
    get user() {
        return (0, user_repository_1.getUserRepository)();
    }
    /** Event repository — events with search, pagination, creator population */
    get event() {
        return (0, event_repository_1.getEventRepository)();
    }
    /** Booking repository — bookings with event/user population */
    get booking() {
        return (0, booking_repository_1.getBookingRepository)();
    }
    /**
     * Health check — verifies all repositories are accessible.
     */
    async healthCheck() {
        const results = {};
        try {
            await this.user.count();
            results.user = true;
        }
        catch {
            results.user = false;
        }
        try {
            await this.event.count();
            results.event = true;
        }
        catch {
            results.event = false;
        }
        try {
            await this.booking.count();
            results.booking = true;
        }
        catch {
            results.booking = false;
        }
        const allHealthy = Object.values(results).every(Boolean);
        return {
            status: allHealthy ? 'healthy' : 'degraded',
            repositories: results,
        };
    }
}
exports.RepositoryManager = RepositoryManager;
// ─── Singleton ───────────────────────────────────────────────────────────────
let instance = null;
/**
 * Returns the singleton RepositoryManager instance.
 */
function getRepositoryManager() {
    if (!instance) {
        instance = new RepositoryManager();
    }
    return instance;
}
//# sourceMappingURL=index.js.map