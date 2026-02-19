/**
 * User Mongoose Model
 *
 * Defines the User schema and model for MongoDB.
 * Users can create events, book events, and authenticate.
 *
 * TODO: Implement full model with validation (Phase 1.4)
 */

import mongoose, { Schema } from "mongoose";
import { IUser } from "../types";

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

export default mongoose.model<IUser>("User", userSchema);
