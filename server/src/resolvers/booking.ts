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

import { GraphQLError } from 'graphql';
import { combineResolvers } from 'graphql-resolvers';
import { PubSub } from 'graphql-subscriptions';

import { isAuthenticated } from '../middlewares/isAuth';
import { getRepositoryManager } from '../repositories';
import { transformBooking, transformEvent } from './transform';
import { GraphQLContext } from '../types';

const pubsub = new PubSub();

export const bookingResolver = {
  Query: {
    /**
     * Fetches all bookings for the authenticated user.
     * Populates event and user references.
     */
    bookings: combineResolvers(
      isAuthenticated,
      async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
        const repos = getRepositoryManager();
        const bookings = await repos.booking.findByUser(context.user!._id.toString());
        return bookings.map((booking) => transformBooking(booking));
      }
    ),
  },

  Mutation: {
    /**
     * Books an event for the authenticated user.
     * Prevents duplicate bookings for the same event by the same user.
     */
    bookEvent: combineResolvers(
      isAuthenticated,
      async (_parent: unknown, { eventId }: { eventId: string }, context: GraphQLContext) => {
        const repos = getRepositoryManager();
        const userId = context.user!._id.toString();

        const alreadyBooked = await repos.booking.userHasBooked(userId, eventId);
        if (alreadyBooked) {
          throw new GraphQLError('قد حجزت هذه المناسبة بالفعل مسبقًا!', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const fetchedEvent = await repos.event.findById(eventId);
        if (!fetchedEvent) {
          throw new GraphQLError('المناسبة غير موجودة!', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const populatedBooking = await repos.booking.createAndPopulate(
          userId,
          fetchedEvent._id.toString()
        );
        const transformedBooking = transformBooking(populatedBooking);

        // Publish booking added event
        pubsub.publish('BOOKING_ADDED', { bookingAdded: transformedBooking });

        return transformedBooking;
      }
    ),

    /**
     * Cancels a booking by ID.
     * Returns the event that was booked.
     */
    cancelBooking: combineResolvers(
      isAuthenticated,
      async (_parent: unknown, { bookingId }: { bookingId: string }, context: GraphQLContext) => {
        const repos = getRepositoryManager();
        const booking = await repos.booking.findByIdWithDetails(bookingId);

        if (!booking) {
          throw new GraphQLError('الحجز غير موجود!', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Only the booking owner can cancel
        if (booking.user.toString() !== context.user!._id.toString()) {
          throw new GraphQLError('غير مصرح لك بإلغاء هذا الحجز!', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const event = transformEvent(booking.event as any);
        await repos.booking.delete(bookingId);
        return event;
      }
    ),
  },

  Subscription: {
    bookingAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOKING_ADDED']),
    },
  },
};
