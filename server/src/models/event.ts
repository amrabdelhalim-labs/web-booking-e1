/**
 * Event Mongoose Model
 *
 * Defines the Event schema and model for MongoDB.
 * Events are created by users and can be booked by other users.
 */

import mongoose, { Schema } from "mongoose";
import { IEvent } from "../types";

const eventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

export default mongoose.model<IEvent>("Event", eventSchema);
