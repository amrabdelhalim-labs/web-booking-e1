/**
 * Booking Repository
 *
 * Extends BaseRepository with booking-specific data operations.
 * Handles booking queries with event and user population.
 *
 * Singleton: Use getBookingRepository() to get the shared instance.
 */
import { BaseRepository } from './base.repository';
import { IBooking } from '../types';
declare class BookingRepository extends BaseRepository<IBooking> {
    constructor();
    /**
     * Find all bookings for a specific user with populated event and user info.
     */
    findByUser(userId: string): Promise<IBooking[]>;
    /**
     * Find a booking by ID with populated event and creator info.
     */
    findByIdWithDetails(id: string): Promise<IBooking | null>;
    /**
     * Find a booking by ID with fully populated event, creator, and user.
     */
    findByIdFullyPopulated(id: string): Promise<IBooking | null>;
    /**
     * Check if a user has already booked a specific event.
     */
    userHasBooked(userId: string, eventId: string): Promise<boolean>;
    /**
     * Create a booking and return it with all populated fields.
     */
    createAndPopulate(userId: string, eventId: string): Promise<IBooking>;
    /**
     * Delete all bookings for a user or on a user's events.
     */
    deleteByUserCascade(userId: string, eventIds: string[]): Promise<number>;
    /**
     * Delete all bookings for a specific event.
     */
    deleteByEvent(eventId: string): Promise<number>;
    /**
     * Count bookings for a specific event.
     */
    countByEvent(eventId: string): Promise<number>;
}
/**
 * Returns the singleton BookingRepository instance.
 */
export declare function getBookingRepository(): BookingRepository;
export { BookingRepository };
//# sourceMappingURL=booking.repository.d.ts.map