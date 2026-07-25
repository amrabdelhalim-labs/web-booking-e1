/**
 * Resolvers Index
 *
 * Merges all resolver modules into a single resolver map.
 * Uses lodash merge for deep merging of resolver objects.
 */
/**
 * Combined resolvers from all modules.
 * Merged using lodash.merge for deep object composition.
 */
export declare const resolvers: {
    Mutation: {
        login: (_parent: unknown, { email, password }: {
            email: string;
            password: string;
        }) => Promise<{
            userId: any;
            token: string;
            username: string;
        }>;
        createUser: (_parent: unknown, { userInput }: {
            userInput: import("../types").UserInput;
        }) => Promise<{
            userId: any;
            token: string;
            username: string;
        }>;
        updateUser: import("graphql").GraphQLFieldResolver<unknown, import("../types").GraphQLContext>;
        deleteUser: import("graphql").GraphQLFieldResolver<unknown, import("../types").GraphQLContext>;
    };
} & {
    Query: {
        bookings: import("graphql").GraphQLFieldResolver<unknown, import("../types").GraphQLContext>;
    };
    Mutation: {
        bookEvent: import("graphql").GraphQLFieldResolver<unknown, import("../types").GraphQLContext>;
        cancelBooking: import("graphql").GraphQLFieldResolver<unknown, import("../types").GraphQLContext>;
    };
    Subscription: {
        bookingAdded: {
            subscribe: () => AsyncIterator<unknown, any, any>;
        };
    };
} & {
    Query: {
        events: (_parent: unknown, { searchTerm, skip, limit }: {
            searchTerm?: string;
            skip?: number;
            limit?: number;
        }) => Promise<any[]>;
        getUserEvents: (_parent: unknown, { userId }: {
            userId: string;
        }) => Promise<any[]>;
    };
    Mutation: {
        createEvent: import("graphql").GraphQLFieldResolver<unknown, import("../types").GraphQLContext>;
        updateEvent: import("graphql").GraphQLFieldResolver<unknown, import("../types").GraphQLContext>;
        deleteEvent: import("graphql").GraphQLFieldResolver<unknown, import("../types").GraphQLContext>;
    };
    Subscription: {
        eventAdded: {
            subscribe: () => AsyncIterator<unknown, any, any>;
        };
    };
};
//# sourceMappingURL=index.d.ts.map