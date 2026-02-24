/**
 * GraphQL Fragments
 *
 * Reusable GraphQL fragments for shared field selections.
 * Fragments avoid duplication across queries and mutations.
 */

import { gql } from '@apollo/client';

/**
 * Event fields fragment - shared across event queries/mutations.
 * Includes creator info for display and ownership checks.
 */
export const EVENT_FIELDS = gql`
  fragment EventFields on Event {
    _id
    title
    description
    price
    date
    creator {
      _id
      username
      email
    }
  }
`;
