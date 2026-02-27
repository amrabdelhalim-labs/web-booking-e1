/**
 * Event Repository
 *
 * Extends BaseRepository with event-specific data operations.
 * Handles event queries with search, pagination, and creator population.
 *
 * Singleton: Use getEventRepository() to get the shared instance.
 */
import { BaseRepository } from './base.repository';
import { IEvent } from '../types';
declare class EventRepository extends BaseRepository<IEvent> {
    constructor();
    /**
     * Find all events with populated creator info, sorted by newest first.
     */
    findAllWithCreator(filter?: Record<string, unknown>, skip?: number, limit?: number): Promise<IEvent[]>;
    /**
     * Find events by creator with populated creator info.
     */
    findByCreator(creatorId: string): Promise<IEvent[]>;
    /**
     * Search events by title or description (case-insensitive).
     */
    search(searchTerm: string, skip?: number, limit?: number): Promise<IEvent[]>;
    /**
     * Check if an event with the given title already exists.
     */
    titleExists(title: string): Promise<boolean>;
    /**
     * Find a single event with populated creator info.
     */
    findByIdWithCreator(id: string): Promise<IEvent | null>;
    /**
     * Update event fields and return the updated event with populated creator.
     */
    updateWithCreator(id: string, data: Record<string, unknown>): Promise<IEvent | null>;
    /**
     * Get all event IDs created by a specific user.
     */
    getEventIdsByCreator(creatorId: string): Promise<string[]>;
}
/**
 * Returns the singleton EventRepository instance.
 */
export declare function getEventRepository(): EventRepository;
export { EventRepository };
//# sourceMappingURL=event.repository.d.ts.map