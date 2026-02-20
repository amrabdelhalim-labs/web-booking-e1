/**
 * Type declarations for graphql-resolvers package.
 * This package does not ship its own TypeScript types.
 */
declare module "graphql-resolvers" {
  import { GraphQLFieldResolver } from "graphql";

  /**
   * Combines multiple resolvers into a single resolver chain.
   * Each resolver is executed in sequence; if a resolver returns
   * `skip`, the next resolver in the chain is called.
   */
  export function combineResolvers<TSource = any, TContext = any>(
    ...resolvers: Array<GraphQLFieldResolver<TSource, TContext>>
  ): GraphQLFieldResolver<TSource, TContext>;

  /**
   * A special return value that tells combineResolvers to skip
   * to the next resolver in the chain.
   */
  export const skip: undefined;
}
