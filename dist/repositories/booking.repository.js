"use strict";
/**
 * Booking Repository
 *
 * Extends BaseRepository with booking-specific data operations.
 * Handles booking queries with event and user population.
 *
 * Singleton: Use getBookingRepository() to get the shared instance.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRepository = void 0;
exports.getBookingRepository = getBookingRepository;
const base_repository_1 = require("./base.repository");
const booking_1 = __importDefault(require("../models/booking"));
class BookingRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(booking_1.default);
    }
    /**
     * Find all bookings for a specific user with populated event and user info.
     */
    async findByUser(userId) {
        return booking_1.default.find({ user: userId })
            .populate({ path: 'event', populate: { path: 'creator' } })
            .populate('user');
    }
    /**
     * Find a booking by ID with populated event and creator info.
     */
    async findByIdWithDetails(id) {
        return booking_1.default.findById(id).populate({
            path: 'event',
            populate: { path: 'creator' },
        });
    }
    /**
     * Find a booking by ID with fully populated event, creator, and user.
     */
    async findByIdFullyPopulated(id) {
        return booking_1.default.findById(id)
            .populate({ path: 'event', populate: { path: 'creator' } })
            .populate('user');
    }
    /**
     * Check if a user has already booked a specific event.
     */
    async userHasBooked(userId, eventId) {
        return this.exists({ user: userId, event: eventId });
    }
    /**
     * Create a booking and return it with all populated fields.
     */
    async createAndPopulate(userId, eventId) {
        const booking = await this.create({
            user: userId,
            event: eventId,
        });
        return booking.populate([{ path: 'event', populate: { path: 'creator' } }, { path: 'user' }]);
    }
    /**
     * Delete all bookings for a user or on a user's events.
     */
    async deleteByUserCascade(userId, eventIds) {
        const result = await booking_1.default.deleteMany({
            $or: [{ user: userId }, { event: { $in: eventIds } }],
        });
        return result.deletedCount;
    }
    /**
     * Delete all bookings for a specific event.
     */
    async deleteByEvent(eventId) {
        const result = await booking_1.default.deleteMany({ event: eventId });
        return result.deletedCount;
    }
    /**
     * Count bookings for a specific event.
     */
    async countByEvent(eventId) {
        return this.count({ event: eventId });
    }
}
exports.BookingRepository = BookingRepository;
// ─── Singleton ───────────────────────────────────────────────────────────────
let instance = null;
/**
 * Returns the singleton BookingRepository instance.
 */
function getBookingRepository() {
    if (!instance) {
        instance = new BookingRepository();
    }
    return instance;
}
//# sourceMappingURL=booking.repository.js.map