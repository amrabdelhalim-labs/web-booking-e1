/**
 * Authentication Resolvers
 *
 * Handles user registration (createUser), login, profile update, and account deletion.
 * Uses bcrypt for password hashing and JWT for token generation.
 * Cascade deletion removes all user's events and bookings on account delete.
 *
 * Data access is abstracted through the Repository Pattern.
 * Input validation is handled by dedicated validators.
 */
import { GraphQLContext, UserInput } from '../types';
export declare const authResolver: {
    Mutation: {
        /**
         * Authenticates a user with email and password.
         * Returns AuthData with JWT token on success.
         */
        login: (_parent: unknown, { email, password }: {
            email: string;
            password: string;
        }) => Promise<{
            userId: any;
            token: string;
            username: string;
        }>;
        /**
         * Creates a new user account.
         * Hashes the password and returns AuthData with JWT token.
         */
        createUser: (_parent: unknown, { userInput }: {
            userInput: UserInput;
        }) => Promise<{
            userId: any;
            token: string;
            username: string;
        }>;
        /**
         * Updates the authenticated user's profile data (username and/or password).
         * Email cannot be changed.
         */
        updateUser: import("graphql").GraphQLFieldResolver<unknown, GraphQLContext>;
        /**
         * Deletes the authenticated user's account.
         * Cascade: removes all user's events and all bookings
         * (both bookings by the user and bookings on the user's events).
         */
        deleteUser: import("graphql").GraphQLFieldResolver<unknown, GraphQLContext>;
    };
};
//# sourceMappingURL=auth.d.ts.map