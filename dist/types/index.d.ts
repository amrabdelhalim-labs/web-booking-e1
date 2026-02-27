/**
 * Shared TypeScript Type Definitions
 *
 * Contains all shared interfaces and types used across the server application.
 * Includes Mongoose document interfaces, GraphQL context types, and resolver types.
 */
import { Document, Types } from 'mongoose';
/**
 * User document interface for Mongoose.
 * Users can create events, book events, and authenticate.
 */
export interface IUser extends Document {
    _doc?: any;
    username: string;
    email: string;
    password: string;
}
/**
 * Event document interface for Mongoose.
 * Events are created by users and can be booked by other users.
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
 * Booking document interface for Mongoose.
 * Bookings link users to events they have reserved.
 * Timestamps (createdAt, updatedAt) are auto-managed by Mongoose.
 */
export interface IBooking extends Document {
    _doc?: any;
    event: Types.ObjectId | IEvent;
    user: Types.ObjectId | IUser;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * JWT token payload structure after decoding.
 */
export interface JwtPayload {
    id: string;
    iat?: number;
    exp?: number;
}
/**
 * GraphQL resolver context - available in all resolvers.
 * Contains the authenticated user (if any) extracted from JWT.
 */
export interface GraphQLContext {
    user?: IUser | null;
}
/**
 * Authentication response data returned after login/signup.
 */
export interface AuthData {
    userId: string;
    token: string;
    username: string;
}
/**
 * Input for creating a new user.
 */
export interface UserInput {
    username: string;
    email: string;
    password: string;
}
/**
 * Input for updating user data (email cannot be changed).
 */
export interface UpdateUserInput {
    username?: string;
    password?: string;
}
/**
 * Input for creating a new event.
 */
export interface EventInput {
    title: string;
    description: string;
    price: number;
    date: string;
}
/**
 * Input for updating an existing event (all fields optional).
 */
export interface UpdateEventInput {
    title?: string;
    description?: string;
    price?: number;
    date?: string;
}
//# sourceMappingURL=index.d.ts.map