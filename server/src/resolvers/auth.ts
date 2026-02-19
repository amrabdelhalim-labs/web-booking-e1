/**
 * Authentication Resolvers
 *
 * Handles user registration (createUser) and login mutations.
 * Uses bcrypt for password hashing and JWT for token generation.
 *
 * TODO: Implement full auth resolvers (Phase 2.1)
 */

import { GraphQLError } from "graphql";

/**
 * Placeholder auth resolver.
 * Will be implemented with createUser and login mutations.
 */
export const authResolver = {
  Mutation: {
    login: async (
      _parent: unknown,
      _args: { email: string; password: string }
    ) => {
      // TODO: Implement login logic
      throw new GraphQLError("Not implemented yet");
    },

    createUser: async (
      _parent: unknown,
      _args: { userInput: { username: string; email: string; password: string } }
    ) => {
      // TODO: Implement user creation logic
      throw new GraphQLError("Not implemented yet");
    },
  },
};
