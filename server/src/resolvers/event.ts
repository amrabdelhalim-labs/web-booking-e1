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

import { GraphQLError } from 'graphql';
import { combineResolvers } from 'graphql-resolvers';
import { PubSub } from 'graphql-subscriptions';

import { isAuthenticated } from '../middlewares/isAuth';
import { getRepositoryManager } from '../repositories';
import { validateEventInput, validateUpdateEventInput } from '../validators';
import { transformEvent } from './transform';
import { GraphQLContext, EventInput, UpdateEventInput } from '../types';

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
      { searchTerm, skip = 0, limit = 8 }: { searchTerm?: string; skip?: number; limit?: number }
    ) => {
      const repos = getRepositoryManager();

      let events;
      if (searchTerm && searchTerm.trim()) {
        events = await repos.event.search(searchTerm, skip, limit);
      } else {
        events = await repos.event.findAllWithCreator({}, skip, limit);
      }
      return events.map((event) => transformEvent(event));
    },

    /**
     * Fetches all events created by a specific user.
     */
    getUserEvents: async (_parent: unknown, { userId }: { userId: string }) => {
      const repos = getRepositoryManager();
      const events = await repos.event.findByCreator(userId);
      return events.map((event) => transformEvent(event));
    },
  },

  Mutation: {
    /**
     * Creates a new event. Requires authentication.
     * Validates input and checks for duplicate title.
     * Publishes eventAdded subscription on success.
     */
    createEvent: combineResolvers(
      isAuthenticated,
      async (
        _parent: unknown,
        { eventInput }: { eventInput: EventInput },
        context: GraphQLContext
      ) => {
        validateEventInput(eventInput);

        const repos = getRepositoryManager();
        const titleTaken = await repos.event.titleExists(eventInput.title);
        if (titleTaken) {
          throw new GraphQLError('يوجد لدينا مناسبة بنفس هذا العنوان، الرجاء اختيار عنوان آخر!', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const event = await repos.event.create({
          title: eventInput.title,
          description: eventInput.description,
          price: eventInput.price,
          date: new Date(eventInput.date),
          creator: context.user!._id,
        } as any);

        const populatedResult = await event.populate('creator');
        const createdEvent = transformEvent(populatedResult);

        pubsub.publish('EVENT_ADDED', { eventAdded: createdEvent });

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
        { eventId, eventInput }: { eventId: string; eventInput: UpdateEventInput },
        context: GraphQLContext
      ) => {
        validateUpdateEventInput(eventInput);

        const repos = getRepositoryManager();
        const event = await repos.event.findById(eventId);
        if (!event) {
          throw new GraphQLError('المناسبة غير موجودة!', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        if (event.creator.toString() !== context.user!._id.toString()) {
          throw new GraphQLError('غير مصرح لك بتعديل هذه المناسبة!', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const updates: Record<string, unknown> = {};
        if (eventInput.title !== undefined) updates.title = eventInput.title;
        if (eventInput.description !== undefined) updates.description = eventInput.description;
        if (eventInput.price !== undefined) updates.price = eventInput.price;
        if (eventInput.date !== undefined) updates.date = new Date(eventInput.date);

        const updated = await repos.event.updateWithCreator(eventId, updates);
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
      async (_parent: unknown, { eventId }: { eventId: string }, context: GraphQLContext) => {
        const repos = getRepositoryManager();
        const event = await repos.event.findById(eventId);
        if (!event) {
          throw new GraphQLError('المناسبة غير موجودة!', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Only the creator can delete their event
        if (event.creator.toString() !== context.user!._id.toString()) {
          throw new GraphQLError('غير مصرح لك بحذف هذه المناسبة!', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Cascade: delete all bookings for this event
        await repos.booking.deleteByEvent(eventId);

        // Delete the event
        await repos.event.delete(eventId);

        // Return updated events list
        const events = await repos.event.findAllWithCreator();
        return events.map((e) => transformEvent(e));
      }
    ),
  },

  Subscription: {
    eventAdded: {
      subscribe: () => pubsub.asyncIterator(['EVENT_ADDED']),
    },
  },
};
