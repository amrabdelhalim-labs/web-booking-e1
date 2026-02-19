/**
 * Booking Mongoose Model
 *
 * Defines the Booking schema and model for MongoDB.
 * Bookings link users to events they have reserved.
 * Timestamps are automatically managed by Mongoose.
 *
 * TODO: Implement full model with validation (Phase 1.4)
 */

import mongoose, { Schema } from "mongoose";
import { IBooking } from "../types";

const bookingSchema = new Schema<IBooking>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>("Booking", bookingSchema);
