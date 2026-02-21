/**
 * Shared TypeScript Type Definitions
 *
 * Client-side interfaces matching the shapes returned by GraphQL queries.
 * Used across pages and components for type safety.
 */

/** Event creator info returned by GraphQL */
export interface Creator {
  _id: string;
  username: string;
  email: string;
}

/** Event data shape from GraphQL responses */
export interface EventData {
  _id: string;
  title: string;
  description: string;
  price: number;
  date: string;
  creator: Creator;
}

/** Booking data shape from GraphQL responses */
export interface BookingData {
  _id: string;
  createdAt: string;
  event: EventData;
  user: { username: string; email: string };
}
