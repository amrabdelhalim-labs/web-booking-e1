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

import { getUserRepository, UserRepository } from './user.repository';
import { getEventRepository, EventRepository } from './event.repository';
import { getBookingRepository, BookingRepository } from './booking.repository';

/**
 * Repository Manager class.
 * Provides typed access to all entity repositories.
 */
class RepositoryManager {
  /** User repository — authentication, profiles, lookups */
  get user(): UserRepository {
    return getUserRepository();
  }

  /** Event repository — events with search, pagination, creator population */
  get event(): EventRepository {
    return getEventRepository();
  }

  /** Booking repository — bookings with event/user population */
  get booking(): BookingRepository {
    return getBookingRepository();
  }

  /**
   * Health check — verifies all repositories are accessible.
   */
  async healthCheck(): Promise<{
    status: string;
    repositories: Record<string, boolean>;
  }> {
    const results: Record<string, boolean> = {};

    try {
      await this.user.count();
      results.user = true;
    } catch {
      results.user = false;
    }

    try {
      await this.event.count();
      results.event = true;
    } catch {
      results.event = false;
    }

    try {
      await this.booking.count();
      results.booking = true;
    } catch {
      results.booking = false;
    }

    const allHealthy = Object.values(results).every(Boolean);
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      repositories: results,
    };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: RepositoryManager | null = null;

/**
 * Returns the singleton RepositoryManager instance.
 */
export function getRepositoryManager(): RepositoryManager {
  if (!instance) {
    instance = new RepositoryManager();
  }
  return instance;
}

export { RepositoryManager };
