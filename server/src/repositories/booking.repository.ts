/**
 * Booking Repository
 *
 * Extends BaseRepository with booking-specific data operations.
 * Handles booking queries with event and user population.
 *
 * Singleton: Use getBookingRepository() to get the shared instance.
 */

import { BaseRepository } from "./base.repository";
import Booking from "../models/booking";
import { IBooking } from "../types";

class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(Booking);
  }

  /**
   * Find all bookings for a specific user with populated event and user info.
   */
  async findByUser(userId: string): Promise<IBooking[]> {
    return Booking.find({ user: userId })
      .populate({ path: "event", populate: { path: "creator" } })
      .populate("user");
  }

  /**
   * Find a booking by ID with populated event and creator info.
   */
  async findByIdWithDetails(id: string): Promise<IBooking | null> {
    return Booking.findById(id).populate({
      path: "event",
      populate: { path: "creator" },
    });
  }

  /**
   * Find a booking by ID with fully populated event, creator, and user.
   */
  async findByIdFullyPopulated(id: string): Promise<IBooking | null> {
    return Booking.findById(id)
      .populate({ path: "event", populate: { path: "creator" } })
      .populate("user");
  }

  /**
   * Check if a user has already booked a specific event.
   */
  async userHasBooked(userId: string, eventId: string): Promise<boolean> {
    return this.exists({ user: userId, event: eventId });
  }

  /**
   * Create a booking and return it with all populated fields.
   */
  async createAndPopulate(
    userId: string,
    eventId: string
  ): Promise<IBooking> {
    const booking = await this.create({
      user: userId as any,
      event: eventId as any,
    });
    return booking.populate([
      { path: "event", populate: { path: "creator" } },
      { path: "user" },
    ]);
  }

  /**
   * Delete all bookings for a user or on a user's events.
   */
  async deleteByUserCascade(
    userId: string,
    eventIds: string[]
  ): Promise<number> {
    const result = await Booking.deleteMany({
      $or: [{ user: userId }, { event: { $in: eventIds } }],
    });
    return result.deletedCount;
  }

  /**
   * Delete all bookings for a specific event.
   */
  async deleteByEvent(eventId: string): Promise<number> {
    const result = await Booking.deleteMany({ event: eventId });
    return result.deletedCount;
  }

  /**
   * Count bookings for a specific event.
   */
  async countByEvent(eventId: string): Promise<number> {
    return this.count({ event: eventId });
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: BookingRepository | null = null;

/**
 * Returns the singleton BookingRepository instance.
 */
export function getBookingRepository(): BookingRepository {
  if (!instance) {
    instance = new BookingRepository();
  }
  return instance;
}

export { BookingRepository };
