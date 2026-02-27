"use strict";
/**
 * Data Transform Utilities
 *
 * Helper functions to transform Mongoose documents into the shape
 * expected by GraphQL responses. Handles date formatting and
 * document-to-plain-object conversion.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformBooking = exports.transformEvent = void 0;
/**
 * Transforms an Event document for GraphQL response.
 * Formats the date field to a readable string.
 */
const transformEvent = (event) => ({
    ...event._doc,
    date: new Date(event.date).toISOString().replace(/T/, ' '),
});
exports.transformEvent = transformEvent;
/**
 * Transforms a Booking document for GraphQL response.
 * Formats timestamp fields to readable date strings.
 */
const transformBooking = (booking) => ({
    ...booking._doc,
    createdAt: booking.createdAt.toDateString(),
    updatedAt: booking.updatedAt.toDateString(),
});
exports.transformBooking = transformBooking;
//# sourceMappingURL=transform.js.map