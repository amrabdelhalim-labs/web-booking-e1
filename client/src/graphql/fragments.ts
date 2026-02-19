/**
 * GraphQL Fragments
 *
 * Reusable GraphQL fragments for shared field selections.
 * Fragments avoid duplication across queries and mutations.
 *
 * TODO: Implement full fragments (Phase 5.1)
 */

import { gql } from "@apollo/client";

/**
 * Event fields fragment - shared across event queries/mutations.
 */
export const EVENT_FIELDS = gql`
  fragment EventFields on Event {
    _id
    title
    description
    price
    date
  }
`;
