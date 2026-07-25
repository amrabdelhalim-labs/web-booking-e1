"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingResolver = void 0;
const graphql_1 = require("graphql");
const graphql_resolvers_1 = require("graphql-resolvers");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const isAuth_1 = require("../middlewares/isAuth");
const repositories_1 = require("../repositories");
const transform_1 = require("./transform");
const pubsub = new graphql_subscriptions_1.PubSub();
exports.bookingResolver = {
    Query: {
        /**
         * Fetches all bookings for the authenticated user.
         * Populates event and user references.
         */
        bookings: (0, graphql_resolvers_1.combineResolvers)(isAuth_1.isAuthenticated, async (_parent, _args, context) => {
            const repos = (0, repositories_1.getRepositoryManager)();
            const bookings = await repos.booking.findByUser(context.user._id.toString());
            return bookings.map((booking) => (0, transform_1.transformBooking)(booking));
        }),
    },
    Mutation: {
        /**
         * Books an event for the authenticated user.
         * Prevents duplicate bookings for the same event by the same user.
         */
        bookEvent: (0, graphql_resolvers_1.combineResolvers)(isAuth_1.isAuthenticated, async (_parent, { eventId }, context) => {
            const repos = (0, repositories_1.getRepositoryManager)();
            const userId = context.user._id.toString();
            const alreadyBooked = await repos.booking.userHasBooked(userId, eventId);
            if (alreadyBooked) {
                throw new graphql_1.GraphQLError('قد حجزت هذه المناسبة بالفعل مسبقًا!', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }
            const fetchedEvent = await repos.event.findById(eventId);
            if (!fetchedEvent) {
                throw new graphql_1.GraphQLError('المناسبة غير موجودة!', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            const populatedBooking = await repos.booking.createAndPopulate(userId, fetchedEvent._id.toString());
            const transformedBooking = (0, transform_1.transformBooking)(populatedBooking);
            // Publish booking added event
            pubsub.publish('BOOKING_ADDED', { bookingAdded: transformedBooking });
            return transformedBooking;
        }),
        /**
         * Cancels a booking by ID.
         * Returns the event that was booked.
         */
        cancelBooking: (0, graphql_resolvers_1.combineResolvers)(isAuth_1.isAuthenticated, async (_parent, { bookingId }, context) => {
            const repos = (0, repositories_1.getRepositoryManager)();
            const booking = await repos.booking.findByIdWithDetails(bookingId);
            if (!booking) {
                throw new graphql_1.GraphQLError('الحجز غير موجود!', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            // Only the booking owner can cancel
            if (booking.user.toString() !== context.user._id.toString()) {
                throw new graphql_1.GraphQLError('غير مصرح لك بإلغاء هذا الحجز!', {
                    extensions: { code: 'FORBIDDEN' },
                });
            }
            const event = (0, transform_1.transformEvent)(booking.event);
            await repos.booking.delete(bookingId);
            return event;
        }),
    },
    Subscription: {
        bookingAdded: {
            subscribe: () => pubsub.asyncIterator(['BOOKING_ADDED']),
        },
    },
};
//# sourceMappingURL=booking.js.map