/**
 * Authentication Middleware
 *
 * Provides an authentication guard for protected GraphQL resolvers.
 * Used with graphql-resolvers' combineResolvers to protect mutations/queries.
 */
import { GraphQLContext } from '../types';
/**
 * Authentication guard resolver.
 * Throws an error if the user is not authenticated.
 * Used as first resolver in combineResolvers chain.
 */
export declare const isAuthenticated: (_parent: unknown, _args: unknown, context: GraphQLContext) => void;
//# sourceMappingURL=isAuth.d.ts.map