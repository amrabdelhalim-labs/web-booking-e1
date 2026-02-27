"use strict";
/**
 * Authentication Middleware
 *
 * Provides an authentication guard for protected GraphQL resolvers.
 * Used with graphql-resolvers' combineResolvers to protect mutations/queries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const graphql_1 = require("graphql");
/**
 * Authentication guard resolver.
 * Throws an error if the user is not authenticated.
 * Used as first resolver in combineResolvers chain.
 */
const isAuthenticated = (_parent, _args, context) => {
    if (!context.user) {
        throw new graphql_1.GraphQLError('Authentication required!', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
};
exports.isAuthenticated = isAuthenticated;
//# sourceMappingURL=isAuth.js.map