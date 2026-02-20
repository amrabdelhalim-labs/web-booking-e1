/**
 * GraphQL Queries, Mutations & Subscriptions
 *
 * Centralizes all GraphQL operations used by the client application.
 * Uses fragments for shared field selections.
 */

import { gql } from "@apollo/client";
import { EVENT_FIELDS } from "./fragments";

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetches all events with creator info */
export const EVENTS = gql`
  ${EVENT_FIELDS}
  query Events {
    events {
      ...EventFields
      creator {
        _id
        email
      }
    }
  }
`;

/** Fetches bookings for the authenticated user */
export const BOOKINGS = gql`
  ${EVENT_FIELDS}
  query Bookings {
    bookings {
      _id
      createdAt
      event {
        ...EventFields
      }
      user {
        username
        email
      }
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Authenticates a user and returns token */
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      userId
      username
    }
  }
`;

/** Registers a new user and returns token */
export const CREATE_USER = gql`
  mutation CreateUser(
    $username: String!
    $email: String!
    $password: String!
  ) {
    createUser(
      userInput: { username: $username, email: $email, password: $password }
    ) {
      token
      userId
      username
    }
  }
`;

/** Creates a new event */
export const CREATE_EVENT = gql`
  ${EVENT_FIELDS}
  mutation CreateEvent(
    $title: String!
    $description: String!
    $price: Float!
    $date: String!
  ) {
    createEvent(
      eventInput: {
        title: $title
        description: $description
        price: $price
        date: $date
      }
    ) {
      ...EventFields
    }
  }
`;

/** Books an event for the authenticated user */
export const BOOK_EVENT = gql`
  mutation BookEvent($eventId: ID!) {
    bookEvent(eventId: $eventId) {
      _id
      createdAt
      updatedAt
    }
  }
`;

/** Cancels a booking */
export const CANCEL_BOOKING = gql`
  mutation CancelBooking($bookingId: ID!) {
    cancelBooking(bookingId: $bookingId) {
      _id
      title
    }
  }
`;

// ─── User Management ──────────────────────────────────────────────────────────

/** Updates the authenticated user's profile (username and/or password) */
export const UPDATE_USER = gql`
  mutation UpdateUser($username: String, $password: String) {
    updateUser(updateUserInput: { username: $username, password: $password }) {
      _id
      username
    }
  }
`;

/** Deletes the authenticated user's account (cascade: events + bookings) */
export const DELETE_USER = gql`
  mutation DeleteUser {
    deleteUser
  }
`;

// ─── Subscriptions ────────────────────────────────────────────────────────────

/** Subscribes to new event additions */
export const EVENT_ADDED = gql`
  ${EVENT_FIELDS}
  subscription {
    eventAdded {
      ...EventFields
    }
  }
`;
