/**
 * Event Resolvers
 *
 * Handles all event-related GraphQL operations:
 * - Querying events (all events, user-specific events)
 * - Creating new events (authenticated)
 * - Deleting events with cascade (removes related bookings)
 * - Publishing subscription events when a new event is created
 *
 * Data access is abstracted through the Repository Pattern.
 * Input validation is handled by dedicated validators.
 */
import { GraphQLContext } from '../types';
export declare const eventResolver: {
    Query: {
        /**
         * Fetches events with pagination support, sorted by newest first.
         * Optionally filters by searchTerm (matches title or description).
         * Pagination: skip (offset) and limit (page size, default 8).
         */
        events: (_parent: unknown, { searchTerm, skip, limit }: {
            searchTerm?: string;
            skip?: number;
            limit?: number;
        }) => Promise<any[]>;
        /**
         * Fetches all events created by a specific user.
         */
        getUserEvents: (_parent: unknown, { userId }: {
            userId: string;
        }) => Promise<any[]>;
    };
    Mutation: {
        /**
         * Creates a new event. Requires authentication.
         * Validates input and checks for duplicate title.
         * Publishes eventAdded subscription on success.
         */
        createEvent: import("graphql").GraphQLFieldResolver<unknown, GraphQLContext>;
        /**
         * Updates an event. Requires authentication.
         * Only the creator can update their own event.
         */
        updateEvent: import("graphql").GraphQLFieldResolver<unknown, GraphQLContext>;
        /**
         * Deletes an event by ID.
         * Cascade: removes all bookings associated with the deleted event.
         * Returns the updated list of all events.
         */
        deleteEvent: import("graphql").GraphQLFieldResolver<unknown, GraphQLContext>;
    };
    Subscription: {
        eventAdded: {
            subscribe: () => AsyncIterator<unknown, any, any>;
        };
    };
};
//# sourceMappingURL=event.d.ts.map