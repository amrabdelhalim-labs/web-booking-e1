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
import { UserRepository } from './user.repository';
import { EventRepository } from './event.repository';
import { BookingRepository } from './booking.repository';
/**
 * Repository Manager class.
 * Provides typed access to all entity repositories.
 */
declare class RepositoryManager {
    /** User repository — authentication, profiles, lookups */
    get user(): UserRepository;
    /** Event repository — events with search, pagination, creator population */
    get event(): EventRepository;
    /** Booking repository — bookings with event/user population */
    get booking(): BookingRepository;
    /**
     * Health check — verifies all repositories are accessible.
     */
    healthCheck(): Promise<{
        status: string;
        repositories: Record<string, boolean>;
    }>;
}
/**
 * Returns the singleton RepositoryManager instance.
 */
export declare function getRepositoryManager(): RepositoryManager;
export { RepositoryManager };
//# sourceMappingURL=index.d.ts.map