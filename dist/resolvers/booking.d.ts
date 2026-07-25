/**
 * Booking Resolvers
 *
 * Handles all booking-related GraphQL operations:
 * - Querying user bookings (authenticated)
 * - Booking an event (authenticated, prevents duplicate bookings)
 * - Cancelling a booking (authenticated)
 *
 * Data access is abstracted through the Repository Pattern.
 */
import { GraphQLContext } from '../types';
export declare const bookingResolver: {
    Query: {
        /**
         * Fetches all bookings for the authenticated user.
         * Populates event and user references.
         */
        bookings: import("graphql").GraphQLFieldResolver<unknown, GraphQLContext>;
    };
    Mutation: {
        /**
         * Books an event for the authenticated user.
         * Prevents duplicate bookings for the same event by the same user.
         */
        bookEvent: import("graphql").GraphQLFieldResolver<unknown, GraphQLContext>;
        /**
         * Cancels a booking by ID.
         * Returns the event that was booked.
         */
        cancelBooking: import("graphql").GraphQLFieldResolver<unknown, GraphQLContext>;
    };
    Subscription: {
        bookingAdded: {
            subscribe: () => AsyncIterator<unknown, any, any>;
        };
    };
};
//# sourceMappingURL=booking.d.ts.map