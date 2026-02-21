/**
 * Booking Resolvers
 *
 * Handles all booking-related GraphQL operations:
 * - Querying user bookings (authenticated)
 * - Booking an event (authenticated, prevents duplicate bookings)
 * - Cancelling a booking (authenticated)
 */

import { GraphQLError } from "graphql";
import { combineResolvers } from "graphql-resolvers";
import { PubSub } from "graphql-subscriptions";

import Event from "../models/event";
import Booking from "../models/booking";
import { isAuthenticated } from "../middlewares/isAuth";
import { transformBooking, transformEvent } from "./transform";
import { GraphQLContext } from "../types";

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
        const bookings = await Booking.find({ user: context.user!._id })
          .populate({ path: "event", populate: { path: "creator" } })
          .populate("user");
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
      async (
        _parent: unknown,
        { eventId }: { eventId: string },
        context: GraphQLContext
      ) => {
        const existingBooking = await Booking.findOne({
          event: eventId,
          user: context.user!._id,
        });
        if (existingBooking) {
          throw new GraphQLError("قد حجزت هذه المناسبة بالفعل مسبقًا!", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        const fetchedEvent = await Event.findById(eventId);
        if (!fetchedEvent) {
          throw new GraphQLError("المناسبة غير موجودة!", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        const booking = new Booking({
          user: context.user!._id,
          event: fetchedEvent._id,
        });

        const result = await booking.save();
        const populatedResult = await result.populate([
          { path: "event", populate: { path: "creator" } },
          { path: "user" },
        ]);
        const transformedBooking = transformBooking(populatedResult);
        
        // Publish booking added event
        pubsub.publish("BOOKING_ADDED", { bookingAdded: transformedBooking });
        
        return transformedBooking;
      }
    ),

    /**
     * Cancels a booking by ID.
     * Returns the event that was booked.
     */
    cancelBooking: combineResolvers(
      isAuthenticated,
      async (
        _parent: unknown,
        { bookingId }: { bookingId: string },
        context: GraphQLContext
      ) => {
        const booking = await Booking.findById(bookingId).populate({
          path: "event",
          populate: { path: "creator" },
        });

        if (!booking) {
          throw new GraphQLError("الحجز غير موجود!", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        // Only the booking owner can cancel
        if (booking.user.toString() !== context.user!._id.toString()) {
          throw new GraphQLError("غير مصرح لك بإلغاء هذا الحجز!", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        const event = transformEvent(booking.event as any);
        await Booking.findByIdAndDelete(bookingId);
        return event;
      }
    ),
  },

  Subscription: {
    bookingAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOKING_ADDED"]),
    },
  },
};
