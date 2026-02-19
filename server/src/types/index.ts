/**
 * Shared TypeScript Type Definitions
 *
 * Contains all shared interfaces and types used across the server application.
 * Includes Mongoose document interfaces, GraphQL context types, and resolver types.
 *
 * TODO: Implement full type definitions (Phase 1.5)
 */

import { Document, Types } from "mongoose";

// ─── Mongoose Document Interfaces ────────────────────────────────────────────

/**
 * User document interface for Mongoose
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
}

/**
 * Event document interface for Mongoose
 */
export interface IEvent extends Document {
  _doc?: any;
  title: string;
  description: string;
  price: number;
  date: Date;
  creator: Types.ObjectId | IUser;
}

/**
 * Booking document interface for Mongoose
 */
export interface IBooking extends Document {
  _doc?: any;
  event: Types.ObjectId | IEvent;
  user: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// ─── GraphQL Context ─────────────────────────────────────────────────────────

/**
 * GraphQL resolver context - available in all resolvers
 */
export interface GraphQLContext {
  user?: IUser | null;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

/**
 * Authentication response data returned after login/signup
 */
export interface AuthData {
  userId: string;
  token: string;
  username: string;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

/**
 * Input for creating a new user
 */
export interface UserInput {
  username: string;
  email: string;
  password: string;
}

/**
 * Input for creating a new event
 */
export interface EventInput {
  title: string;
  description: string;
  price: number;
  date: string;
}
