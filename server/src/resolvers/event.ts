/**
 * Event Resolvers
 *
 * Handles all event-related GraphQL operations:
 * - Querying events (all events, user-specific events)
 * - Creating new events (authenticated)
 * - Deleting events with cascade (removes related bookings)
 * - Publishing subscription events when a new event is created
 */

import { GraphQLError } from "graphql";
import { combineResolvers } from "graphql-resolvers";
import { PubSub } from "graphql-subscriptions";

import Event from "../models/event";
import Booking from "../models/booking";
import { isAuthenticated } from "../middlewares/isAuth";
import { transformEvent } from "./transform";
import { GraphQLContext, EventInput, UpdateEventInput } from "../types";

const pubsub = new PubSub();

export const eventResolver = {
  Query: {
    /**
     * Fetches events with pagination support, sorted by newest first.
     * Optionally filters by searchTerm (matches title or description).
     * Pagination: skip (offset) and limit (page size, default 8).
     */
    events: async (
      _parent: unknown,
      {
        searchTerm,
        skip = 0,
        limit = 8,
      }: { searchTerm?: string; skip?: number; limit?: number }
    ) => {
      const filter: Record<string, unknown> = {};
      if (searchTerm && searchTerm.trim()) {
        const escaped = searchTerm
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        filter.$or = [{ title: regex }, { description: regex }];
      }
      const events = await Event.find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate("creator");
      return events.map((event) => transformEvent(event));
    },

    /**
     * Fetches all events created by a specific user.
     */
    getUserEvents: async (_parent: unknown, { userId }: { userId: string }) => {
      const events = await Event.find({ creator: userId }).populate("creator");
      return events.map((event) => transformEvent(event));
    },
  },

  Mutation: {
    /**
     * Creates a new event. Requires authentication.
     * Validates that no duplicate title exists.
     * Publishes eventAdded subscription on success.
     */
    createEvent: combineResolvers(
      isAuthenticated,
      async (
        _parent: unknown,
        { eventInput }: { eventInput: EventInput },
        context: GraphQLContext
      ) => {
        const existingEvent = await Event.findOne({ title: eventInput.title });
        if (existingEvent) {
          throw new GraphQLError(
            "يوجد لدينا مناسبة بنفس هذا العنوان، الرجاء اختيار عنوان آخر!",
            { extensions: { code: "BAD_USER_INPUT" } }
          );
        }

        const event = new Event({
          title: eventInput.title,
          description: eventInput.description,
          price: eventInput.price,
          date: new Date(eventInput.date),
          creator: context.user!._id,
        });

        const result = await event.save();
        const populatedResult = await result.populate("creator");
        const createdEvent = transformEvent(populatedResult);

        pubsub.publish("EVENT_ADDED", { eventAdded: createdEvent });

        return createdEvent;
      }
    ),

    /**
     * Updates an event. Requires authentication.
     * Only the creator can update their own event.
     */
    updateEvent: combineResolvers(
      isAuthenticated,
      async (
        _parent: unknown,
        {
          eventId,
          eventInput,
        }: { eventId: string; eventInput: UpdateEventInput },
        context: GraphQLContext
      ) => {
        const event = await Event.findById(eventId);
        if (!event) {
          throw new GraphQLError("المناسبة غير موجودة!", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        if (event.creator.toString() !== context.user!._id.toString()) {
          throw new GraphQLError("غير مصرح لك بتعديل هذه المناسبة!", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        const updates: Record<string, unknown> = {};
        if (eventInput.title !== undefined) updates.title = eventInput.title;
        if (eventInput.description !== undefined)
          updates.description = eventInput.description;
        if (eventInput.price !== undefined) updates.price = eventInput.price;
        if (eventInput.date !== undefined)
          updates.date = new Date(eventInput.date);

        const updated = await Event.findByIdAndUpdate(eventId, updates, {
          new: true,
        }).populate("creator");
        return transformEvent(updated!);
      }
    ),

    /**
     * Deletes an event by ID.
     * Cascade: removes all bookings associated with the deleted event.
     * Returns the updated list of all events.
     */
    deleteEvent: combineResolvers(
      isAuthenticated,
      async (
        _parent: unknown,
        { eventId }: { eventId: string },
        context: GraphQLContext
      ) => {
        const event = await Event.findById(eventId);
        if (!event) {
          throw new GraphQLError("المناسبة غير موجودة!", {
            extensions: { code: "NOT_FOUND" },
          });
        }

        // Only the creator can delete their event
        if (event.creator.toString() !== context.user!._id.toString()) {
          throw new GraphQLError("غير مصرح لك بحذف هذه المناسبة!", {
            extensions: { code: "FORBIDDEN" },
          });
        }

        // Cascade: delete all bookings for this event
        await Booking.deleteMany({ event: eventId });

        // Delete the event
        await Event.findByIdAndDelete(eventId);

        // Return updated events list
        const events = await Event.find({})
          .sort({ _id: -1 })
          .populate("creator");
        return events.map((e) => transformEvent(e));
      }
    ),
  },

  Subscription: {
    eventAdded: {
      subscribe: () => pubsub.asyncIterator(["EVENT_ADDED"]),
    },
  },
};
