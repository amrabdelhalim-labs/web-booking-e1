/**
 * Data Transform Utilities
 *
 * Helper functions to transform Mongoose documents into the shape
 * expected by GraphQL responses. Handles date formatting and
 * document-to-plain-object conversion.
 */
import { IEvent, IBooking } from '../types';
/**
 * Transforms an Event document for GraphQL response.
 * Formats the date field to a readable string.
 */
export declare const transformEvent: (event: IEvent) => any;
/**
 * Transforms a Booking document for GraphQL response.
 * Formats timestamp fields to readable date strings.
 */
export declare const transformBooking: (booking: IBooking) => any;
//# sourceMappingURL=transform.d.ts.map