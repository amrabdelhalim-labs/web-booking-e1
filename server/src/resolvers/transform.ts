/**
 * Data Transform Utilities
 *
 * Helper functions to transform Mongoose documents into the shape
 * expected by GraphQL responses. Handles date formatting and
 * document-to-plain-object conversion.
 *
 * TODO: Implement full transform functions (Phase 2.4)
 */

import { IEvent, IBooking } from "../types";

/**
 * Transforms an Event document for GraphQL response.
 * Formats the date field to a readable string.
 */
export const transformEvent = (event: IEvent) => ({
  ...event._doc,
  date: new Date(event.date).toISOString().replace(/T/, " "),
});

/**
 * Transforms a Booking document for GraphQL response.
 * Formats timestamp fields to readable date strings.
 */
export const transformBooking = (booking: IBooking) => ({
  ...booking._doc,
  createdAt: booking.createdAt.toDateString(),
  updatedAt: booking.updatedAt.toDateString(),
});
