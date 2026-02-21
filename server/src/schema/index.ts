/**
 * GraphQL Schema Definition
 *
 * Defines the complete GraphQL schema using SDL (Schema Definition Language).
 * Includes all types, inputs, queries, mutations, and subscriptions.
 */

import gql from "graphql-tag";

export const typeDefs = gql`
  # ─── Types ───────────────────────────────────────────────────────────────────

  type User {
    _id: ID!
    username: String!
    email: String!
    password: String!
  }

  type AuthData {
    userId: ID!
    token: String!
    username: String!
  }

  type Event {
    _id: ID!
    title: String!
    description: String!
    price: Float!
    date: String!
    creator: User!
  }

  type Booking {
    _id: ID!
    event: Event!
    user: User!
    createdAt: String!
    updatedAt: String!
  }

  # ─── Inputs ──────────────────────────────────────────────────────────────────

  input UserInput {
    username: String!
    email: String!
    password: String!
  }

  input UpdateUserInput {
    username: String
    password: String
  }

  input EventInput {
    title: String!
    description: String!
    price: Float!
    date: String!
  }

  input UpdateEventInput {
    title: String
    description: String
    price: Float
    date: String
  }

  # ─── Queries ─────────────────────────────────────────────────────────────────

  type Query {
    events(searchTerm: String, skip: Int = 0, limit: Int = 8): [Event!]
    bookings: [Booking!]
    getUserEvents(userId: ID!): [Event]
  }

  # ─── Mutations ───────────────────────────────────────────────────────────────

  type Mutation {
    createUser(userInput: UserInput!): AuthData
    login(email: String!, password: String!): AuthData
    updateUser(updateUserInput: UpdateUserInput!): User
    deleteUser: Boolean
    createEvent(eventInput: EventInput!): Event
    updateEvent(eventId: ID!, eventInput: UpdateEventInput!): Event
    bookEvent(eventId: ID!): Booking
    cancelBooking(bookingId: ID!): Event
    deleteEvent(eventId: ID!): [Event]
  }

  # ─── Subscriptions ──────────────────────────────────────────────────────────

  type Subscription {
    eventAdded: Event!
    bookingAdded: Booking!
  }
`;
