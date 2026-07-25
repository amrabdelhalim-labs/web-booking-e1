"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventResolver = void 0;
const graphql_1 = require("graphql");
const graphql_resolvers_1 = require("graphql-resolvers");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const isAuth_1 = require("../middlewares/isAuth");
const repositories_1 = require("../repositories");
const validators_1 = require("../validators");
const transform_1 = require("./transform");
const pubsub = new graphql_subscriptions_1.PubSub();
exports.eventResolver = {
    Query: {
        /**
         * Fetches events with pagination support, sorted by newest first.
         * Optionally filters by searchTerm (matches title or description).
         * Pagination: skip (offset) and limit (page size, default 8).
         */
        events: async (_parent, { searchTerm, skip = 0, limit = 8 }) => {
            const repos = (0, repositories_1.getRepositoryManager)();
            let events;
            if (searchTerm && searchTerm.trim()) {
                events = await repos.event.search(searchTerm, skip, limit);
            }
            else {
                events = await repos.event.findAllWithCreator({}, skip, limit);
            }
            return events.map((event) => (0, transform_1.transformEvent)(event));
        },
        /**
         * Fetches all events created by a specific user.
         */
        getUserEvents: async (_parent, { userId }) => {
            const repos = (0, repositories_1.getRepositoryManager)();
            const events = await repos.event.findByCreator(userId);
            return events.map((event) => (0, transform_1.transformEvent)(event));
        },
    },
    Mutation: {
        /**
         * Creates a new event. Requires authentication.
         * Validates input and checks for duplicate title.
         * Publishes eventAdded subscription on success.
         */
        createEvent: (0, graphql_resolvers_1.combineResolvers)(isAuth_1.isAuthenticated, async (_parent, { eventInput }, context) => {
            (0, validators_1.validateEventInput)(eventInput);
            const repos = (0, repositories_1.getRepositoryManager)();
            const titleTaken = await repos.event.titleExists(eventInput.title);
            if (titleTaken) {
                throw new graphql_1.GraphQLError('يوجد لدينا مناسبة بنفس هذا العنوان، الرجاء اختيار عنوان آخر!', {
                    extensions: { code: 'BAD_USER_INPUT' },
                });
            }
            const event = await repos.event.create({
                title: eventInput.title,
                description: eventInput.description,
                price: eventInput.price,
                date: new Date(eventInput.date),
                creator: context.user._id,
            });
            const populatedResult = await event.populate('creator');
            const createdEvent = (0, transform_1.transformEvent)(populatedResult);
            pubsub.publish('EVENT_ADDED', { eventAdded: createdEvent });
            return createdEvent;
        }),
        /**
         * Updates an event. Requires authentication.
         * Only the creator can update their own event.
         */
        updateEvent: (0, graphql_resolvers_1.combineResolvers)(isAuth_1.isAuthenticated, async (_parent, { eventId, eventInput }, context) => {
            (0, validators_1.validateUpdateEventInput)(eventInput);
            const repos = (0, repositories_1.getRepositoryManager)();
            const event = await repos.event.findById(eventId);
            if (!event) {
                throw new graphql_1.GraphQLError('المناسبة غير موجودة!', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            if (event.creator.toString() !== context.user._id.toString()) {
                throw new graphql_1.GraphQLError('غير مصرح لك بتعديل هذه المناسبة!', {
                    extensions: { code: 'FORBIDDEN' },
                });
            }
            const updates = {};
            if (eventInput.title !== undefined)
                updates.title = eventInput.title;
            if (eventInput.description !== undefined)
                updates.description = eventInput.description;
            if (eventInput.price !== undefined)
                updates.price = eventInput.price;
            if (eventInput.date !== undefined)
                updates.date = new Date(eventInput.date);
            const updated = await repos.event.updateWithCreator(eventId, updates);
            return (0, transform_1.transformEvent)(updated);
        }),
        /**
         * Deletes an event by ID.
         * Cascade: removes all bookings associated with the deleted event.
         * Returns the updated list of all events.
         */
        deleteEvent: (0, graphql_resolvers_1.combineResolvers)(isAuth_1.isAuthenticated, async (_parent, { eventId }, context) => {
            const repos = (0, repositories_1.getRepositoryManager)();
            const event = await repos.event.findById(eventId);
            if (!event) {
                throw new graphql_1.GraphQLError('المناسبة غير موجودة!', {
                    extensions: { code: 'NOT_FOUND' },
                });
            }
            // Only the creator can delete their event
            if (event.creator.toString() !== context.user._id.toString()) {
                throw new graphql_1.GraphQLError('غير مصرح لك بحذف هذه المناسبة!', {
                    extensions: { code: 'FORBIDDEN' },
                });
            }
            // Cascade: delete all bookings for this event
            await repos.booking.deleteByEvent(eventId);
            // Delete the event
            await repos.event.delete(eventId);
            // Return updated events list
            const events = await repos.event.findAllWithCreator();
            return events.map((e) => (0, transform_1.transformEvent)(e));
        }),
    },
    Subscription: {
        eventAdded: {
            subscribe: () => pubsub.asyncIterator(['EVENT_ADDED']),
        },
    },
};
//# sourceMappingURL=event.js.map